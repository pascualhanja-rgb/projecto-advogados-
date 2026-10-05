"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { listEspecialidades, listLawyers } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { CATEGORIAS, CATEGORIA_ESTILO } from "@/lib/format";
import { imageUrl } from "@/lib/urls";
import type { Especialidade, Lawyer } from "@/lib/types";
import { Spinner } from "@/components/ui";

export default function HomePage() {
  const { user, loading: authLoading } = useAuth();
  const [advogados, setAdvogados] = useState<Lawyer[]>([]);
  const [especialidades, setEspecialidades] = useState<Especialidade[]>([]);
  const [categoria, setCategoria] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    if (!authLoading && !user) {
      window.location.href = "/login";
    }
  }, [authLoading, user]);

  useEffect(() => {
    if (!user) return;
    let alive = true;
    setLoading(true);
    Promise.all([
      listLawyers(categoria ? { categoria: categoria as Lawyer["categoria"] } : {}),
      listEspecialidades().catch(() => [] as Especialidade[]),
    ])
      .then(([lawyers, especs]) => {
        if (!alive) return;
        setAdvogados(lawyers.data);
        setEspecialidades(especs);
      })
      .catch((err) => alive && setErro(err instanceof Error ? err.message : "Erro ao carregar"))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [categoria, user]);

  const primeiroNome = user?.nome.split(" ")[0] ?? "";

  return (
    <div className="flex min-h-dvh flex-col pb-24">
      {/* Topo */}
      <header className="sticky top-0 z-40 border-b border-white/5 bg-background/85 px-5 pb-4 pt-6 backdrop-blur-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted">Olá,</p>
            <h1 className="text-xl font-extrabold tracking-tight">{primeiroNome} </h1>
          </div>
          <Link
            href="/perfil"
            aria-label="Perfil"
            className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-surface"
          >
            {user?.fotoUrl ? (
              <Image src={imageUrl(user.fotoUrl)!} alt="Foto" width={44} height={44} className="h-full w-full object-cover" unoptimized />
            ) : (
              <span className="text-lg">👤</span>
            )}
          </Link>
        </div>

        {/* Busca visual (filtra por categoria abaixo) */}
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-white/10 bg-surface/70 px-4 py-3 text-sm text-muted">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4-4" />
          </svg>
          Encontre o advogado certo para o seu caso
        </div>
      </header>

      {/* Especialidades */}
      {especialidades.length > 0 && (
        <section className="mt-5">
          <h2 className="px-5 text-sm font-bold tracking-tight">Especialidades</h2>
          <div className="mt-3 flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none]">
            {especialidades.map((esp) => (
              <Link
                key={esp.id}
                href={`/advogados?especialidade=${esp.id}`}
                className="shrink-0 rounded-xl border border-white/10 bg-surface/70 px-3.5 py-2 text-xs font-medium text-slate-200 transition hover:border-gold-bright/40 hover:text-gold-bright"
              >
                {esp.nome}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Filtro de categoria */}
      <section className="mt-5 px-5">
        <h2 className="text-sm font-bold tracking-tight">Categorias</h2>
        <div className="mt-3 grid grid-cols-4 gap-2">
          <button
            onClick={() => setCategoria(null)}
            className={`rounded-xl border px-2 py-2.5 text-[11px] font-bold tracking-wide transition ${
              categoria === null
                ? "border-gold-bright/60 bg-amber-400/10 text-gold-bright"
                : "border-white/10 bg-surface/60 text-muted"
            }`}
          >
            TODAS
          </button>
          {CATEGORIAS.map((c) => (
            <button
              key={c}
              onClick={() => setCategoria(categoria === c ? null : c)}
              className={`rounded-xl border px-2 py-2.5 text-[11px] font-bold tracking-wide transition ${
                categoria === c
                  ? `${CATEGORIA_ESTILO[c].chip} ring-1 ${CATEGORIA_ESTILO[c].ring}`
                  : "border-white/10 bg-surface/60 text-muted"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </section>

      {/* Lista de advogados */}
      <section className="mt-6 px-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold tracking-tight">Advogados</h2>
          <span className="text-xs text-muted">{advogados.length} disponíveis</span>
        </div>

        {loading ? (
          <Spinner />
        ) : erro ? (
          <p className="mt-6 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{erro}</p>
        ) : advogados.length === 0 ? (
          <p className="mt-8 text-center text-sm text-muted">Nenhum advogado encontrado nesta categoria.</p>
        ) : (
          <div className="mt-4 flex flex-col gap-3">
            {advogados.map((adv, i) => (
              <Link
                key={adv.id}
                href={`/advogados/${adv.id}`}
                className={`glass animate-fade-up relative overflow-hidden rounded-2xl p-4 transition active:scale-[0.99] ${CATEGORIA_ESTILO[adv.categoria]?.grad ?? ""}`}
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className="relative flex items-center gap-3.5">
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
                    <p className="mt-0.5 text-xs text-muted">
                      {adv.anosExperiencia} anos de experiência
                    </p>
                    <span
                      className={`mt-1.5 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold tracking-wider ${
                        CATEGORIA_ESTILO[adv.categoria]?.chip ?? ""
                      }`}
                    >
                      {adv.categoria}
                    </span>
                  </div>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 text-muted">
                    <path d="m9 6 6 6-6 6" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Bottom nav */}
      <BottomNav ativo="home" />
    </div>
  );
}

export function BottomNav({ ativo }: { ativo: "home" | "servicos" | "perfil" }) {
  const items = [
    {
      key: "home",
      href: "/home",
      label: "Início",
      icon: (
        <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m3 10 9-7 9 7v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />
          <path d="M9 22V12h6v10" />
        </svg>
      ),
    },
    {
      key: "servicos",
      href: "/servicos",
      label: "Serviços",
      icon: (
        <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M8 2h8l1 5H7Z" />
          <path d="M17 7h3l-2 6a5 5 0 0 1-4 3M7 7H4l2 6a5 5 0 0 0 4 3" />
          <path d="M12 16v4M8 22h8" />
        </svg>
      ),
    },
    {
      key: "perfil",
      href: "/perfil",
      label: "Perfil",
      icon: (
        <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="8" r="4" />
          <path d="M4 21c0-4 3.6-6 8-6s8 2 8 6" />
        </svg>
      ),
    },
  ] as const;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 mx-auto flex max-w-md items-center justify-around border-t border-white/10 bg-surface/90 px-4 pb-[max(env(safe-area-inset-bottom),0.6rem)] pt-2.5 backdrop-blur-xl">
      {items.map((it) => (
        <Link
          key={it.key}
          href={it.href}
          className={`flex flex-col items-center gap-0.5 px-4 py-1 text-[10px] font-semibold transition ${
            ativo === it.key ? "text-gold-bright" : "text-muted hover:text-foreground"
          }`}
        >
          {it.icon}
          {it.label}
        </Link>
      ))}
    </nav>
  );
}
