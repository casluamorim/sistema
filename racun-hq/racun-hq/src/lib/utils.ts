import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export function formatDate(date: string): string {
  try {
    return format(parseISO(date), "dd/MM/yyyy", { locale: ptBR })
  } catch {
    return date
  }
}

export function formatDateFull(date: string): string {
  try {
    return format(parseISO(date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
  } catch {
    return date
  }
}

export function formatMonth(mes: number, ano: number): string {
  const date = new Date(ano, mes - 1)
  return format(date, "MMMM/yyyy", { locale: ptBR })
}

export function getMesAtual(): number {
  return new Date().getMonth() + 1
}

export function getAnoAtual(): number {
  return new Date().getFullYear()
}

export const SERVICOS_LABEL: Record<string, string> = {
  meta_ads: 'Meta Ads',
  google_ads: 'Google Ads',
  social_media: 'Social Media',
  audiovisual: 'Audiovisual',
  casamento: 'Casamento/Evento',
}

export const STATUS_ENTREGA_LABEL: Record<string, string> = {
  a_fazer: 'A fazer',
  em_andamento: 'Em andamento',
  aguardando_aprovacao: 'Aguard. aprovação',
  aprovado: 'Aprovado',
  concluido: 'Concluído',
  atrasado: 'Atrasado',
}

export const STATUS_ENTREGA_COLOR: Record<string, string> = {
  a_fazer: 'bg-gray-700 text-gray-300',
  em_andamento: 'bg-blue-500/20 text-blue-400',
  aguardando_aprovacao: 'bg-yellow-500/20 text-yellow-400',
  aprovado: 'bg-green-500/20 text-green-400',
  concluido: 'bg-brand-500/20 text-brand-400',
  atrasado: 'bg-red-500/20 text-red-400',
}

export const STATUS_CLIENTE_COLOR: Record<string, string> = {
  ativo: 'bg-green-500/20 text-green-400',
  pausado: 'bg-yellow-500/20 text-yellow-400',
  encerrado: 'bg-red-500/20 text-red-400',
}

export const PRIORIDADE_COLOR: Record<string, string> = {
  baixa: 'bg-gray-700 text-gray-300',
  normal: 'bg-blue-500/20 text-blue-400',
  alta: 'bg-orange-500/20 text-orange-400',
  urgente: 'bg-red-500/20 text-red-400',
}

export const LIMITE_MEI = 81000

export function calcularCPL(investimento: number, leads: number): number {
  if (!leads || leads === 0) return 0
  return investimento / leads
}

export function calcularCPC(investimento: number, cliques: number): number {
  if (!cliques || cliques === 0) return 0
  return investimento / cliques
}

export function calcularCTR(cliques: number, impressoes: number): number {
  if (!impressoes || impressoes === 0) return 0
  return (cliques / impressoes) * 100
}
