import Link from "next/link";
import { Suspense } from "react";
import { register } from "@/app/auth/actions";
import { AuthCard, Field, FormMessage } from "@/components/AuthCard";
import { SubmitButton } from "@/components/SubmitButton";
import { AUTH_ERRORS } from "@/lib/auth-messages";

type SearchParams = Promise<{ error?: string | string[] }>;

export default function RegisterPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <AuthCard
      title="Konto erstellen"
      footer={
        <>
          Bereits registriert?{" "}
          <Link href="/login" className="font-medium underline underline-offset-2">
            Anmelden
          </Link>
        </>
      }
    >
      <Suspense fallback={null}>
        <RegisterForm searchParams={searchParams} />
      </Suspense>
    </AuthCard>
  );
}

async function RegisterForm({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const errorKey = typeof params.error === "string" ? params.error : undefined;

  return (
    <>
      {errorKey && (
        <FormMessage kind="error">{AUTH_ERRORS[errorKey] ?? AUTH_ERRORS.unknown}</FormMessage>
      )}

      <form action={register} className="space-y-4">
        <Field label="E-Mail" name="email" type="email" autoComplete="email" />
        <Field
          label="Passwort (mindestens 8 Zeichen)"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
        />
        <Field
          label="Passwort wiederholen"
          name="confirm"
          type="password"
          autoComplete="new-password"
          minLength={8}
        />
        <SubmitButton pendingText="Konto wird erstellt …">Konto erstellen</SubmitButton>
      </form>
    </>
  );
}