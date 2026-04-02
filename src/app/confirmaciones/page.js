'use client'

import { useState, useEffect } from 'react'
import ModalFormulario from '@/componentes/ModalFormulario'

export default function PaginaConfirmaciones() {
  const [invitados, setInvitados] = useState([])
  const [eventos, setEventos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [modalAbierto, setModalAbierto] = useState(false)
  const [eventoSeleccionado, setEventoSeleccionado] = useState('todos')
  const [filtroEstado, setFiltroEstado] = useState('todos')
  const [pagina, setPagina] = useState(1)
  const porPagina = 10

  const cargarDatos = async () => {
    setCargando(true)
    try {
      const [respI, respE] = await Promise.all([fetch('/api/invitados'), fetch('/api/eventos')])
      const datosI = await respI.json()
      const datosE = await respE.json()
      setInvitados(Array.isArray(datosI) ? datosI : [])
      setEventos(Array.isArray(datosE) ? datosE : [])
    } catch (e) { console.error(e) }
    finally { setCargando(false) }
  }

  useEffect(() => { cargarDatos() }, [])

  const camposInvitado = [
    { nombre: 'evento_id', etiqueta: 'Evento', tipo: 'select', requerido: true, opciones: eventos.map(e => ({ valor: e.id, etiqueta: e.nombre_evento })) },
    { nombre: 'nombre', etiqueta: 'Nombre Completo', tipo: 'text', requerido: true, placeholder: 'Ej: María García' },
    { nombre: 'telefono', etiqueta: 'Teléfono', tipo: 'tel', placeholder: '5213412345678' },
    { nombre: 'correo', etiqueta: 'Correo', tipo: 'email', placeholder: 'correo@ejemplo.com' },
    { nombre: 'grupo', etiqueta: 'Grupo', tipo: 'text', placeholder: 'Ej: Familia de la Novia' },
    { nombre: 'max_acompanantes', etiqueta: 'Máx. Acompañantes', tipo: 'number', placeholder: '0' },
    { nombre: 'notas_dieta', etiqueta: 'Notas de Dieta', tipo: 'text', placeholder: 'Ej: Vegetariano, Sin Gluten' },
    { nombre: 'notas', etiqueta: 'Notas', tipo: 'textarea', placeholder: 'Notas adicionales...' },
  ]

  const crearInvitado = async (datos) => {
    const resp = await fetch('/api/invitados', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(datos) })
    if (resp.ok) { cargarDatos(); setModalAbierto(false) }
  }

  const eliminarInvitado = async (id) => {
    if (!confirm('¿Eliminar este invitado?')) return
    await fetch(`/api/invitados?id=${id}`, { method: 'DELETE' })
    cargarDatos()
  }

  let filtrados = eventoSeleccionado === 'todos' ? invitados : invitados.filter(i => i.evento_id === eventoSeleccionado)
  if (filtroEstado === 'confirmados') filtrados = filtrados.filter(i => i.confirmado === true)
  else if (filtroEstado === 'declinados') filtrados = filtrados.filter(i => i.confirmado === false)
  else if (filtroEstado === 'pendientes') filtrados = filtrados.filter(i => i.confirmado === null)

  const totalFiltrados = filtrados.length
  const totalPaginas = Math.ceil(totalFiltrados / porPagina)
  const paginados = filtrados.slice((pagina - 1) * porPagina, pagina * porPagina)

  const total = invitados.length
  const totalConfirmados = invitados.filter(i => i.confirmado === true).length
  const totalDeclinados = invitados.filter(i => i.confirmado === false).length
  const totalPendientes = invitados.filter(i => i.confirmado === null).length
  const tasaRespuesta = total > 0 ? Math.round((totalConfirmados / total) * 100) : 0
  const conAcomp = invitados.filter(i => i.num_acompanantes > 0).length
  const sinAcomp = total - conAcomp
  const pctAcomp = total > 0 ? Math.round((conAcomp / total) * 100) : 0

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="font-serif text-4xl font-bold tracking-tight text-[var(--on-surface)]">Respuestas de Invitados</h1>
          <p className="text-[var(--on-surface-variant)]">Vista detallada de asistencia y preferencias para el evento seleccionado.</p>
        </div>
        <div className="flex gap-3">
          <button className="bg-[var(--surface-container-highest)] text-[var(--primary)] px-6 py-3 rounded-full font-bold text-sm hover:opacity-80 transition-opacity">
            Exportar CSV
          </button>
          <button onClick={() => setModalAbierto(true)} className="gold-gradient text-white px-8 py-3 rounded-full font-bold text-sm shadow-md hover:opacity-90 transition-opacity">
            Añadir Invitado Manualmente
          </button>
        </div>
      </div>

      {/* Bento Grid Metrics */}
      <div className="grid grid-cols-12 gap-6">
        {/* Attendance Progress */}
        <div className="col-span-12 lg:col-span-4 bg-white p-8 rounded-xl flex flex-col justify-between min-h-[240px] shadow-sm border border-[var(--outline-variant)]/10">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-[var(--primary)] opacity-60">Asistencia Confirmada</span>
            <div className="flex items-baseline gap-2 mt-4">
              <span className="font-serif text-6xl font-bold text-[var(--on-surface)]">{totalConfirmados}</span>
              <span className="text-[var(--on-surface-variant)] text-lg">/ {total}</span>
            </div>
          </div>
          <div className="w-full h-2 bg-[var(--surface-container-highest)] rounded-full mt-6 overflow-hidden">
            <div className="h-full gold-gradient rounded-full transition-all duration-700" style={{ width: `${tasaRespuesta}%` }}></div>
          </div>
          <p className="text-xs text-[var(--on-surface-variant)] mt-4">{tasaRespuesta}% de tasa de respuesta. {totalPendientes} invitaciones pendientes.</p>
        </div>

        {/* Dietary Preferences */}
        <div className="col-span-12 lg:col-span-5 bg-[var(--surface-container-low)] p-8 rounded-xl flex flex-col min-h-[240px]">
          <div className="flex justify-between items-start mb-6">
            <span className="text-xs font-bold uppercase tracking-widest text-[var(--primary)] opacity-60">Preferencias Dietéticas</span>
            <span className="material-symbols-outlined text-[var(--primary)]">restaurant</span>
          </div>
          <div className="grid grid-cols-2 gap-6 flex-1">
            {[
              { num: invitados.filter(i => i.notas_dieta?.toLowerCase().includes('vegan')).length || 0, label: 'Vegano', sub: 'Sin lácteos' },
              { num: invitados.filter(i => i.notas_dieta?.toLowerCase().includes('vegetarian')).length || 0, label: 'Vegetariano', sub: 'Sin carne' },
              { num: invitados.filter(i => i.notas_dieta?.toLowerCase().includes('alergi')).length || 0, label: 'Alergia', sub: 'Precaución' },
              { num: invitados.filter(i => i.notas_dieta?.toLowerCase().includes('gluten')).length || 0, label: 'Sin Gluten', sub: 'Prep. celíaca' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-[var(--surface-container-highest)] flex items-center justify-center">
                  <span className="font-serif text-xl font-bold text-[var(--primary)]">{String(item.num).padStart(2, '0')}</span>
                </div>
                <div>
                  <p className="text-sm font-bold text-[var(--on-surface)]">{item.label}</p>
                  <p className="text-xs text-[var(--on-surface-variant)]">{item.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="col-span-12 lg:col-span-3 bg-[var(--primary)] text-white p-8 rounded-xl flex flex-col justify-between shadow-lg">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest opacity-60">Acciones del Concierge</span>
            <h3 className="font-serif text-xl mt-4 leading-tight">
              {totalPendientes > 0 ? `¿Enviar recordatorios a ${totalPendientes} invitados pendientes?` : 'Todos los invitados han respondido.'}
            </h3>
          </div>
          <button className="bg-white text-[var(--primary)] py-3 rounded-full font-bold text-sm w-full mt-6 flex items-center justify-center gap-2 hover:bg-[var(--surface)] transition-colors">
            <span className="material-symbols-outlined text-sm">send</span>
            Automatizar Alcance
          </button>
        </div>
      </div>

      {/* Filters Strip */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-[var(--surface-container-low)] p-4 rounded-full px-8">
        <div className="flex items-center gap-6">
          {[
            { key: 'todos', label: `Todos los Invitados (${total})` },
            { key: 'confirmados', label: `Confirmados (${totalConfirmados})` },
            { key: 'declinados', label: `Declinados (${totalDeclinados})` },
            { key: 'pendientes', label: `Pendientes (${totalPendientes})` },
          ].map(f => (
            <button key={f.key} onClick={() => { setFiltroEstado(f.key); setPagina(1) }}
              className={`text-sm font-medium transition-colors ${filtroEstado === f.key ? 'font-bold text-[var(--primary)] border-b-2 border-[var(--primary)] pb-1' : 'text-[var(--on-surface-variant)] hover:text-[var(--primary)]'}`}>
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs font-bold text-[var(--on-surface-variant)] uppercase tracking-widest">Filtrar por:</span>
          <select value={eventoSeleccionado} onChange={e => { setEventoSeleccionado(e.target.value); setPagina(1) }}
            className="bg-transparent border-none text-sm font-bold text-[var(--primary)] focus:ring-0 cursor-pointer">
            <option value="todos">Todos los Eventos</option>
            {eventos.map(e => <option key={e.id} value={e.id}>{e.nombre_evento}</option>)}
          </select>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-[var(--outline-variant)]/10">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[var(--surface-container-low)]">
              <th className="px-8 py-5 text-xs font-bold uppercase tracking-widest text-[var(--on-surface-variant)]">Nombre</th>
              <th className="px-8 py-5 text-xs font-bold uppercase tracking-widest text-[var(--on-surface-variant)]">Estado</th>
              <th className="px-8 py-5 text-xs font-bold uppercase tracking-widest text-[var(--on-surface-variant)] hidden lg:table-cell">Grupo</th>
              <th className="px-8 py-5 text-xs font-bold uppercase tracking-widest text-[var(--on-surface-variant)] hidden md:table-cell">Notas de Dieta</th>
              <th className="px-8 py-5 text-xs font-bold uppercase tracking-widest text-[var(--on-surface-variant)] text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--outline-variant)]/10">
            {cargando ? (
              <tr><td colSpan={5} className="px-8 py-12 text-center text-[var(--on-surface-variant)]">Cargando...</td></tr>
            ) : paginados.length === 0 ? (
              <tr><td colSpan={5} className="px-8 py-12 text-center text-[var(--on-surface-variant)]">No hay invitados en esta categoría</td></tr>
            ) : paginados.map(inv => (
              <tr key={inv.id} className="hover:bg-[var(--surface-container-low)]/30 transition-colors">
                <td className="px-8 py-6">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-[var(--surface-container-highest)] flex items-center justify-center font-bold text-[var(--primary)] text-xs">
                      {inv.nombre?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-[var(--on-surface)] text-sm">{inv.nombre}</p>
                      <p className="text-xs text-[var(--on-surface-variant)]">{inv.correo || inv.telefono || ''}</p>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-6">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full border ${
                    inv.confirmado === true
                      ? 'bg-[var(--primary)]/10 text-[var(--primary)] border-[var(--primary)]/20'
                      : inv.confirmado === false
                        ? 'bg-red-50 text-red-600 border-red-200'
                        : 'bg-[var(--surface-container-highest)] text-[var(--on-surface-variant)] border-[var(--outline-variant)]/30'
                  }`}>
                    {inv.confirmado === true ? 'Confirmado' : inv.confirmado === false ? 'Declinado' : 'Pendiente'}
                  </span>
                </td>
                <td className="px-8 py-6 text-sm text-[var(--on-surface)] font-medium hidden lg:table-cell">{inv.grupo || '—'}</td>
                <td className="px-8 py-6 hidden md:table-cell">
                  {inv.notas_dieta ? (
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[var(--primary)] text-lg">eco</span>
                      <span className="text-xs text-[var(--on-surface-variant)]">{inv.notas_dieta}</span>
                    </div>
                  ) : (
                    <div className="flex gap-2 items-center">
                      <span className="material-symbols-outlined text-[var(--primary)] text-lg">check_circle</span>
                      <span className="text-xs text-[var(--on-surface-variant)]">Sin restricciones</span>
                    </div>
                  )}
                </td>
                <td className="px-8 py-6 text-right">
                  <button onClick={() => eliminarInvitado(inv.id)} className="text-[var(--on-surface-variant)] hover:text-[var(--primary)] transition-colors">
                    <span className="material-symbols-outlined">more_horiz</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        {totalPaginas > 1 && (
          <div className="px-8 py-6 bg-[var(--surface-container-low)]/20 flex justify-between items-center border-t border-[var(--outline-variant)]/10">
            <p className="text-xs text-[var(--on-surface-variant)] font-medium">
              Mostrando {(pagina - 1) * porPagina + 1} a {Math.min(pagina * porPagina, totalFiltrados)} de {totalFiltrados} invitados
            </p>
            <div className="flex gap-2">
              <button onClick={() => setPagina(p => Math.max(1, p - 1))} disabled={pagina === 1}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-[var(--surface-container-highest)] text-[var(--primary)] hover:bg-[var(--primary)] hover:text-white transition-colors disabled:opacity-30">
                <span className="material-symbols-outlined text-sm">chevron_left</span>
              </button>
              {Array.from({ length: Math.min(totalPaginas, 5) }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => setPagina(p)}
                  className={`w-8 h-8 flex items-center justify-center rounded-full font-bold text-xs transition-colors ${
                    pagina === p ? 'bg-[var(--primary)] text-white' : 'bg-[var(--surface-container-highest)] text-[var(--on-surface-variant)] hover:bg-[var(--primary)]/10'
                  }`}>{p}</button>
              ))}
              <button onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))} disabled={pagina === totalPaginas}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-[var(--surface-container-highest)] text-[var(--primary)] hover:bg-[var(--primary)] hover:text-white transition-colors disabled:opacity-30">
                <span className="material-symbols-outlined text-sm">chevron_right</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer: Companion Analysis + Venue Integration */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-[var(--surface-container-low)] rounded-xl p-8 flex flex-col gap-6">
          <h4 className="font-serif text-xl font-bold">Análisis de Acompañantes</h4>
          <div className="flex items-center gap-12">
            <div className="relative w-32 h-32 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="var(--surface-container-highest)" strokeWidth="4" />
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="var(--primary)" strokeWidth="4" strokeDasharray={`${pctAcomp}, 100`} />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-serif text-2xl font-bold">{pctAcomp}%</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[var(--primary)]"></div>
                <span className="text-sm font-medium">Viene con Acompañante ({conAcomp})</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[var(--surface-container-highest)]"></div>
                <span className="text-sm font-medium">Asiste solo/a ({sinAcomp})</span>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-[var(--surface-container-low)] rounded-xl p-8 overflow-hidden relative group flex flex-col justify-between">
          <div className="relative z-10">
            <h4 className="font-serif text-xl font-bold">Integración de Plano del Lugar</h4>
            <p className="text-sm text-[var(--on-surface-variant)] mt-2 mb-4">Las listas de invitados están sincronizadas con la gestión de mesas y asientos del evento.</p>
            <button className="flex items-center gap-2 text-[var(--primary)] font-bold text-sm hover:translate-x-1 transition-transform">
              Abrir Plano de Asientos
              <span className="material-symbols-outlined">arrow_forward</span>
            </button>
          </div>
        </div>
      </div>

      <ModalFormulario abierto={modalAbierto} alCerrar={() => setModalAbierto(false)} titulo="Añadir Invitado" campos={camposInvitado} alEnviar={crearInvitado} textoBoton="Agregar Invitado" />
    </div>
  )
}
