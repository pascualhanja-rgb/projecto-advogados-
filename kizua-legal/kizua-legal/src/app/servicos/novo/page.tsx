"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { createServico } from "@/lib/api";
import { CATEGORIAS, CATEGORIA_ESTILO, formatKwanza } from "@/lib/format";
import { Btn, FloatInput, FloatTextarea, ScreenHeader } from "@/components/ui";

const MapPicker = dynamic(() => import("@/components/MapPicker"), {
  ssr: false,
  loading: () => (
    <div className="flex h-64 items-center justify-center rounded-2xl border border-white/10 bg-surface/60 text-sm text-muted">
      A carregar o mapa…
    </div>
  ),
});

export default function NovoServicoPageWrapper() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center">
          <span className="spin-slow h-8 w-8 rounded-full border-[3px] border-gold-bright/80 border-t-transparent" />
        </div>
      }
    >
      <NovoServicoPage />
    </Suspense>
  );
}

function NovoServicoPage() {
  const router = useRouter();
  const search = useSearchParams();

  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [endereco, setEndereco] = useState("");
  const [categoria, setCategoria] = useState<(typeof CATEGORIAS)[number]>("BRONZE");
  const [lat, setLat] = useState<number | null>(-8.839);
  const [lng, setLng] = useState<number | null>(13.2894);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function usarMinhaLocalizacao() {
    if (!navigator.geolocation) {
      setError("Geolocalização não suportada neste dispositivo.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude);
        setLng(pos.coords.longitude);
      },
      () => setError("Não foi possível obter a sua localização."),
      { enableHighAccuracy: true, timeout: 8000 },
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (lat == null || lng == null) {
      setError("Marque o local no mapa.");
      return;
    }
    const valorNum = Number(valor);
    if (!valor || Number.isNaN(valorNum) || valorNum < 100) {
      setError("O valor mínimo é 100 AOA.");
      return;
    }
    setLoading(true);
    try {
      const servico = await createServico({
        titulo: titulo.trim(),
        descricao: descricao.trim(),
        valorTotal: valorNum,
        latitudeDestino: lat,
        longitudeDestino: lng,
        categoriaRequerida: categoria,
        enderecoDestino: endereco.trim() || undefined,
      });
      router.replace(`/servicos/${servico.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar serviço");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <ScreenHeader title="Solicitar serviço" onBack={() => router.back()} />

      <form onSubmit={handleSubmit} className="animate-fade-up flex flex-1 flex-col gap-5 px-6 py-6 pb-28">
        <FloatInput
          label="Título do pedido"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          required
          maxLength={150}
        />
        <FloatTextarea
          label="Descreva o seu caso"
          rows={4}
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          required
        />

        {/* Valor */}
        <div>
          <FloatInput
            label="Valor proposto (AOA)"
            type="number"
            inputMode="decimal"
            min={100}
            step="0.01"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            required
          />
          {valor && !Number.isNaN(Number(valor)) && Number(valor) >= 100 && (
            <p className="mt-1.5 pl-1 text-xs text-muted">
              {formatKwanza(Number(valor))} — inclui comissão da plataforma
            </p>
          )}
        </div>

        {/* Categoria */}
        <div>
          <p className="mb-2 text-[11px] font-medium text-muted">Categoria pretendida</p>
          <div className="grid grid-cols-4 gap-2">
            {CATEGORIAS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCategoria(c)}
                className={`rounded-xl border px-1 py-2.5 text-[11px] font-bold tracking-wide transition ${
                  categoria === c
                    ? `${CATEGORIA_ESTILO[c].chip} ring-1 ${CATEGORIA_ESTILO[c].ring}`
                    : "border-white/10 bg-surface/60 text-muted"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Mapa */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[11px] font-medium text-muted">Local de atendimento *</p>
            <button
              type="button"
              onClick={usarMinhaLocalizacao}
              className="flex items-center gap-1 text-xs font-semibold text-gold-bright"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3" />
                <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
              </svg>
              Usar a minha localização
            </button>
          </div>
          <MapPicker lat={lat} lng={lng} onChange={(a, b) => { setLat(a); setLng(b); }} />
          <FloatInput
            label="Endereço (opcional)"
            value={endereco}
            onChange={(e) => setEndereco(e.target.value)}
            className="mt-3"
          />
        </div>

        {error && (
          <p className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</p>
        )}

        <div className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-md border-t border-white/10 bg-surface/95 p-4 pb-[max(env(safe-area-inset-bottom),1rem)] backdrop-blur-xl">
          <Btn type="submit" loading={loading}>
            Enviar solicitação
          </Btn>
        </div>
      </form>
    </div>
  );
}
