"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser, requireAuth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { LoanStatus } from "@prisma/client";
import { cacheGet, cacheSet, cacheInvalidateTag } from "@/lib/cache";
import { resolveTargetHouseIds } from "@/lib/house-query";

export async function getLoans(houseId?: number | string) {
  const user = await getCurrentUser();
  if (!user) return [];

  const { targetIds, cacheKeySegment } = await resolveTargetHouseIds(houseId);
  const cacheKey = `loans:${user.id}:${cacheKeySegment}`;
  const cached = cacheGet<any[]>(cacheKey);
  if (cached) return cached;

  const whereClause: any = {
    deletedAt: null,
    houseId: { in: targetIds },
  };

  const loans = await prisma.loan.findMany({
    where: whereClause,
    select: {
      id: true,
      userId: true,
      houseId: true,
      relativeName: true,
      totalAmount: true,
      amountPaid: true,
      nextPaymentDueDate: true,
      status: true,
      notes: true,
      loanDate: true,
      createdAt: true,
      house: { select: { id: true, name: true } },
      repayments: {
        select: {
          id: true,
          loanId: true,
          amount: true,
          repaymentDate: true,
          notes: true,
          createdAt: true,
          house: { select: { id: true, name: true } },
        },
        orderBy: { repaymentDate: "desc" },
      },
    },
    orderBy: [{ totalAmount: "desc" }, { createdAt: "desc" }],
  });

  const result = loans
    .map((l) => ({
      ...l,
      totalAmount: Number(l.totalAmount),
      amountPaid: Number(l.amountPaid),
      repayments: l.repayments.map((r) => ({
        ...r,
        amount: Number(r.amount),
      })),
    }))
    .sort((a, b) => b.totalAmount - a.totalAmount);

  cacheSet(cacheKey, result, 60000, ["loans"]);
  return result;
}

export async function addLoanAction(formData: FormData) {
  const user = await requireAuth();

  const relativeName = (formData.get("relativeName") as string)?.trim();
  const totalAmountStr = formData.get("totalAmount") as string;
  const houseIdStr = (formData.get("houseId") as string) || null;
  const houseId = houseIdStr ? parseInt(houseIdStr, 10) : null;
  const nextPaymentDueDateStr = formData.get("nextPaymentDueDate") as string;
  const notes = (formData.get("notes") as string)?.trim() || null;
  const loanDateStr = formData.get("loanDate") as string;
  const loanDate = loanDateStr ? new Date(loanDateStr) : new Date();

  if (!relativeName || !totalAmountStr) {
    return { error: "Relative name and total loan amount are required." };
  }

  const totalAmount = parseFloat(totalAmountStr);
  if (isNaN(totalAmount) || totalAmount <= 0) {
    return { error: "Total amount must be a positive number." };
  }

  const nextPaymentDueDate = nextPaymentDueDateStr
    ? new Date(nextPaymentDueDateStr)
    : null;

  await prisma.loan.create({
    data: {
      userId: user.id,
      houseId: houseId && !isNaN(houseId) ? houseId : null,
      relativeName,
      totalAmount,
      amountPaid: 0,
      status: LoanStatus.PENDING,
      nextPaymentDueDate,
      notes,
      loanDate,
    },
  });

  cacheInvalidateTag("loans");
  cacheInvalidateTag("dashboard");
  cacheInvalidateTag("houses");
  revalidatePath("/");
  revalidatePath("/loans");
  return { success: true };
}

export async function recordRepaymentAction(formData: FormData) {
  const user = await requireAuth();

  const loanIdStr = formData.get("loanId") as string;
  const loanId = parseInt(loanIdStr, 10);
  const amountStr = formData.get("amount") as string;
  const repaymentDateStr = formData.get("repaymentDate") as string;
  const nextPaymentDueDateStr = formData.get("nextPaymentDueDate") as string;
  const houseIdStr = (formData.get("houseId") as string) || null;
  const houseId = houseIdStr ? parseInt(houseIdStr, 10) : null;
  const notes = (formData.get("notes") as string)?.trim() || null;

  if (isNaN(loanId) || !amountStr) {
    return { error: "Loan ID and repayment amount are required." };
  }

  const repaymentAmount = parseFloat(amountStr);
  if (isNaN(repaymentAmount) || repaymentAmount <= 0) {
    return { error: "Repayment amount must be positive." };
  }

  const repaymentDate = repaymentDateStr
    ? new Date(repaymentDateStr)
    : new Date();

  // Find existing loan
  const loan = await prisma.loan.findFirst({
    where: { id: loanId, userId: user.id, deletedAt: null },
  });

  if (!loan) {
    return { error: "Loan not found." };
  }

  const currentPaid = Number(loan.amountPaid);
  const totalLoan = Number(loan.totalAmount);
  const newAmountPaid = currentPaid + repaymentAmount;

  if (newAmountPaid > totalLoan) {
    return {
      error: `Repayment amount (₹ ${repaymentAmount}) exceeds the remaining balance of ₹ ${(totalLoan - currentPaid).toFixed(2)}.`,
    };
  }

  // Determine updated status
  let newStatus: LoanStatus = LoanStatus.PARTIALLY_PAID;
  if (Math.abs(newAmountPaid - totalLoan) < 0.01) {
    newStatus = LoanStatus.FULLY_PAID;
  }

  const nextDueDate =
    newStatus === LoanStatus.FULLY_PAID
      ? null
      : nextPaymentDueDateStr
        ? new Date(nextPaymentDueDateStr)
        : loan.nextPaymentDueDate;

  // Execute in transaction: create repayment log + update loan
  await prisma.$transaction([
    prisma.loanRepayment.create({
      data: {
        loanId,
        houseId: houseId && !isNaN(houseId) ? houseId : null,
        amount: repaymentAmount,
        repaymentDate,
        notes,
      },
    }),
    prisma.loan.update({
      where: { id: loanId },
      data: {
        amountPaid: newAmountPaid,
        status: newStatus,
        nextPaymentDueDate: nextDueDate,
      },
    }),
  ]);

  cacheInvalidateTag("loans");
  cacheInvalidateTag("dashboard");
  cacheInvalidateTag("houses");
  revalidatePath("/");
  revalidatePath("/loans");
  return { success: true };
}
