"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { enviarMensagem, getServico, listMensagens, marcarLidas } from "@/lib/api";
import { getSocket } from "@/lib/socket";
import { formatHora } from "@/lib/format";
import { useGeolocation } from "@/lib/useGeolocation";
import { osmLink } from "@/components/RouteMap";
import type { Mensagem, Servico } from "@/lib/types";
import { Spinner } from "@/components/ui";

const RouteMap = dynamic(() => import("@/components/RouteMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-56 items-center justify-center rounded-2xl border border-white/10 bg-surface/60 text-sm text-muted">
      A carregar o mapa…
    </div>
  ),
});

export default function ChatPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [servico, setServico] = useState<Servico | null>(null);
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [texto, setTexto] = useState("");
  const [loading, setLoading] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [mapaAberto, setMapaAberto] = useState(false);
  const fimRef = useRef<HTMLDivElement>(null);
  const meuId = useRef<string>("");
  const { coords: minhaLocalizacao, erro: erroLocalizacao } = useGeolocation();

  // Carrega serviço + histórico e liga ao socket
  useEffect(() => {
    let alive = true;
    let cleanupSocket: (() => void) | undefined;

    (async () => {
      try {
        const [s, msgs] = await Promise.all([getServico(id), listMensagens(id)]);
        if (!alive) return;
        setServico(s);
        setMensagens(msgs);
        setLoading(false);

        await marcarLidas(id).catch(() => undefined);

        const socket = await getSocket();
        if (!alive || !socket) return;

        socket.emit("servico:entrar", { servicoId: id });

        const onNova = (m: Mensagem) => {
          if (m.servicoId !== id) return;
          setMensagens((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));
        };
        const onAtribuido = () => getServico(id).then((s2) => alive && setServico(s2));

        socket.on("mensagem:nova", onNova);
        socket.on("servico:atribuido", onAtribuido);

        cleanupSocket = () => {
          socket.off("mensagem:nova", onNova);
          socket.off("servico:atribuido", onAtribuido);
        };
      } catch {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
      cleanupSocket?.();
    };
  }, [id]);

  // Identifica o utilizador atual (para alinhar as bolhas)
  useEffect(() => {
    import("@/lib/api").then(({ getMe }) =>
      getMe()
        .then((me) => (meuId.current = me.id))
        .catch(() => undefined),
    );
  }, []);

  // Scroll para a última mensagem
  useEffect(() => {
    fimRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensagens.length, mapaAberto]);

  const enviar = useCallback(
    async (conteudo: string) => {
      const c = conteudo.trim();
      if (!c || enviando) return;
      setEnviando(true);
      try {
        const msg = await enviarMensagem(id, c);
        setMensagens((prev) => (prev.some((x) => x.id === msg.id) ? prev : [...prev, msg]));
        setTexto("");
      } catch (err) {
        alert(err instanceof Error ? err.message : "Erro ao enviar");
      } finally {
        setEnviando(false);
      }
    },
    [id, enviando],
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    void enviar(texto);
  }

  /** Partilha a localização atual do cliente como mensagem + abre o mapa de rota */
  function partilharLocalizacao() {
    if (!minhaLocalizacao) {
      alert(erroLocalizacao ?? "A obter a sua localização… tente novamente em instantes.");
      return;
    }
    setMapaAberto(true);
    const link = osmLink(minhaLocalizacao);
    void enviar(`📍 A minha localização atual: ${link}`);
  }

  const destino =
    servico?.latitudeDestino != null && servico?.longitudeDestino != null
      ? { lat: servico.latitudeDestino, lng: servico.longitudeDestino }
      : null;

  if (loading) return <Spinner className="min-h-dvh" />;

  return (
    <div className="flex min-h-dvh flex-col">
      {/* Header */}
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
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-[15px] font-bold">{servico?.advogado?.nome ?? "Conversa"}</h1>
          <p className="truncate text-[11px] text-muted">{servico?.titulo}</p>
        </div>
        {/* Botão mapa / localização */}
        <button
          onClick={() => (mapaAberto ? setMapaAberto(false) : partilharLocalizacao())}
          title={mapaAberto ? "Fechar mapa" : "Partilhar a minha localização"}
          className={`flex h-9 w-9 items-center justify-center rounded-full border transition ${
            mapaAberto
              ? "border-gold-bright/60 bg-amber-400/15 text-gold-bright"
              : "border-white/10 bg-white/5 text-muted hover:text-foreground"
          }`}
          aria-label="Partilhar localização"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 22s7-7.1 7-12a7 7 0 1 0-14 0c0 4.9 7 12 7 12Z" />
            <circle cx="12" cy="10" r="2.6" />
          </svg>
        </button>
        <button
          onClick={() => router.push(`/servicos/${id}/chamada`)}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
          aria-label="Chamada"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.9a2 2 0 0 1-.5 2.1L8 10a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.9.3 1.9.6 2.9.7a2 2 0 0 1 1.7 2Z" />
          </svg>
        </button>
      </header>

      {/* Mapa de rota (expansível) */}
      {mapaAberto && destino && (
        <div className="animate-fade-up border-b border-white/10 bg-surface/40 p-3">
          <RouteMap origem={minhaLocalizacao} destino={destino} altura="h-56" />
          <div className="mt-2 flex items-center justify-between gap-2">
            <p className="truncate text-[11px] text-muted">
              {servico?.enderecoDestino ? `📍 ${servico.enderecoDestino}` : "Rota até ao local do serviço"}
            </p>
            {minhaLocalizacao && (
              <a
                href={osmLink(minhaLocalizacao)}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 text-[11px] font-semibold text-gold-bright"
              >
                Abrir no OpenStreetMap ↗
              </a>
            )}
          </div>
        </div>
      )}

      {/* Mensagens */}
      <div className="flex flex-1 flex-col gap-2.5 overflow-y-auto px-4 py-5">
        {mensagens.length === 0 && (
          <p className="mt-auto text-center text-sm text-muted">
            Envie a primeira mensagem para o advogado.
          </p>
        )}
        {mensagens.map((m) => {
          const minha = m.remetenteId === meuId.current;
          // Links de localização viram cartão especial
          const localMatch = m.conteudo.match(/https:\/\/www\.openstreetmap\.org\/\S+/);
          return (
            <div key={m.id} className={`flex ${minha ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                  minha
                    ? "rounded-br-md bg-gradient-to-br from-amber-600/80 to-amber-800/80 text-slate-50"
                    : "rounded-bl-md border border-white/10 bg-surface text-slate-200"
                }`}
              >
                {localMatch ? (
                  <div>
                    <p className="mb-1 font-semibold">📍 {minha ? "A minha localização" : "Localização partilhada"}</p>
                    <a
                      href={localMatch[0]}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 rounded-xl border border-white/15 bg-black/20 px-3 py-2 text-xs font-semibold text-gold-bright transition hover:bg-black/30"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 22s7-7.1 7-12a7 7 0 1 0-14 0c0 4.9 7 12 7 12Z" />
                        <circle cx="12" cy="10" r="2.6" />
                      </svg>
                      Ver no mapa (OpenStreetMap)
                    </a>
                  </div>
                ) : (
                  <p>{m.conteudo}</p>
                )}
                <p className={`mt-1 text-right text-[10px] ${minha ? "text-amber-200/70" : "text-muted"}`}>
                  {formatHora(m.criadaEm)}
                  {minha && (m.lida ? " · lida" : " · enviada")}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={fimRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="sticky bottom-0 z-40 flex items-end gap-2 border-t border-white/10 bg-surface/95 p-3 pb-[max(env(safe-area-inset-bottom),0.75rem)] backdrop-blur-xl"
      >
        <button
          type="button"
          onClick={partilharLocalizacao}
          title="Partilhar a minha localização"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/10 bg-background/60 text-muted transition hover:text-gold-bright"
          aria-label="Partilhar localização"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 22s7-7.1 7-12a7 7 0 1 0-14 0c0 4.9 7 12 7 12Z" />
            <circle cx="12" cy="10" r="2.6" />
          </svg>
        </button>
        <textarea
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void enviar(texto);
            }
          }}
          rows={1}
          placeholder="Escreva a sua mensagem…"
          className="max-h-32 flex-1 resize-none rounded-2xl border border-white/10 bg-background/80 px-4 py-3 text-[15px] outline-none placeholder:text-muted focus:border-gold-bright/50"
        />
        <button
          type="submit"
          disabled={enviando || !texto.trim()}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gold-bright text-slate-950 transition active:scale-95 disabled:opacity-50"
          aria-label="Enviar"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m22 2-7 20-4-9-9-4Z" />
            <path d="M22 2 11 13" />
          </svg>
        </button>
      </form>
    </div>
  );
}
