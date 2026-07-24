import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/session";

/**
 * Protege toda la aplicación cuando NO está en modo demostración.
 *
 * - DEMO_MODE=true  → acceso libre (instancia pública de demostración).
 * - DEMO_MODE!=true → se exige sesión válida; sin ella, redirige a /login.
 *
 * Solo usa `verifySession` (jose), compatible con el runtime Edge del middleware.
 */
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Expone la ruta al layout (para ocultar la barra lateral en /login).
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-pathname", pathname);
  const pass = NextResponse.next({ request: { headers: requestHeaders } });

  // En modo demostración no hay login.
  if (process.env.DEMO_MODE === "true") return pass;

  // La pantalla de login siempre es accesible.
  if (pathname === "/login") return pass;

  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifySession(token) : null;
  if (session) return pass;

  // Sin sesión válida → redirigir al login, recordando a dónde iba.
  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.search = "";
  if (pathname !== "/") url.searchParams.set("from", pathname);
  return NextResponse.redirect(url);
}

export const config = {
  // Aplica a todo salvo los recursos estáticos de Next y archivos con extensión.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.[\\w]+$).*)"],
};
