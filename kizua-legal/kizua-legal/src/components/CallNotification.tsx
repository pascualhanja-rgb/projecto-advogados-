"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { getSocket } from "@/lib/socket";
import { getServico } from "@/lib/api";
import type { Servico } from "@/lib/types";

/** Dados do evento socket `chamada:entrada` */
export interface ChamadaEntrada {
  chamadaId: string;
  servicoId: string;
  tipoChamada: "AUDIO" | "VIDEO";
  canalAgoraId?: string;
  de?: string;
}

interface CallCtx {
  atual: ChamadaEntrada | null;
  mostrarToque: (c: ChamadaEntrada) => void;
  fechar: () => void;
}

const Ctx = createContext<CallCtx | null>(null);

export function useCallNotification() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useCallNotification fora do provider");
  return c;
}

/** Vibrar/soar enquanto toca (best-effort, sem permissões extras). */
function vibrar(loop = true) {
  if (typeof navigator === "undefined" || !("vibrate" in navigator)) return () => undefined;
  const padrao = [400, 250, 400, 250, 600];
  try {
    navigator.vibrate(loop ? padrao : padrao[0]);
  } catch {
    /* ignora */
  }
  if (!loop) return () => undefined;
  const id = window.setInterval(() => {
    try {
      navigator.vibrate(padrao);
    } catch {
      /* ignora */
    }
  }, 2500);
  return () => window.clearInterval(id);
}

export function CallNotificationProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [atual, setAtual] = useState<ChamadaEntrada | null>(null);
  const [servico, setServico] = useState<Servico | null>(null);
  const [aceitou, setAceitou] = useState(false);
  const pararVibracao = useRef<(() => void) | null>(null);

  const parar = () => {
    pararVibracao.current?.();
    pararVibracao.current = null;
  };

  const mostrarToque = useCallback((c: ChamadaEntrada) => {
    setAtual(c);
    setAceitou(false);
    getServico(c.servicoId)
      .then(setServico)
      .catch(() => setServico(null));
    pararVibracao.current = vibrar();
  }, []);

  const fechar = useCallback(() => {
    setAtual(null);
    setServico(null);
    parar();
  }, []);

  // Liga o listener global do socket uma única vez
  useEffect(() => {
    let off: (() => void) | undefined;
    let alive = true;

    (async () => {
      try {
        const socket = await getSocket();
        if (!alive || !socket) return;
        const onEntrada = (payload: ChamadaEntrada) => {
          if (payload?.chamadaId) mostrarToque(payload);
        };
        socket.on("chamada:entrada", onEntrada);
        off = () => socket.off("chamada:entrada", onEntrada);
      } catch {
        /* sem sessão/socket — não faz nada */
      }
    })();

    return () => {
      alive = false;
      off?.();
      parar();
    };
  }, [mostrarToque]);

  function recusar() {
    // Registra a chamada como perdida/terminada de imediato
    const c = atual;
    fechar();
    if (c) {
      import("@/lib/api")
        .then(({ terminarChamada }) => terminarChamada(c.chamadaId).catch(() => undefined))
        .catch(() => undefined);
    }
  }

  function aceitar() {
    const c = atual;
    if (!c) return;
    setAceitou(true);
    parar();
    fechar();
    router.push(`/servicos/${c.servicoId}/chamada?chamadaId=${c.chamadaId}&responder=1`);
  }

  return (
    <Ctx.Provider value={{ atual, mostrarToque, fechar }}>
      {children}

      {/* ————— Ecrã de toque (overlay) ————— */}
      {atual && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-between overflow-hidden bg-slate-950/95 px-8 py-14 backdrop-blur-xl">
          {/* Halo pulsante */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <span className="ring-pulse absolute h-56 w-56 rounded-full bg-emerald-400/20" />
            <span className="ring-pulse absolute h-56 w-56 rounded-full bg-emerald-400/15" style={{ animationDelay: "0.6s" }} />
          </div>

          <div className="animate-fade-up relative z-10 mt-6 flex flex-col items-center gap-3 text-center">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-emerald-300">
              {atual.tipoChamada === "VIDEO" ? "Chamada de vídeo" : "Chamada de áudio"}
            </p>
            <div className="relative mt-2">
              <div className="glass glow-gold flex h-28 w-28 items-center justify-center rounded-full text-5xl">
                ⚖️
              </div>
              <span className="pulse-dot absolute bottom-1 right-1 h-4 w-4 rounded-full border-2 border-slate-950 bg-emerald-400" />
            </div>
            <h2 className="mt-3 text-2xl font-extrabold">
              {servico?.advogado?.nome ?? "Advogado"}
            </h2>
            <p className="max-w-xs text-sm text-muted">{servico?.titulo ?? "A ligar-lhe…"}</p>
          </div>

          {/* Ações */}
          <div className="relative z-10 mb-6 flex items-center justify-center gap-16">
            <button
              onClick={recusar}
              className="flex flex-col items-center gap-2"
              aria-label="Recusar"
            >
              <span className="ring-pulse absolute" />
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500 text-white shadow-lg shadow-red-500/40 transition active:scale-95">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                  <path d="M12 10c-3 0-6 .6-8.5 1.8a2 2 0 0 0-.9 2.6l.8 1.8a2 2 0 0 0 2.3 1.1c1.4-.3 3-.5 4.3-.5h4c1.3 0 2.9.2 4.3.5a2 2 0 0 0 2.3-1.1l.8-1.8a2 2 0 0 0-.9-2.6A19.6 19.6 0 0 0 12 10Z" />
                  <path d="m3 3 18 18" />
                </svg>
              </span>
              <span className="text-xs font-semibold text-red-300">Recusar</span>
            </button>

            <button onClick={aceitar} className="flex flex-col items-center gap-2" aria-label="Aceitar">
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-500/40 transition active:scale-95">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                  <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.9a2 2 0 0 1-.5 2.1L8 10a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.9.3 1.9.6 2.9.7a2 2 0 0 1 1.7 2Z" />
                </svg>
              </span>
              <span className="text-xs font-semibold text-emerald-300">Aceitar</span>
            </button>
          </div>
        </div>
      )}
    </Ctx.Provider>
  );
}
