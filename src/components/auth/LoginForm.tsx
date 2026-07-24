"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { login } from "@/app/login/actions";

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    start(async () => {
      const res = await login({ email, password });
      if (res.ok) {
        const from = params.get("from");
        router.replace(from && from.startsWith("/") ? from : "/");
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="Correo">
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="username"
          autoFocus
          required
        />
      </Field>
      <Field label="Contraseña">
        <Input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
        />
      </Field>

      {error && (
        <p className="rounded-lg bg-danger-soft px-3 py-2 text-xs text-danger">{error}</p>
      )}

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Ingresando…" : "Ingresar"}
      </Button>
    </form>
  );
}
