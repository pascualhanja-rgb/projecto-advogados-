"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { loginCliente } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Btn, FloatInput } from "@/components/ui";

export default function LoginPage() {
  const router = useRouter();
  const { signInWithTokens } = useAuth();
  const [modo, setModo] = useState<"email" | "telefone">("email");
  const [identificador, setIdentificador] = useState("");
  const [senha, setSenha] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const tokens = await loginCliente(identificador.trim(), senha);
      await signInWithTokens(tokens);
      router.replace("/home");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao entrar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center opacity-20"
        style={{ backgroundImage: "url(/portifolio.jpg)" }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/90 to-background" />

      <div className="relative z-10 flex flex-1 flex-col px-6 pb-10 pt-16">
        <div className="animate-fade-up">
          <h1 className="text-3xl font-extrabold tracking-tight">
            Bem-vindo de <span className="text-gold-bright">volta</span>
          </h1>
          <p className="mt-1.5 text-sm text-muted">Entre na sua conta de cliente Kizua Legal</p>
        </div>

        {/* Alternador email / telefone */}
        <div className="mt-8 grid grid-cols-2 gap-1 rounded-xl border border-white/10 bg-surface/60 p-1">
          {(["email", "telefone"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => {
                setModo(m);
                setIdentificador("");
              }}
              className={`rounded-lg py-2.5 text-sm font-semibold transition ${
                modo === m ? "bg-gold-bright text-slate-950" : "text-muted hover:text-foreground"
              }`}
            >
              {m === "email" ? "E-mail" : "Telefone"}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="animate-fade-up mt-6 flex flex-col gap-5">
          {modo === "email" ? (
            <FloatInput
              label="E-mail"
              type="email"
              autoComplete="email"
              value={identificador}
              onChange={(e) => setIdentificador(e.target.value)}
              required
              icon={
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="4" width="20" height="16" rx="3" />
                  <path d="m2 7 10 6 10-6" />
                </svg>
              }
            />
          ) : (
            <FloatInput
              label="Telefone"
              type="tel"
              autoComplete="tel"
              inputMode="tel"
              value={identificador}
              onChange={(e) => setIdentificador(e.target.value)}
              required
              prefix="+244"
              icon={
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.9a2 2 0 0 1-.5 2.1L8 10a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.9.3 1.9.6 2.9.7a2 2 0 0 1 1.7 2Z" />
                </svg>
              }
            />
          )}

          <FloatInput
            label="Palavra-passe"
            type="password"
            autoComplete="current-password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            required
            icon={
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="10" rx="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            }
          />

          {error && (
            <p className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {error}
            </p>
          )}

          <Btn type="submit" loading={loading}>
            Entrar
          </Btn>
        </form>

        <div className="mt-5 flex items-center justify-between text-sm">
          <button onClick={() => router.push("/recuperar")} className="text-muted transition hover:text-gold-bright">
            Esqueci a palavra-passe
          </button>
          <button onClick={() => router.push("/registar")} className="font-semibold text-gold-bright">
            Criar conta
          </button>
        </div>
      </div>
    </div>
  );
}
