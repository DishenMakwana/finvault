import { cache } from "react";
import jwt, { type SignOptions } from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "./prisma";
import type { Session } from "@prisma/client";
import { JwtPayload } from "@/types/settings.types";
import { cacheGet, cacheSet, cacheInvalidateTag } from "./cache";
import { UAParser } from "ua-parser-js";

const JWT_SECRET =
  process.env.JWT_SECRET ||
  "finvault_super_secret_jwt_key_2026_change_in_production";
const COOKIE_NAME = "finvault_token";

// Fetch ACCESS_TOKEN_EXPIRES_IN from environment with fallback '1d'
function getAccessTokenExpiry(): string {
  return process.env.ACCESS_TOKEN_EXPIRES_IN || "1d";
}

// Convert human-readable expiry string (e.g., '1d', '24h', '60m', '3600s') to milliseconds
function parseExpiryToMs(expiryStr: string): number {
  const str = expiryStr.trim();
  const match = str.match(/^(\d+)([smhdwy])?$/i);
  if (!match) {
    return 24 * 60 * 60 * 1000; // 1 day default
  }
  const val = parseInt(match[1], 10);
  const unit = (match[2] || "s").toLowerCase();
  switch (unit) {
    case "s":
      return val * 1000;
    case "m":
      return val * 60 * 1000;
    case "h":
      return val * 60 * 60 * 1000;
    case "d":
      return val * 24 * 60 * 60 * 1000;
    case "w":
      return val * 7 * 24 * 60 * 60 * 1000;
    case "y":
      return val * 365 * 24 * 60 * 60 * 1000;
    default:
      return val * 1000;
  }
}

export async function comparePassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createSession(userId: number, email: string) {
  const expirySetting = getAccessTokenExpiry();
  const expiryMs = parseExpiryToMs(expirySetting);
  const expiresAt = new Date(Date.now() + expiryMs);

  let userAgent = "Unknown Browser / Device";
  let ipAddress = "127.0.0.1";
  try {
    const headersList = await headers();
    userAgent = headersList.get("user-agent") || userAgent;
    ipAddress =
      headersList.get("x-forwarded-for")?.split(",")[0].trim() ||
      headersList.get("x-real-ip") ||
      ipAddress;
  } catch {
    // headers() might not be available
  }

  // Parse client device & browser metadata with ua-parser-js v2
  const parsed = new UAParser(userAgent).getResult();
  const browserName = parsed.browser.name || null;
  const browserVersion = parsed.browser.version || null;
  const osName = parsed.os.name || null;
  const osVersion = parsed.os.version || null;
  const deviceType =
    parsed.device.type ||
    (parsed.os.name && /android|ios/i.test(parsed.os.name)
      ? "mobile"
      : "desktop");
  const deviceVendor =
    parsed.device.vendor ||
    (parsed.os.name && /macos|mac os|ios/i.test(parsed.os.name)
      ? "Apple"
      : null);
  const deviceModel =
    parsed.device.model ||
    (parsed.os.name && /macos|mac os/i.test(parsed.os.name)
      ? "Mac"
      : parsed.os.name && /windows/i.test(parsed.os.name)
        ? "PC"
        : null);
  const cpuArchitecture = parsed.cpu.architecture || null;

  // 1. Create session in database with synchronized expiresAt & device metadata
  const session = await prisma.session.create({
    data: {
      userId,
      token: "", // Placeholder, will update after signing
      userAgent,
      ipAddress,
      browserName,
      browserVersion,
      osName,
      osVersion,
      deviceType,
      deviceVendor,
      deviceModel,
      cpuArchitecture,
      expiresAt,
    },
  });

  // 2. Sign JWT using jsonwebtoken with ACCESS_TOKEN_EXPIRES_IN
  const payload: JwtPayload = {
    userId,
    email,
    sessionId: session.id,
  };

  const token = jwt.sign(payload, JWT_SECRET, {
    expiresIn: expirySetting as SignOptions["expiresIn"],
  });

  // 3. Update session with signed token
  await prisma.session.update({
    where: { id: session.id },
    data: { token },
  });

  // 4. Set HttpOnly cookie with matching maxAge and expiresAt
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
    maxAge: Math.floor(expiryMs / 1000),
  });

  cacheInvalidateTag("sessions");
  return { token, session };
}

async function verifyToken(token: string): Promise<JwtPayload | null> {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    return decoded;
  } catch {
    // Handles TokenExpiredError and JsonWebTokenError
    return null;
  }
}

export const getCurrentUser = cache(async () => {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;

    const decoded = await verifyToken(token);
    if (!decoded || !decoded.userId) {
      // Clear expired or invalid token cookie
      cookieStore.delete(COOKIE_NAME);
      return null;
    }

    // Verify session in DB and check expiration
    if (decoded.sessionId) {
      const activeSession = await prisma.session.findUnique({
        where: { id: decoded.sessionId },
      });
      if (!activeSession || new Date(activeSession.expiresAt) < new Date()) {
        if (activeSession) {
          await prisma.session
            .delete({ where: { id: decoded.sessionId } })
            .catch(() => {});
        }
        cookieStore.delete(COOKIE_NAME);
        return null;
      }
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      },
    });

    if (!user) {
      cookieStore.delete(COOKIE_NAME);
      return null;
    }

    return user;
  } catch {
    return null;
  }
});

export const getCurrentSessionId = cache(async (): Promise<number | null> => {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;

    const decoded = await verifyToken(token);
    if (decoded?.sessionId) {
      return decoded.sessionId;
    }

    // Fallback 1: match database session directly by the JWT token string
    const dbSession = await prisma.session.findUnique({
      where: { token },
      select: { id: true },
    });
    if (dbSession) return dbSession.id;

    // Fallback 2: match latest session for this authenticated user
    if (decoded?.userId) {
      let userAgent = "";
      try {
        const headersList = await headers();
        userAgent = headersList.get("user-agent") || "";
      } catch {}

      if (userAgent) {
        const matchingUaSession = await prisma.session.findFirst({
          where: { userId: decoded.userId, userAgent },
          orderBy: { createdAt: "desc" },
          select: { id: true },
        });
        if (matchingUaSession) return matchingUaSession.id;
      }

      const latestSession = await prisma.session.findFirst({
        where: { userId: decoded.userId },
        orderBy: { createdAt: "desc" },
        select: { id: true },
      });
      if (latestSession) return latestSession.id;
    }

    return null;
  } catch {
    return null;
  }
});

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}

export async function getActiveSessions(userId: number): Promise<Session[]> {
  const cacheKey = `sessions:${userId}`;
  const cached = cacheGet<Session[]>(cacheKey);
  if (cached) return cached;

  // Opportunistic cleanup of expired sessions for this user
  await prisma.session
    .deleteMany({
      where: {
        userId,
        expiresAt: { lte: new Date() },
      },
    })
    .catch(() => {});

  const sessions = await prisma.session.findMany({
    where: {
      userId,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });

  cacheSet(cacheKey, sessions, 30000, ["sessions"]);
  return sessions;
}

export async function revokeSession(sessionId: number, userId: number) {
  cacheInvalidateTag("sessions");
  return prisma.session.deleteMany({
    where: {
      id: sessionId,
      userId,
    },
  });
}

export async function logout() {
  cacheInvalidateTag("sessions");
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (token) {
      const decoded = await verifyToken(token);
      if (decoded?.sessionId) {
        await prisma.session
          .delete({ where: { id: decoded.sessionId } })
          .catch(() => {});
      }
    }
    cookieStore.delete(COOKIE_NAME);
  } catch {
    // Ignore cookie deletion error if any
  }
}
