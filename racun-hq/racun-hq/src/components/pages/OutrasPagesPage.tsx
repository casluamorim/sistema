import { useEffect, useState } from 'react'
import { Plus, FileText } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Modal } from '@/components/ui/Modal'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { Proposta } from '@/types'

const STATUS_COLOR: Record<string, string> = {
  rascunho: 'bg-gray-700 text-gray-400',
  enviada: 'bg-blue-500/20 text-blue-400',
  aceita: 'bg-green-500/20 text-green-400',
  recusada: 'bg-red-500/20 text-red-400',
}

const emptyForm = {
  cliente_nome: '', servicos: [] as string[], valor_total: 0,
  condicoes_pagamento: '', validade_dias: 15, status: 'rascunho' as const, observacoes: ''
}

const SERVICOS_OPTS = ['Meta Ads', 'Google Ads', 'Social Media', 'Produção Audiovisual', 'Fotografia', 'Casamento/Evento', 'Consultoria de Marketing']

export function PropostasPage() {
  const [items, setItems] = useState<Proposta[]>([])
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState<Proposta | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  async function load() {
    const { data } = await supabase.from('propostas').select('*').order('created_at', { ascending: false })
    setItems(data || [])
  }

  useEffect(() => { load() }, [])

  async function save() {
    setSaving(true)
    if (editing) {
      await supabase.from('propostas').update(form).eq('id', editing.id)
    } else {
      await supabase.from('propostas').insert(form)
    }
    await load()
    setModal(false)
    setSaving(false)
  }

  function toggleServico(s: string) {
    setForm(f => ({
      ...f,
      servicos: f.servicos.includes(s) ? f.servicos.filter(x => x !== s) : [...f.servicos, s]
    }))
  }

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div><h1 className="page-title">Propostas</h1><p className="page-subtitle">{items.filter(p => p.status === 'enviada').length} aguardando resposta</p></div>
        <button className="btn-primary" onClick={() => { setEditing(null); setForm(emptyForm); setModal(true) }}><Plus size={16} /> Nova Proposta</button>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-800/50">
            <tr>
              <th className="table-header">Cliente</th>
              <th className="table-header">Serviços</th>
              <th className="table-header">Valor</th>
              <th className="table-header">Validade</th>
              <th className="table-header">Status</th>
              <th className="table-header">Data</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr><td colSpan={6} className="table-cell text-center text-gray-500 py-8">
                <FileText size={28} className="mx-auto mb-2 opacity-30" />
                Nenhuma proposta criada
              </td></tr>
            ) : items.map(p => (
              <tr key={p.id} className="table-row cursor-pointer" onClick={() => { setEditing(p); setForm({ ...p } as any); setModal(true) }}>
                <td className="table-cell font-medium text-white">{p.cliente_nome}</td>
                <td className="table-cell text-gray-400 text-xs">{p.servicos.join(', ')}</td>
                <td className="table-cell font-semibold text-white">{formatCurrency(p.valor_total)}</td>
                <td className="table-cell text-gray-400">{p.validade_dias} dias</td>
                <td className="table-cell"><span className={`badge text-xs ${STATUS_COLOR[p.status]}`}>{p.status}</span></td>
                <td className="table-cell text-gray-400">{formatDate(p.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Editar Proposta' : 'Nova Proposta'} size="lg">
        <div className="space-y-4">
          <div><label className="label">Nome do Cliente *</label><input className="input" value={form.cliente_nome} onChange={e => setForm(f => ({ ...f, cliente_nome: e.target.value }))} /></div>
          <div>
            <label className="label">Serviços Incluídos</label>
            <div className="flex flex-wrap gap-2">
              {SERVICOS_OPTS.map(s => (
                <button key={s} type="button" onClick={() => toggleServico(s)} className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${form.servicos.includes(s) ? 'bg-brand-500/20 border-brand-500/50 text-brand-300' : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Valor Total (R$) *</label><input type="number" step="0.01" className="input" value={form.valor_total} onChange={e => setForm(f => ({ ...f, valor_total: Number(e.target.value) }))} /></div>
            <div><label className="label">Validade (dias)</label><input type="number" className="input" value={form.validade_dias} onChange={e => setForm(f => ({ ...f, validade_dias: Number(e.target.value) }))} /></div>
            <div><label className="label">Condições de Pagamento</label><input className="input" placeholder="Ex: 50% na assinatura, 50% na entrega" value={form.condicoes_pagamento} onChange={e => setForm(f => ({ ...f, condicoes_pagamento: e.target.value }))} /></div>
            <div><label className="label">Status</label>
              <select className="input" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as any }))}>
                <option value="rascunho">Rascunho</option>
                <option value="enviada">Enviada</option>
                <option value="aceita">Aceita</option>
                <option value="recusada">Recusada</option>
              </select>
            </div>
          </div>
          <div><label className="label">Observações</label><textarea rows={3} className="input resize-none" value={form.observacoes} onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))} /></div>
        </div>
        <div className="flex justify-end gap-3 mt-5 pt-4 border-t border-gray-800">
          <button className="btn-secondary" onClick={() => setModal(false)}>Cancelar</button>
          <button className="btn-primary" onClick={save} disabled={saving || !form.cliente_nome}>{saving ? 'Salvando...' : 'Salvar'}</button>
        </div>
      </Modal>
    </div>
  )
}

// ─── CONFIGURAÇÕES ─────────────────────────────
export function ConfiguracoesPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="page-title">Configurações</h1>
        <p className="page-subtitle">Ajustes do sistema</p>
      </div>
      <div className="card p-6 max-w-lg">
        <h2 className="text-base font-semibold text-white mb-4">Agência</h2>
        <div className="space-y-4">
          <div><label className="label">Nome da Agência</label><input className="input" defaultValue="Agência Racun" /></div>
          <div><label className="label">CNPJ MEI</label><input className="input" defaultValue="47.717.946/0001-37" /></div>
          <div><label className="label">Cidade</label><input className="input" defaultValue="Blumenau, SC" /></div>
          <div><label className="label">Meta de Faturamento Mensal (R$)</label><input type="number" className="input" defaultValue={8000} /></div>
          <div><label className="label">Limite MEI Anual (R$)</label><input type="number" className="input" defaultValue={81000} /></div>
        </div>
        <div className="mt-5">
          <button className="btn-primary">Salvar Configurações</button>
        </div>
      </div>
    </div>
  )
}

// ─── PORTAL CLIENTE (preview) ───────────────────
export function PortalClientePage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="page-title">Portal do Cliente</h1>
        <p className="page-subtitle">Área de acesso exclusivo para seus clientes</p>
      </div>
      <div className="card p-6 max-w-lg">
        <div className="text-center py-8">
          <div className="w-14 h-14 bg-brand-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FileText size={24} className="text-brand-400" />
          </div>
          <h2 className="text-base font-semibold text-white mb-2">Portal do Cliente</h2>
          <p className="text-sm text-gray-400 mb-4">
            Seus clientes acessam um portal exclusivo com suas entregas, relatórios de tráfego e arquivos compartilhados.
          </p>
          <p className="text-xs text-gray-500">
            Para criar o acesso de um cliente, vá em <strong className="text-gray-300">Clientes</strong> e clique no botão "Criar login".
          </p>
        </div>
      </div>
    </div>
  )
}
