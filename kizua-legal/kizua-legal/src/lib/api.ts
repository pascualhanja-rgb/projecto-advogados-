import type {
  ApiMeta,
  AuthTokens,
  Categoria,
  Chamada,
  Especialidade,
  Lawyer,
  Mensagem,
  Paginated,
  Servico,
  User,
} from "./types";

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "https://kizua-legal.onrender.com/api/v1";

/* ——————————————————————————— Tokens ——————————————————————————— */

const ACCESS_KEY = "kizua.accessToken";
const REFRESH_KEY = "kizua.refreshToken";

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACCESS_KEY);
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFRESH_KEY);
}

export function saveTokens(t: AuthTokens) {
  localStorage.setItem(ACCESS_KEY, t.accessToken);
  localStorage.setItem(REFRESH_KEY, t.refreshToken);
}

export function clearTokens() {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

/* ——————————————————————————— Fetch base ——————————————————————————— */

export class ApiError extends Error {
  status: number;
  messages: string[];
  constructor(status: number, messages: string[]) {
    super(messages.join(" · "));
    this.status = status;
    this.messages = messages;
  }
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  formData?: FormData;
  auth?: boolean;
  retry?: boolean;
}

async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, formData, auth = true, retry = true } = opts;

  const headers: Record<string, string> = {};
  const token = getAccessToken();
  if (auth && token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers["Content-Type"] = "application/json";

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: formData ?? (body !== undefined ? JSON.stringify(body) : undefined),
  });

  if (res.status === 401 && auth && retry && getRefreshToken()) {
    const refreshed = await refreshTokens();
    if (refreshed) return request<T>(path, { ...opts, retry: false });
  }

  if (res.status === 204) return undefined as T;

  const text = await res.text();
  let payload: unknown = undefined;
  try {
    payload = text ? JSON.parse(text) : undefined;
  } catch {
    payload = text;
  }

  if (!res.ok) {
    const messages: string[] = [];
    if (payload && typeof payload === "object" && "message" in payload) {
      const m = (payload as { message: unknown }).message;
      if (Array.isArray(m)) messages.push(...m.map(String));
      else if (m) messages.push(String(m));
    }
    if (messages.length === 0) messages.push(`Erro ${res.status}`);
    throw new ApiError(res.status, messages);
  }

  return payload as T;
}

let refreshPromise: Promise<boolean> | null = null;

async function refreshTokens(): Promise<boolean> {
  if (refreshPromise) return refreshPromise;
  refreshPromise = (async () => {
    try {
      const rt = getRefreshToken();
      if (!rt) return false;
      const res = await fetch(`${API_URL}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: rt }),
      });
      if (!res.ok) {
        clearTokens();
        return false;
      }
      const data = (await res.json()) as AuthTokens;
      saveTokens(data);
      return true;
    } catch {
      return false;
    } finally {
      setTimeout(() => (refreshPromise = null), 0);
    }
  })();
  return refreshPromise;
}

/* ——————————————————————————— Auth ——————————————————————————— */

export async function registar(input: {
  nomeCompleto: string;
  email: string;
  telefone: string;
  senha: string;
}): Promise<AuthTokens> {
  const data = await request<AuthTokens>("/auth/registar", {
    method: "POST",
    body: input,
    auth: false,
  });
  saveTokens(data);
  return data;
}

export async function loginCliente(identificador: string, senha: string): Promise<AuthTokens> {
  const data = await request<AuthTokens>("/auth/login/cliente", {
    method: "POST",
    body: { identificador, senha },
    auth: false,
  });
  saveTokens(data);
  return data;
}

export async function logout(): Promise<void> {
  const rt = getRefreshToken();
  try {
    if (rt) await request("/auth/logout", { method: "POST", body: { refreshToken: rt } });
  } finally {
    clearTokens();
  }
}

export async function recuperarSolicitar(identificador: string) {
  return request<{ mensagem: string; devToken?: string }>("/auth/recuperacao/solicitar", {
    method: "POST",
    body: { identificador },
    auth: false,
  });
}

export async function recuperarValidar(identificador: string, codigo: string) {
  return request<{ mensagem: string; resetToken: string }>("/auth/recuperacao/validar", {
    method: "POST",
    body: { identificador, codigo },
    auth: false,
  });
}

export async function recuperarRedefinir(resetToken: string, novaSenha: string) {
  return request<{ mensagem: string }>("/auth/recuperacao/redefinir", {
    method: "POST",
    body: { resetToken, novaSenha },
    auth: false,
  });
}

/* ——————————————————————————— Perfil ——————————————————————————— */

export function getMe(): Promise<User> {
  return request<User>("/users/me");
}

export function patchMe(input: { nomeCompleto?: string; email?: string; fotoUrl?: string }) {
  return request<User>("/users/me", { method: "PATCH", body: input });
}

export async function uploadFoto(file: File): Promise<{ url: string }> {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("pasta", "fotos");
  // Envia para o Cloudinary via rota interna; devolve URL estática
  const res = await fetch("/api/upload", { method: "POST", body: fd });
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new ApiError(res.status, [data?.message ?? "Erro ao enviar foto"]);
  }
  const { url } = (await res.json()) as { url: string };
  return { url };
}

/* ——————————————————————————— Catálogo ——————————————————————————— */

export function listLawyers(params: { categoria?: Categoria; page?: number; limit?: number } = {}) {
  const q = new URLSearchParams();
  if (params.categoria) q.set("categoria", params.categoria);
  if (params.page) q.set("page", String(params.page));
  if (params.limit) q.set("limit", String(params.limit));
  const qs = q.toString();
  return request<Paginated<Lawyer>>(`/lawyers${qs ? `?${qs}` : ""}`, { auth: false });
}

export function getLawyer(id: string): Promise<Lawyer> {
  return request<Lawyer>(`/lawyers/${id}`, { auth: false });
}

export function getLawyerEspecialidades(id: string): Promise<Especialidade[]> {
  return request<Especialidade[]>(`/lawyers/${id}/especialidades`);
}

export function listEspecialidades(): Promise<Especialidade[]> {
  return request<Especialidade[]>("/especialidades");
}

export function getAdvogadosPorEspecialidade(id: string): Promise<{ data: Lawyer[] }> {
  return request<{ data: Lawyer[] }>(`/especialidades/${id}/advogados`);
}

/* ——————————————————————————— Serviços ——————————————————————————— */

export function createServico(input: {
  titulo: string;
  descricao: string;
  valorTotal: number;
  latitudeDestino: number;
  longitudeDestino: number;
  categoriaRequerida?: Categoria;
  enderecoDestino?: string;
}): Promise<Servico> {
  return request<Servico>("/servicos", { method: "POST", body: input });
}

export function listServicos(params: { page?: number; limit?: number } = {}) {
  const q = new URLSearchParams();
  if (params.page) q.set("page", String(params.page));
  if (params.limit) q.set("limit", String(params.limit));
  const qs = q.toString();
  return request<Paginated<Servico>>(`/servicos${qs ? `?${qs}` : ""}`);
}

export function getServico(id: string): Promise<Servico> {
  return request<Servico>(`/servicos/${id}`);
}

export function patchServico(id: string, input: { titulo?: string; descricao?: string; enderecoDestino?: string }) {
  return request<Servico>(`/servicos/${id}`, { method: "PATCH", body: input });
}

export function deleteServico(id: string): Promise<{ status: string }> {
  return request<{ status: string }>(`/servicos/${id}`, { method: "DELETE" });
}

export async function uploadComprovativo(file: File): Promise<{ url: string; origem: string }> {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("pasta", "comprovativos");
  // Envia para o Cloudinary via rota interna; devolve URL estática
  const res = await fetch("/api/upload", {
    method: "POST",
    body: fd,
  });
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new ApiError(res.status, [data?.message ?? "Erro ao enviar comprovativo"]);
  }
  return (await res.json()) as { url: string; origem: string; tamanho: number };
}

export function submitPagamento(servicoId: string, input: { comprovativoUrl: string; referenciaBancaria?: string }) {
  return request<{ status: string }>(`/payments/servicos/${servicoId}`, {
    method: "POST",
    body: input,
  });
}

export function avaliarServico(servicoId: string, input: { pontuacao: number; comentario?: string }) {
  return request<unknown>(`/servicos/${servicoId}/avaliacao`, { method: "POST", body: input });
}

/* ——————————————————————————— Chat ——————————————————————————— */

export function listMensagens(servicoId: string): Promise<Mensagem[]> {
  return request<Mensagem[]>(`/servicos/${servicoId}/mensagens`);
}

export function enviarMensagem(servicoId: string, conteudo: string): Promise<Mensagem> {
  return request<Mensagem>(`/servicos/${servicoId}/mensagens`, {
    method: "POST",
    body: { conteudo },
  });
}

export function marcarLidas(servicoId: string): Promise<{ atualizadas: number }> {
  return request<{ atualizadas: number }>(`/servicos/${servicoId}/mensagens/lidas`, {
    method: "PATCH",
  });
}

/* ——————————————————————————— Chamadas ——————————————————————————— */

export function iniciarChamada(servicoId: string, tipoChamada: "AUDIO" | "VIDEO"): Promise<Chamada> {
  return request<Chamada>(`/servicos/${servicoId}/chamadas`, {
    method: "POST",
    body: { tipoChamada },
  });
}

export function terminarChamada(chamadaId: string): Promise<Chamada> {
  return request<Chamada>(`/chamadas/${chamadaId}/end`, { method: "PATCH" });
}

export function listChamadas(servicoId: string): Promise<Chamada[]> {
  return request<Chamada[]>(`/servicos/${servicoId}/chamadas`);
}
