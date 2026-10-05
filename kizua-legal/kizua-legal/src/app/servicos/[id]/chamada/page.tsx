"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getServico, iniciarChamada, listChamadas, terminarChamada } from "@/lib/api";
import { formatDuracao } from "@/lib/format";
import type { Chamada, Servico } from "@/lib/types";
import { Spinner } from "@/components/ui";

export default function ChamadaPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [servico, setServico] = useState<Servico | null>(null);
  const [historico, setHistorico] = useState<Chamada[]>([]);
  const [chamada, setChamada] = useState<Chamada | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [segundos, setSegundos] = useState(0);
  const [mudo, setMudo] = useState(false);
  const [cameraOn, setCameraOn] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    Promise.all([
      getServico(id),
      listChamadas(id).catch(() => [] as Chamada[]),
    ])
      .then(([s, hist]) => {
        setServico(s);
        setHistorico(hist);
      })
      .catch((err) => setErro(err instanceof Error ? err.message : "Erro ao carregar"))
      .finally(() => setLoading(false));
  }, [id]);

  // Cronómetro da chamada ativa
  useEffect(() => {
    if (!chamada) return;
    const t = setInterval(() => setSegundos((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [chamada]);

  // Pré-visualização local da câmara em chamadas de vídeo
  useEffect(() => {
    if (!chamada || chamada.tipoChamada !== "VIDEO") return;
    navigator.mediaDevices
      ?.getUserMedia({ video: true, audio: true })
      .then((stream) => {
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          void videoRef.current.play().catch(() => undefined);
        }
      })
      .catch(() => setErro("Sem acesso à câmara/microfone — a chamada prossegue apenas com sinalização."));
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [chamada]);

  async function ligar(tipo: "AUDIO" | "VIDEO") {
    setErro("");
    try {
      const c = await iniciarChamada(id, tipo);
      setChamada(c);
      setSegundos(0);
      setCameraOn(tipo === "VIDEO");
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao iniciar chamada");
    }
  }

  async function desligar() {
    if (!chamada) return;
    try {
      await terminarChamada(chamada.id);
    } catch {
      /* mesmo com erro, sai da chamada */
    }
    setChamada(null);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    listChamadas(id).then(setHistorico).catch(() => undefined);
  }

  if (loading) return <Spinner className="min-h-dvh" />;

  /* ————— Overlay de chamada em andamento ————— */
  if (chamada) {
    return (
      <div className="relative flex min-h-dvh flex-col overflow-hidden bg-slate-950">
        {/* Vídeo de fundo (chamadas de vídeo) */}
        {chamada.tipoChamada === "VIDEO" ? (
          <video ref={videoRef} muted playsInline className="absolute inset-0 h-full w-full object-cover opacity-90" />
        ) : (
          <div
            className="absolute inset-0 bg-cover bg-center opacity-25 blur-sm"
            style={{ backgroundImage: "url(/portifolio.jpg)" }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/40 via-slate-950/60 to-slate-950/90 backdrop-blur-[2px]" />

        <div className="relative z-10 flex flex-1 flex-col items-center justify-between px-6 py-12">
          {/* Info */}
          <div className="animate-fade-up flex flex-col items-center gap-3 text-center">
            <div className="relative">
              <span className="ring-pulse absolute inset-0 rounded-full bg-emerald-400/25" />
              <div className="glass relative flex h-28 w-28 items-center justify-center rounded-full text-4xl">
                ⚖️
              </div>
            </div>
            <h1 className="mt-2 text-2xl font-extrabold">{servico?.advogado?.nome ?? "Advogado"}</h1>
            <p className="text-sm text-emerald-300">
              {chamada.tipoChamada === "VIDEO" ? "Chamada de vídeo" : "Chamada de áudio"} ·{" "}
              {formatDuracao(segundos)}
            </p>
            {chamada.numeroSuporteExibido && (
              <p className="text-xs text-muted">Suporte: {chamada.numeroSuporteExibido}</p>
            )}
          </div>

          {/* Controlos circulares flutuantes */}
          <div className="flex items-center justify-center gap-5 pb-6">
            <button
              onClick={() => {
                const next = !mudo;
                setMudo(next);
                streamRef.current?.getAudioTracks().forEach((t) => (t.enabled = !next));
              }}
              className={`flex h-14 w-14 items-center justify-center rounded-full border backdrop-blur-md transition ${
                mudo ? "border-white/40 bg-white/90 text-slate-900" : "border-white/20 bg-white/10 text-white"
              }`}
              aria-label="Microfone"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="9" y="2" width="6" height="12" rx="3" />
                <path d="M5 10a7 7 0 0 0 14 0M12 19v3" />
                {mudo && <path d="m3 3 18 18" />}
              </svg>
            </button>

            {chamada.tipoChamada === "VIDEO" && (
              <button
                onClick={() => {
                  const next = !cameraOn;
                  setCameraOn(next);
                  streamRef.current?.getVideoTracks().forEach((t) => (t.enabled = next));
                }}
                className={`flex h-14 w-14 items-center justify-center rounded-full border backdrop-blur-md transition ${
                  cameraOn ? "border-white/20 bg-white/10 text-white" : "border-white/40 bg-white/90 text-slate-900"
                }`}
                aria-label="Câmara"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="m22 8-6 4 6 4V8Z" />
                  <rect x="2" y="6" width="14" height="12" rx="2" />
                </svg>
              </button>
            )}

            <button
              onClick={desligar}
              className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500 text-white shadow-lg shadow-red-500/40 transition active:scale-95"
              aria-label="Desligar"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <path d="M12 10c-3 0-6 .6-8.5 1.8a2 2 0 0 0-.9 2.6l.8 1.8a2 2 0 0 0 2.3 1.1c1.4-.3 3-.5 4.3-.5h4c1.3 0 2.9.2 4.3.5a2 2 0 0 0 2.3-1.1l.8-1.8a2 2 0 0 0-.9-2.6A19.6 19.6 0 0 0 12 10Z" />
                <path d="M2 2l20 20" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ————— Ecrã de início de chamada ————— */
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-40 flex items-center gap-3 border-b border-white/5 bg-background/85 px-4 py-3 backdrop-blur-lg">
        <button
          onClick={() => router.push(`/servicos/${id}`)}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-muted"
          aria-label="Voltar"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <h1 className="flex-1 text-lg font-bold">Chamada</h1>
      </header>

      <div className="animate-fade-up flex flex-1 flex-col gap-5 px-6 py-6">
        <div className="glass flex flex-col items-center gap-2 rounded-3xl p-8 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-amber-400/10 text-3xl">📞</div>
          <h2 className="text-lg font-extrabold">{servico?.advogado?.nome ?? "Advogado"}</h2>
          <p className="text-sm text-muted">{servico?.titulo}</p>
        </div>

        {erro && (
          <p className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{erro}</p>
        )}

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => void ligar("AUDIO")}
            className="glass flex flex-col items-center gap-2 rounded-2xl py-6 transition active:scale-[0.98]"
          >
            <span className="text-2xl">🎙️</span>
            <span className="text-sm font-semibold">Áudio</span>
          </button>
          <button
            onClick={() => void ligar("VIDEO")}
            className="glass flex flex-col items-center gap-2 rounded-2xl py-6 transition active:scale-[0.98]"
          >
            <span className="text-2xl">📹</span>
            <span className="text-sm font-semibold">Vídeo</span>
          </button>
        </div>

        {historico.length > 0 && (
          <section>
            <h3 className="text-sm font-bold">Histórico de chamadas</h3>
            <div className="mt-3 flex flex-col gap-2">
              {historico.map((c) => (
                <div key={c.id} className="flex items-center justify-between rounded-xl border border-white/10 bg-surface/60 px-4 py-3 text-sm">
                  <span>
                    {c.tipoChamada === "VIDEO" ? "📹" : "🎙️"} {c.tipoChamada === "VIDEO" ? "Vídeo" : "Áudio"}
                  </span>
                  <span className="text-xs text-muted">
                    {c.statusChamada === "CONCLUIDA" ? `✓ ${formatDuracao(c.duracaoSegundos)}` : c.statusChamada}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
