'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'

const titulosPagina = {
  '/': 'Panel de Control',
  '/invitaciones': 'Invitaciones',
  '/prospectos': 'Prospectos',
  '/confirmaciones': 'Confirmaciones',
  '/calendario': 'Calendario',
  '/concierge': 'Concierge',
  '/eventos': 'Eventos',
  '/configuracion': 'Configuración',
}

export default function BarraSuperior() {
  const rutaActual = usePathname()
  if (rutaActual === '/login') return null

  return (
    <header className="sticky top-0 z-30 bg-[var(--surface)]">
      <div className="flex justify-between items-center w-full px-8 py-4">
        <div className="flex items-center gap-6">
          <span className="text-xl font-serif tracking-[0.1em] text-[var(--primary)] whitespace-nowrap">
            The Modern Concierge
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center bg-[var(--surface-container)] rounded-full px-4 py-2">
            <span className="material-symbols-outlined text-[var(--outline)] text-lg">search</span>
            <input type="text" placeholder="Buscar..." className="bg-transparent border-none focus:ring-0 focus:outline-none text-sm w-36 ml-2 text-[var(--on-surface)]" />
          </div>
          <div className="flex items-center gap-3 text-[var(--primary)]">
            <button className="hover:scale-110 transition-transform"><span className="material-symbols-outlined">notifications</span></button>
            <Link href="/configuracion" className="hover:scale-110 transition-transform"><span className="material-symbols-outlined">settings</span></Link>
            <div className="w-9 h-9 rounded-full bg-[var(--surface-container-highest)] overflow-hidden border border-[var(--outline-variant)]/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-[var(--primary)]">person</span>
            </div>
          </div>
        </div>
      </div>
      <div className="bg-[var(--surface-container-low)] h-[1px] w-full"></div>
    </header>
  )
}
