"use server";

import { prisma } from "@/lib/prisma";
import {
  comparePassword,
  createSession,
  getCurrentUser,
  getCurrentSessionId,
  getActiveSessions,
  revokeSession,
  logout,
} from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";

export async function loginUser(formData: FormData) {
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return { error: "Invalid email or password." };
  }

  const isPasswordValid = await comparePassword(password, user.password);
  if (!isPasswordValid) {
    return { error: "Invalid email or password." };
  }

  await createSession(user.id, user.email);

  // Look up user's primary owned house
  const userHouse = await prisma.house.findFirst({
    where: { userId: user.id, deletedAt: null },
    orderBy: { createdAt: "asc" },
  });
  const defaultHouseId = userHouse ? userHouse.id : "ALL";
  const cookieStore = await cookies();
  cookieStore.set("finvault_active_house", String(defaultHouseId), {
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 31536000,
  });

  redirect(`/?houseId=${defaultHouseId}`);
}

export async function logoutUser() {
  await logout();
  redirect("/login");
}

export async function getUserActiveSessions() {
  const user = await getCurrentUser();
  if (!user) return [];
  return getActiveSessions(user.id);
}

export async function revokeSessionAction(sessionId: number | string) {
  const user = await getCurrentUser();
  if (!user) return { error: "Unauthorized" };

  const currentSessionId = await getCurrentSessionId();
  const id =
    typeof sessionId === "number" ? sessionId : parseInt(sessionId, 10);

  if (currentSessionId && Number(currentSessionId) === id) {
    return {
      error:
        "Cannot revoke active session for this device. Use Logout instead.",
    };
  }

  await revokeSession(id, user.id);
  revalidatePath("/settings");
  return { success: true };
}
