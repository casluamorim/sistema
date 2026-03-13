import { useEffect, useState } from 'react'
import { Plus, Search, List, Columns } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import { STATUS_ENTREGA_COLOR, STATUS_ENTREGA_LABEL, SERVICOS_LABEL, PRIORIDADE_COLOR } from '@/lib/utils'
import type { Entrega, Cliente, ServicoTipo } from '@/types'

const STATUS_COLS = ['a_fazer', 'em_andamento', 'aguardando_aprovacao', 'aprovado', 'concluido'] as const

const emptyForm = {
  titulo: '', descricao: '', cliente_id: '', servico: 'social_media' as ServicoTipo,
  prazo: '', prioridade: 'normal' as const, status: 'a_fazer' as const, link_entrega: '', observacoes: ''
}

export function EntregasPage() {
  const [entregas, setEntregas] = useState<Entrega[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [search, setSearch] = useState('')
  const [view, setView] = useState<'kanban' | 'lista'>('kanban')
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState<Entrega | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [filterCliente, setFilterCliente] = useState('')

  async function load() {
    const [e, c] = await Promise.all([
      supabase.from('entregas').select('*, cliente:clientes(nome)').order('created_at', { ascending: false }),
      supabase.from('clientes').select('id, nome').eq('status', 'ativo').order('nome')
    ])
    setEntregas(e.data || [])
    setClientes(c.data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function openNew() {
    setEditing(null)
    setForm(emptyForm)
    setModal(true)
  }

  function openEdit(e: Entrega) {
    setEditing(e)
    setForm({ ...e } as any)
    setModal(true)
  }

  async function save() {
    setSaving(true)
    const payload = { ...form }
    if (editing) {
      await supabase.from('entregas').update(payload).eq('id', editing.id)
    } else {
      await supabase.from('entregas').insert(payload)
    }
    await load()
    setModal(false)
    setSaving(false)
  }

  async function updateStatus(id: string, status: string) {
    await supabase.from('entregas').update({ status }).eq('id', id)
    setEntregas(prev => prev.map(e => e.id === id ? { ...e, status: status as any } : e))
  }

  const hoje = new Date().toISOString().split('T')[0]

  const filtered = entregas.filter(e => {
    const q = search.toLowerCase()
    const matchSearch = e.titulo.toLowerCase().includes(q) || (e.cliente as any)?.nome?.toLowerCase().includes(q)
    const matchCliente = !filterCliente || e.cliente_id === filterCliente
    return matchSearch && matchCliente
  })

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">Entregas</h1>
          <p className="page-subtitle">{entregas.filter(e => e.status !== 'concluido').length} em aberto</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setView('kanban')} className={`btn-secondary px-3 py-2 ${view === 'kanban' ? 'border-brand-500/50 text-brand-300' : ''}`}>
            <Columns size={15} />
          </button>
          <button onClick={() => setView('lista')} className={`btn-secondary px-3 py-2 ${view === 'lista' ? 'border-brand-500/50 text-brand-300' : ''}`}>
            <List size={15} />
          </button>
          <button className="btn-primary" onClick={openNew}>
            <Plus size={16} /> Nova Entrega
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input className="input pl-9" placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input w-48" value={filterCliente} onChange={e => setFilterCliente(e.target.value)}>
          <option value="">Todos os clientes</option>
          {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : view === 'kanban' ? (
        /* KANBAN */
        <div className="flex gap-3 overflow-x-auto pb-4">
          {STATUS_COLS.map(col => {
            const items = filtered.filter(e => e.status === col)
            return (
              <div key={col} className="flex-shrink-0 w-64">
                <div className="flex items-center justify-between mb-2 px-1">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{STATUS_ENTREGA_LABEL[col]}</span>
                  <span className="text-xs text-gray-600 bg-gray-800 rounded-full w-5 h-5 flex items-center justify-center">{items.length}</span>
                </div>
                <div className="space-y-2 min-h-16">
                  {items.map(e => {
                    const atrasado = e.prazo && e.prazo < hoje && col !== 'concluido' && col !== 'aprovado'
                    return (
                      <div
                        key={e.id}
                        onClick={() => openEdit(e)}
                        className={`card p-3 cursor-pointer hover:border-gray-700 transition-colors ${atrasado ? 'border-red-500/30' : ''}`}
                      >
                        <p className="text-sm font-medium text-white mb-1 leading-snug">{e.titulo}</p>
                        <p className="text-xs text-gray-500 mb-2">{(e.cliente as any)?.nome}</p>
                        <div className="flex items-center justify-between">
                          <Badge className={`${PRIORIDADE_COLOR[e.prioridade]} text-xs`}>{e.prioridade}</Badge>
                          {e.prazo && (
                            <span className={`text-xs ${atrasado ? 'text-red-400' : 'text-gray-500'}`}>
                              {e.prazo}
                            </span>
                          )}
                        </div>
                        <div className="mt-2">
                          <select
                            value={e.status}
                            onClick={ev => ev.stopPropagation()}
                            onChange={ev => updateStatus(e.id, ev.target.value)}
                            className="w-full bg-gray-800 border border-gray-700 text-xs text-gray-300 rounded px-2 py-1"
                          >
                            {Object.entries(STATUS_ENTREGA_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                          </select>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        /* LISTA */
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-800/50">
              <tr>
                <th className="table-header">Entrega</th>
                <th className="table-header">Cliente</th>
                <th className="table-header">Serviço</th>
                <th className="table-header">Prazo</th>
                <th className="table-header">Prioridade</th>
                <th className="table-header">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(e => {
                const atrasado = e.prazo && e.prazo < hoje
                return (
                  <tr key={e.id} className="table-row cursor-pointer" onClick={() => openEdit(e)}>
                    <td className="table-cell font-medium text-white">{e.titulo}</td>
                    <td className="table-cell text-gray-400">{(e.cliente as any)?.nome}</td>
                    <td className="table-cell text-gray-400">{SERVICOS_LABEL[e.servico]}</td>
                    <td className={`table-cell ${atrasado ? 'text-red-400' : 'text-gray-400'}`}>{e.prazo || '—'}</td>
                    <td className="table-cell"><Badge className={`${PRIORIDADE_COLOR[e.prioridade]} text-xs`}>{e.prioridade}</Badge></td>
                    <td className="table-cell"><Badge className={`${STATUS_ENTREGA_COLOR[e.status]} text-xs`}>{STATUS_ENTREGA_LABEL[e.status]}</Badge></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Editar Entrega' : 'Nova Entrega'} size="lg">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="label">Título *</label>
            <input className="input" value={form.titulo} onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))} />
          </div>
          <div>
            <label className="label">Cliente *</label>
            <select className="input" value={form.cliente_id} onChange={e => setForm(f => ({ ...f, cliente_id: e.target.value }))}>
              <option value="">Selecione...</option>
              {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Serviço</label>
            <select className="input" value={form.servico} onChange={e => setForm(f => ({ ...f, servico: e.target.value as ServicoTipo }))}>
              {Object.entries(SERVICOS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Prazo</label>
            <input type="date" className="input" value={form.prazo} onChange={e => setForm(f => ({ ...f, prazo: e.target.value }))} />
          </div>
          <div>
            <label className="label">Prioridade</label>
            <select className="input" value={form.prioridade} onChange={e => setForm(f => ({ ...f, prioridade: e.target.value as any }))}>
              <option value="baixa">Baixa</option>
              <option value="normal">Normal</option>
              <option value="alta">Alta</option>
              <option value="urgente">Urgente</option>
            </select>
          </div>
          <div>
            <label className="label">Status</label>
            <select className="input" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as any }))}>
              {Object.entries(STATUS_ENTREGA_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Link de Entrega</label>
            <input className="input" placeholder="https://drive.google.com/..." value={form.link_entrega} onChange={e => setForm(f => ({ ...f, link_entrega: e.target.value }))} />
          </div>
          <div className="col-span-2">
            <label className="label">Descrição / Observações</label>
            <textarea rows={3} className="input resize-none" value={form.observacoes} onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))} />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-5 pt-4 border-t border-gray-800">
          <button className="btn-secondary" onClick={() => setModal(false)}>Cancelar</button>
          <button className="btn-primary" onClick={save} disabled={saving || !form.titulo || !form.cliente_id}>
            {saving ? 'Salvando...' : editing ? 'Salvar' : 'Criar Entrega'}
          </button>
        </div>
      </Modal>
    </div>
  )
}
