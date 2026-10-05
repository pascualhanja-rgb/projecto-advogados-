"use client";

import { useState, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from "react";

/* ————————————————— Botão primário ————————————————— */

export function Btn({
  children,
  loading,
  className = "",
  variant = "primary",
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  loading?: boolean;
  variant?: "primary" | "ghost" | "danger";
}) {
  const base =
    "relative inline-flex h-13 w-full items-center justify-center gap-2 rounded-xl font-semibold transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 min-h-13 px-5 py-3.5 text-[15px]";
  const styles = {
    primary: "bg-gold-bright text-slate-950 shadow-lg shadow-amber-500/20 hover:bg-amber-400",
    ghost: "border border-white/10 bg-white/5 text-foreground hover:bg-white/10",
    danger: "border border-red-400/30 bg-red-500/15 text-red-300 hover:bg-red-500/25",
  }[variant];
  return (
    <button className={`${base} ${styles} ${className}`} disabled={loading || rest.disabled} {...rest}>
      {loading && (
        <span className="spin-slow h-4 w-4 rounded-full border-2 border-current border-t-transparent" />
      )}
      {children}
    </button>
  );
}

/* ————————————————— Floating label input ————————————————— */

interface FloatFieldProps {
  label: string;
  error?: string;
  icon?: ReactNode;
  prefix?: ReactNode;
}

export function FloatInput({
  label,
  error,
  icon,
  prefix,
  ...rest
}: FloatFieldProps & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="relative block">
      <span className="pointer-events-none absolute -top-2 left-3 z-10 bg-background px-1.5 text-[11px] font-medium text-muted">
        {label}
      </span>
      <span className="relative block">
        {icon && <span className="absolute left-3.5 top-1/2 z-10 -translate-y-1/2 text-muted">{icon}</span>}
        {prefix && (
          <span className="absolute left-11 top-1/2 z-10 -translate-y-1/2 border-r border-white/10 pr-2 text-sm font-semibold text-gold-bright">
            {prefix}
          </span>
        )}
        <input
          {...rest}
          placeholder={rest.placeholder ?? " "}
          className={`peer w-full rounded-xl border bg-surface/80 py-4 pr-4 text-[15px] text-foreground outline-none transition placeholder:text-transparent focus:border-gold-bright/60 focus:glow-gold ${
            prefix
              ? "pl-[4.5rem]"
              : icon
                ? "pl-11"
                : ""
          } pl-4 ${error ? "border-red-400/60" : "border-white/10"} ${rest.className ?? ""}`}
        />
      </span>
      {error && <span className="mt-1.5 block pl-1 text-xs text-red-400">{error}</span>}
    </label>
  );
}

export function FloatTextarea({
  label,
  error,
  ...rest
}: FloatFieldProps & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <label className="relative block">
      <span className="pointer-events-none absolute -top-2 left-3 z-10 bg-background px-1.5 text-[11px] font-medium text-muted">
        {label}
      </span>
      <textarea
        {...rest}
        placeholder={rest.placeholder ?? " "}
        className={`peer w-full rounded-xl border border-white/10 bg-surface/80 px-4 py-4 text-[15px] text-foreground outline-none transition placeholder:text-transparent focus:border-gold-bright/60 focus:glow-gold ${
          error ? "border-red-400/60" : ""
        } ${rest.className ?? ""}`}
      />
      {error && <span className="mt-1.5 block pl-1 text-xs text-red-400">{error}</span>}
    </label>
  );
}

/* ————————————————— Header de tela ————————————————— */

export function ScreenHeader({
  title,
  onBack,
  right,
}: {
  title: string;
  onBack?: () => void;
  right?: ReactNode;
}) {
  return (
    <header className="sticky top-0 z-40 flex items-center gap-3 border-b border-white/5 bg-background/85 px-4 py-3 backdrop-blur-lg">
      {onBack && (
        <button
          onClick={onBack}
          aria-label="Voltar"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-muted transition hover:text-foreground"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
      )}
      <h1 className="flex-1 truncate text-lg font-bold tracking-tight">{title}</h1>
      {right}
    </header>
  );
}

/* ————————————————— Estado vazio / loading ————————————————— */

export function EmptyState({ icon, title, subtitle }: { icon?: ReactNode; title: string; subtitle?: string }) {
  return (
    <div className="flex flex-col items-center gap-3 px-8 py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-2xl">
        {icon ?? "📄"}
      </div>
      <p className="font-semibold">{title}</p>
      {subtitle && <p className="max-w-xs text-sm text-muted">{subtitle}</p>}
    </div>
  );
}

export function Spinner({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center py-16 ${className}`}>
      <span className="spin-slow h-8 w-8 rounded-full border-[3px] border-gold-bright/80 border-t-transparent" />
    </div>
  );
}

/* ————————————————— Chip de categoria ————————————————— */

export function CategoriaChip({ categoria }: { categoria: string }) {
  const estilos: Record<string, string> = {
    BRONZE: "text-orange-300 bg-orange-400/10 border-orange-400/30",
    PRATA: "text-slate-200 bg-slate-300/10 border-slate-300/30",
    OURO: "text-amber-300 bg-amber-400/15 border-amber-400/40",
    BLACK: "text-fuchsia-200 bg-fuchsia-400/10 border-fuchsia-400/30",
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold tracking-wider ${estilos[categoria] ?? estilos.BRONZE}`}>
      {categoria}
    </span>
  );
}
