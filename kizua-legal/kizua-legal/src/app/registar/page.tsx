"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { registar } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Btn, FloatInput, ScreenHeader } from "@/components/ui";

export default function RegistarPage() {
  const router = useRouter();
  const { signInWithTokens } = useAuth();
  const [form, setForm] = useState({
    nomeCompleto: "",
    email: "",
    telefone: "+244",
    senha: "",
    confirmar: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (form.senha !== form.confirmar) {
      setError("As palavras-passe não coincidem.");
      return;
    }
    if (form.senha.length < 8) {
      setError("A palavra-passe deve ter no mínimo 8 caracteres.");
      return;
    }
    setLoading(true);
    try {
      const tokens = await registar({
        nomeCompleto: form.nomeCompleto.trim(),
        email: form.email.trim(),
        telefone: form.telefone.trim(),
        senha: form.senha,
      });
      await signInWithTokens(tokens);
      router.replace("/home");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar conta");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <ScreenHeader title="Criar conta" onBack={() => router.push("/login")} />
      <form onSubmit={handleSubmit} className="animate-fade-up flex flex-1 flex-col gap-5 px-6 py-8">
        <FloatInput
          label="Nome completo"
          value={form.nomeCompleto}
          onChange={(e) => set("nomeCompleto", e.target.value)}
          required
          minLength={3}
          icon={
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="8" r="4" />
              <path d="M4 21c0-4 3.6-6 8-6s8 2 8 6" />
            </svg>
          }
        />
        <FloatInput
          label="E-mail"
          type="email"
          value={form.email}
          onChange={(e) => set("email", e.target.value)}
          required
          icon={
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="4" width="20" height="16" rx="3" />
              <path d="m2 7 10 6 10-6" />
            </svg>
          }
        />
        <FloatInput
          label="Telefone (+244)"
          type="tel"
          inputMode="tel"
          value={form.telefone}
          onChange={(e) => set("telefone", e.target.value)}
          required
          pattern="\+244\s?9\d{8}"
          title="Formato: +244 9XXXXXXXX"
          icon={
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.9a2 2 0 0 1-.5 2.1L8 10a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.9.3 1.9.6 2.9.7a2 2 0 0 1 1.7 2Z" />
            </svg>
          }
        />
        <FloatInput
          label="Palavra-passe"
          type="password"
          value={form.senha}
          onChange={(e) => set("senha", e.target.value)}
          required
          minLength={8}
          icon={
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="10" rx="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          }
        />
        <FloatInput
          label="Confirmar palavra-passe"
          type="password"
          value={form.confirmar}
          onChange={(e) => set("confirmar", e.target.value)}
          required
          minLength={8}
        />

        {error && (
          <p className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </p>
        )}

        <Btn type="submit" loading={loading}>
          Criar conta
        </Btn>
        <p className="text-center text-sm text-muted">
          Já tem conta?{" "}
          <button type="button" onClick={() => router.push("/login")} className="font-semibold text-gold-bright">
            Entrar
          </button>
        </p>
      </form>
    </div>
  );
}
