'use client'

import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useState, useRef, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

const titulosPagina = {
  '/': 'Panel de Control',
  '/invitaciones': 'Invitaciones',
  '/prospectos': 'Prospectos',
  '/confirmaciones': 'Confirmaciones',
  '/calendario': 'Calendario',
  '/inbox': 'Inbox',
  '/eventos': 'Eventos',
  '/configuracion': 'Configuración',
}

export default function BarraSuperior() {
  const rutaActual = usePathname()
  const router = useRouter()
  const [menuAbierto, setMenuAbierto] = useState(null)
  const [usuario, setUsuario] = useState(null)
  const menuRef = useRef(null)

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const nombrePerfil = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'Admin'
        setUsuario(nombrePerfil)
      }
    }
    fetchUser()
  }, [])

  useEffect(() => {
    const handleClickFuera = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuAbierto(null)
      }
    }
    document.addEventListener('mousedown', handleClickFuera)
    return () => document.removeEventListener('mousedown', handleClickFuera)
  }, [])

  const cerrarSesion = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

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
          <div className="flex items-center gap-3 text-[var(--primary)]" ref={menuRef}>
            
            {/* Notificaciones */}
            <div className="relative">
              <button 
                onClick={() => setMenuAbierto(menuAbierto === 'notificaciones' ? null : 'notificaciones')} 
                className="hover:scale-110 transition-transform relative p-1"
              >
                <span className="material-symbols-outlined">notifications</span>
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              
              {menuAbierto === 'notificaciones' && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-[var(--outline-variant)]/10 p-4 z-50">
                  <h4 className="font-serif text-sm font-bold mb-3 border-b border-[var(--outline-variant)]/10 pb-2">Notificaciones</h4>
                  <div className="space-y-3">
                    <div className="flex gap-3 items-start">
                      <div className="w-8 h-8 rounded-full gold-gradient shrink-0 flex items-center justify-center text-white"><span className="material-symbols-outlined text-[16px]">rsvp</span></div>
                      <div>
                        <p className="text-xs text-[var(--on-surface)]"><span className="font-bold">María</span> confirmó su asistencia.</p>
                        <span className="text-[9px] text-[var(--on-surface-variant)]">Hace 5 min</span>
                      </div>
                    </div>
                    <div className="flex gap-3 items-start">
                      <div className="w-8 h-8 rounded-full bg-[var(--surface-container-highest)] shrink-0 flex items-center justify-center text-[var(--primary)]"><span className="material-symbols-outlined text-[16px]">calendar_month</span></div>
                      <div>
                        <p className="text-xs text-[var(--on-surface)]">Nueva cita agendada por <span className="font-bold">Carlos</span>.</p>
                        <span className="text-[9px] text-[var(--on-surface-variant)]">Hace 1 hora</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <Link href="/configuracion" className="hover:scale-110 transition-transform p-1">
              <span className="material-symbols-outlined">settings</span>
            </Link>
            
            {/* Perfil */}
            <div className="relative">
              <button 
                onClick={() => setMenuAbierto(menuAbierto === 'perfil' ? null : 'perfil')}
                className="w-9 h-9 rounded-full bg-[var(--surface-container-highest)] overflow-hidden border border-[var(--outline-variant)]/20 flex items-center justify-center transition-transform hover:scale-105"
              >
                <span className="material-symbols-outlined text-[var(--primary)]">person</span>
              </button>

              {menuAbierto === 'perfil' && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-[var(--outline-variant)]/10 py-2 z-50 overflow-hidden">
                  <div className="px-4 py-2 border-b border-[var(--outline-variant)]/10 mb-2">
                    <p className="text-sm font-bold text-[var(--on-surface)] truncate">{usuario || 'Admin'}</p>
                    <p className="text-[10px] text-[var(--on-surface-variant)]">Eventos Boreal</p>
                  </div>
                  <button onClick={() => { setMenuAbierto(null); router.push('/configuracion') }} className="w-full text-left px-4 py-2 text-xs text-[var(--on-surface)] hover:bg-[var(--surface-variant)] transition-colors flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px]">manage_accounts</span> Mi Cuenta
                  </button>
                  <button onClick={cerrarSesion} className="w-full text-left px-4 py-2 text-xs text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2 mt-1">
                    <span className="material-symbols-outlined text-[16px]">logout</span> Cerrar Sesión
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
      <div className="bg-[var(--surface-container-low)] h-[1px] w-full"></div>
    </header>
  )
}
