"use client";

import { useState } from "react";

type PasswordFieldProps = {
  autoComplete: string;
  minLength?: number;
  name: string;
};

export function PasswordField({
  autoComplete,
  minLength,
  name,
}: PasswordFieldProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <label className="grid gap-2 text-sm text-slate-300">
      Password
      <div className="relative">
        <input
          required
          minLength={minLength}
          name={name}
          type={isVisible ? "text" : "password"}
          autoComplete={autoComplete}
          className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 pr-14 text-white outline-none transition focus:border-sky-400"
        />
        <button
          type="button"
          aria-label={isVisible ? "Hide password" : "Show password"}
          aria-pressed={isVisible}
          onClick={() => setIsVisible((value) => !value)}
          className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-slate-400 transition hover:text-sky-300"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M2 12s3.6-6 10-6 10 6 10 6-3.6 6-10 6S2 12 2 12Z" />
            <circle cx="12" cy="12" r="3" />
            {isVisible ? null : <path d="M4 4l16 16" />}
          </svg>
        </button>
      </div>
    </label>
  );
}
