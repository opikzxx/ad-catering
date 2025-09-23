import { NextRequest } from "next/server";
import jwt from "jsonwebtoken";

export interface TokenPayload {
  userId: string;
  email: string;
  full_name: string;
  user_role: string;
  isAdmin: boolean;
}

export function verifyAuthToken(token: string): TokenPayload | null {
  try {
    const payload = jwt.verify(
      token,
      process.env.NEXTAUTH_SECRET!
    ) as TokenPayload;
    return payload;
  } catch (err) {
    console.error("JWT verification error:", err);
    return null;
  }
}

export function getTokenFromHeader(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  return authHeader.split(" ")[1];
}
