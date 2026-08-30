import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import type { Role } from "./types";

const COOKIE = "dealboard_session";

function secret() {
  const raw = process.env.AUTH_SECRET || "dealboard-dev-secret-change-me";
  return new TextEncoder().encode(raw);
}

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: Role;
  badge: string;
  lookingStatus: string;
  phone: string;
  entityName: string | null;
  pofOnFile: boolean;
  entityOnFile: boolean;
  w9OnFile: boolean;
  quietHours: boolean;
  blacklisted: boolean;
  fundedCloses: number;
};

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createSession(userId: string) {
  const token = await new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("14d")
    .sign(secret());
  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 14,
    secure: process.env.NODE_ENV === "production",
  });
}

export async function clearSession() {
  const jar = await cookies();
  jar.delete(COOKIE);
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    const id = payload.sub;
    if (!id) return null;
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user || user.deletedAt) return null;
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as Role,
      badge: user.badge,
      lookingStatus: user.lookingStatus,
      phone: user.phone,
      entityName: user.entityName,
      pofOnFile: user.pofOnFile,
      entityOnFile: user.entityOnFile,
      w9OnFile: user.w9OnFile,
      quietHours: user.quietHours,
      blacklisted: user.blacklisted,
      fundedCloses: user.fundedCloses,
    };
  } catch {
    return null;
  }
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
}
