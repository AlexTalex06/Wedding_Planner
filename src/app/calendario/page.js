'use client'

import { useState, useEffect } from 'react'
import ModalFormulario from '@/componentes/ModalFormulario'

export default function PaginaCalendario() {
  const [citas, setCitas] = useState([])
  const [prospectos, setProspectos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [modalAbierto, setModalAbierto] = useState(false)
  const [mesActual, setMesActual] = useState(new Date())
  const [vista, setVista] = useState('mes')

  const cargarDatos = async () => {
    setCargando(true)
    try {
      const [respC, respP] = await Promise.all([fetch('/api/citas'), fetch('/api/prospectos')])
      const datosC = await respC.json()
      const datosP = await respP.json()
      setCitas(Array.isArray(datosC) ? datosC : [])
      setProspectos(Array.isArray(datosP) ? datosP : [])
    } catch (e) { console.error(e) }
    finally { setCargando(false) }
  }

  useEffect(() => { cargarDatos() }, [])

  const camposCita = [
    { nombre: 'prospecto_id', etiqueta: 'Prospecto', tipo: 'select', requerido: true, opciones: prospectos.map(p => ({ valor: p.id, etiqueta: p.nombre })) },
    { nombre: 'fecha', etiqueta: 'Fecha', tipo: 'date', requerido: true },
    { nombre: 'hora', etiqueta: 'Hora', tipo: 'time', requerido: true },
    { nombre: 'tipo', etiqueta: 'Tipo', tipo: 'select', opciones: [
      { valor: 'consulta', etiqueta: 'Consulta Inicial' },
      { valor: 'visita_tecnica', etiqueta: 'Visita Técnica' },
      { valor: 'degustacion', etiqueta: 'Degustación' },
      { valor: 'presencial', etiqueta: 'Presencial' },
      { valor: 'online', etiqueta: 'En línea' },
      { valor: 'llamada', etiqueta: 'Llamada' },
    ]},
    { nombre: 'notas', etiqueta: 'Notas', tipo: 'textarea', placeholder: 'Detalles de la cita...' },
  ]

  const crearCita = async (datos) => {
    const resp = await fetch('/api/citas', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(datos) })
    if (resp.ok) { cargarDatos(); setModalAbierto(false) }
  }

  const eliminarCita = async (id) => {
    if (!confirm('¿Eliminar esta cita?')) return
    await fetch(`/api/citas?id=${id}`, { method: 'DELETE' })
    cargarDatos()
  }

  const nombresMes = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
  const diasSemana = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

  const obtenerDiasMes = () => {
    const anio = mesActual.getFullYear()
    const mes = mesActual.getMonth()
    const primerDia = new Date(anio, mes, 1)
    const ultimoDia = new Date(anio, mes + 1, 0)
    const diasEnMes = ultimoDia.getDate()
    let diaInicio = primerDia.getDay() - 1
    if (diaInicio < 0) diaInicio = 6

    const dias = []
    const mesAnteriorUltimoDia = new Date(anio, mes, 0).getDate()
    for (let i = diaInicio - 1; i >= 0; i--) {
      dias.push({ numero: mesAnteriorUltimoDia - i, actual: false, fecha: null })
    }
    for (let i = 1; i <= diasEnMes; i++) {
      const fecha = `${anio}-${String(mes + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`
      dias.push({ numero: i, actual: true, fecha })
    }
    // Fill remaining cells
    const remaining = 7 - (dias.length % 7)
    if (remaining < 7) {
      for (let i = 1; i <= remaining; i++) {
        dias.push({ numero: i, actual: false, fecha: null })
      }
    }
    return dias
  }

  const hoy = new Date()
  const hoyStr = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`

  const citasHoy = citas.filter(c => c.fecha === hoyStr)

  const tipoColors = {
    consulta: { bg: 'bg-[var(--primary-container)]/20', border: 'border-[var(--primary)]', text: 'text-[var(--on-primary-container)]' },
    visita_tecnica: { bg: 'bg-[var(--primary-container)]/20', border: 'border-[var(--primary)]', text: 'text-[var(--on-primary-container)]' },
    degustacion: { bg: 'bg-[var(--secondary-container)]/30', border: 'border-[var(--secondary)]', text: 'text-[var(--on-surface)]' },
    presencial: { bg: 'bg-[var(--tertiary-container)]/20', border: 'border-[var(--tertiary)]', text: 'text-[var(--on-surface)]' },
    online: { bg: 'bg-blue-50', border: 'border-blue-400', text: 'text-blue-800' },
    llamada: { bg: 'bg-amber-50', border: 'border-amber-400', text: 'text-amber-800' },
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-10">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-5xl font-serif text-[var(--on-surface)] tracking-tight mb-2">Calendario de Citas</h1>
          <p className="text-[var(--on-surface-variant)]">Gestiona los momentos mágicos de tus clientes.</p>
        </div>
        <div className="flex gap-4">
          <button className="bg-[var(--surface-container-highest)] text-[var(--primary)] px-6 py-3 rounded-full font-semibold hover:bg-[var(--surface-container-high)] transition-colors text-sm">
            Agendar Llamada
          </button>
          <button onClick={() => setModalAbierto(true)} className="gold-gradient text-white px-8 py-3 rounded-full font-semibold shadow-lg flex items-center gap-2 active:scale-95 transition-transform text-sm">
            <span className="material-symbols-outlined">add</span>
            Nueva Cita
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center bg-[var(--surface-container-low)] p-2 rounded-xl">
        <div className="flex bg-white rounded-lg p-1">
          {['mes', 'semana', 'dia'].map(v => (
            <button key={v} onClick={() => setVista(v)}
              className={`px-6 py-2 rounded-md font-medium text-sm transition-colors ${vista === v ? 'bg-[var(--primary)] text-white' : 'text-[var(--on-surface-variant)] hover:bg-[var(--surface-container)]'}`}>
              {v === 'mes' ? 'Mes' : v === 'semana' ? 'Semana' : 'Día'}
            </button>
          ))}
        </div>
        <div className="h-8 w-[1px] bg-[var(--outline-variant)]/30 hidden md:block"></div>
        <span className="text-sm text-[var(--on-surface-variant)] ml-2">Filtrar por:</span>
        <select className="bg-transparent border-none text-sm font-semibold text-[var(--primary)] focus:ring-0 cursor-pointer">
          <option>Todos los Planners</option>
        </select>
        <select className="bg-transparent border-none text-sm font-semibold text-[var(--primary)] focus:ring-0 cursor-pointer">
          <option>Tipo de Evento</option>
          <option>Boda Completa</option>
          <option>Consulta Inicial</option>
          <option>Degustación</option>
        </select>
      </div>

      {/* Bento Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Calendar */}
        <div className="lg:col-span-8 bg-white rounded-xl p-8 border border-[var(--outline-variant)]/10">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-2xl font-serif text-[var(--primary)]">{nombresMes[mesActual.getMonth()]} {mesActual.getFullYear()}</h3>
            <div className="flex gap-2">
              <button onClick={() => setMesActual(new Date(mesActual.getFullYear(), mesActual.getMonth() - 1))}
                className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-[var(--surface-container)] transition-colors">
                <span className="material-symbols-outlined">chevron_left</span>
              </button>
              <button onClick={() => setMesActual(new Date(mesActual.getFullYear(), mesActual.getMonth() + 1))}
                className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-[var(--surface-container)] transition-colors">
                <span className="material-symbols-outlined">chevron_right</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-px bg-[var(--outline-variant)]/20 rounded-lg overflow-hidden border border-[var(--outline-variant)]/20">
            {/* Days of week header */}
            {diasSemana.map(dia => (
              <div key={dia} className="bg-[var(--surface-container-low)] py-3 text-center text-xs font-bold text-[var(--on-surface-variant)] uppercase tracking-widest">{dia}</div>
            ))}
            {/* Day cells */}
            {obtenerDiasMes().map((dia, idx) => {
              const citasDelDia = dia.fecha ? citas.filter(c => c.fecha === dia.fecha) : []
              const esHoy = dia.fecha === hoyStr
              return (
                <div key={idx} className={`h-28 p-2 text-sm ${!dia.actual ? 'bg-[var(--surface)] text-stone-300' : esHoy ? 'bg-[var(--primary)]/5 ring-2 ring-[var(--primary)] ring-inset' : 'bg-white'}`}>
                  <span className={`${esHoy ? 'font-bold text-[var(--primary)]' : ''}`}>{dia.numero}</span>
                  {citasDelDia.slice(0, 2).map(cita => {
                    const colors = tipoColors[cita.tipo] || tipoColors.consulta
                    return (
                      <div key={cita.id} className={`mt-1 p-1.5 ${colors.bg} border-l-4 ${colors.border} rounded-r-md text-[9px] leading-tight ${colors.text} font-semibold truncate`}>
                        {cita.hora?.slice(0, 5)} {cita.wp_prospectos?.nombre?.split(' ')[0] || cita.tipo}
                      </div>
                    )
                  })}
                  {citasDelDia.length > 2 && (
                    <div className="mt-1 text-[9px] text-[var(--primary)] font-bold">+{citasDelDia.length - 2} más</div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Side Panel */}
        <div className="lg:col-span-4 space-y-8">
          {/* Upcoming Appointments */}
          <div className="bg-[var(--surface-container-low)] rounded-xl p-8 space-y-6">
            <h4 className="text-xl font-serif text-[var(--on-surface)] flex items-center justify-between">
              Próximas Citas
              <span className="text-xs font-sans font-normal text-[var(--on-surface-variant)] bg-[var(--surface-container-highest)] px-3 py-1 rounded-full">Hoy</span>
            </h4>
            <div className="space-y-4">
              {citasHoy.length === 0 ? (
                <p className="text-sm text-[var(--on-surface-variant)] text-center py-6">No hay citas para hoy</p>
              ) : citasHoy.map(cita => (
                <div key={cita.id} className="bg-white p-5 rounded-lg border border-transparent hover:border-[var(--primary-container)] transition-colors group">
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-xs font-bold text-[var(--primary)] uppercase tracking-widest">{cita.hora}</span>
                    <button onClick={() => eliminarCita(cita.id)} className="material-symbols-outlined text-[var(--outline)] group-hover:text-[var(--primary)] transition-colors text-lg">more_vert</button>
                  </div>
                  <h5 className="font-bold text-[var(--on-surface)] mb-1">{cita.tipo?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</h5>
                  <p className="text-sm text-[var(--on-surface-variant)] mb-4">{cita.wp_prospectos?.nombre || 'Sin nombre'}</p>
                </div>
              ))}
            </div>
            <button className="w-full text-center py-2 text-sm font-bold text-[var(--primary)] hover:underline transition-all">
              Ver toda la agenda
            </button>
          </div>

          {/* Editorial Tip Card */}
          <div className="relative overflow-hidden rounded-xl h-64 group bg-[var(--surface-container-highest)]">
            <div className="absolute inset-0 gold-gradient opacity-80"></div>
            <div className="absolute inset-0 flex flex-col justify-end p-6 z-10">
              <p className="text-white/80 text-xs font-bold uppercase tracking-widest mb-1">Tip del Concierge</p>
              <h4 className="text-white text-xl font-serif">Asegura los tiempos de montaje 48h antes de cada evento.</h4>
            </div>
          </div>
        </div>
      </div>

      <ModalFormulario abierto={modalAbierto} alCerrar={() => setModalAbierto(false)} titulo="Nueva Cita" campos={camposCita} alEnviar={crearCita} textoBoton="Agendar Cita" />
    </div>
  )
}
