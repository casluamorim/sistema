import { useEffect, useState } from 'react'
import { Plus, Phone, Mail, MessageCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import { formatCurrency, SERVICOS_LABEL } from '@/lib/utils'
import type { Lead, ServicoTipo } from '@/types'

const COLS = [
  { key: 'novo', label: 'Novo Lead', color: 'text-gray-400' },
  { key: 'contato', label: 'Contato Feito', color: 'text-blue-400' },
  { key: 'proposta', label: 'Proposta Enviada', color: 'text-yellow-400' },
  { key: 'negociacao', label: 'Negociação', color: 'text-orange-400' },
  { key: 'fechado', label: 'Fechado', color: 'text-green-400' },
  { key: 'perdido', label: 'Perdido', color: 'text-red-400' },
] as const

const emptyForm = {
  nome: '', empresa: '', telefone: '', email: '', whatsapp: '',
  servico_interesse: 'social_media' as ServicoTipo, valor_estimado: 0,
  origem: 'instagram' as const, status: 'novo' as const, observacoes: ''
}

export function CRMPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState<Lead | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  async function load() {
    const { data } = await supabase.from('leads').select('*').order('created_at', { ascending: false })
    setLeads(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function openNew() {
    setEditing(null)
    setForm(emptyForm)
    setModal(true)
  }

  function openEdit(l: Lead) {
    setEditing(l)
    setForm({ ...l } as any)
    setModal(true)
  }

  async function save() {
    setSaving(true)
    if (editing) {
      await supabase.from('leads').update(form).eq('id', editing.id)
    } else {
      await supabase.from('leads').insert(form)
    }
    await load()
    setModal(false)
    setSaving(false)
  }

  async function moveStatus(id: string, status: string) {
    await supabase.from('leads').update({ status }).eq('id', id)
    setLeads(prev => prev.map(l => l.id === id ? { ...l, status: status as any } : l))
  }

  async function converterCliente(lead: Lead) {
    if (!confirm(`Converter "${lead.nome}" em cliente?`)) return
    await supabase.from('clientes').insert({
      nome: lead.nome, empresa: lead.empresa, telefone: lead.telefone,
      email: lead.email, whatsapp: lead.whatsapp,
      servicos: [lead.servico_interesse], status: 'ativo',
      valor_mensal: lead.valor_estimado
    })
    await supabase.from('leads').update({ status: 'fechado' }).eq('id', lead.id)
    load()
    alert('Cliente criado com sucesso!')
  }

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">Pipeline / CRM</h1>
          <p className="page-subtitle">{leads.filter(l => l.status !== 'fechado' && l.status !== 'perdido').length} leads em aberto</p>
        </div>
        <button className="btn-primary" onClick={openNew}>
          <Plus size={16} /> Novo Lead
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-4">
          {COLS.map(col => {
            const items = leads.filter(l => l.status === col.key)
            const totalValor = items.reduce((a, l) => a + (l.valor_estimado || 0), 0)
            return (
              <div key={col.key} className="flex-shrink-0 w-64">
                <div className="flex items-center justify-between mb-2 px-1">
                  <div>
                    <span className={`text-xs font-semibold uppercase tracking-wider ${col.color}`}>{col.label}</span>
                    {totalValor > 0 && <p className="text-xs text-gray-600">{formatCurrency(totalValor)}</p>}
                  </div>
                  <span className="text-xs text-gray-600 bg-gray-800 rounded-full w-5 h-5 flex items-center justify-center">{items.length}</span>
                </div>
                <div className="space-y-2 min-h-12">
                  {items.map(l => (
                    <div key={l.id} className="card p-3 cursor-pointer hover:border-gray-700 transition-colors" onClick={() => openEdit(l)}>
                      <p className="text-sm font-medium text-white">{l.nome}</p>
                      {l.empresa && <p className="text-xs text-gray-500 mb-1">{l.empresa}</p>}
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className="bg-brand-500/15 text-brand-300 text-xs">{SERVICOS_LABEL[l.servico_interesse]}</Badge>
                      </div>
                      {l.valor_estimado > 0 && (
                        <p className="text-xs text-green-400 font-medium mb-2">{formatCurrency(l.valor_estimado)}/mês</p>
                      )}
                      <div className="flex gap-1 mb-2">
                        {l.whatsapp && <a href={`https://wa.me/55${l.whatsapp.replace(/\D/g,'')}`} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} className="p-1 text-gray-500 hover:text-green-400 transition-colors"><MessageCircle size={13} /></a>}
                        {l.telefone && <a href={`tel:${l.telefone}`} onClick={e => e.stopPropagation()} className="p-1 text-gray-500 hover:text-blue-400 transition-colors"><Phone size={13} /></a>}
                        {l.email && <a href={`mailto:${l.email}`} onClick={e => e.stopPropagation()} className="p-1 text-gray-500 hover:text-yellow-400 transition-colors"><Mail size={13} /></a>}
                      </div>
                      <select
                        value={l.status}
                        onClick={e => e.stopPropagation()}
                        onChange={e => moveStatus(l.id, e.target.value)}
                        className="w-full bg-gray-800 border border-gray-700 text-xs text-gray-300 rounded px-2 py-1 mb-2"
                      >
                        {COLS.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
                      </select>
                      {l.status === 'fechado' && (
                        <button
                          onClick={e => { e.stopPropagation(); converterCliente(l) }}
                          className="w-full text-xs bg-green-500/20 text-green-400 border border-green-500/30 rounded px-2 py-1 hover:bg-green-500/30 transition-colors"
                        >
                          Converter em Cliente
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Editar Lead' : 'Novo Lead'} size="lg">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Nome *</label>
            <input className="input" value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} />
          </div>
          <div>
            <label className="label">Empresa</label>
            <input className="input" value={form.empresa} onChange={e => setForm(f => ({ ...f, empresa: e.target.value }))} />
          </div>
          <div>
            <label className="label">WhatsApp</label>
            <input className="input" placeholder="(47) 99999-0000" value={form.whatsapp} onChange={e => setForm(f => ({ ...f, whatsapp: e.target.value }))} />
          </div>
          <div>
            <label className="label">E-mail</label>
            <input type="email" className="input" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
          </div>
          <div>
            <label className="label">Serviço de Interesse</label>
            <select className="input" value={form.servico_interesse} onChange={e => setForm(f => ({ ...f, servico_interesse: e.target.value as ServicoTipo }))}>
              {Object.entries(SERVICOS_LABEL).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Valor Estimado (R$/mês)</label>
            <input type="number" className="input" value={form.valor_estimado} onChange={e => setForm(f => ({ ...f, valor_estimado: Number(e.target.value) }))} />
          </div>
          <div>
            <label className="label">Origem</label>
            <select className="input" value={form.origem} onChange={e => setForm(f => ({ ...f, origem: e.target.value as any }))}>
              <option value="instagram">Instagram</option>
              <option value="indicacao">Indicação</option>
              <option value="google">Google</option>
              <option value="site">Site</option>
              <option value="outros">Outros</option>
            </select>
          </div>
          <div>
            <label className="label">Status</label>
            <select className="input" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as any }))}>
              {COLS.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
            </select>
          </div>
          <div className="col-span-2">
            <label className="label">Observações</label>
            <textarea rows={3} className="input resize-none" value={form.observacoes} onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))} />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-5 pt-4 border-t border-gray-800">
          <button className="btn-secondary" onClick={() => setModal(false)}>Cancelar</button>
          <button className="btn-primary" onClick={save} disabled={saving || !form.nome}>
            {saving ? 'Salvando...' : editing ? 'Salvar' : 'Criar Lead'}
          </button>
        </div>
      </Modal>
    </div>
  )
}
