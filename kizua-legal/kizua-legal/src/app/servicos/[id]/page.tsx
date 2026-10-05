"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import dynamic from "next/dynamic";
import { useParams, useRouter } from "next/navigation";
import {
  deleteServico,
  getServico,
  submitPagamento,
  uploadComprovativo,
} from "@/lib/api";
import { useGeolocation } from "@/lib/useGeolocation";
import { useAuth } from "@/lib/auth";
import { STATUS_COR, STATUS_LABEL, formatData, formatKwanza } from "@/lib/format";
import { imageUrl } from "@/lib/urls";
import type { Servico } from "@/lib/types";
import { Btn, CategoriaChip, Spinner } from "@/components/ui";

const RouteMap = dynamic(() => import("@/components/RouteMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-72 items-center justify-center rounded-2xl border border-white/10 bg-surface/60 text-sm text-muted">
      A carregar o mapa de rota…
    </div>
  ),
});

export default function DetalheServicoPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [servico, setServico] = useState<Servico | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [acao, setAcao] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const { coords: minhaLocalizacao } = useGeolocation();

  const carregar = useCallback(() => {
    getServico(id)
      .then(setServico)
      .catch((err) => setErro(err instanceof Error ? err.message : "Erro ao carregar"))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function handlePagamento(file: File) {
    setAcao("A enviar comprovativo…");
    setErro("");
    try {
      const up = await uploadComprovativo(file);
      setAcao("A submeter pagamento…");
      await submitPagamento(id, { comprovativoUrl: up.url });
      carregar();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro no pagamento");
    } finally {
      setAcao("");
    }
  }

  async function handleCancelar() {
    if (!confirm("Cancelar este serviço?")) return;
    setAcao("A cancelar…");
    try {
      await deleteServico(id);
      router.replace("/servicos");
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao cancelar");
      setAcao("");
    }
  }

  async function handleAvaliar(pontuacao: number) {
    try {
      const { avaliarServico } = await import("@/lib/api");
      await avaliarServico(id, { pontuacao });
      carregar();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erro ao avaliar");
    }
  }

  if (loading) return <Spinner className="min-h-dvh" />;
  if (!servico)
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-8 text-center">
        <p className="text-sm text-red-300">{erro || "Serviço não encontrado."}</p>
        <button onClick={() => router.push("/servicos")} className="text-sm font-semibold text-gold-bright">
          Voltar
        </button>
      </div>
    );

  const pendente = servico.status === "PENDENTE_PAGAMENTO";
  const emCurso = ["PAGO_EM_CUSTODIA", "ATRIBUIDO_PELO_ADMIN", "EM_ANDAMENTO"].includes(servico.status);

  return (
    <div className="flex min-h-dvh flex-col pb-6">
      <header className="sticky top-0 z-40 border-b border-white/5 bg-background/85 px-4 py-3 backdrop-blur-lg">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/servicos")}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-muted"
            aria-label="Voltar"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <h1 className="flex-1 truncate text-lg font-bold">Detalhe do serviço</h1>
        </div>
      </header>

      <div className="animate-fade-up flex flex-1 flex-col gap-5 px-5 py-6">
        {/* Cartão principal */}
        <div className="glass rounded-2xl p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-lg font-extrabold leading-snug">{servico.titulo}</h2>
              <p className="mt-1 text-xs text-muted">Criado em {formatData(servico.criadoEm)}</p>
            </div>
            <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-bold ${STATUS_COR[servico.status] ?? ""}`}>
              {STATUS_LABEL[servico.status] ?? servico.status}
            </span>
          </div>

          {servico.descricao && <p className="mt-3 text-sm leading-relaxed text-slate-300">{servico.descricao}</p>}

          <div className="mt-4 grid grid-cols-2 gap-3 border-t border-white/5 pt-4 text-sm">
            <div>
              <p className="text-[11px] text-muted">Valor total</p>
              <p className="font-bold text-gold-bright">{formatKwanza(servico.valorTotal)}</p>
            </div>
            <div>
              <p className="text-[11px] text-muted">Advogado (75%)</p>
              <p className="font-semibold">{formatKwanza(servico.valorAdvogado)}</p>
            </div>
            {servico.categoriaRequerida && (
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-muted">Categoria:</span>
                <CategoriaChip categoria={servico.categoriaRequerida} />
              </div>
            )}
            {servico.enderecoDestino && (
              <div>
                <p className="text-[11px] text-muted">Local</p>
                <p className="truncate font-semibold">{servico.enderecoDestino}</p>
              </div>
            )}
          </div>
        </div>

        {/* Mapa de rota: cliente → destino do serviço */}
        {servico.latitudeDestino != null && servico.longitudeDestino != null && (
          <section>
            <h3 className="mb-2 text-sm font-bold tracking-tight">🗺️ Localização &amp; Rota</h3>
            <RouteMap
              origem={minhaLocalizacao}
              destino={{ lat: servico.latitudeDestino, lng: servico.longitudeDestino }}
            />
            {servico.enderecoDestino && (
              <p className="mt-2 text-xs text-muted">📍 {servico.enderecoDestino}</p>
            )}
          </section>
        )}

        {/* Advogado atribuído */}
        {servico.advogado && (
          <div className="glass flex items-center gap-3.5 rounded-2xl p-4">
            <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-slate-800 text-lg">
              {servico.advogado.fotoUrl ? (
                <Image src={imageUrl(servico.advogado.fotoUrl)!} alt={servico.advogado.nome} width={48} height={48} className="h-full w-full object-cover" unoptimized />
              ) : (
                "⚖️"
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-bold">{servico.advogado.nome}</p>
              <span className={`mt-1 inline-block rounded-full border px-2 py-0.5 text-[10px] font-bold ${STATUS_COR.EM_ANDAMENTO}`}>
                {servico.advogado.categoria}
              </span>
            </div>
          </div>
        )}

        {/* Pagamento */}
        {pendente && (
          <div className="glass rounded-2xl p-5">
            <h3 className="font-bold">💰 Pagamento em custódia</h3>
            <p className="mt-1.5 text-sm text-muted">
              Faça a transferência de <strong className="text-gold-bright">{formatKwanza(servico.valorTotal)}</strong> e envie o comprovativo. O valor fica guardado até à conclusão do serviço.
            </p>
            <input
              ref={fileRef}
              type="file"
              accept="image/*,application/pdf"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void handlePagamento(f);
              }}
            />
            <div className="mt-4">
              <Btn loading={acao !== ""} onClick={() => fileRef.current?.click()}>
                📎 Enviar comprovativo
              </Btn>
            </div>
          </div>
        )}

        {/* Avaliação */}
        {servico.status === "CONCLUIDO" && (
          <div className="glass rounded-2xl p-5">
            <h3 className="font-bold">⭐ Avaliar advogado</h3>
            <p className="mt-1 text-sm text-muted">Como foi o atendimento?</p>
            <div className="mt-3 flex gap-1.5">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} onClick={() => void handleAvaliar(n)} className="text-2xl transition hover:scale-110">
                  ⭐
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Erro / ação em curso */}
        {erro && (
          <p className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{erro}</p>
        )}
        {acao && <p className="text-center text-sm text-muted">{acao}</p>}

        {/* Ações */}
        <div className="flex flex-col gap-3">
          {emCurso && (
            <>
              <button
                onClick={() => router.push(`/servicos/${id}/chat`)}
                className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 py-3.5 text-[15px] font-semibold transition hover:bg-white/10"
              >
                💬 Abrir chat
              </button>
              <button
                onClick={() => router.push(`/servicos/${id}/chamada`)}
                className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 py-3.5 text-[15px] font-semibold transition hover:bg-white/10"
              >
                📞 Iniciar chamada
              </button>
            </>
          )}
          {pendente && (
            <button
              onClick={handleCancelar}
              className="rounded-xl border border-red-400/30 bg-red-500/10 py-3.5 text-[15px] font-semibold text-red-300 transition hover:bg-red-500/20"
            >
              Cancelar serviço
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
