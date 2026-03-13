import { useEffect, useState } from 'react'
import { Plus, Heart, CheckCircle, Circle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Modal } from '@/components/ui/Modal'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { Casamento } from '@/types'

const STATUS_COLOR: Record<string, string> = {
  confirmado: 'bg-blue-500/20 text-blue-400',
  em_producao: 'bg-yellow-500/20 text-yellow-400',
  entregue: 'bg-green-500/20 text-green-400',
  arquivado: 'bg-gray-700 text-gray-400',
}

const CHECKLIST_PRE = ['Contrato assinado','Reunião de alinhamento','Local visitado','Equipamentos conferidos','Backup verificado']
const CHECKLIST_DIA = ['Check-in da equipe','Teste de equipamentos','Briefing repassado']
const CHECKLIST_POS = ['Material organizado','Edição iniciada','Edição entregue','Feedback coletado','Arquivamento feito']

const emptyForm = {
  contratante: '', noivos: '', data_evento: '', hora_evento: '',
  local_cerimonia: '', local_recepcao: '', pacote: '',
  valor_total: 0, sinal_pago: 0, status: 'confirmado' as const, observacoes: ''
}

export function CasamentosPage() {
  const [items, setItems] = useState<Casamento[]>([])
  const [selected, setSelected] = useState<Casamento | null>(null)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [checks, setChecks] = useState<Record<string, string[]>>({})

  async function load() {
    const { data } = await supabase.from('casamentos').select('*').order('data_evento')
    setItems(data || [])
    if (data && data[0] && !selected) setSelected(data[0])
  }

  useEffect(() => { load() }, [])

  async function save() {
    setSaving(true)
    if (selected && modal) {
      await supabase.from('casamentos').update(form).eq('id', selected.id)
    } else {
      await supabase.from('casamentos').insert(form)
    }
    await load()
    setModal(false)
    setSaving(false)
  }

  function toggleCheck(casamentoId: string, item: string) {
    setChecks(prev => {
      const current = prev[casamentoId] || []
      const updated = current.includes(item) ? current.filter(x => x !== item) : [...current, item]
      return { ...prev, [casamentoId]: updated }
    })
  }

  const CheckItem = ({ casamentoId, item }: { casamentoId: string; item: string }) => {
    const checked = (checks[casamentoId] || []).includes(item)
    return (
      <div className="flex items-center gap-2 cursor-pointer py-1" onClick={() => toggleCheck(casamentoId, item)}>
        {checked ? <CheckCircle size={15} className="text-green-400 flex-shrink-0" /> : <Circle size={15} className="text-gray-600 flex-shrink-0" />}
        <span className={`text-sm ${checked ? 'text-gray-500 line-through' : 'text-gray-300'}`}>{item}</span>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div><h1 className="page-title">Casamentos</h1><p className="page-subtitle">{items.length} produções cadastradas</p></div>
        <button className="btn-primary" onClick={() => { setForm(emptyForm); setModal(true) }}><Plus size={16} /> Novo Casamento</button>
      </div>

      <div className="flex gap-4">
        {/* Lista lateral */}
        <div className="w-72 flex-shrink-0 space-y-2">
          {items.length === 0 && <div className="card p-6 text-center text-gray-500 text-sm"><Heart size={24} className="mx-auto mb-2 opacity-30" />Nenhum casamento cadastrado</div>}
          {items.map(c => (
            <div key={c.id} onClick={() => setSelected(c)} className={`card p-3 cursor-pointer transition-colors ${selected?.id === c.id ? 'border-brand-500/50' : 'hover:border-gray-700'}`}>
              <p className="text-sm font-medium text-white">{c.contratante}</p>
              {c.noivos && <p className="text-xs text-gray-500 mb-1">{c.noivos}</p>}
              <p className="text-xs text-gray-400">{c.data_evento ? formatDate(c.data_evento) : '—'}</p>
              <span className={`badge text-xs mt-1 ${STATUS_COLOR[c.status]}`}>{c.status.replace('_',' ')}</span>
            </div>
          ))}
        </div>

        {/* Detalhe */}
        {selected && (
          <div className="flex-1 space-y-4">
            <div className="card p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-semibold text-white">{selected.contratante}</h2>
                <button className="btn-secondary text-xs px-3 py-1.5" onClick={() => { setForm({ ...selected } as any); setModal(true) }}>Editar</button>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-gray-500">Noivos:</span> <span className="text-gray-200">{selected.noivos || '—'}</span></div>
                <div><span className="text-gray-500">Data:</span> <span className="text-gray-200">{selected.data_evento ? formatDate(selected.data_evento) : '—'} {selected.hora_evento}</span></div>
                <div><span className="text-gray-500">Cerimônia:</span> <span className="text-gray-200">{selected.local_cerimonia || '—'}</span></div>
                <div><span className="text-gray-500">Recepção:</span> <span className="text-gray-200">{selected.local_recepcao || '—'}</span></div>
                <div><span className="text-gray-500">Valor total:</span> <span className="text-green-400 font-medium">{selected.valor_total ? formatCurrency(selected.valor_total) : '—'}</span></div>
                <div><span className="text-gray-500">Sinal pago:</span> <span className="text-gray-200">{selected.sinal_pago ? formatCurrency(selected.sinal_pago) : '—'}</span></div>
                {selected.valor_total && selected.sinal_pago && (
                  <div><span className="text-gray-500">Saldo:</span> <span className="text-yellow-400 font-medium">{formatCurrency(selected.valor_total - selected.sinal_pago)}</span></div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="card p-4">
                <h3 className="text-xs font-semibold text-gray-400 uppercase mb-3">Pré-evento</h3>
                {CHECKLIST_PRE.map(item => <CheckItem key={item} casamentoId={selected.id} item={item} />)}
              </div>
              <div className="card p-4">
                <h3 className="text-xs font-semibold text-gray-400 uppercase mb-3">Dia do evento</h3>
                {CHECKLIST_DIA.map(item => <CheckItem key={item} casamentoId={selected.id} item={item} />)}
              </div>
              <div className="card p-4">
                <h3 className="text-xs font-semibold text-gray-400 uppercase mb-3">Pós-evento</h3>
                {CHECKLIST_POS.map(item => <CheckItem key={item} casamentoId={selected.id} item={item} />)}
              </div>
            </div>
          </div>
        )}
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title="Casamento" size="lg">
        <div className="grid grid-cols-2 gap-4">
          <div><label className="label">Contratante *</label><input className="input" value={form.contratante} onChange={e => setForm(f => ({ ...f, contratante: e.target.value }))} /></div>
          <div><label className="label">Noivos</label><input className="input" placeholder="João & Maria" value={form.noivos} onChange={e => setForm(f => ({ ...f, noivos: e.target.value }))} /></div>
          <div><label className="label">Data do Evento</label><input type="date" className="input" value={form.data_evento} onChange={e => setForm(f => ({ ...f, data_evento: e.target.value }))} /></div>
          <div><label className="label">Horário</label><input type="time" className="input" value={form.hora_evento} onChange={e => setForm(f => ({ ...f, hora_evento: e.target.value }))} /></div>
          <div><label className="label">Local Cerimônia</label><input className="input" value={form.local_cerimonia} onChange={e => setForm(f => ({ ...f, local_cerimonia: e.target.value }))} /></div>
          <div><label className="label">Local Recepção</label><input className="input" value={form.local_recepcao} onChange={e => setForm(f => ({ ...f, local_recepcao: e.target.value }))} /></div>
          <div><label className="label">Valor Total (R$)</label><input type="number" className="input" value={form.valor_total} onChange={e => setForm(f => ({ ...f, valor_total: Number(e.target.value) }))} /></div>
          <div><label className="label">Sinal Pago (R$)</label><input type="number" className="input" value={form.sinal_pago} onChange={e => setForm(f => ({ ...f, sinal_pago: Number(e.target.value) }))} /></div>
          <div><label className="label">Pacote</label><input className="input" value={form.pacote} onChange={e => setForm(f => ({ ...f, pacote: e.target.value }))} /></div>
          <div><label className="label">Status</label>
            <select className="input" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as any }))}>
              <option value="confirmado">Confirmado</option>
              <option value="em_producao">Em produção</option>
              <option value="entregue">Entregue</option>
              <option value="arquivado">Arquivado</option>
            </select>
          </div>
          <div className="col-span-2"><label className="label">Observações</label><textarea rows={2} className="input resize-none" value={form.observacoes} onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))} /></div>
        </div>
        <div className="flex justify-end gap-3 mt-5 pt-4 border-t border-gray-800">
          <button className="btn-secondary" onClick={() => setModal(false)}>Cancelar</button>
          <button className="btn-primary" onClick={save} disabled={saving || !form.contratante}>{saving ? 'Salvando...' : 'Salvar'}</button>
        </div>
      </Modal>
    </div>
  )
}
