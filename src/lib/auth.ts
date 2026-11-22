import { cache } from "react";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { cookies, headers } from "next/headers";
import { prisma } from "./prisma";
import { JwtPayload } from "@/types/settings.types";
import { cacheGet, cacheSet, cacheInvalidateTag } from "./cache";

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

// Fetch SALT_ROUNDS from environment variable with fallback
function getSaltRounds(): number {
  const envRounds = process.env.SALT_ROUNDS;
  const parsed = envRounds ? parseInt(envRounds, 10) : 10;
  return isNaN(parsed) || parsed < 4 ? 10 : parsed;
}

export async function hashPassword(password: string): Promise<string> {
  const saltRounds = getSaltRounds();
  const salt = await bcrypt.genSalt(saltRounds);
  return bcrypt.hash(password, salt);
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
      headersList.get("x-forwarded-for")?.split(",")[0].trim() || ipAddress;
  } catch {
    // headers() might not be available
  }

  // 1. Create session in database with synchronized expiresAt
  const session = await prisma.session.create({
    data: {
      userId,
      token: "", // Placeholder, will update after signing
      userAgent,
      ipAddress,
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
    expiresIn: expirySetting as any,
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

export async function getActiveSessions(userId: number) {
  const cacheKey = `sessions:${userId}`;
  const cached = cacheGet<any[]>(cacheKey);
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

async function revokeAllOtherSessions(
  currentSessionId: number,
  userId: number
) {
  cacheInvalidateTag("sessions");
  return prisma.session.deleteMany({
    where: {
      userId,
      id: { not: currentSessionId },
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
