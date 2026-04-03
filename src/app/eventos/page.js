'use client'

import { useState, useEffect } from 'react'
import ModalFormulario from '@/componentes/ModalFormulario'

export default function PaginaEventos() {
  const [eventos, setEventos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [modalAbierto, setModalAbierto] = useState(false)
  const [eventoSeleccionado, setEventoSeleccionado] = useState(null)

  const cargarDatos = async () => {
    setCargando(true)
    try {
      const resp = await fetch('/api/eventos')
      const data = await resp.json()
      setEventos(Array.isArray(data) ? data : [])
    } catch (e) { console.error(e) }
    finally { setCargando(false) }
  }

  useEffect(() => { cargarDatos() }, [])

  const camposEvento = [
    { nombre: 'nombre_evento', etiqueta: 'Nombre del Evento', tipo: 'text', requerido: true, placeholder: 'Ej: Boda Ana & Carlos' },
    { nombre: 'tipo_evento', etiqueta: 'Tipo de Evento', tipo: 'select', requerido: true, opciones: [
      { valor: 'boda', etiqueta: '💍 Boda' },
      { valor: 'xv_anos', etiqueta: '🎂 XV Años' },
      { valor: 'bautizo', etiqueta: '👶 Bautizo' },
      { valor: 'corporativo', etiqueta: '🏢 Corporativo' },
      { valor: 'otro', etiqueta: '🎉 Otro' },
    ]},
    { nombre: 'fecha_evento', etiqueta: 'Fecha', tipo: 'date', requerido: true },
    { nombre: 'hora_evento', etiqueta: 'Hora', tipo: 'select', requerido: false, opciones: 
      Array.from({ length: 48 }, (_, i) => {
        const hora = Math.floor(i / 2).toString().padStart(2, '0')
        const minuto = i % 2 === 0 ? '00' : '30'
        return { valor: `${hora}:${minuto}`, etiqueta: `${hora}:${minuto}` }
      })
    },
    { nombre: 'ubicacion', etiqueta: 'Ubicación', tipo: 'text', placeholder: 'Ej: Hacienda Los Laureles' },
    { nombre: 'link_ubicacion', etiqueta: 'Link de Ubicación', tipo: 'text', placeholder: 'https://maps.google.com/...' },
    { nombre: 'codigo_vestimenta', etiqueta: 'Código de Vestimenta', tipo: 'text', placeholder: 'Ej: Formal / Etiqueta' },
    { nombre: 'max_invitados', etiqueta: 'Máx. Invitados', tipo: 'number', placeholder: '100' },
    { nombre: 'descripcion', etiqueta: 'Descripción', tipo: 'textarea', placeholder: 'Detalles del evento...' },
  ]

  const crearEvento = async (datos) => {
    const resp = await fetch('/api/eventos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datos)
    })
    if (resp.ok) cargarDatos()
  }

  const eliminarEvento = async (e, id) => {
    e.stopPropagation()
    if (!confirm('¿Eliminar este evento y todos sus invitados?')) return
    const resp = await fetch(`/api/eventos?id=${id}`, { method: 'DELETE' })
    if (resp.ok) cargarDatos()
  }

  const tipoIconos = {
    boda: '💍', xv_anos: '🎂', bautizo: '👶', corporativo: '🏢', otro: '🎉'
  }

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-[var(--on-surface)] tracking-tight font-serif">Eventos</h1>
          <p className="text-[var(--on-surface-muted)] mt-1">Gestiona tus bodas y eventos especiales.</p>
        </div>
        <button onClick={() => setModalAbierto(true)} className="btn-gold px-6 py-3 rounded-xl font-semibold shadow-lg active:scale-95 transition-all flex items-center gap-2">
          <span className="material-symbols-outlined">add</span>
          Nuevo Evento
        </button>
      </div>

      {cargando ? (
        <div className="text-center py-16 text-[var(--on-surface-muted)]">Cargando eventos...</div>
      ) : eventos.length === 0 ? (
        <div className="text-center py-16 text-[var(--on-surface-muted)]">
          <span className="material-symbols-outlined text-6xl mb-4 block text-[var(--gold-soft)]">celebration</span>
          <p className="text-lg font-medium">No hay eventos aún</p>
          <p className="text-sm">Crea tu primer evento para empezar</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {eventos.map(evento => {
            const totalInvitados = evento.wp_invitados?.length || 0
            const confirmados = evento.wp_invitados?.filter(i => i.confirmado === true).length || 0
            const porcentaje = totalInvitados > 0 ? Math.round((confirmados / totalInvitados) * 100) : 0
            
            return (
              <div key={evento.id} onClick={() => setEventoSeleccionado(evento)} className="bg-[var(--cream)] rounded-2xl p-6 shadow-ambient-sm hover:shadow-ambient transition-all group cursor-pointer hover:border-[var(--primary)]/30 border border-transparent">
                <div className="flex items-start justify-between mb-4">
                  <div className="text-3xl">{tipoIconos[evento.tipo_evento] || '🎉'}</div>
                  <button onClick={(e) => eliminarEvento(e, evento.id)} className="opacity-0 group-hover:opacity-100 transition-opacity w-8 h-8 rounded-full flex items-center justify-center hover:bg-red-50 text-red-400">
                    <span className="material-symbols-outlined text-lg">delete</span>
                  </button>
                </div>
                <h3 className="text-lg font-bold text-[var(--on-surface)] font-serif mb-1">{evento.nombre_evento}</h3>
                <p className="text-sm text-[var(--on-surface-muted)] mb-4">
                  {evento.fecha_evento ? new Date(evento.fecha_evento + 'T00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Fecha pendiente'}
                  {evento.hora_evento && ` • ${evento.hora_evento}`}
                </p>
                {evento.ubicacion && (
                  <p className="text-xs text-[var(--on-surface-muted)] flex items-center gap-1 mb-4">
                    <span className="material-symbols-outlined text-sm">location_on</span>
                    {evento.ubicacion}
                  </p>
                )}
                <div className="pt-4 border-t border-[var(--gold-soft)]/20">
                  <div className="flex justify-between text-xs font-medium text-[var(--on-surface-muted)] mb-2">
                    <span>RSVP: {confirmados}/{totalInvitados}</span>
                    <span className="text-[var(--gold)] font-bold">{porcentaje}%</span>
                  </div>
                  <div className="h-2 bg-[var(--ivory)] rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${porcentaje}%`, background: 'linear-gradient(90deg, #775a19, #d4ad65)' }}></div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <ModalFormulario
        abierto={modalAbierto}
        alCerrar={() => setModalAbierto(false)}
        titulo="Nuevo Evento"
        campos={camposEvento}
        alEnviar={crearEvento}
        textoBoton="Crear Evento"
      />

      {/* Modal Detalle Evento */}
      {eventoSeleccionado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--scrim)]/40 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setEventoSeleccionado(null)}>
          <div className="bg-white rounded-3xl p-8 w-full max-w-2xl max-h-[85vh] overflow-y-auto shadow-2xl animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-4">
                <span className="text-4xl">{tipoIconos[eventoSeleccionado.tipo_evento] || '🎉'}</span>
                <div>
                  <h2 className="text-2xl font-bold font-serif text-[var(--on-surface)] leading-tight">{eventoSeleccionado.nombre_evento}</h2>
                  <p className="text-sm font-semibold uppercase tracking-widest text-[var(--primary)] opacity-80 mt-1">{eventoSeleccionado.tipo_evento?.replace('_', ' ')}</p>
                </div>
              </div>
              <button type="button" onClick={() => setEventoSeleccionado(null)} className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-[var(--surface-container)] text-[var(--on-surface-variant)] transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
              <div className="space-y-4 text-sm text-[var(--on-surface)]">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[var(--primary)] text-[20px]">calendar_today</span>
                  <span className="font-semibold">{eventoSeleccionado.fecha_evento ? new Date(eventoSeleccionado.fecha_evento + 'T00:00').toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : 'Fecha pendiente'}</span>
                </div>
                {eventoSeleccionado.hora_evento && (
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-[var(--primary)] text-[20px]">schedule</span>
                    <span>{eventoSeleccionado.hora_evento} hrs</span>
                  </div>
                )}
                {eventoSeleccionado.ubicacion && (
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-[var(--primary)] text-[20px]">location_on</span>
                    {eventoSeleccionado.link_ubicacion ? (
                      <a href={eventoSeleccionado.link_ubicacion} target="_blank" rel="noreferrer" className="text-[var(--primary)] hover:underline">{eventoSeleccionado.ubicacion}</a>
                    ) : <span>{eventoSeleccionado.ubicacion}</span>}
                  </div>
                )}
                {eventoSeleccionado.codigo_vestimenta && (
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-[var(--primary)] text-[20px]">checkroom</span>
                    <span>{eventoSeleccionado.codigo_vestimenta}</span>
                  </div>
                )}
              </div>
              
              <div className="bg-[var(--cream)] rounded-2xl p-5 border border-[var(--gold-soft)]/20">
                <h4 className="text-xs font-bold uppercase tracking-widest text-[var(--primary)] mb-4">Métricas de RSVP</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-[var(--on-surface-variant)]">Total Invitados</span>
                    <span className="font-bold text-[var(--on-surface)]">{eventoSeleccionado.wp_invitados?.length || 0}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-[var(--on-surface-variant)]">Confirmados</span>
                    <span className="font-bold text-green-700">{eventoSeleccionado.wp_invitados?.filter(i => i.confirmado === true).length || 0}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-[var(--on-surface-variant)]">Declinados</span>
                    <span className="font-bold text-red-600">{eventoSeleccionado.wp_invitados?.filter(i => i.confirmado === false).length || 0}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-[var(--on-surface-variant)]">Pendientes</span>
                    <span className="font-bold text-[var(--primary)]">{eventoSeleccionado.wp_invitados?.filter(i => i.confirmado === null).length || 0}</span>
                  </div>
                </div>
              </div>
            </div>

            {eventoSeleccionado.descripcion && (
              <div className="mt-8 bg-[var(--surface-container-lowest)] p-5 rounded-2xl">
                <h4 className="text-xs font-bold uppercase tracking-widest text-[var(--on-surface-variant)] mb-2">Desglose Libre</h4>
                <p className="text-sm text-[var(--on-surface)] whitespace-pre-wrap leading-relaxed">{eventoSeleccionado.descripcion}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
