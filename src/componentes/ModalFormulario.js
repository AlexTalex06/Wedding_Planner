'use client'

import { useState } from 'react'

export default function ModalFormulario({ abierto, alCerrar, titulo, campos, alEnviar, textoBoton = 'Guardar' }) {
  const [datos, setDatos] = useState({})

  if (!abierto) return null

  const manejarEnvio = (e) => {
    e.preventDefault()
    alEnviar(datos)
    setDatos({})
    alCerrar()
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={alCerrar}></div>
      <div className="relative bg-[var(--cream)] rounded-2xl shadow-ambient w-full max-w-md mx-4 animate-[fadeIn_0.2s_ease-out]">
        <div className="flex items-center justify-between p-5 border-b border-[var(--gold-soft)]/30">
          <h2 className="text-lg font-bold text-[var(--gold)] font-serif">{titulo}</h2>
          <button onClick={alCerrar} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[var(--ivory)]">
            <span className="material-symbols-outlined text-[var(--on-surface-muted)]">close</span>
          </button>
        </div>
        <form onSubmit={manejarEnvio} className="p-5 space-y-4">
          {campos.map((campo) => (
            <div key={campo.nombre} className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-[var(--on-surface)]">{campo.etiqueta}</label>
              {campo.tipo === 'select' ? (
                <select
                  className="w-full rounded-xl bg-[var(--ivory)] text-sm p-3 outline-none focus:ring-2 focus:ring-[var(--gold-soft)] text-[var(--on-surface)]"
                  required={campo.requerido}
                  value={datos[campo.nombre] || ''}
                  onChange={(e) => setDatos({ ...datos, [campo.nombre]: e.target.value })}
                >
                  <option value="">{campo.placeholder || 'Seleccionar...'}</option>
                  {campo.opciones?.map((op) => (
                    <option key={op.valor} value={op.valor}>{op.etiqueta}</option>
                  ))}
                </select>
              ) : campo.tipo === 'textarea' ? (
                <textarea
                  className="w-full rounded-xl bg-[var(--ivory)] text-sm p-3 outline-none resize-none focus:ring-2 focus:ring-[var(--gold-soft)] text-[var(--on-surface)]"
                  rows={3}
                  placeholder={campo.placeholder}
                  required={campo.requerido}
                  value={datos[campo.nombre] || ''}
                  onChange={(e) => setDatos({ ...datos, [campo.nombre]: e.target.value })}
                />
              ) : (
                <input
                  type={campo.tipo}
                  className="w-full rounded-xl bg-[var(--ivory)] text-sm p-3 outline-none focus:ring-2 focus:ring-[var(--gold-soft)] text-[var(--on-surface)]"
                  placeholder={campo.placeholder}
                  required={campo.requerido}
                  value={datos[campo.nombre] || ''}
                  onChange={(e) => setDatos({ ...datos, [campo.nombre]: e.target.value })}
                />
              )}
            </div>
          ))}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--gold-soft)]/30">
            <button type="button" onClick={alCerrar} className="px-5 py-2.5 text-sm font-semibold text-[var(--on-surface-muted)] hover:bg-[var(--ivory)] rounded-xl transition-colors">
              Cancelar
            </button>
            <button type="submit" className="px-5 py-2.5 btn-gold text-sm font-semibold rounded-xl shadow-lg active:scale-95 transition-all">
              {textoBoton}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
