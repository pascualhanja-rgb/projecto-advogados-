"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { recuperarRedefinir, recuperarSolicitar, recuperarValidar } from "@/lib/api";
import { Btn, FloatInput, ScreenHeader } from "@/components/ui";

export default function RecuperarPage() {
  const router = useRouter();
  const [etapa, setEtapa] = useState<1 | 2 | 3>(1);
  const [identificador, setIdentificador] = useState("");
  const [codigo, setCodigo] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [devCodigo, setDevCodigo] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Passo 1: solicitar código
  async function solicitar(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await recuperarSolicitar(identificador.trim());
      setDevCodigo(res.devToken ?? null);
      setEtapa(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao solicitar código");
    } finally {
      setLoading(false);
    }
  }

  // Passo 2: validar PIN de 6 dígitos
  async function validar(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await recuperarValidar(identificador.trim(), codigo.trim());
      setResetToken(res.resetToken);
      setEtapa(3);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Código inválido");
    } finally {
      setLoading(false);
    }
  }

  // Passo 3: redefinir senha
  async function redefinir(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (novaSenha !== confirmar) {
      setError("As palavras-passe não coincidem.");
      return;
    }
    setLoading(true);
    try {
      await recuperarRedefinir(resetToken, novaSenha);
      alert("Palavra-passe redefinida com sucesso! Já pode entrar.");
      router.replace("/login");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao redefinir");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <ScreenHeader title="Recuperar conta" onBack={() => router.push("/login")} />

      <div className="animate-fade-up flex flex-1 flex-col gap-6 px-6 py-8">
        {/* Indicador de etapas */}
        <div className="flex items-center gap-2">
          {[1, 2, 3].map((n) => (
            <div key={n} className="flex flex-1 flex-col gap-1.5">
              <div
                className={`h-1.5 rounded-full transition ${etapa >= n ? "bg-gold-bright" : "bg-white/10"}`}
              />
              <span className={`text-[11px] ${etapa === n ? "text-gold-bright" : "text-muted"}`}>
                {["Identificar", "Código", "Nova senha"][n - 1]}
              </span>
            </div>
          ))}
        </div>

        {etapa === 1 && (
          <form onSubmit={solicitar} className="flex flex-col gap-5">
            <p className="text-sm text-muted">
              Indique o e-mail ou telefone da sua conta. Enviaremos um código de verificação de 6 dígitos.
            </p>
            <FloatInput
              label="E-mail ou telefone"
              value={identificador}
              onChange={(e) => setIdentificador(e.target.value)}
              required
            />
            {error && (
              <p className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {error}
              </p>
            )}
            <Btn type="submit" loading={loading}>
              Solicitar código
            </Btn>
          </form>
        )}

        {etapa === 2 && (
          <form onSubmit={validar} className="flex flex-col gap-5">
            <p className="text-sm text-muted">Introduza o código de 6 dígitos que recebeu.</p>
            {devCodigo && (
              <p className="rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-300">
                Modo de teste — código: <strong className="font-mono">{devCodigo}</strong>
              </p>
            )}
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={codigo}
              onChange={(e) => setCodigo(e.target.value.replace(/\D/g, ""))}
              placeholder="••••••"
              required
              className="w-full rounded-xl border border-white/10 bg-surface/80 py-4 text-center font-mono text-3xl tracking-[0.5em] outline-none focus:border-gold-bright/60 focus:glow-gold"
            />
            {error && (
              <p className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {error}
              </p>
            )}
            <Btn type="submit" loading={loading}>
              Validar código
            </Btn>
          </form>
        )}

        {etapa === 3 && (
          <form onSubmit={redefinir} className="flex flex-col gap-5">
            <p className="text-sm text-muted">Crie a sua nova palavra-passe.</p>
            <FloatInput
              label="Nova palavra-passe"
              type="password"
              value={novaSenha}
              onChange={(e) => setNovaSenha(e.target.value)}
              required
              minLength={8}
            />
            <FloatInput
              label="Confirmar palavra-passe"
              type="password"
              value={confirmar}
              onChange={(e) => setConfirmar(e.target.value)}
              required
              minLength={8}
            />
            {error && (
              <p className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {error}
              </p>
            )}
            <Btn type="submit" loading={loading}>
              Redefinir palavra-passe
            </Btn>
          </form>
        )}
      </div>
    </div>
  );
}
