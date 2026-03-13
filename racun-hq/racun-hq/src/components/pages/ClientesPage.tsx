import { useEffect, useState } from 'react'
import { Plus, Search, Edit, Trash2, Users } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import { formatCurrency, SERVICOS_LABEL, STATUS_CLIENTE_COLOR } from '@/lib/utils'
import type { Cliente, ServicoTipo } from '@/types'

const SERVICOS: ServicoTipo[] = ['meta_ads', 'google_ads', 'social_media', 'audiovisual', 'casamento']

const emptyForm = {
  nome: '', empresa: '', cnpj_cpf: '', telefone: '', email: '',
  whatsapp: '', instagram: '', servicos: [] as ServicoTipo[],
  valor_mensal: 0, vencimento_dia: 10, data_inicio: '', status: 'ativo' as const, observacoes: ''
}

export function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState<Cliente | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  async function load() {
    const { data } = await supabase.from('clientes').select('*').order('nome')
    setClientes(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function openNew() {
    setEditing(null)
    setForm(emptyForm)
    setModal(true)
  }

  function openEdit(c: Cliente) {
    setEditing(c)
    setForm({ ...c, servicos: c.servicos || [], valor_mensal: c.valor_mensal || 0, vencimento_dia: c.vencimento_dia || 10 })
    setModal(true)
  }

  async function save() {
    setSaving(true)
    if (editing) {
      await supabase.from('clientes').update(form).eq('id', editing.id)
    } else {
      await supabase.from('clientes').insert(form)
    }
    await load()
    setModal(false)
    setSaving(false)
  }

  async function remove(id: string) {
    if (!confirm('Remover este cliente?')) return
    await supabase.from('clientes').delete().eq('id', id)
    load()
  }

  function toggleServico(s: ServicoTipo) {
    setForm(f => ({
      ...f,
      servicos: f.servicos.includes(s) ? f.servicos.filter(x => x !== s) : [...f.servicos, s]
    }))
  }

  const filtered = clientes.filter(c =>
    c.nome.toLowerCase().includes(search.toLowerCase()) ||
    c.empresa?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">Clientes</h1>
          <p className="page-subtitle">{clientes.filter(c => c.status === 'ativo').length} ativos de {clientes.length} total</p>
        </div>
        <button className="btn-primary" onClick={openNew}>
          <Plus size={16} /> Novo Cliente
        </button>
      </div>

      {/* Filtros */}
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input className="input pl-9" placeholder="Buscar cliente..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {/* Tabela */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-gray-500">
            <Users size={32} className="mb-2 opacity-30" />
            <p className="text-sm">Nenhum cliente encontrado</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-800/50">
              <tr>
                <th className="table-header">Cliente</th>
                <th className="table-header">Serviços</th>
                <th className="table-header">Valor Mensal</th>
                <th className="table-header">Status</th>
                <th className="table-header w-20"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id} className="table-row">
                  <td className="table-cell">
                    <p className="font-medium text-white">{c.nome}</p>
                    {c.empresa && <p className="text-xs text-gray-500">{c.empresa}</p>}
                    {c.whatsapp && <p className="text-xs text-gray-500">{c.whatsapp}</p>}
                  </td>
                  <td className="table-cell">
                    <div className="flex flex-wrap gap-1">
                      {(c.servicos || []).map(s => (
                        <span key={s} className="badge bg-brand-500/15 text-brand-300 text-xs">{SERVICOS_LABEL[s]}</span>
                      ))}
                    </div>
                  </td>
                  <td className="table-cell font-medium">{c.valor_mensal ? formatCurrency(c.valor_mensal) : '—'}</td>
                  <td className="table-cell">
                    <Badge className={STATUS_CLIENTE_COLOR[c.status]}>
                      {c.status === 'ativo' ? 'Ativo' : c.status === 'pausado' ? 'Pausado' : 'Encerrado'}
                    </Badge>
                  </td>
                  <td className="table-cell">
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(c)} className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors">
                        <Edit size={14} />
                      </button>
                      <button onClick={() => remove(c.id)} className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Editar Cliente' : 'Novo Cliente'} size="lg">
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
            <label className="label">Instagram</label>
            <input className="input" placeholder="@perfil" value={form.instagram} onChange={e => setForm(f => ({ ...f, instagram: e.target.value }))} />
          </div>
          <div>
            <label className="label">CNPJ / CPF</label>
            <input className="input" value={form.cnpj_cpf} onChange={e => setForm(f => ({ ...f, cnpj_cpf: e.target.value }))} />
          </div>
          <div>
            <label className="label">Valor Mensal (R$)</label>
            <input type="number" className="input" value={form.valor_mensal} onChange={e => setForm(f => ({ ...f, valor_mensal: Number(e.target.value) }))} />
          </div>
          <div>
            <label className="label">Dia de Vencimento</label>
            <input type="number" min={1} max={31} className="input" value={form.vencimento_dia} onChange={e => setForm(f => ({ ...f, vencimento_dia: Number(e.target.value) }))} />
          </div>
          <div>
            <label className="label">Data de Início</label>
            <input type="date" className="input" value={form.data_inicio} onChange={e => setForm(f => ({ ...f, data_inicio: e.target.value }))} />
          </div>
          <div>
            <label className="label">Status</label>
            <select className="input" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as any }))}>
              <option value="ativo">Ativo</option>
              <option value="pausado">Pausado</option>
              <option value="encerrado">Encerrado</option>
            </select>
          </div>

          <div className="col-span-2">
            <label className="label">Serviços Contratados</label>
            <div className="flex flex-wrap gap-2">
              {SERVICOS.map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => toggleServico(s)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    form.servicos.includes(s)
                      ? 'bg-brand-500/20 border-brand-500/50 text-brand-300'
                      : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'
                  }`}
                >
                  {SERVICOS_LABEL[s]}
                </button>
              ))}
            </div>
          </div>

          <div className="col-span-2">
            <label className="label">Observações</label>
            <textarea rows={3} className="input resize-none" value={form.observacoes} onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))} />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-5 pt-4 border-t border-gray-800">
          <button className="btn-secondary" onClick={() => setModal(false)}>Cancelar</button>
          <button className="btn-primary" onClick={save} disabled={saving || !form.nome}>
            {saving ? 'Salvando...' : editing ? 'Salvar Alterações' : 'Cadastrar Cliente'}
          </button>
        </div>
      </Modal>
    </div>
  )
}
