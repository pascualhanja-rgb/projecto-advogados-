"use client";

import { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";

interface RouteMapProps {
  /** Coordenada do cliente (origem) */
  origem: { lat: number; lng: number } | null;
  /** Coordenada de destino do serviço */
  destino: { lat: number; lng: number } | null;
  altura?: string;
}

/** Link universal do OpenStreetMap para partilhar uma posição. */
export function osmLink(p: { lat: number; lng: number }, zoom = 17): string {
  return `https://www.openstreetmap.org/?mlat=${p.lat.toFixed(6)}&mlon=${p.lng.toFixed(6)}#map=${zoom}/${p.lat.toFixed(6)}/${p.lng.toFixed(6)}`;
}

const PIN_ORIGEM = `<svg width="30" height="30" viewBox="0 0 24 24" fill="none">
  <path d="M12 22s7-7.1 7-12a7 7 0 1 0-14 0c0 4.9 7 12 7 12Z" fill="#10B981" stroke="#0F172A" stroke-width="1.6"/>
  <circle cx="12" cy="10" r="2.6" fill="#0F172A"/>
</svg>`;

const PIN_DESTINO = `<svg width="34" height="34" viewBox="0 0 24 24" fill="none">
  <path d="M12 22s7-7.1 7-12a7 7 0 1 0-14 0c0 4.9 7 12 7 12Z" fill="#F59E0B" stroke="#0F172A" stroke-width="1.6"/>
  <circle cx="12" cy="10" r="2.6" fill="#0F172A"/>
</svg>`;

function pinIcon(html: string, size: number) {
  return window.L.divIcon({
    html: `<div style="filter:drop-shadow(0 4px 8px rgba(0,0,0,.5))">${html}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size - 2],
  });
}

/**
 * Mapa com rota real (estradas) via OSRM entre a localização do cliente
 * e o destino do serviço. Faz fallback para linha reta se o OSRM falhar.
 */
export default function RouteMap({ origem, destino, altura = "h-72" }: RouteMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<import("leaflet").Map | null>(null);
  const linhaRef = useRef<import("leaflet").Polyline | null>(null);
  const marcadoresRef = useRef<import("leaflet").LayerGroup | null>(null);
  const [distanciaKm, setDistanciaKm] = useState<number | null>(null);
  const [erroRota, setErroRota] = useState(false);

  // Criar mapa
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    let cancelled = false;

    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !containerRef.current || mapRef.current) return;

      const centro: [number, number] = destino
        ? [destino.lat, destino.lng]
        : origem
          ? [origem.lat, origem.lng]
          : [-8.839, 13.2894];

      const map = L.map(containerRef.current, { zoomControl: false }).setView(centro, 14);
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);
      L.control.zoom({ position: "bottomright" }).addTo(map);

      mapRef.current = map;
      marcadoresRef.current = L.layerGroup().addTo(map);
    })();

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [origem, destino]);

  // Desenhar rota quando os pontos mudarem
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !destino) return;

    let cancelled = false;

    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !map) return;

      const grupo = marcadoresRef.current;
      if (!grupo) return;
      grupo.clearLayers();

      // Pino do destino (dourado)
      L.marker([destino.lat, destino.lng], { icon: pinIcon(PIN_DESTINO, 34) }).addTo(grupo);

      // Pino do cliente (esmeralda) — só se existir
      if (origem) {
        L.marker([origem.lat, origem.lng], { icon: pinIcon(PIN_ORIGEM, 30) }).addTo(grupo);
      }

      // Remove rota anterior
      linhaRef.current?.remove();
      linhaRef.current = null;
      setDistanciaKm(null);
      setErroRota(false);

      const pontos: [number, number][] = [];
      let distKm: number | null = null;

      if (origem) {
        // Rota real de estrada via OSRM (servidor público, sem chave)
        try {
          const url = `https://router.project-osrm.org/route/v1/driving/${origem.lng},${origem.lat};${destino.lng},${destino.lat}?overview=full&geometries=geojson`;
          const res = await fetch(url);
          if (!res.ok) throw new Error("OSRM indisponível");
          const json = (await res.json()) as {
            code: string;
            routes?: { distance: number; geometry: { coordinates: [number, number][] } }[];
          };
          if (json.code !== "Ok" || !json.routes?.[0]) throw new Error("Sem rota");
          const rota = json.routes[0];
          distKm = rota.distance / 1000;
          pontos.push(...rota.geometry.coordinates.map(([lng, lat]) => [lat, lng] as [number, number]));
        } catch {
          // Fallback: linha reta tracejada
          setErroRota(true);
          pontos.push([origem.lat, origem.lng], [destino.lat, destino.lng]);
        }
      } else {
        pontos.push([destino.lat, destino.lng]);
      }

      if (pontos.length > 1) {
        linhaRef.current = L.polyline(pontos, {
          color: "#F59E0B",
          weight: 4,
          opacity: 0.9,
          dashArray: erroRota ? "8 10" : undefined,
        }).addTo(map);
      }

      setDistanciaKm(distKm);
      const bounds = L.latLngBounds(pontos.map(([lat, lng]) => L.latLng(lat, lng)));
      map.fitBounds(bounds, { padding: [45, 45] });
    })();

    return () => {
      cancelled = true;
    };
  }, [origem, destino, erroRota]);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10">
      <div ref={containerRef} className={`${altura} w-full bg-slate-800`} />
      <div className="pointer-events-none absolute left-3 top-3 z-[500] flex flex-col gap-1.5">
        <span className="glass flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold">
          <span className="h-2 w-2 rounded-full bg-emerald-400" /> Você
        </span>
        <span className="glass flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold">
          <span className="h-2 w-2 rounded-full bg-amber-400" /> Destino
        </span>
        {distanciaKm != null && (
          <span className="glass rounded-full px-2.5 py-1 text-[10px] font-semibold text-gold-bright">
            🛣️ {distanciaKm < 1 ? `${Math.round(distanciaKm * 1000)} m` : `${distanciaKm.toFixed(1)} km`}
          </span>
        )}
        {erroRota && (
          <span className="glass rounded-full px-2.5 py-1 text-[10px] text-muted">rota direta</span>
        )}
      </div>
    </div>
  );
}
