"use client";

import { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";

/** Coordenada central padrão: Luanda, Angola */
const LUANDA: [number, number] = [-8.8390, 13.2894];

interface MapPickerProps {
  lat: number | null;
  lng: number | null;
  onChange: (lat: number, lng: number) => void;
}

/**
 * Mapa OpenStreetMap com pino arrastável.
 * Toque no mapa move o pino; também é possível arrastá-lo.
 */
export default function MapPicker({ lat, lng, onChange }: MapPickerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<import("leaflet").Map | null>(null);
  const markerRef = useRef<import("leaflet").Marker | null>(null);
  const [ready, setReady] = useState(false);

  // Criar o mapa uma única vez
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    let cancelled = false;

    (async () => {
      const L = (await import("leaflet")).default;

      if (cancelled || !containerRef.current || mapRef.current) return;

      const initial: [number, number] = lat != null && lng != null ? [lat, lng] : LUANDA;

      const map = L.map(containerRef.current, {
        center: initial,
        zoom: lat != null ? 16 : 12,
        zoomControl: false,
        attributionControl: true,
      });

      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);

      // Pino dourado
      const icon = L.divIcon({
        className: "kizua-pin",
        html: `<div class="kizua-pin-inner">
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none">
            <path d="M12 22s7-7.1 7-12a7 7 0 1 0-14 0c0 4.9 7 12 7 12Z" fill="#F59E0B" stroke="#0F172A" stroke-width="1.6"/>
            <circle cx="12" cy="10" r="2.6" fill="#0F172A"/>
          </svg>
        </div>`,
        iconSize: [34, 34],
        iconAnchor: [17, 32],
      });

      const marker = L.marker(initial, { icon, draggable: true }).addTo(map);
      marker.on("dragend", () => {
        const pos = marker.getLatLng();
        onChange(pos.lat, pos.lng);
      });

      map.on("click", (e: import("leaflet").LeafletMouseEvent) => {
        marker.setLatLng(e.latlng);
        onChange(e.latlng.lat, e.latlng.lng);
      });

      mapRef.current = map;
      markerRef.current = marker;
      setReady(true);
    })();

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Atualiza o pino quando as coordenadas mudam externamente (ex: "usar a minha localização")
  useEffect(() => {
    if (!ready || !mapRef.current || !markerRef.current) return;
    if (lat == null || lng == null) return;
    const current = markerRef.current.getLatLng();
    if (Math.abs(current.lat - lat) < 1e-9 && Math.abs(current.lng - lng) < 1e-9) return;
    markerRef.current.setLatLng([lat, lng]);
    mapRef.current.setView([lat, lng], Math.max(mapRef.current.getZoom(), 15));
  }, [lat, lng, ready]);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10">
      <div ref={containerRef} className="h-64 w-full bg-slate-800" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-background/90 to-transparent px-3 pb-2 pt-8">
        <span className="text-[10px] text-muted">
          {lat != null && lng != null
            ? `${lat.toFixed(5)}, ${lng.toFixed(5)}`
            : "Toque no mapa para marcar o local"}
        </span>
        <span className="text-[10px] text-muted">© OpenStreetMap</span>
      </div>
    </div>
  );
}
