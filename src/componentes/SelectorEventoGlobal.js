'use client'

import { useState, useEffect } from 'react'

export default function SelectorEventoGlobal() {
  const [eventos, setEventos] = useState([])
  const [eventoActivo, setEventoActivo] = useState('')

  useEffect(() => {
    // 1. Cargar eventos de la API
    const cargar = async () => {
      try {
        const resp = await fetch('/api/eventos')
        const data = await resp.json()
        setEventos(Array.isArray(data) ? data : [])
      } catch (e) {
        console.error('Error cargando eventos:', e)
      }
    }
    cargar()

    // 2. Cargar evento guardado en localStorage
    const guardado = localStorage.getItem('wedding_planner_evento_activo')
    if (guardado) {
      setEventoActivo(guardado)
    }
  }, [])

  const cambiarEvento = (id) => {
    setEventoActivo(id)
    localStorage.setItem('wedding_planner_evento_activo', id)
    // Notificar a otras pestañas/componentes
    window.dispatchEvent(new CustomEvent('cambio_evento_global', { detail: id }))
  }

  return (
    <div className="flex items-center gap-3 bg-[var(--surface-container-low)] px-4 py-2 rounded-full border border-[var(--outline-variant)]/20 shadow-sm">
      <span className="material-symbols-outlined text-[var(--primary)] text-sm">event_note</span>
      <select 
        value={eventoActivo} 
        onChange={(e) => cambiarEvento(e.target.value)}
        className="bg-transparent border-none text-xs font-bold text-[var(--on-surface)] focus:ring-0 cursor-pointer min-w-[150px]"
      >
        <option value="">Todos los eventos</option>
        {eventos.map(ev => (
          <option key={ev.id} value={ev.id}>{ev.nombre_evento}</option>
        ))}
      </select>
    </div>
  )
}
