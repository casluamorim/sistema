import { useEffect, useState } from 'react'
import { Plus, Star, Search } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Modal } from '@/components/ui/Modal'
import { formatCurrency } from '@/lib/utils'
import type { Fornecedor, Equipamento } from '@/types'

// ─── FORNECEDORES ───────────────────────────────
const emptyFornecedor = {
  nome: '', tipo: 'freelancer' as const, especialidade: '', telefone: '',
  email: '', whatsapp: '', valor_hora: 0, valor_projeto: 0,
  forma_pagamento: '', avaliacao: 5, observacoes: ''
}

export function FornecedoresPage() {
  const [items, setItems] = useState<Fornecedor[]>([])
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState<Fornecedor | null>(null)
  const [form, setForm] = useState(emptyFornecedor)
  const [saving, setSaving] = useState(false)

  async function load() {
    const { data } = await supabase.from('fornecedores').select('*').order('nome')
    setItems(data || [])
  }

  useEffect(() => { load() }, [])

  async function save() {
    setSaving(true)
    if (editing) {
      await supabase.from('fornecedores').update(form).eq('id', editing.id)
    } else {
      await supabase.from('fornecedores').insert(form)
    }
    await load()
    setModal(false)
    setSaving(false)
  }

  const filtered = items.filter(i =>
    i.nome.toLowerCase().includes(search.toLowerCase()) ||
    i.especialidade?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div><h1 className="page-title">Fornecedores</h1><p className="page-subtitle">{items.length} cadastrados</p></div>
        <button className="btn-primary" onClick={() => { setEditing(null); setForm(emptyFornecedor); setModal(true) }}><Plus size={16} /> Novo Fornecedor</button>
      </div>
      <div className="relative max-w-xs">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        <input className="input pl-9" placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map(f => (
          <div key={f.id} className="card p-4 cursor-pointer hover:border-gray-700 transition-colors" onClick={() => { setEditing(f); setForm({ ...f } as any); setModal(true) }}>
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="text-sm font-semibold text-white">{f.nome}</p>
                <p className="text-xs text-gray-500 capitalize">{f.tipo}</p>
              </div>
              <div className="flex">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} size={12} className={i < (f.avaliacao || 0) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-700'} />
                ))}
              </div>
            </div>
            {f.especialidade && <p className="text-xs text-gray-400 mb-2">{f.especialidade}</p>}
            <div className="flex gap-3 text-xs text-gray-500">
              {f.valor_hora ? <span>{formatCurrency(f.valor_hora)}/h</span> : null}
              {f.valor_projeto ? <span>{formatCurrency(f.valor_projeto)}/proj</span> : null}
            </div>
            {f.whatsapp && <p className="text-xs text-gray-500 mt-1">{f.whatsapp}</p>}
          </div>
        ))}
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Editar Fornecedor' : 'Novo Fornecedor'} size="lg">
        <div className="grid grid-cols-2 gap-4">
          <div><label className="label">Nome *</label><input className="input" value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} /></div>
          <div><label className="label">Tipo</label>
            <select className="input" value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value as any }))}>
              <option value="freelancer">Freelancer</option>
              <option value="grafica">Gráfica</option>
              <option value="locadora">Locadora</option>
              <option value="servico">Serviço</option>
              <option value="outros">Outros</option>
            </select>
          </div>
          <div><label className="label">Especialidade</label><input className="input" value={form.especialidade} onChange={e => setForm(f => ({ ...f, especialidade: e.target.value }))} /></div>
          <div><label className="label">WhatsApp</label><input className="input" value={form.whatsapp} onChange={e => setForm(f => ({ ...f, whatsapp: e.target.value }))} /></div>
          <div><label className="label">Valor/hora (R$)</label><input type="number" className="input" value={form.valor_hora} onChange={e => setForm(f => ({ ...f, valor_hora: Number(e.target.value) }))} /></div>
          <div><label className="label">Valor/projeto (R$)</label><input type="number" className="input" value={form.valor_projeto} onChange={e => setForm(f => ({ ...f, valor_projeto: Number(e.target.value) }))} /></div>
          <div><label className="label">Forma de Pagamento</label><input className="input" value={form.forma_pagamento} onChange={e => setForm(f => ({ ...f, forma_pagamento: e.target.value }))} /></div>
          <div><label className="label">Avaliação (1-5)</label>
            <select className="input" value={form.avaliacao} onChange={e => setForm(f => ({ ...f, avaliacao: Number(e.target.value) }))}>
              {[1,2,3,4,5].map(n => <option key={n} value={n}>{n} estrela{n > 1 ? 's' : ''}</option>)}
            </select>
          </div>
          <div className="col-span-2"><label className="label">Observações</label><textarea rows={2} className="input resize-none" value={form.observacoes} onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))} /></div>
        </div>
        <div className="flex justify-end gap-3 mt-5 pt-4 border-t border-gray-800">
          <button className="btn-secondary" onClick={() => setModal(false)}>Cancelar</button>
          <button className="btn-primary" onClick={save} disabled={saving || !form.nome}>{saving ? 'Salvando...' : 'Salvar'}</button>
        </div>
      </Modal>
    </div>
  )
}

// ─── EQUIPAMENTOS ──────────────────────────────
const emptyEquipamento = {
  nome: '', categoria: 'camera' as const, marca: '', modelo: '', numero_serie: '',
  status: 'disponivel' as const, data_compra: '', valor_compra: 0,
  ultima_manutencao: '', proxima_manutencao: '', observacoes: ''
}

const STATUS_EQUIP: Record<string, string> = {
  disponivel: 'bg-green-500/20 text-green-400',
  em_uso: 'bg-blue-500/20 text-blue-400',
  manutencao: 'bg-yellow-500/20 text-yellow-400',
  inativo: 'bg-gray-700 text-gray-400',
}

export function EquipamentosPage() {
  const [items, setItems] = useState<Equipamento[]>([])
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState<Equipamento | null>(null)
  const [form, setForm] = useState(emptyEquipamento)
  const [saving, setSaving] = useState(false)

  async function load() {
    const { data } = await supabase.from('equipamentos').select('*').order('nome')
    setItems(data || [])
  }

  useEffect(() => { load() }, [])

  async function save() {
    setSaving(true)
    if (editing) {
      await supabase.from('equipamentos').update(form).eq('id', editing.id)
    } else {
      await supabase.from('equipamentos').insert(form)
    }
    await load()
    setModal(false)
    setSaving(false)
  }

  const hoje = new Date().toISOString().split('T')[0]
  const alertas = items.filter(e => e.proxima_manutencao && e.proxima_manutencao <= hoje)

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div><h1 className="page-title">Equipamentos</h1><p className="page-subtitle">{items.filter(e => e.status === 'disponivel').length} disponíveis</p></div>
        <button className="btn-primary" onClick={() => { setEditing(null); setForm(emptyEquipamento); setModal(true) }}><Plus size={16} /> Novo Equipamento</button>
      </div>

      {alertas.length > 0 && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl px-4 py-3">
          <p className="text-sm text-yellow-400 font-medium">⚠️ {alertas.length} equipamento{alertas.length > 1 ? 's' : ''} com manutenção vencida: {alertas.map(e => e.nome).join(', ')}</p>
        </div>
      )}

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-800/50">
            <tr>
              <th className="table-header">Equipamento</th>
              <th className="table-header">Categoria</th>
              <th className="table-header">Status</th>
              <th className="table-header">Próx. Manutenção</th>
              <th className="table-header">Valor</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr><td colSpan={5} className="table-cell text-center text-gray-500 py-8">Nenhum equipamento cadastrado</td></tr>
            ) : items.map(e => (
              <tr key={e.id} className="table-row cursor-pointer" onClick={() => { setEditing(e); setForm({ ...e } as any); setModal(true) }}>
                <td className="table-cell">
                  <p className="font-medium text-white">{e.nome}</p>
                  <p className="text-xs text-gray-500">{[e.marca, e.modelo].filter(Boolean).join(' ')}</p>
                </td>
                <td className="table-cell text-gray-400 capitalize">{e.categoria}</td>
                <td className="table-cell"><span className={`badge text-xs ${STATUS_EQUIP[e.status]}`}>{e.status.replace('_',' ')}</span></td>
                <td className={`table-cell text-sm ${e.proxima_manutencao && e.proxima_manutencao <= hoje ? 'text-yellow-400' : 'text-gray-400'}`}>
                  {e.proxima_manutencao || '—'}
                </td>
                <td className="table-cell text-gray-300">{e.valor_compra ? formatCurrency(e.valor_compra) : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Editar Equipamento' : 'Novo Equipamento'} size="lg">
        <div className="grid grid-cols-2 gap-4">
          <div><label className="label">Nome *</label><input className="input" value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} /></div>
          <div><label className="label">Categoria</label>
            <select className="input" value={form.categoria} onChange={e => setForm(f => ({ ...f, categoria: e.target.value as any }))}>
              <option value="camera">Câmera</option>
              <option value="lente">Lente</option>
              <option value="audio">Áudio</option>
              <option value="iluminacao">Iluminação</option>
              <option value="acessorio">Acessório</option>
              <option value="outros">Outros</option>
            </select>
          </div>
          <div><label className="label">Marca</label><input className="input" value={form.marca} onChange={e => setForm(f => ({ ...f, marca: e.target.value }))} /></div>
          <div><label className="label">Modelo</label><input className="input" value={form.modelo} onChange={e => setForm(f => ({ ...f, modelo: e.target.value }))} /></div>
          <div><label className="label">Nº de Série</label><input className="input" value={form.numero_serie} onChange={e => setForm(f => ({ ...f, numero_serie: e.target.value }))} /></div>
          <div><label className="label">Status</label>
            <select className="input" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as any }))}>
              <option value="disponivel">Disponível</option>
              <option value="em_uso">Em uso</option>
              <option value="manutencao">Manutenção</option>
              <option value="inativo">Inativo</option>
            </select>
          </div>
          <div><label className="label">Valor de Compra (R$)</label><input type="number" className="input" value={form.valor_compra} onChange={e => setForm(f => ({ ...f, valor_compra: Number(e.target.value) }))} /></div>
          <div><label className="label">Data de Compra</label><input type="date" className="input" value={form.data_compra} onChange={e => setForm(f => ({ ...f, data_compra: e.target.value }))} /></div>
          <div><label className="label">Última Manutenção</label><input type="date" className="input" value={form.ultima_manutencao} onChange={e => setForm(f => ({ ...f, ultima_manutencao: e.target.value }))} /></div>
          <div><label className="label">Próxima Manutenção</label><input type="date" className="input" value={form.proxima_manutencao} onChange={e => setForm(f => ({ ...f, proxima_manutencao: e.target.value }))} /></div>
          <div className="col-span-2"><label className="label">Observações</label><textarea rows={2} className="input resize-none" value={form.observacoes} onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))} /></div>
        </div>
        <div className="flex justify-end gap-3 mt-5 pt-4 border-t border-gray-800">
          <button className="btn-secondary" onClick={() => setModal(false)}>Cancelar</button>
          <button className="btn-primary" onClick={save} disabled={saving || !form.nome}>{saving ? 'Salvando...' : 'Salvar'}</button>
        </div>
      </Modal>
    </div>
  )
}
