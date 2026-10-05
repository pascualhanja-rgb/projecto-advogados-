"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { getMe, patchMe, uploadFoto } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { imageUrl } from "@/lib/urls";
import { Btn, FloatInput, ScreenHeader, Spinner } from "@/components/ui";
import { BottomNav } from "@/app/home/page";

export default function PerfilPage() {
  const router = useRouter();
  const { user, loading: authLoading, refreshUser, signOut } = useAuth();
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [erro, setErro] = useState("");
  const [saindo, setSaindo] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!authLoading && !user) window.location.href = "/login";
  }, [authLoading, user]);

  useEffect(() => {
    if (user) {
      setNome(user.nome);
      setEmail(user.email);
    }
  }, [user]);

  async function salvar() {
    setSaving(true);
    setMsg("");
    setErro("");
    try {
      await patchMe({
        nomeCompleto: nome.trim(),
        email: email.trim(),
      });
      await refreshUser();
      setMsg("Dados atualizados com sucesso.");
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao guardar");
    } finally {
      setSaving(false);
    }
  }

  async function trocarFoto(file: File) {
    setErro("");
    try {
      const { url } = await uploadFoto(file);
      await patchMe({ fotoUrl: url });
      await refreshUser();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao enviar foto");
    }
  }

  async function sair() {
    if (!confirm("Terminar sessão?")) return;
    setSaindo(true);
    await signOut();
    router.replace("/login");
  }

  if (authLoading || !user) return <Spinner className="min-h-dvh" />;

  return (
    <div className="flex min-h-dvh flex-col pb-24">
      <ScreenHeader title="Meu perfil" />

      <div className="animate-fade-up flex flex-1 flex-col gap-6 px-6 py-6">
        {/* Avatar + foto */}
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-2 border-gold-bright/40 bg-surface text-3xl">
              {user.fotoUrl ? (
                <Image src={imageUrl(user.fotoUrl)!} alt="Foto de perfil" width={96} height={96} className="h-full w-full object-cover" unoptimized />
              ) : (
                "👤"
              )}
            </div>
            <button
              onClick={() => fileRef.current?.click()}
              className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-gold-bright text-slate-950 shadow-lg"
              aria-label="Alterar foto"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
            </button>
          </div>
          <p className="text-sm font-bold">{user.nome}</p>
          <span className="rounded-full border border-white/10 bg-surface/70 px-2.5 py-0.5 text-[10px] font-bold tracking-wider text-muted">
            {user.role}
          </span>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void trocarFoto(f);
            }}
          />
        </div>

        {/* Formulário */}
        <div className="flex flex-col gap-5">
          <FloatInput label="Nome completo" value={nome} onChange={(e) => setNome(e.target.value)} />
          <FloatInput label="E-mail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>

        {msg && (
          <p className="rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-300">{msg}</p>
        )}
        {erro && (
          <p className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{erro}</p>
        )}

        <Btn onClick={salvar} loading={saving}>
          Guardar alterações
        </Btn>

        <div className="mt-4 flex flex-col gap-3 border-t border-white/5 pt-6">
          <button
            onClick={() => router.push("/recuperar")}
            className="flex items-center justify-between rounded-xl border border-white/10 bg-surface/60 px-4 py-3.5 text-sm font-semibold transition hover:bg-surface"
          >
            <span>🔑 Alterar palavra-passe</span>
            <span className="text-muted">→</span>
          </button>
          <button
            onClick={sair}
            disabled={saindo}
            className="rounded-xl border border-red-400/30 bg-red-500/10 py-3.5 text-[15px] font-semibold text-red-300 transition hover:bg-red-500/20"
          >
            {saindo ? "A terminar…" : "Terminar sessão"}
          </button>
        </div>
      </div>

      <BottomNav ativo="perfil" />
    </div>
  );
}
