"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { getLawyer, getLawyerEspecialidades } from "@/lib/api";
import { CATEGORIA_ESTILO } from "@/lib/format";
import { imageUrl } from "@/lib/urls";
import type { Especialidade, Lawyer } from "@/lib/types";
import { CategoriaChip, Spinner } from "@/components/ui";

export default function DetalheAdvogadoPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [adv, setAdv] = useState<Lawyer | null>(null);
  const [especs, setEspecs] = useState<Especialidade[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    let alive = true;
    setLoading(true);
    Promise.all([getLawyer(id), getLawyerEspecialidades(id).catch(() => [])])
      .then(([lawyer, especs]) => {
        if (!alive) return;
        setAdv(lawyer);
        setEspecs(especs);
      })
      .catch((err) => alive && setErro(err instanceof Error ? err.message : "Erro ao carregar"))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [id]);

  if (loading) return <Spinner className="min-h-dvh" />;
  if (erro || !adv)
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-8 text-center">
        <p className="text-sm text-red-300">{erro || "Advogado não encontrado."}</p>
        <button onClick={() => router.push("/home")} className="text-sm font-semibold text-gold-bright">
          Voltar ao início
        </button>
      </div>
    );

  return (
    <div className="flex min-h-dvh flex-col pb-28">
      <header className="sticky top-0 z-40 border-b border-white/5 bg-background/85 px-4 py-3 backdrop-blur-lg">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-muted"
            aria-label="Voltar"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <h1 className="flex-1 truncate text-lg font-bold">Perfil do advogado</h1>
        </div>
      </header>

      <div className="animate-fade-up flex flex-1 flex-col px-5 py-6">
        {/* Cabeçalho do perfil */}
        <div className={`glass relative overflow-hidden rounded-3xl p-6 ${CATEGORIA_ESTILO[adv.categoria]?.grad ?? ""}`}>
          <div className="relative flex flex-col items-center text-center">
            <div className="relative">
              <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-2 border-white/20 bg-slate-800 text-3xl">
                {adv.fotoUrl ? (
                  <Image src={imageUrl(adv.fotoUrl)!} alt={adv.nome} width={96} height={96} className="h-full w-full object-cover" unoptimized />
                ) : (
                  "⚖️"
                )}
              </div>
              {adv.disponivel && (
                <span className="pulse-dot absolute bottom-1 right-1 h-4 w-4 rounded-full border-2 border-background bg-emerald-500" />
              )}
            </div>
            <h2 className="mt-4 text-xl font-extrabold">{adv.nome}</h2>
            <div className="mt-2 flex items-center gap-2">
              <CategoriaChip categoria={adv.categoria} />
              {adv.disponivel && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2 py-0.5 text-[10px] font-bold tracking-wider text-emerald-300">
                  <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  DISPONÍVEL
                </span>
              )}
            </div>
            <p className="mt-2 text-sm text-muted">{adv.anosExperiencia} anos de experiência</p>
          </div>
        </div>

        {/* Especialidades */}
        <section className="mt-6">
          <h3 className="text-sm font-bold tracking-tight">Áreas de atuação</h3>
          {especs.length === 0 ? (
            <p className="mt-3 text-sm text-muted">Sem especialidades registadas.</p>
          ) : (
            <div className="mt-3 flex flex-wrap gap-2">
              {especs.map((e) => (
                <div key={e.id} className="rounded-xl border border-white/10 bg-surface/70 px-3.5 py-2.5">
                  <p className="text-sm font-semibold">{e.nome}</p>
                  {e.descricao && <p className="mt-0.5 text-xs text-muted">{e.descricao}</p>}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Info extra */}
        <section className="mt-6 flex flex-col gap-3">
          <div className="flex items-center justify-between rounded-xl border border-white/10 bg-surface/60 px-4 py-3">
            <span className="text-sm text-muted">Aprovação</span>
            <span className="text-sm font-semibold text-emerald-300">{adv.statusAprovacao ?? "APROVADO"}</span>
          </div>
        </section>
      </div>

      {/* CTA fixo */}
      <div className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-md border-t border-white/10 bg-surface/95 p-4 pb-[max(env(safe-area-inset-bottom),1rem)] backdrop-blur-xl">
        <button
          onClick={() => router.push(`/servicos/novo?advogado=${adv.id}`)}
          className="w-full rounded-xl bg-gold-bright py-3.5 text-[15px] font-bold text-slate-950 shadow-lg shadow-amber-500/20 transition active:scale-[0.98]"
        >
          Solicitar serviço
        </button>
      </div>
    </div>
  );
}
