"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import {
  isAuthConfigured,
  verifyCredentials,
  createSession,
  destroySession,
} from "@/lib/auth";
import { isDemoMode } from "@/lib/demo";

const loginSchema = z.object({
  email: z.string().trim().min(1, "Ingresa tu correo").max(200),
  password: z.string().min(1, "Ingresa tu contraseña").max(200),
});

export type LoginResult = { ok: true } | { ok: false; error: string };

export async function login(input: unknown): Promise<LoginResult> {
  // En modo demostración no hay autenticación.
  if (isDemoMode()) return { ok: true };

  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }
  if (!isAuthConfigured()) {
    return {
      ok: false,
      error:
        "La autenticación no está configurada en el servidor. Define AUTH_EMAIL, AUTH_PASSWORD_HASH y SESSION_SECRET.",
    };
  }

  const { email, password } = parsed.data;
  const valid = await verifyCredentials(email, password);
  // Mensaje genérico: no revela si falló el correo o la contraseña.
  if (!valid) return { ok: false, error: "Correo o contraseña incorrectos." };

  await createSession(email.trim().toLowerCase());
  return { ok: true };
}

export async function logout(): Promise<void> {
  await destroySession();
  redirect("/login");
}
