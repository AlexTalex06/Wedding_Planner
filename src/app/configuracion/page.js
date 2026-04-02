'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function PaginaConfiguracion() {
  const [config, setConfig] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState('')

  useEffect(() => {
    const cargar = async () => {
      const { data } = await supabase.from('wp_configuracion_bot').select('*').eq('id', 1).single()
      if (data) setConfig(data)
      setCargando(false)
    }
    cargar()
  }, [])

  const guardar = async () => {
    if (!config) return
    setGuardando(true)
    const { error } = await supabase.from('wp_configuracion_bot').update({
      nombre_agente: config.nombre_agente,
      system_prompt: config.system_prompt,
      modelo: config.modelo,
      temperatura: config.temperatura,
      actualizado_en: new Date().toISOString()
    }).eq('id', 1)
    
    setGuardando(false)
    setMensaje(error ? '❌ Error al guardar' : '✅ Configuración guardada')
    setTimeout(() => setMensaje(''), 3000)
  }

  if (cargando) return <div className="p-10 text-[var(--on-surface-muted)]">Cargando configuración...</div>

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-[var(--on-surface)] tracking-tight font-serif">Configuración del Bot</h1>
        <p className="text-[var(--on-surface-muted)] mt-1">Personaliza el comportamiento de Evelyn IA.</p>
      </div>

      {config && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-[var(--on-surface)]">Nombre del Agente</label>
              <input
                type="text"
                value={config.nombre_agente || ''}
                onChange={e => setConfig({ ...config, nombre_agente: e.target.value })}
                className="bg-[var(--ivory)] rounded-xl px-4 py-3 outline-none text-sm text-[var(--on-surface)] focus:ring-2 focus:ring-[var(--gold-soft)]"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-[var(--on-surface)]">Modelo</label>
              <select
                value={config.modelo || 'gpt-4o'}
                onChange={e => setConfig({ ...config, modelo: e.target.value })}
                className="bg-[var(--ivory)] rounded-xl px-4 py-3 outline-none text-sm text-[var(--on-surface)] focus:ring-2 focus:ring-[var(--gold-soft)]"
              >
                <option value="gpt-4o">GPT-4o</option>
                <option value="gpt-4o-mini">GPT-4o Mini</option>
                <option value="gpt-4-turbo">GPT-4 Turbo</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-bold text-[var(--on-surface)]">Temperatura ({config.temperatura})</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={config.temperatura || 0.7}
              onChange={e => setConfig({ ...config, temperatura: parseFloat(e.target.value) })}
              className="w-full accent-[var(--gold)]"
            />
            <div className="flex justify-between text-[10px] text-[var(--on-surface-muted)]">
              <span>Preciso (0.0)</span>
              <span>Creativo (1.0)</span>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-bold text-[var(--on-surface)]">System Prompt</label>
            <textarea
              value={config.system_prompt || ''}
              onChange={e => setConfig({ ...config, system_prompt: e.target.value })}
              className="bg-[var(--ivory)] rounded-xl px-4 py-3 outline-none text-sm text-[var(--on-surface)] focus:ring-2 focus:ring-[var(--gold-soft)] min-h-[300px] resize-y font-mono"
            />
            <p className="text-[11px] text-[var(--on-surface-muted)]">
              Este prompt define la personalidad y comportamiento de Evelyn. El prompt principal está en el código (evelynIA.js), este es un override opcional.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <button onClick={guardar} disabled={guardando} className="btn-gold px-6 py-3 rounded-xl font-semibold shadow-lg active:scale-95 transition-all disabled:opacity-50">
              {guardando ? 'Guardando...' : 'Guardar Cambios'}
            </button>
            {mensaje && <span className="text-sm font-medium">{mensaje}</span>}
          </div>
        </div>
      )}
    </div>
  )
}
