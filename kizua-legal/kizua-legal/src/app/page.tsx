"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";

export default function SplashPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [minTimePassed, setMinTimePassed] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMinTimePassed(true), 2600);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!loading && minTimePassed) {
      router.replace(user ? "/home" : "/login");
    }
  }, [loading, minTimePassed, user, router]);

  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-background">
      {/* Fundo com a imagem do portfólio */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-45"
        style={{ backgroundImage: "url(/portifolio.jpg)" }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/80 to-background" />

      {/* Conteúdo */}
      <div className="animate-fade-up relative z-10 flex flex-col items-center gap-5 px-8 text-center">
        <div className="relative">
          <span className="ring-pulse absolute inset-0 rounded-[28px] bg-amber-400/30" />
          <div className="glass glow-gold relative flex h-24 w-24 items-center justify-center rounded-[28px]">
            {/* Balança da justiça em dourado */}
            <svg width="56" height="56" viewBox="0 0 512 512" fill="none">
              <g stroke="#F59E0B" strokeWidth="26" strokeLinecap="round" fill="none">
                <line x1="256" y1="112" x2="256" y2="356" />
                <line x1="118" y1="164" x2="394" y2="164" />
                <path d="M118 164 L70 282" />
                <path d="M118 164 L166 282" />
                <path d="M394 164 L346 282" />
                <path d="M394 164 L442 282" />
                <path d="M70 282 A48 48 0 0 0 166 282" />
                <path d="M346 282 A48 48 0 0 0 442 282" />
              </g>
              <circle cx="256" cy="98" r="26" fill="#F59E0B" />
              <rect x="176" y="356" width="160" height="26" rx="13" fill="#F59E0B" />
            </svg>
          </div>
        </div>

        <div>
          <h1 className="text-4xl font-extrabold tracking-tight">
            Kizua <span className="text-gold-bright">Legal</span>
          </h1>
          <p className="mt-2 text-sm text-muted">
            Advogados verificados · Bronze, Prata, Ouro e Black
          </p>
        </div>

        <div className="mt-6 flex items-center gap-2 text-muted">
          <span className="spin-slow h-5 w-5 rounded-full border-2 border-gold-bright border-t-transparent" />
          <span className="text-xs tracking-wide">A preparar a sua área jurídica…</span>
        </div>
      </div>

      <p className="absolute bottom-8 z-10 text-[11px] text-muted/70">
        © {new Date().getFullYear()} Kizua Legal · Angola
      </p>
    </div>
  );
}
