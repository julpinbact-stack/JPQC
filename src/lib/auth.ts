// Autenticación (solo servidor, runtime Node) — usa bcrypt y next/headers.
// NO debe importarse desde el middleware (Edge): para eso está src/lib/session.ts.
import "server-only";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { SESSION_COOKIE, SESSION_MAX_AGE, signSession, verifySession } from "@/lib/session";

/** ¿Están configuradas las variables de autenticación? */
export function isAuthConfigured(): boolean {
  return Boolean(
    process.env.AUTH_EMAIL &&
      process.env.AUTH_PASSWORD_HASH &&
      process.env.SESSION_SECRET
  );
}

/**
 * Verifica correo + contraseña contra las variables de entorno.
 * El correo se compara sin distinguir mayúsculas; la contraseña con bcrypt.
 */
export async function verifyCredentials(
  email: string,
  password: string
): Promise<boolean> {
  const expectedEmail = process.env.AUTH_EMAIL?.trim().toLowerCase();
  const hash = process.env.AUTH_PASSWORD_HASH;
  if (!expectedEmail || !hash) return false;
  if (email.trim().toLowerCase() !== expectedEmail) return false;
  try {
    return await bcrypt.compare(password, hash);
  } catch {
    return false;
  }
}

/** Correo del usuario autenticado según la cookie, o null. */
export async function getSessionUser(): Promise<string | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = await verifySession(token);
  return session?.email ?? null;
}

/** Crea la cookie de sesión para el usuario. */
export async function createSession(email: string): Promise<void> {
  const token = await signSession(email);
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

/** Elimina la cookie de sesión. */
export async function destroySession(): Promise<void> {
  (await cookies()).delete(SESSION_COOKIE);
}
