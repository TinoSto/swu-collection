import Link from "next/link";
import { Suspense } from "react";
import { login } from "@/app/auth/actions";
import { AuthCard, Field, FormMessage } from "@/components/AuthCard";
import { SubmitButton } from "@/components/SubmitButton";
import { AUTH_ERRORS, AUTH_INFOS } from "@/lib/auth-messages";

type SearchParams = Promise<{
  error?: string | string[];
  message?: string | string[];
  next?: string | string[];
}>;

export default function LoginPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <AuthCard
      title="Anmelden"
      footer={
        <>
          Noch kein Konto?{" "}
          <Link href="/register" className="font-medium underline underline-offset-2">
            Konto erstellen
          </Link>
        </>
      }
    >
      {/* searchParams sind Request-Daten und müssen hinter einer Suspense-Grenze gelesen werden. */}
      <Suspense fallback={null}>
        <LoginForm searchParams={searchParams} />
      </Suspense>
    </AuthCard>
  );
}

async function LoginForm({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const errorKey = typeof params.error === "string" ? params.error : undefined;
  const messageKey = typeof params.message === "string" ? params.message : undefined;
  const next = typeof params.next === "string" ? params.next : "/";

  return (
    <>
      {errorKey && (
        <FormMessage kind="error">{AUTH_ERRORS[errorKey] ?? AUTH_ERRORS.unknown}</FormMessage>
      )}
      {messageKey && AUTH_INFOS[messageKey] && (
        <FormMessage kind="info">{AUTH_INFOS[messageKey]}</FormMessage>
      )}

      <form action={login} className="space-y-4">
        <input type="hidden" name="next" value={next} />
        <Field label="E-Mail" name="email" type="email" autoComplete="email" />
        <Field label="Passwort" name="password" type="password" autoComplete="current-password" />
        <SubmitButton pendingText="Anmelden …">Anmelden</SubmitButton>
      </form>
    </>
  );
}