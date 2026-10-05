"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { listServicos } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { STATUS_COR, STATUS_LABEL, formatKwanza } from "@/lib/format";
import { imageUrl } from "@/lib/urls";
import type { Servico } from "@/lib/types";
import { EmptyState, Spinner } from "@/components/ui";
import { BottomNav } from "@/app/home/page";

export default function MeusServicosPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  const carregar = useCallback(() => {
    setLoading(true);
    listServicos({ limit: 50 })
      .then((res) => setServicos(res.data))
      .catch((err) => setErro(err instanceof Error ? err.message : "Erro ao carregar"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!authLoading && !user) window.location.href = "/login";
  }, [authLoading, user]);

  useEffect(() => {
    if (user) carregar();
  }, [user, carregar]);

  return (
    <div className="flex min-h-dvh flex-col pb-24">
      <header className="sticky top-0 z-40 border-b border-white/5 bg-background/85 px-5 pb-4 pt-6 backdrop-blur-lg">
        <h1 className="text-xl font-extrabold tracking-tight">Meus serviços</h1>
        <p className="mt-0.5 text-xs text-muted">Acompanhe os seus pedidos jurídicos</p>
      </header>

      <div className="flex flex-1 flex-col px-5 py-5">
        {loading ? (
          <Spinner />
        ) : erro ? (
          <p className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{erro}</p>
        ) : servicos.length === 0 ? (
          <EmptyState
            icon="⚖️"
            title="Ainda sem pedidos"
            subtitle="Explore o catálogo e solicite o seu primeiro serviço jurídico."
          />
        ) : (
          <div className="flex flex-col gap-3">
            {servicos.map((s, i) => (
              <Link
                key={s.id}
                href={`/servicos/${s.id}`}
                className="glass animate-fade-up rounded-2xl p-4 transition active:scale-[0.99]"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold">{s.titulo}</p>
                    <p className="mt-1 text-xs text-muted">
                      {formatKwanza(s.valorTotal)}
                      {s.advogado ? ` · ${s.advogado.nome}` : ""}
                    </p>
                  </div>
                  <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-bold ${STATUS_COR[s.status] ?? ""}`}>
                    {STATUS_LABEL[s.status] ?? s.status}
                  </span>
                </div>
                {s.advogado?.fotoUrl && (
                  <div className="mt-3 flex items-center gap-2 border-t border-white/5 pt-3">
                    <div className="h-7 w-7 overflow-hidden rounded-full bg-slate-800">
                      <Image src={imageUrl(s.advogado.fotoUrl)!} alt={s.advogado.nome} width={28} height={28} className="h-full w-full object-cover" unoptimized />
                    </div>
                    <span className="text-xs text-muted">Advogado atribuído: {s.advogado.nome}</span>
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}

        <button
          onClick={() => router.push("/servicos/novo")}
          className="mt-5 flex items-center justify-center gap-2 rounded-xl border border-dashed border-gold-bright/40 bg-amber-400/5 py-3.5 text-sm font-semibold text-gold-bright transition active:scale-[0.99]"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Novo pedido de serviço
        </button>
      </div>

      <BottomNav ativo="servicos" />
    </div>
  );
}
