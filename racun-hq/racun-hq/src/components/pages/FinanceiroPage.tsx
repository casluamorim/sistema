import { useEffect, useState } from 'react'
import { Plus, TrendingUp, TrendingDown, DollarSign } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { supabase } from '@/lib/supabase'
import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import { formatCurrency, getMesAtual, getAnoAtual, SERVICOS_LABEL } from '@/lib/utils'
import type { Entrada, Saida, Cliente } from '@/types'

const MESES_LABEL = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']

const emptyEntrada = {
  cliente_id: '', servico: '', valor: 0, data: new Date().toISOString().split('T')[0],
  forma_pagamento: 'pix' as const, competencia_mes: getMesAtual(), competencia_ano: getAnoAtual(),
  status: 'pago' as const, descricao: '', recorrente: false
}

const emptySaida = {
  valor: 0, data: new Date().toISOString().split('T')[0],
  categoria: 'ferramentas' as const, descricao: '', recorrente: false
}

export function FinanceiroPage() {
  const [tab, setTab] = useState<'entradas' | 'saidas' | 'relatorios'>('entradas')
  const [entradas, setEntradas] = useState<Entrada[]>([])
  const [saidas, setSaidas] = useState<Saida[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [modalEntrada, setModalEntrada] = useState(false)
  const [modalSaida, setModalSaida] = useState(false)
  const [formEntrada, setFormEntrada] = useState(emptyEntrada)
  const [formSaida, setFormSaida] = useState(emptySaida)
  const [saving, setSaving] = useState(false)
  const [mes, setMes] = useState(getMesAtual())
  const [ano, setAno] = useState(getAnoAtual())

  async function load() {
    const [e, s, c] = await Promise.all([
      supabase.from('entradas').select('*, cliente:clientes(nome)').eq('competencia_ano', ano).order('data', { ascending: false }),
      supabase.from('saidas').select('*').gte('data', `${ano}-01-01`).order('data', { ascending: false }),
      supabase.from('clientes').select('id, nome').eq('status', 'ativo').order('nome')
    ])
    setEntradas(e.data || [])
    setSaidas(s.data || [])
    setClientes(c.data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [ano])

  async function saveEntrada() {
    setSaving(true)
    await supabase.from('entradas').insert(formEntrada)
    await load()
    setModalEntrada(false)
    setFormEntrada(emptyEntrada)
    setSaving(false)
  }

  async function saveSaida() {
    setSaving(true)
    await supabase.from('saidas').insert(formSaida)
    await load()
    setModalSaida(false)
    setFormSaida(emptySaida)
    setSaving(false)
  }

  async function togglePago(id: string, currentStatus: string) {
    const newStatus = currentStatus === 'pago' ? 'pendente' : 'pago'
    await supabase.from('entradas').update({ status: newStatus }).eq('id', id)
    load()
  }

  const entradasMes = entradas.filter(e => e.competencia_mes === mes)
  const saidasMes = saidas.filter(s => new Date(s.data).getMonth() + 1 === mes)
  const receitaMes = entradasMes.filter(e => e.status === 'pago').reduce((a, e) => a + e.valor, 0)
  const despesaMes = saidasMes.reduce((a, s) => a + s.valor, 0)
  const lucroMes = receitaMes - despesaMes

  const dadosMensais = MESES_LABEL.map((label, i) => {
    const m = i + 1
    const receita = entradas.filter(e => e.competencia_mes === m && e.status === 'pago').reduce((a, e) => a + e.valor, 0)
    const despesa = saidas.filter(s => new Date(s.data).getMonth() + 1 === m).reduce((a, s) => a + s.valor, 0)
    return { label, receita, despesa, lucro: receita - despesa }
  })

  const statusColor: Record<string, string> = {
    pago: 'bg-green-500/20 text-green-400',
    pendente: 'bg-yellow-500/20 text-yellow-400',
    atrasado: 'bg-red-500/20 text-red-400',
  }

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">Financeiro</h1>
          <p className="page-subtitle">Controle de entradas e saídas</p>
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary" onClick={() => { setFormSaida(emptySaida); setModalSaida(true) }}>
            <TrendingDown size={15} /> Saída
          </button>
          <button className="btn-primary" onClick={() => { setFormEntrada(emptyEntrada); setModalEntrada(true) }}>
            <Plus size={16} /> Entrada
          </button>
        </div>
      </div>

      {/* Filtro de mês */}
      <div className="flex gap-2">
        <select className="input w-36" value={mes} onChange={e => setMes(Number(e.target.value))}>
          {MESES_LABEL.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
        </select>
        <select className="input w-28" value={ano} onChange={e => setAno(Number(e.target.value))}>
          {[2023, 2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {/* KPIs rápidos */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card p-4">
          <p className="text-xs text-gray-400">Receita ({MESES_LABEL[mes-1]})</p>
          <p className="text-2xl font-bold text-green-400 mt-1">{formatCurrency(receitaMes)}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-gray-400">Despesas ({MESES_LABEL[mes-1]})</p>
          <p className="text-2xl font-bold text-red-400 mt-1">{formatCurrency(despesaMes)}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-gray-400">Lucro Líquido</p>
          <p className={`text-2xl font-bold mt-1 ${lucroMes >= 0 ? 'text-brand-400' : 'text-red-400'}`}>{formatCurrency(lucroMes)}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-900 border border-gray-800 rounded-lg p-1 w-fit">
        {(['entradas', 'saidas', 'relatorios'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors capitalize ${tab === t ? 'bg-brand-500/20 text-brand-300 border border-brand-500/30' : 'text-gray-400 hover:text-white'}`}
          >
            {t === 'relatorios' ? 'Relatórios' : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Entradas */}
      {tab === 'entradas' && (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-800/50">
              <tr>
                <th className="table-header">Descrição / Cliente</th>
                <th className="table-header">Serviço</th>
                <th className="table-header">Forma</th>
                <th className="table-header">Data</th>
                <th className="table-header">Valor</th>
                <th className="table-header">Status</th>
              </tr>
            </thead>
            <tbody>
              {entradasMes.length === 0 ? (
                <tr><td colSpan={6} className="table-cell text-center text-gray-500 py-8">Nenhuma entrada neste mês</td></tr>
              ) : entradasMes.map(e => (
                <tr key={e.id} className="table-row">
                  <td className="table-cell">
                    <p className="text-white">{e.descricao || (e.cliente as any)?.nome || '—'}</p>
                    {e.descricao && <p className="text-xs text-gray-500">{(e.cliente as any)?.nome}</p>}
                  </td>
                  <td className="table-cell text-gray-400">{e.servico ? SERVICOS_LABEL[e.servico] : '—'}</td>
                  <td className="table-cell text-gray-400 capitalize">{e.forma_pagamento}</td>
                  <td className="table-cell text-gray-400">{e.data}</td>
                  <td className="table-cell font-semibold text-white">{formatCurrency(e.valor)}</td>
                  <td className="table-cell">
                    <button onClick={() => togglePago(e.id, e.status)}>
                      <Badge className={statusColor[e.status]}>{e.status}</Badge>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Saídas */}
      {tab === 'saidas' && (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-800/50">
              <tr>
                <th className="table-header">Descrição</th>
                <th className="table-header">Categoria</th>
                <th className="table-header">Data</th>
                <th className="table-header">Valor</th>
                <th className="table-header">Recorrente</th>
              </tr>
            </thead>
            <tbody>
              {saidasMes.length === 0 ? (
                <tr><td colSpan={5} className="table-cell text-center text-gray-500 py-8">Nenhuma saída neste mês</td></tr>
              ) : saidasMes.map(s => (
                <tr key={s.id} className="table-row">
                  <td className="table-cell text-white">{s.descricao}</td>
                  <td className="table-cell"><Badge className="bg-gray-700 text-gray-300 capitalize">{s.categoria}</Badge></td>
                  <td className="table-cell text-gray-400">{s.data}</td>
                  <td className="table-cell font-semibold text-red-400">{formatCurrency(s.valor)}</td>
                  <td className="table-cell text-gray-400">{s.recorrente ? 'Sim' : 'Não'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Relatórios */}
      {tab === 'relatorios' && (
        <div className="space-y-4">
          <div className="card p-4">
            <h3 className="text-sm font-semibold text-gray-200 mb-4">Receita vs Despesa por Mês ({ano})</h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={dadosMensais} barSize={16}>
                <XAxis dataKey="label" tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} />
                <Tooltip contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 8, fontSize: 12 }} formatter={(v: number) => formatCurrency(v)} />
                <Bar dataKey="receita" fill="#7c3aed" radius={[4,4,0,0]} name="Receita" />
                <Bar dataKey="despesa" fill="#ef4444" radius={[4,4,0,0]} name="Despesa" />
                <Bar dataKey="lucro" fill="#10b981" radius={[4,4,0,0]} name="Lucro" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Modal Entrada */}
      <Modal open={modalEntrada} onClose={() => setModalEntrada(false)} title="Nova Entrada" size="md">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Cliente</label>
              <select className="input" value={formEntrada.cliente_id} onChange={e => setFormEntrada(f => ({ ...f, cliente_id: e.target.value }))}>
                <option value="">Selecione...</option>
                {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Serviço</label>
              <select className="input" value={formEntrada.servico} onChange={e => setFormEntrada(f => ({ ...f, servico: e.target.value }))}>
                <option value="">Selecione...</option>
                {Object.entries(SERVICOS_LABEL).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Valor (R$) *</label>
              <input type="number" step="0.01" className="input" value={formEntrada.valor} onChange={e => setFormEntrada(f => ({ ...f, valor: Number(e.target.value) }))} />
            </div>
            <div>
              <label className="label">Data *</label>
              <input type="date" className="input" value={formEntrada.data} onChange={e => setFormEntrada(f => ({ ...f, data: e.target.value }))} />
            </div>
            <div>
              <label className="label">Forma de Pagamento</label>
              <select className="input" value={formEntrada.forma_pagamento} onChange={e => setFormEntrada(f => ({ ...f, forma_pagamento: e.target.value as any }))}>
                <option value="pix">Pix</option>
                <option value="boleto">Boleto</option>
                <option value="cartao">Cartão</option>
                <option value="transferencia">Transferência</option>
              </select>
            </div>
            <div>
              <label className="label">Status</label>
              <select className="input" value={formEntrada.status} onChange={e => setFormEntrada(f => ({ ...f, status: e.target.value as any }))}>
                <option value="pago">Pago</option>
                <option value="pendente">Pendente</option>
                <option value="atrasado">Atrasado</option>
              </select>
            </div>
            <div>
              <label className="label">Competência (mês)</label>
              <select className="input" value={formEntrada.competencia_mes} onChange={e => setFormEntrada(f => ({ ...f, competencia_mes: Number(e.target.value) }))}>
                {MESES_LABEL.map((m, i) => <option key={i} value={i+1}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Ano</label>
              <input type="number" className="input" value={formEntrada.competencia_ano} onChange={e => setFormEntrada(f => ({ ...f, competencia_ano: Number(e.target.value) }))} />
            </div>
            <div className="col-span-2">
              <label className="label">Descrição</label>
              <input className="input" value={formEntrada.descricao} onChange={e => setFormEntrada(f => ({ ...f, descricao: e.target.value }))} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="recorrente-e" checked={formEntrada.recorrente} onChange={e => setFormEntrada(f => ({ ...f, recorrente: e.target.checked }))} />
            <label htmlFor="recorrente-e" className="text-sm text-gray-400">Lançamento recorrente mensal</label>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-5 pt-4 border-t border-gray-800">
          <button className="btn-secondary" onClick={() => setModalEntrada(false)}>Cancelar</button>
          <button className="btn-primary" onClick={saveEntrada} disabled={saving || !formEntrada.valor}>
            {saving ? 'Salvando...' : 'Registrar Entrada'}
          </button>
        </div>
      </Modal>

      {/* Modal Saída */}
      <Modal open={modalSaida} onClose={() => setModalSaida(false)} title="Nova Saída" size="md">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Valor (R$) *</label>
              <input type="number" step="0.01" className="input" value={formSaida.valor} onChange={e => setFormSaida(f => ({ ...f, valor: Number(e.target.value) }))} />
            </div>
            <div>
              <label className="label">Data *</label>
              <input type="date" className="input" value={formSaida.data} onChange={e => setFormSaida(f => ({ ...f, data: e.target.value }))} />
            </div>
            <div className="col-span-2">
              <label className="label">Categoria</label>
              <select className="input" value={formSaida.categoria} onChange={e => setFormSaida(f => ({ ...f, categoria: e.target.value as any }))}>
                <option value="ferramentas">Ferramentas / SaaS</option>
                <option value="freelancer">Freelancer / Fornecedor</option>
                <option value="equipamento">Equipamento</option>
                <option value="imposto">Imposto / DAS</option>
                <option value="marketing">Marketing</option>
                <option value="assinatura">Assinatura</option>
                <option value="outros">Outros</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="label">Descrição *</label>
              <input className="input" value={formSaida.descricao} onChange={e => setFormSaida(f => ({ ...f, descricao: e.target.value }))} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="recorrente-s" checked={formSaida.recorrente} onChange={e => setFormSaida(f => ({ ...f, recorrente: e.target.checked }))} />
            <label htmlFor="recorrente-s" className="text-sm text-gray-400">Despesa recorrente mensal</label>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-5 pt-4 border-t border-gray-800">
          <button className="btn-secondary" onClick={() => setModalSaida(false)}>Cancelar</button>
          <button className="btn-primary" onClick={saveSaida} disabled={saving || !formSaida.valor || !formSaida.descricao}>
            {saving ? 'Salvando...' : 'Registrar Saída'}
          </button>
        </div>
      </Modal>
    </div>
  )
}
