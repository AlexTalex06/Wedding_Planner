'use client'

import { useState, useEffect } from 'react'

export default function ModalFormulario({ abierto, alCerrar, titulo, campos, alEnviar, textoBoton = 'Guardar', valoresIniciales = {} }) {
  const [datos, setDatos] = useState(valoresIniciales)

  useEffect(() => {
    if (abierto) setDatos(valoresIniciales)
  }, [abierto])

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
      <div className="relative bg-[var(--surface-container-high)] rounded-2xl shadow-xl w-full max-w-md mx-4 animate-[fadeIn_0.2s_ease-out]">
        <div className="flex items-center justify-between p-5 border-b border-[var(--outline-variant)]/30">
          <h2 className="text-lg font-bold text-[var(--primary)] font-serif">{titulo}</h2>
          <button type="button" onClick={alCerrar} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[var(--surface-variant)] transition-colors">
            <span className="material-symbols-outlined text-[var(--on-surface-variant)]">close</span>
          </button>
        </div>
        <form onSubmit={manejarEnvio} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {campos.map((campo) => (
            <div key={campo.nombre} className="flex flex-col gap-1.5">
              <label className="text-[13px] font-bold text-[var(--on-surface)] uppercase tracking-wider">{campo.etiqueta}</label>
              {campo.tipo === 'select' ? (
                <select
                  className="w-full rounded-xl bg-[var(--surface-container-lowest)] text-sm p-3 outline-none border border-[var(--outline-variant)] focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] text-[var(--on-surface)] transition-colors"
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
                  className="w-full rounded-xl bg-[var(--surface-container-lowest)] text-sm p-3 outline-none border border-[var(--outline-variant)] focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] resize-none text-[var(--on-surface)] transition-colors"
                  rows={3}
                  placeholder={campo.placeholder}
                  required={campo.requerido}
                  value={datos[campo.nombre] || ''}
                  onChange={(e) => setDatos({ ...datos, [campo.nombre]: e.target.value })}
                />
              ) : (
                <input
                  type={campo.tipo}
                  className="w-full rounded-xl bg-[var(--surface-container-lowest)] text-sm p-3 outline-none border border-[var(--outline-variant)] focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] text-[var(--on-surface)] transition-colors"
                  placeholder={campo.placeholder}
                  required={campo.requerido}
                  value={datos[campo.nombre] || ''}
                  onChange={(e) => setDatos({ ...datos, [campo.nombre]: e.target.value })}
                />
              )}
            </div>
          ))}
          <div className="flex items-center justify-end gap-3 pt-5 mt-2 border-t border-[var(--outline-variant)]/30">
            <button type="button" onClick={alCerrar} className="px-5 py-2.5 text-sm font-semibold text-[var(--on-surface-variant)] hover:bg-[var(--surface-variant)] rounded-xl transition-colors">
              Cancelar
            </button>
            <button type="submit" className="px-6 py-2.5 bg-[var(--primary)] text-white text-sm font-bold rounded-xl shadow-md hover:bg-[#5b4000] active:scale-95 transition-all">
              {textoBoton}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
