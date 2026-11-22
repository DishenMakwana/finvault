"use server";

import { prisma } from "@/lib/prisma";
import {
  hashPassword,
  comparePassword,
  createSession,
  getCurrentUser,
  getActiveSessions,
  revokeSession,
  logout,
} from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function registerUser(formData: FormData) {
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const password = formData.get("password") as string;
  const name = (formData.get("name") as string)?.trim() || null;

  if (!email || !password || password.length < 6) {
    return {
      error:
        "Please provide a valid email and a password of at least 6 characters.",
    };
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "An account with this email already exists." };
  }

  const hashedPassword = await hashPassword(password);
  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name,
    },
  });

  // Automatically create a default house for the new user
  await prisma.house.create({
    data: {
      userId: user.id,
      name: "Main House",
      initialCash: 0,
    },
  });

  await createSession(user.id, user.email);
  redirect("/");
}

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
  redirect("/");
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

  const id =
    typeof sessionId === "number" ? sessionId : parseInt(sessionId, 10);
  await revokeSession(id, user.id);
  revalidatePath("/settings");
  return { success: true };
}
