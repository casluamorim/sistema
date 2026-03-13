import { useEffect, useState } from 'react'
import { DollarSign, Users, TrendingUp, AlertTriangle, Clock, CheckCircle } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts'
import { supabase } from '@/lib/supabase'
import { StatCard } from '@/components/ui/StatCard'
import { formatCurrency, LIMITE_MEI, STATUS_ENTREGA_COLOR, STATUS_ENTREGA_LABEL } from '@/lib/utils'
import type { Entrada, Saida, Entrega, Cliente } from '@/types'

const COLORS = ['#7c3aed', '#10b981', '#f59e0b', '#ef4444', '#3b82f6']

const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

export function DashboardPage() {
  const [entradas, setEntradas] = useState<Entrada[]>([])
  const [saidas, setSaidas] = useState<Saida[]>([])
  const [entregas, setEntregas] = useState<Entrega[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)

  const anoAtual = new Date().getFullYear()
  const mesAtual = new Date().getMonth() + 1

  useEffect(() => {
    async function load() {
      const [e, s, en, c] = await Promise.all([
        supabase.from('entradas').select('*, cliente:clientes(nome)').eq('competencia_ano', anoAtual),
        supabase.from('saidas').select('*').gte('data', `${anoAtual}-01-01`),
        supabase.from('entregas').select('*, cliente:clientes(nome)').neq('status', 'concluido'),
        supabase.from('clientes').select('*').eq('status', 'ativo'),
      ])
      setEntradas(e.data || [])
      setSaidas(s.data || [])
      setEntregas(en.data || [])
      setClientes(c.data || [])
      setLoading(false)
    }
    load()
  }, [anoAtual])

  // KPIs do mês
  const receitaMes = entradas.filter(e => e.competencia_mes === mesAtual && e.status === 'pago').reduce((a, e) => a + e.valor, 0)
  const despesasMes = saidas.filter(s => new Date(s.data).getMonth() + 1 === mesAtual).reduce((a, s) => a + s.valor, 0)
  const lucroMes = receitaMes - despesasMes

  // Faturamento anual para MEI
  const faturamentoAnual = entradas.filter(e => e.status === 'pago').reduce((a, e) => a + e.valor, 0)
  const percentMEI = Math.min((faturamentoAnual / LIMITE_MEI) * 100, 100)

  // Gráfico mensal
  const dadosMensais = MESES.map((mes, i) => {
    const m = i + 1
    const receita = entradas.filter(e => e.competencia_mes === m && e.status === 'pago').reduce((a, e) => a + e.valor, 0)
    const despesa = saidas.filter(s => new Date(s.data).getMonth() + 1 === m).reduce((a, s) => a + s.valor, 0)
    return { mes, receita, despesa }
  }).filter((_, i) => i < mesAtual)

  // Receita por serviço
  const servicoMap: Record<string, number> = {}
  entradas.filter(e => e.status === 'pago' && e.competencia_mes === mesAtual).forEach(e => {
    const s = e.servico || 'outros'
    servicoMap[s] = (servicoMap[s] || 0) + e.valor
  })
  const dadosServico = Object.entries(servicoMap).map(([name, value]) => ({
    name: name === 'meta_ads' ? 'Meta Ads' : name === 'google_ads' ? 'Google Ads' : name === 'social_media' ? 'Social' : name === 'audiovisual' ? 'AV' : 'Casamento',
    value
  }))

  // Entregas atrasadas
  const hoje = new Date().toISOString().split('T')[0]
  const atrasadas = entregas.filter(e => e.prazo && e.prazo < hoje && e.status !== 'concluido' && e.status !== 'aprovado')
  const pendentes = entregas.filter(e => e.status === 'aguardando_aprovacao')

  const meiColor = percentMEI >= 90 ? 'bg-red-500' : percentMEI >= 70 ? 'bg-yellow-500' : 'bg-brand-500'
  const meiTextColor = percentMEI >= 90 ? 'text-red-400' : percentMEI >= 70 ? 'text-yellow-400' : 'text-green-400'

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Visão geral da Agência Racun — {MESES[mesAtual - 1]} {anoAtual}</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Receita do Mês" value={formatCurrency(receitaMes)} icon={DollarSign} color="green" />
        <StatCard title="Despesas do Mês" value={formatCurrency(despesasMes)} icon={TrendingUp} color="red" />
        <StatCard title="Lucro Líquido" value={formatCurrency(lucroMes)} icon={DollarSign} color={lucroMes >= 0 ? 'brand' : 'red'} />
        <StatCard title="Clientes Ativos" value={String(clientes.length)} icon={Users} color="blue" />
      </div>

      {/* Alerta MEI */}
      <div className="card p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            {percentMEI >= 70 && <AlertTriangle size={16} className={meiTextColor} />}
            <span className="text-sm font-medium text-gray-200">Limite MEI Anual</span>
          </div>
          <span className={`text-sm font-bold ${meiTextColor}`}>
            {formatCurrency(faturamentoAnual)} / {formatCurrency(LIMITE_MEI)} ({percentMEI.toFixed(1)}%)
          </span>
        </div>
        <div className="w-full bg-gray-800 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-500 ${meiColor}`}
            style={{ width: `${percentMEI}%` }}
          />
        </div>
        {percentMEI >= 90 && (
          <p className="text-xs text-red-400 mt-2">⚠️ Atenção: você está próximo do limite MEI. Considere consultar seu contador.</p>
        )}
        {percentMEI >= 70 && percentMEI < 90 && (
          <p className="text-xs text-yellow-400 mt-2">Você atingiu 70% do limite MEI anual. Fique de olho.</p>
        )}
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Receita x Despesa */}
        <div className="card p-4 lg:col-span-2">
          <h3 className="text-sm font-semibold text-gray-200 mb-4">Receita vs Despesa ({anoAtual})</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={dadosMensais} barSize={14}>
              <XAxis dataKey="mes" tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: '#e5e7eb' }}
                formatter={(v: number) => [formatCurrency(v), '']}
              />
              <Bar dataKey="receita" fill="#7c3aed" radius={[4, 4, 0, 0]} name="Receita" />
              <Bar dataKey="despesa" fill="#ef4444" radius={[4, 4, 0, 0]} name="Despesa" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pizza por serviço */}
        <div className="card p-4">
          <h3 className="text-sm font-semibold text-gray-200 mb-4">Receita por Serviço</h3>
          {dadosServico.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={dadosServico} dataKey="value" nameKey="name" cx="50%" cy="45%" outerRadius={70} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={10}>
                  {dadosServico.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 8, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-52 text-gray-500 text-sm">Sem dados no mês</div>
          )}
        </div>
      </div>

      {/* Entregas pendentes e atrasadas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Atrasadas */}
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={16} className="text-red-400" />
            <h3 className="text-sm font-semibold text-gray-200">Entregas Atrasadas ({atrasadas.length})</h3>
          </div>
          {atrasadas.length === 0 ? (
            <p className="text-sm text-gray-500 py-4 text-center">Nenhuma entrega atrasada 🎉</p>
          ) : (
            <div className="space-y-2">
              {atrasadas.slice(0, 5).map(e => (
                <div key={e.id} className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
                  <div>
                    <p className="text-sm text-gray-200">{e.titulo}</p>
                    <p className="text-xs text-gray-500">{(e.cliente as any)?.nome}</p>
                  </div>
                  <span className="badge bg-red-500/20 text-red-400 text-xs">{e.prazo}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Aguardando aprovação */}
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-3">
            <Clock size={16} className="text-yellow-400" />
            <h3 className="text-sm font-semibold text-gray-200">Aguardando Aprovação ({pendentes.length})</h3>
          </div>
          {pendentes.length === 0 ? (
            <p className="text-sm text-gray-500 py-4 text-center">Nenhuma entrega aguardando aprovação</p>
          ) : (
            <div className="space-y-2">
              {pendentes.slice(0, 5).map(e => (
                <div key={e.id} className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
                  <div>
                    <p className="text-sm text-gray-200">{e.titulo}</p>
                    <p className="text-xs text-gray-500">{(e.cliente as any)?.nome}</p>
                  </div>
                  <span className={`badge text-xs ${STATUS_ENTREGA_COLOR['aguardando_aprovacao']}`}>
                    {STATUS_ENTREGA_LABEL['aguardando_aprovacao']}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Ranking de clientes */}
      <div className="card p-4">
        <h3 className="text-sm font-semibold text-gray-200 mb-4">Receita por Cliente (mês atual)</h3>
        {clientes.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">Nenhum dado disponível</p>
        ) : (
          <div className="space-y-3">
            {clientes
              .map(c => ({
                ...c,
                receita: entradas.filter(e => e.cliente_id === c.id && e.competencia_mes === mesAtual && e.status === 'pago').reduce((a, e) => a + e.valor, 0)
              }))
              .sort((a, b) => b.receita - a.receita)
              .slice(0, 6)
              .map((c, i) => {
                const max = clientes[0]?.valor_mensal || 1
                const pct = Math.min((c.receita / (max * clientes.length || 1)) * 100, 100)
                return (
                  <div key={c.id} className="flex items-center gap-3">
                    <span className="text-xs text-gray-500 w-4">{i + 1}</span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-300">{c.nome}</span>
                        <span className="text-xs font-medium text-gray-200">{formatCurrency(c.receita)}</span>
                      </div>
                      <div className="w-full bg-gray-800 rounded-full h-1.5">
                        <div className="h-1.5 rounded-full bg-brand-500" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  </div>
                )
              })}
          </div>
        )}
      </div>
    </div>
  )
}
