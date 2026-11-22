import passport from "passport";
import {
  Strategy as JwtStrategy,
  ExtractJwt,
  StrategyOptions,
} from "passport-jwt";
import { prisma } from "./prisma";
import { JwtPayload } from "@/types/settings.types";

const JWT_SECRET =
  process.env.JWT_SECRET ||
  "finvault_super_secret_jwt_key_2026_change_in_production";

// Custom cookie extractor for Next.js App Router
const cookieExtractor = (req: {
  cookies?:
    | Record<string, string | undefined>
    | { get: (name: string) => { value: string } | undefined };
}) => {
  if (!req) return null;
  if ("cookies" in req && typeof req.cookies?.get === "function") {
    return req.cookies.get("finvault_token")?.value || null;
  }
  if (
    "cookies" in req &&
    typeof req.cookies === "object" &&
    req.cookies !== null
  ) {
    return (
      (req.cookies as Record<string, string | undefined>)["finvault_token"] ||
      null
    );
  }
  return null;
};

const options: StrategyOptions = {
  jwtFromRequest: ExtractJwt.fromExtractors([
    ExtractJwt.fromAuthHeaderAsBearerToken(),
    (req: any) => cookieExtractor(req),
  ]),
  secretOrKey: JWT_SECRET,
};

passport.use(
  new JwtStrategy(options, async (payload: JwtPayload, done) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: { id: true, email: true, name: true },
      });

      if (!user) {
        return done(null, false);
      }

      // Check if session is still active in database
      if (payload.sessionId) {
        const session = await prisma.session.findUnique({
          where: { id: payload.sessionId },
        });

        if (!session || new Date(session.expiresAt) < new Date()) {
          return done(null, false);
        }
      }

      return done(null, user);
    } catch (error) {
      return done(error, false);
    }
  })
);
