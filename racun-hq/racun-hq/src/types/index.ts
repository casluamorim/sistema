export type UserRole = 'admin' | 'equipe' | 'cliente'

export interface Profile {
  id: string
  email: string
  nome: string
  role: UserRole
  avatar_url?: string
  created_at: string
}

export interface Cliente {
  id: string
  nome: string
  empresa?: string
  cnpj_cpf?: string
  telefone?: string
  email?: string
  whatsapp?: string
  instagram?: string
  responsavel_id?: string
  servicos: ServicoTipo[]
  valor_mensal?: number
  vencimento_dia?: number
  data_inicio?: string
  status: 'ativo' | 'pausado' | 'encerrado'
  observacoes?: string
  created_at: string
}

export type ServicoTipo =
  | 'meta_ads'
  | 'google_ads'
  | 'social_media'
  | 'audiovisual'
  | 'casamento'

export interface Lead {
  id: string
  nome: string
  empresa?: string
  telefone?: string
  email?: string
  whatsapp?: string
  servico_interesse: ServicoTipo
  valor_estimado?: number
  origem: 'instagram' | 'indicacao' | 'google' | 'site' | 'outros'
  status: 'novo' | 'contato' | 'proposta' | 'negociacao' | 'fechado' | 'perdido'
  responsavel_id?: string
  observacoes?: string
  created_at: string
}

export interface Entrega {
  id: string
  titulo: string
  descricao?: string
  cliente_id: string
  cliente?: Cliente
  servico: ServicoTipo
  responsavel_id?: string
  prazo?: string
  prioridade: 'baixa' | 'normal' | 'alta' | 'urgente'
  status: 'a_fazer' | 'em_andamento' | 'aguardando_aprovacao' | 'aprovado' | 'concluido' | 'atrasado'
  link_entrega?: string
  observacoes?: string
  created_at: string
}

export interface TrafegoRelatorio {
  id: string
  cliente_id: string
  cliente?: Cliente
  mes: number
  ano: number
  plataforma: 'meta' | 'google' | 'ambos'
  investimento: number
  alcance?: number
  impressoes?: number
  cliques?: number
  leads?: number
  conversoes?: number
  roas?: number
  resumo?: string
  created_at: string
}

export interface Entrada {
  id: string
  cliente_id?: string
  cliente?: Cliente
  servico?: ServicoTipo
  valor: number
  data: string
  forma_pagamento: 'pix' | 'boleto' | 'cartao' | 'transferencia'
  competencia_mes: number
  competencia_ano: number
  status: 'pago' | 'pendente' | 'atrasado'
  descricao?: string
  recorrente: boolean
  created_at: string
}

export interface Saida {
  id: string
  valor: number
  data: string
  categoria: 'ferramentas' | 'freelancer' | 'equipamento' | 'imposto' | 'marketing' | 'assinatura' | 'outros'
  descricao: string
  recorrente: boolean
  created_at: string
}

export interface Evento {
  id: string
  titulo: string
  tipo: 'reuniao' | 'gravacao' | 'ensaio' | 'casamento' | 'entrega' | 'outros'
  cliente_id?: string
  cliente?: Cliente
  data_inicio: string
  data_fim?: string
  local?: string
  responsavel_id?: string
  observacoes?: string
  created_at: string
}

export interface Casamento {
  id: string
  contratante: string
  noivos?: string
  data_evento: string
  hora_evento?: string
  local_cerimonia?: string
  local_recepcao?: string
  pacote?: string
  valor_total?: number
  sinal_pago?: number
  status: 'confirmado' | 'em_producao' | 'entregue' | 'arquivado'
  observacoes?: string
  created_at: string
}

export interface Fornecedor {
  id: string
  nome: string
  tipo: 'freelancer' | 'grafica' | 'locadora' | 'servico' | 'outros'
  especialidade?: string
  telefone?: string
  email?: string
  whatsapp?: string
  valor_hora?: number
  valor_projeto?: number
  forma_pagamento?: string
  avaliacao?: number
  observacoes?: string
  created_at: string
}

export interface Equipamento {
  id: string
  nome: string
  categoria: 'camera' | 'lente' | 'audio' | 'iluminacao' | 'acessorio' | 'outros'
  marca?: string
  modelo?: string
  numero_serie?: string
  status: 'disponivel' | 'em_uso' | 'manutencao' | 'inativo'
  data_compra?: string
  valor_compra?: number
  ultima_manutencao?: string
  proxima_manutencao?: string
  observacoes?: string
  created_at: string
}

export interface Proposta {
  id: string
  cliente_nome: string
  lead_id?: string
  servicos: string[]
  valor_total: number
  condicoes_pagamento?: string
  validade_dias: number
  status: 'rascunho' | 'enviada' | 'aceita' | 'recusada'
  observacoes?: string
  created_at: string
}
