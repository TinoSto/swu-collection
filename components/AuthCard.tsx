import type { ReactNode } from "react";

export const inputClass =
  "w-full rounded-lg border border-zinc-300 bg-transparent px-3 py-2.5 text-base outline-none focus-visible:border-zinc-900 focus-visible:ring-2 focus-visible:ring-zinc-900/20 dark:border-zinc-700 dark:focus-visible:border-zinc-100 dark:focus-visible:ring-zinc-100/20";

export function AuthCard({
  title,
  children,
  footer,
}: {
  title: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center px-4 py-10">
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">{title}</h1>
      {children}
      <p className="mt-6 text-sm text-zinc-600 dark:text-zinc-400">{footer}</p>
    </main>
  );
}

export function FormMessage({
  kind,
  children,
}: {
  kind: "error" | "info";
  children: ReactNode;
}) {
  const tone =
    kind === "error"
      ? "border-red-300 bg-red-50 text-red-900 dark:border-red-900 dark:bg-red-950 dark:text-red-100"
      : "border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-100";

  return (
    <p
      role={kind === "error" ? "alert" : "status"}
      className={`mb-4 rounded-lg border px-3 py-2 text-sm ${tone}`}
    >
      {children}
    </p>
  );
}

export function Field({
  label,
  name,
  type,
  autoComplete,
  minLength,
}: {
  label: string;
  name: string;
  type: "email" | "password";
  autoComplete: string;
  minLength?: number;
}) {
  return (
    <div>
      <label htmlFor={name} className="mb-1 block text-sm font-medium">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required
        autoComplete={autoComplete}
        minLength={minLength}
        className={inputClass}
      />
    </div>
  );
}