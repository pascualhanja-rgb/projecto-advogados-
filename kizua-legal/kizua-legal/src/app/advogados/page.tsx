"use client";

import { Suspense, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { getAdvogadosPorEspecialidade, getLawyerEspecialidades, listEspecialidades } from "@/lib/api";
import { CATEGORIA_ESTILO } from "@/lib/format";
import { imageUrl } from "@/lib/urls";
import type { Especialidade, Lawyer } from "@/lib/types";
import { Spinner } from "@/components/ui";

export default function AdvogadosPageWrapper() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center">
          <span className="spin-slow h-8 w-8 rounded-full border-[3px] border-gold-bright/80 border-t-transparent" />
        </div>
      }
    >
      <AdvogadosPage />
    </Suspense>
  );
}

function AdvogadosPage() {
  const router = useRouter();
  const search = useSearchParams();
  const espId = search.get("especialidade");

  const [advogados, setAdvogados] = useState<Lawyer[]>([]);
  const [especialidades, setEspecialidades] = useState<Especialidade[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    const tasks: Promise<unknown>[] = [
      espId ? getAdvogadosPorEspecialidade(espId) : Promise.resolve({ data: [] }),
      listEspecialidades().catch(() => []),
    ];
    Promise.all(tasks)
      .then((res) => {
        if (!alive) return;
        const byEsp = (res[0] as { data: Lawyer[] }).data ?? [];
        setEspecialidades(res[1] as Especialidade[]);
        if (espId) setAdvogados(byEsp);
        else listLawyersAll().then((all) => alive && setAdvogados(all));
      })
      .finally(() => alive && setLoading(false));

    async function listLawyersAll() {
      const { listLawyers } = await import("@/lib/api");
      const res = await listLawyers({ limit: 50 });
      return res.data;
    }
    return () => {
      alive = false;
    };
  }, [espId]);

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-40 border-b border-white/5 bg-background/85 px-4 py-3 backdrop-blur-lg">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/home")}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-muted"
            aria-label="Voltar"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <h1 className="flex-1 truncate text-lg font-bold">
            {espId
              ? (especialidades.find((e) => e.id === espId)?.nome ?? "Advogados")
              : "Advogados"}
          </h1>
        </div>
      </header>

      <div className="flex flex-1 flex-col px-5 py-5">
        {/* Filtro rápido por especialidade */}
        <div className="flex gap-2 overflow-x-auto pb-2 [scrollbar-width:none]">
          <button
            onClick={() => router.replace("/advogados")}
            className={`shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-semibold ${!espId ? "border-gold-bright/60 bg-amber-400/10 text-gold-bright" : "border-white/10 bg-surface/60 text-muted"}`}
          >
            Todas
          </button>
          {especialidades.map((e) => (
            <button
              key={e.id}
              onClick={() => router.replace(`/advogados?especialidade=${e.id}`)}
              className={`shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-semibold ${espId === e.id ? "border-gold-bright/60 bg-amber-400/10 text-gold-bright" : "border-white/10 bg-surface/60 text-muted"}`}
            >
              {e.nome}
            </button>
          ))}
        </div>

        {loading ? (
          <Spinner />
        ) : (
          <div className="mt-3 flex flex-col gap-3">
            {advogados.map((adv, i) => (
              <Link
                key={adv.id}
                href={`/advogados/${adv.id}`}
                className={`glass animate-fade-up rounded-2xl p-4 ${CATEGORIA_ESTILO[adv.categoria]?.grad ?? ""}`}
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className="flex items-center gap-3.5">
                  <div className="relative shrink-0">
                    <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full border border-white/15 bg-slate-800 text-lg">
                      {adv.fotoUrl ? (
                        <Image src={imageUrl(adv.fotoUrl)!} alt={adv.nome} width={56} height={56} className="h-full w-full object-cover" unoptimized />
                      ) : (
                        "⚖️"
                      )}
                    </div>
                    {adv.disponivel && (
                      <span className="pulse-dot absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-background bg-emerald-500" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold">{adv.nome}</p>
                    <p className="mt-0.5 text-xs text-muted">{adv.anosExperiencia} anos de experiência</p>
                    <span className={`mt-1.5 inline-block rounded-full border px-2 py-0.5 text-[10px] font-bold tracking-wider ${CATEGORIA_ESTILO[adv.categoria]?.chip ?? ""}`}>
                      {adv.categoria}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
            {advogados.length === 0 && (
              <p className="mt-10 text-center text-sm text-muted">Nenhum advogado nesta especialidade.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
