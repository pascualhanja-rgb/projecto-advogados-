export const STATUS_LABEL: Record<string, string> = {
  PENDENTE_PAGAMENTO: "Pagamento pendente",
  PAGO_EM_CUSTODIA: "Pago em custódia",
  ATRIBUIDO_PELO_ADMIN: "Advogado atribuído",
  EM_ANDAMENTO: "Em andamento",
  CONCLUIDO: "Concluído",
  CANCELADO: "Cancelado",
};

export const STATUS_COR: Record<string, string> = {
  PENDENTE_PAGAMENTO: "text-amber-400 bg-amber-400/10 border-amber-400/30",
  PAGO_EM_CUSTODIA: "text-sky-400 bg-sky-400/10 border-sky-400/30",
  ATRIBUIDO_PELO_ADMIN: "text-violet-400 bg-violet-400/10 border-violet-400/30",
  EM_ANDAMENTO: "text-emerald-400 bg-emerald-400/10 border-emerald-400/30",
  CONCLUIDO: "text-slate-300 bg-slate-400/10 border-slate-400/30",
  CANCELADO: "text-red-400 bg-red-400/10 border-red-400/30",
};

export const CATEGORIAS = ["BRONZE", "PRATA", "OURO", "BLACK"] as const;

export const CATEGORIA_ESTILO: Record<string, { chip: string; ring: string; grad: string }> = {
  BRONZE: {
    chip: "text-orange-300 bg-orange-400/10 border-orange-400/30",
    ring: "ring-orange-400/40",
    grad: "from-orange-700/60 via-orange-900/40 to-transparent",
  },
  PRATA: {
    chip: "text-slate-200 bg-slate-300/10 border-slate-300/30",
    ring: "ring-slate-300/40",
    grad: "from-slate-500/50 via-slate-700/40 to-transparent",
  },
  OURO: {
    chip: "text-amber-300 bg-amber-400/15 border-amber-400/40",
    ring: "ring-amber-400/50",
    grad: "from-amber-500/50 via-amber-700/30 to-transparent",
  },
  BLACK: {
    chip: "text-fuchsia-200 bg-fuchsia-400/10 border-fuchsia-400/30",
    ring: "ring-fuchsia-400/40",
    grad: "from-fuchsia-700/50 via-slate-900/60 to-transparent",
  },
};

export function formatKwanza(valor: string | number | undefined): string {
  const n = typeof valor === "string" ? Number(valor) : valor;
  if (n === undefined || Number.isNaN(n)) return "—";
  return new Intl.NumberFormat("pt-AO", {
    style: "currency",
    currency: "AOA",
    maximumFractionDigits: 2,
  }).format(n);
}

export function formatData(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleString("pt-PT", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatHora(iso?: string): string {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" });
}

export function formatDuracao(seg?: number): string {
  if (seg === undefined) return "—";
  const m = Math.floor(seg / 60);
  const s = seg % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}
