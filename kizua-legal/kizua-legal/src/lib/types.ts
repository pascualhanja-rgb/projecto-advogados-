export type Role = "CLIENTE" | "ADVOGADO" | "ADMIN";
export type Categoria = "BRONZE" | "PRATA" | "OURO" | "BLACK";
export type ServicoStatus =
  | "PENDENTE_PAGAMENTO"
  | "PAGO_EM_CUSTODIA"
  | "ATRIBUIDO_PELO_ADMIN"
  | "EM_ANDAMENTO"
  | "CONCLUIDO"
  | "CANCELADO";

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface User {
  id: string;
  nome: string;
  email: string;
  fotoUrl?: string | null;
  role: Role;
  ativo?: boolean;
  criadoEm?: string;
}

export interface Lawyer {
  id: string;
  nome: string;
  fotoUrl?: string | null;
  categoria: Categoria;
  statusAprovacao?: string;
  anosExperiencia: number;
  disponivel: boolean;
}

export interface Especialidade {
  id: string;
  nome: string;
  descricao?: string;
  ativa?: boolean;
}

export interface AdvogadoServico {
  id: string;
  nome: string;
  fotoUrl?: string | null;
  categoria: Categoria;
}

export interface Servico {
  id: string;
  clienteId?: string;
  titulo: string;
  descricao?: string;
  valorTotal: string;
  valorAdvogado?: string;
  comissaoKizua?: string;
  status: ServicoStatus;
  statusPagamento?: string;
  latitudeDestino: number;
  longitudeDestino: number;
  enderecoDestino?: string;
  categoriaRequerida?: Categoria;
  advogado?: AdvogadoServico | null;
  criadoEm?: string;
}

export interface Mensagem {
  id: string;
  servicoId: string;
  remetenteId: string;
  destinatarioId?: string;
  conteudo: string;
  lida: boolean;
  criadaEm: string;
}

export interface Chamada {
  id: string;
  servicoId: string;
  tipoChamada: "AUDIO" | "VIDEO";
  statusChamada: "EM_ANDAMENTO" | "CONCLUIDA" | "PERDIDA";
  canalAgoraId?: string;
  numeroSuporteExibido?: string;
  inicioEm: string;
  fimEm?: string;
  duracaoSegundos?: number;
}

export interface ApiMeta {
  page: number;
  limit: number;
  total: number;
}

export interface Paginated<T> {
  data: T[];
  meta: ApiMeta;
}
