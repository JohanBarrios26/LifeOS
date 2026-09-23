import type { ButtonHTMLAttributes, ReactNode } from "react";

// text-base (16px) keeps phones from zooming in when a field gets focus.
export const inputClassName =
  "w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-base outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:focus:border-zinc-100";

export function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-sm font-medium">
        {label}
      </label>
      {children}
      {hint && <p className="text-xs text-zinc-500 dark:text-zinc-400">{hint}</p>}
    </div>
  );
}

const buttonVariants = {
  primary:
    "bg-zinc-900 text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300",
  secondary:
    "border border-zinc-300 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800",
};

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: keyof typeof buttonVariants }) {
  return (
    <button
      type="button"
      className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors disabled:opacity-50 ${buttonVariants[variant]} ${className}`}
      {...props}
    />
  );
}

export function ErrorList({ messages }: { messages: string[] }) {
  if (messages.length === 0) {
    return null;
  }
  return (
    <ul
      role="alert"
      className="list-disc rounded-xl bg-red-50 py-3 pr-4 pl-8 text-sm text-red-800 dark:bg-red-950 dark:text-red-200"
    >
      {messages.map((message) => (
        <li key={message}>{message}</li>
      ))}
    </ul>
  );
}

export const formCardClassName =
  "flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900";
