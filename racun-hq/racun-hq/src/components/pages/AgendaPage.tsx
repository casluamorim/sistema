import { useEffect, useState } from 'react'
import { Plus, ChevronLeft, ChevronRight, Calendar } from 'lucide-react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, parseISO, addMonths, subMonths } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { supabase } from '@/lib/supabase'
import { Modal } from '@/components/ui/Modal'
import type { Evento, Cliente } from '@/types'

const TIPO_COLOR: Record<string, string> = {
  reuniao: 'bg-blue-500/20 text-blue-300',
  gravacao: 'bg-purple-500/20 text-purple-300',
  ensaio: 'bg-pink-500/20 text-pink-300',
  casamento: 'bg-red-500/20 text-red-300',
  entrega: 'bg-green-500/20 text-green-300',
  outros: 'bg-gray-700 text-gray-300',
}

const emptyForm = {
  titulo: '', tipo: 'reuniao' as const, cliente_id: '', data_inicio: '',
  data_fim: '', local: '', observacoes: ''
}

export function AgendaPage() {
  const [eventos, setEventos] = useState<Evento[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState<Evento | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  async function load() {
    const start = format(startOfMonth(currentMonth), 'yyyy-MM-dd')
    const end = format(endOfMonth(currentMonth), 'yyyy-MM-dd')
    const [e, c] = await Promise.all([
      supabase.from('eventos').select('*, cliente:clientes(nome)').gte('data_inicio', start).lte('data_inicio', end + 'T23:59:59').order('data_inicio'),
      supabase.from('clientes').select('id, nome').eq('status', 'ativo').order('nome')
    ])
    setEventos(e.data || [])
    setClientes(c.data || [])
  }

  useEffect(() => { load() }, [currentMonth])

  async function save() {
    setSaving(true)
    if (editing) {
      await supabase.from('eventos').update(form).eq('id', editing.id)
    } else {
      await supabase.from('eventos').insert(form)
    }
    await load()
    setModal(false)
    setSaving(false)
  }

  async function remove(id: string) {
    if (!confirm('Remover este evento?')) return
    await supabase.from('eventos').delete().eq('id', id)
    load()
  }

  const days = eachDayOfInterval({ start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) })
  const firstDayOfWeek = startOfMonth(currentMonth).getDay()

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div><h1 className="page-title">Agenda</h1><p className="page-subtitle">{eventos.length} eventos este mês</p></div>
        <button className="btn-primary" onClick={() => { setEditing(null); setForm(emptyForm); setModal(true) }}><Plus size={16} /> Novo Evento</button>
      </div>

      {/* Navegação do mês */}
      <div className="flex items-center gap-3">
        <button onClick={() => setCurrentMonth(m => subMonths(m, 1))} className="btn-secondary px-2 py-2"><ChevronLeft size={16} /></button>
        <span className="text-base font-semibold text-white capitalize min-w-40 text-center">
          {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
        </span>
        <button onClick={() => setCurrentMonth(m => addMonths(m, 1))} className="btn-secondary px-2 py-2"><ChevronRight size={16} /></button>
      </div>

      {/* Calendário */}
      <div className="card overflow-hidden">
        <div className="grid grid-cols-7 bg-gray-800/50">
          {['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'].map(d => (
            <div key={d} className="px-2 py-2 text-center text-xs font-semibold text-gray-400">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {Array.from({ length: firstDayOfWeek }).map((_, i) => (
            <div key={`empty-${i}`} className="border-t border-r border-gray-800 min-h-24 p-1" />
          ))}
          {days.map(day => {
            const dayEvents = eventos.filter(e => isSameDay(parseISO(e.data_inicio), day))
            const isToday = isSameDay(day, new Date())
            return (
              <div key={day.toISOString()} className="border-t border-r border-gray-800 min-h-24 p-1.5">
                <div className={`text-xs font-medium mb-1 w-6 h-6 flex items-center justify-center rounded-full ${isToday ? 'bg-brand-500 text-white' : 'text-gray-400'}`}>
                  {format(day, 'd')}
                </div>
                <div className="space-y-0.5">
                  {dayEvents.map(e => (
                    <div
                      key={e.id}
                      onClick={() => { setEditing(e); setForm({ ...e } as any); setModal(true) }}
                      className={`text-xs px-1.5 py-0.5 rounded truncate cursor-pointer ${TIPO_COLOR[e.tipo]}`}
                    >
                      {e.titulo}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Lista do mês */}
      <div className="card divide-y divide-gray-800">
        {eventos.length === 0 ? (
          <div className="flex flex-col items-center py-10 text-gray-500">
            <Calendar size={32} className="mb-2 opacity-30" />
            <p className="text-sm">Nenhum evento este mês</p>
          </div>
        ) : eventos.map(e => (
          <div key={e.id} className="flex items-center justify-between px-4 py-3 hover:bg-gray-800/50 cursor-pointer" onClick={() => { setEditing(e); setForm({ ...e } as any); setModal(true) }}>
            <div className="flex items-center gap-3">
              <span className={`badge ${TIPO_COLOR[e.tipo]} capitalize`}>{e.tipo}</span>
              <div>
                <p className="text-sm font-medium text-white">{e.titulo}</p>
                <p className="text-xs text-gray-500">
                  {format(parseISO(e.data_inicio), "dd/MM 'às' HH:mm", { locale: ptBR })}
                  {e.local && ` · ${e.local}`}
                </p>
              </div>
            </div>
            <button onClick={ev => { ev.stopPropagation(); remove(e.id) }} className="text-xs text-gray-600 hover:text-red-400 px-2 py-1">Remover</button>
          </div>
        ))}
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Editar Evento' : 'Novo Evento'} size="md">
        <div className="space-y-4">
          <div>
            <label className="label">Título *</label>
            <input className="input" value={form.titulo} onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Tipo</label>
              <select className="input" value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value as any }))}>
                <option value="reuniao">Reunião</option>
                <option value="gravacao">Gravação/Filmagem</option>
                <option value="ensaio">Ensaio Fotográfico</option>
                <option value="casamento">Casamento</option>
                <option value="entrega">Entrega</option>
                <option value="outros">Outros</option>
              </select>
            </div>
            <div>
              <label className="label">Cliente</label>
              <select className="input" value={form.cliente_id} onChange={e => setForm(f => ({ ...f, cliente_id: e.target.value }))}>
                <option value="">Nenhum</option>
                {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Início *</label>
              <input type="datetime-local" className="input" value={form.data_inicio} onChange={e => setForm(f => ({ ...f, data_inicio: e.target.value }))} />
            </div>
            <div>
              <label className="label">Fim</label>
              <input type="datetime-local" className="input" value={form.data_fim} onChange={e => setForm(f => ({ ...f, data_fim: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="label">Local</label>
            <input className="input" value={form.local} onChange={e => setForm(f => ({ ...f, local: e.target.value }))} />
          </div>
          <div>
            <label className="label">Observações</label>
            <textarea rows={2} className="input resize-none" value={form.observacoes} onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))} />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-5 pt-4 border-t border-gray-800">
          {editing && <button className="btn-danger mr-auto text-xs" onClick={() => remove(editing.id)}>Excluir</button>}
          <button className="btn-secondary" onClick={() => setModal(false)}>Cancelar</button>
          <button className="btn-primary" onClick={save} disabled={saving || !form.titulo || !form.data_inicio}>{saving ? 'Salvando...' : 'Salvar'}</button>
        </div>
      </Modal>
    </div>
  )
}
