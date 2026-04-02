'use client'

import { useState, useEffect } from 'react'
import Etiqueta from '@/componentes/Etiqueta'
import ModalFormulario from '@/componentes/ModalFormulario'

export default function PaginaProspectos() {
  const [prospectos, setProspectos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [modalAbierto, setModalAbierto] = useState(false)
  const [filtroEstado, setFiltroEstado] = useState('todos')

  const cargarDatos = async () => {
    setCargando(true)
    try {
      const resp = await fetch('/api/prospectos')
      const data = await resp.json()
      setProspectos(Array.isArray(data) ? data : [])
    } catch (e) { console.error(e) }
    finally { setCargando(false) }
  }

  useEffect(() => { cargarDatos() }, [])

  const camposProspecto = [
    { nombre: 'nombre', etiqueta: 'Nombre', tipo: 'text', requerido: true, placeholder: 'Nombre completo' },
    { nombre: 'telefono', etiqueta: 'Teléfono', tipo: 'tel', placeholder: 'Con código país' },
    { nombre: 'correo', etiqueta: 'Correo', tipo: 'email', placeholder: 'correo@ejemplo.com' },
    { nombre: 'tipo_evento', etiqueta: 'Tipo de Evento', tipo: 'text', placeholder: 'Ej: Boda' },
    { nombre: 'fecha_evento_aprox', etiqueta: 'Fecha Aprox. del Evento', tipo: 'text', placeholder: 'Ej: Junio 2026' },
    { nombre: 'notas', etiqueta: 'Notas', tipo: 'textarea', placeholder: 'Notas sobre el prospecto...' },
  ]

  const crearProspecto = async (datos) => {
    const resp = await fetch('/api/prospectos', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(datos) })
    if (resp.ok) cargarDatos()
  }

  const actualizarEstado = async (id, estado) => {
    await fetch('/api/prospectos', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, estado }) })
    cargarDatos()
  }

  const eliminarProspecto = async (id) => {
    if (!confirm('¿Eliminar este prospecto?')) return
    await fetch(`/api/prospectos?id=${id}`, { method: 'DELETE' })
    cargarDatos()
  }

  const estados = ['todos', 'nuevo', 'en_proceso', 'contactado', 'agendado', 'cerrado']
  const prospectosFiltrados = filtroEstado === 'todos' ? prospectos : prospectos.filter(p => p.estado === filtroEstado)

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-[var(--on-surface)] tracking-tight font-serif">Prospectos</h1>
          <p className="text-[var(--on-surface-muted)] mt-1">Gestiona tus clientes potenciales.</p>
        </div>
        <button onClick={() => setModalAbierto(true)} className="btn-gold px-6 py-3 rounded-xl font-semibold shadow-lg active:scale-95 transition-all flex items-center gap-2">
          <span className="material-symbols-outlined">person_add</span>
          Nuevo Prospecto
        </button>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2">
        {estados.map(est => (
          <button
            key={est}
            onClick={() => setFiltroEstado(est)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              filtroEstado === est
                ? 'btn-gold text-white'
                : 'bg-[var(--ivory)] text-[var(--on-surface-muted)] hover:bg-[var(--surface-high)]'
            }`}
          >
            {est === 'todos' ? 'Todos' : est.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </button>
        ))}
      </div>

      {/* Lista */}
      <div className="bg-[var(--cream)] rounded-2xl shadow-ambient-sm overflow-hidden">
        {cargando ? (
          <div className="p-12 text-center text-[var(--on-surface-muted)]">Cargando prospectos...</div>
        ) : prospectosFiltrados.length === 0 ? (
          <div className="p-12 text-center text-[var(--on-surface-muted)]">
            <span className="material-symbols-outlined text-5xl mb-3 block text-[var(--gold-soft)]">person_search</span>
            <p>No hay prospectos en esta categoría</p>
          </div>
        ) : prospectosFiltrados.map(pros => (
          <div key={pros.id} className="flex items-center justify-between p-5 hover:bg-[var(--ivory)] transition-colors group border-b border-[var(--gold-soft)]/10 last:border-b-0">
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm uppercase" style={{ background: 'linear-gradient(135deg, #775a19, #d4ad65)', color: 'white' }}>
                {pros.nombre?.[0] || '?'}
              </div>
              <div>
                <p className="font-bold text-[var(--on-surface)]">{pros.nombre}</p>
                <div className="flex flex-wrap gap-x-3 text-xs text-[var(--on-surface-muted)]">
                  {pros.telefono && <span>📱 {pros.telefono}</span>}
                  {pros.tipo_evento && <span>• {pros.tipo_evento}</span>}
                  {pros.fecha_evento_aprox && <span>• 📅 {pros.fecha_evento_aprox}</span>}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {pros.lead_score && (
                <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                  pros.lead_score === 'CALIENTE' ? 'bg-red-100 text-red-600' :
                  pros.lead_score === 'TIBIO' ? 'bg-amber-100 text-amber-700' :
                  'bg-slate-100 text-slate-600'
                }`}>{pros.lead_score}</span>
              )}
              <Etiqueta estado={pros.estado} />
              <select
                className="text-xs border-none bg-transparent focus:ring-0 text-[var(--on-surface-muted)] cursor-pointer w-6"
                value=""
                onChange={(e) => {
                  if (e.target.value === '_eliminar') eliminarProspecto(pros.id)
                  else if (e.target.value) actualizarEstado(pros.id, e.target.value)
                }}
              >
                <option value="">⋮</option>
                <option value="en_proceso">En Proceso</option>
                <option value="contactado">Contactado</option>
                <option value="agendado">Agendado</option>
                <option value="cerrado">Cerrado</option>
                <option value="_eliminar">🗑 Eliminar</option>
              </select>
            </div>
          </div>
        ))}
      </div>

      <ModalFormulario abierto={modalAbierto} alCerrar={() => setModalAbierto(false)} titulo="Nuevo Prospecto" campos={camposProspecto} alEnviar={crearProspecto} textoBoton="Crear Prospecto" />
    </div>
  )
}
