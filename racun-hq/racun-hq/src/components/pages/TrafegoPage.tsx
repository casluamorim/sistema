// ───────────────────────────────
// TRÁFEGO PAGO
// ───────────────────────────────
import { useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Modal } from '@/components/ui/Modal'
import { formatCurrency, calcularCPL, calcularCPC, getMesAtual, getAnoAtual } from '@/lib/utils'
import type { TrafegoRelatorio, Cliente } from '@/types'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

const MESES_LABEL = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']

const emptyForm = {
  cliente_id: '', mes: getMesAtual(), ano: getAnoAtual(), plataforma: 'meta' as const,
  investimento: 0, alcance: 0, impressoes: 0, cliques: 0, leads: 0, conversoes: 0, roas: 0, resumo: ''
}

export function TrafegoPage() {
  const [relatorios, setRelatorios] = useState<TrafegoRelatorio[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState<TrafegoRelatorio | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [selectedCliente, setSelectedCliente] = useState('')

  async function load() {
    const [r, c] = await Promise.all([
      supabase.from('trafego_relatorios').select('*, cliente:clientes(nome)').order('ano', { ascending: false }).order('mes', { ascending: false }),
      supabase.from('clientes').select('id, nome').eq('status', 'ativo').order('nome')
    ])
    setRelatorios(r.data || [])
    setClientes(c.data || [])
  }

  useEffect(() => { load() }, [])

  async function save() {
    setSaving(true)
    if (editing) {
      await supabase.from('trafego_relatorios').update(form).eq('id', editing.id)
    } else {
      await supabase.from('trafego_relatorios').insert(form)
    }
    await load()
    setModal(false)
    setSaving(false)
  }

  const filtered = selectedCliente ? relatorios.filter(r => r.cliente_id === selectedCliente) : relatorios
  const chartData = filtered.slice(0, 6).reverse().map(r => ({
    label: `${MESES_LABEL[r.mes - 1]}/${r.ano}`,
    investimento: r.investimento,
    leads: r.leads || 0
  }))

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div><h1 className="page-title">Tráfego Pago</h1><p className="page-subtitle">Relatórios de Meta Ads e Google Ads</p></div>
        <button className="btn-primary" onClick={() => { setEditing(null); setForm(emptyForm); setModal(true) }}><Plus size={16} /> Novo Relatório</button>
      </div>

      <select className="input w-56" value={selectedCliente} onChange={e => setSelectedCliente(e.target.value)}>
        <option value="">Todos os clientes</option>
        {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
      </select>

      {selectedCliente && chartData.length > 0 && (
        <div className="card p-4">
          <h3 className="text-sm font-semibold text-gray-200 mb-3">Evolução — Investimento vs Leads</h3>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={chartData}>
              <XAxis dataKey="label" tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 8, fontSize: 12 }} />
              <Line type="monotone" dataKey="investimento" stroke="#7c3aed" strokeWidth={2} dot={false} name="Investimento" />
              <Line type="monotone" dataKey="leads" stroke="#10b981" strokeWidth={2} dot={false} name="Leads" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-800/50">
            <tr>
              <th className="table-header">Cliente</th>
              <th className="table-header">Período</th>
              <th className="table-header">Plataforma</th>
              <th className="table-header">Investimento</th>
              <th className="table-header">Leads</th>
              <th className="table-header">CPL</th>
              <th className="table-header">CPC</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={7} className="table-cell text-center text-gray-500 py-8">Nenhum relatório encontrado</td></tr>
            ) : filtered.map(r => (
              <tr key={r.id} className="table-row cursor-pointer" onClick={() => { setEditing(r); setForm({ ...r } as any); setModal(true) }}>
                <td className="table-cell text-white">{(r.cliente as any)?.nome}</td>
                <td className="table-cell text-gray-400">{MESES_LABEL[r.mes-1]}/{r.ano}</td>
                <td className="table-cell"><span className="badge bg-brand-500/15 text-brand-300 capitalize">{r.plataforma}</span></td>
                <td className="table-cell font-medium text-white">{formatCurrency(r.investimento)}</td>
                <td className="table-cell text-white">{r.leads || '—'}</td>
                <td className="table-cell text-gray-300">{r.leads ? formatCurrency(calcularCPL(r.investimento, r.leads)) : '—'}</td>
                <td className="table-cell text-gray-300">{r.cliques ? formatCurrency(calcularCPC(r.investimento, r.cliques)) : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Editar Relatório' : 'Novo Relatório de Tráfego'} size="lg">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Cliente *</label>
            <select className="input" value={form.cliente_id} onChange={e => setForm(f => ({ ...f, cliente_id: e.target.value }))}>
              <option value="">Selecione...</option>
              {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Plataforma</label>
            <select className="input" value={form.plataforma} onChange={e => setForm(f => ({ ...f, plataforma: e.target.value as any }))}>
              <option value="meta">Meta Ads</option>
              <option value="google">Google Ads</option>
              <option value="ambos">Ambos</option>
            </select>
          </div>
          <div>
            <label className="label">Mês</label>
            <select className="input" value={form.mes} onChange={e => setForm(f => ({ ...f, mes: Number(e.target.value) }))}>
              {MESES_LABEL.map((m,i) => <option key={i} value={i+1}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Ano</label>
            <input type="number" className="input" value={form.ano} onChange={e => setForm(f => ({ ...f, ano: Number(e.target.value) }))} />
          </div>
          {[
            ['investimento', 'Investimento (R$)'], ['alcance', 'Alcance'], ['impressoes', 'Impressões'],
            ['cliques', 'Cliques'], ['leads', 'Leads'], ['conversoes', 'Conversões']
          ].map(([key, label]) => (
            <div key={key}>
              <label className="label">{label}</label>
              <input type="number" step="0.01" className="input" value={(form as any)[key]} onChange={e => setForm(f => ({ ...f, [key]: Number(e.target.value) }))} />
            </div>
          ))}
          <div className="col-span-2">
            <label className="label">Resumo do período (visível ao cliente)</label>
            <textarea rows={3} className="input resize-none" value={form.resumo} onChange={e => setForm(f => ({ ...f, resumo: e.target.value }))} />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-5 pt-4 border-t border-gray-800">
          <button className="btn-secondary" onClick={() => setModal(false)}>Cancelar</button>
          <button className="btn-primary" onClick={save} disabled={saving || !form.cliente_id}>{saving ? 'Salvando...' : 'Salvar'}</button>
        </div>
      </Modal>
    </div>
  )
}
