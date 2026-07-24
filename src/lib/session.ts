// Sesión firmada (JWT) — segura para el runtime Edge del middleware.
// NO importa bcrypt ni next/headers: solo jose, para poder usarse en el middleware.
import { SignJWT, jwtVerify } from "jose";

/** Nombre de la cookie de sesión. */
export const SESSION_COOKIE = "jpqc_session";

/** Duración de la sesión: una jornada de trabajo (8 horas). */
export const SESSION_MAX_AGE = 60 * 60 * 8;

function getSecret(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error("SESSION_SECRET no está configurado (o es demasiado corto).");
  }
  return new TextEncoder().encode(secret);
}

/** Firma un token de sesión para el usuario (correo). */
export async function signSession(email: string): Promise<string> {
  return new SignJWT({ email })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(email)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(getSecret());
}

/** Verifica un token; devuelve el correo si es válido, o null. */
export async function verifySession(token: string): Promise<{ email: string } | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    const email = typeof payload.email === "string" ? payload.email : payload.sub;
    return email ? { email } : null;
  } catch {
    return null;
  }
}
