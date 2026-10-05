"use client";

import { useEffect, useState } from "react";

export function useGeolocation(activar = true) {
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (!activar || !navigator.geolocation) {
      if (activar) setErro("Geolocalização não suportada.");
      return;
    }
    const id = navigator.geolocation.watchPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setErro(null);
      },
      (err) => setErro(err.message || "Não foi possível obter a localização."),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 },
    );
    return () => navigator.geolocation.clearWatch(id);
  }, [activar]);

  return { coords, erro };
}
