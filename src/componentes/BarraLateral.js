'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

const elementosNavegacion = [
  { nombre: 'Panel de Control', ruta: '/', icono: 'dashboard' },
  { nombre: 'Invitaciones', ruta: '/invitaciones', icono: 'mail' },
  { nombre: 'Prospectos', ruta: '/prospectos', icono: 'group' },
  { nombre: 'Confirmaciones', ruta: '/confirmaciones', icono: 'event_available' },
  { nombre: 'Calendario', ruta: '/calendario', icono: 'calendar_today' },
  { nombre: 'Inbox', ruta: '/inbox', icono: 'chat_bubble' },
]

export default function BarraLateral() {
  const rutaActual = usePathname()
  const router = useRouter()
  const [eventoActivo, setEventoActivo] = useState(null)
  const [mensajesNoLeidos, setMensajesNoLeidos] = useState(0)

  const cerrarSesion = async (e) => {
    e.preventDefault()
    await supabase.auth.signOut()
    router.push('/login')
  }

  useEffect(() => {
    const cargar = async () => {
      const { data } = await supabase.from('wp_eventos').select('*').eq('activo', true).order('fecha_evento', { ascending: true }).limit(1)
      if (data && data.length > 0) setEventoActivo(data[0])

      const { count } = await supabase.from('wp_mensajes').select('*', { count: 'exact', head: true }).eq('leido', false).eq('remitente', 'usuario')
      setMensajesNoLeidos(count || 0)
    }
    cargar()

    const channel = supabase.channel('wp_sidebar_v1')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'wp_mensajes' }, () => cargar())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  if (rutaActual === '/login') return null

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex h-screen w-64 fixed left-0 top-0 flex-col py-8 z-40 bg-[#f5f3ee] shadow-[0_20px_40px_rgba(77,70,53,0.06)] border-r border-[var(--outline-variant)]/10">
        <div className="px-8 mb-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-full overflow-hidden border border-[var(--primary)]/20 bg-[var(--surface-container-highest)] flex items-center justify-center">
              <span className="material-symbols-outlined text-[var(--primary)]" style={{ fontVariationSettings: "'FILL' 1" }}>diamond</span>
            </div>
            <div>
              <h3 className="font-serif text-lg text-[var(--primary)] leading-tight">
                {eventoActivo?.nombre_evento || 'Sin evento'}
              </h3>
              <p className="text-xs opacity-60">
                {eventoActivo?.fecha_evento
                  ? new Date(eventoActivo.fecha_evento + 'T00:00').toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })
                  : 'Crea tu primer evento'}
              </p>
            </div>
          </div>
          <Link href="/eventos" className="w-full gold-gradient text-white py-3 rounded-full font-semibold shadow-md active:scale-95 duration-200 ease-out text-sm flex items-center justify-center gap-2">
            <span className="material-symbols-outlined text-lg">add</span>
            Planear Nuevo Evento
          </Link>
        </div>

        <nav className="flex flex-col gap-2 flex-grow px-4">
          {elementosNavegacion.map((el) => {
            const activo = rutaActual === el.ruta
            return (
              <Link
                key={el.ruta}
                href={el.ruta}
                className={`flex items-center gap-3 px-4 py-2.5 text-sm tracking-tight transition-all duration-200 active:scale-95 ${
                  activo
                    ? 'text-[var(--primary)] font-semibold bg-white rounded-full shadow-sm'
                    : 'text-[var(--on-surface)] opacity-60 hover:bg-[var(--surface-variant)] rounded-full'
                }`}
              >
                <span className="material-symbols-outlined" style={activo ? { fontVariationSettings: "'FILL' 1" } : {}}>
                  {el.icono}
                </span>
                <span className="flex-1">{el.nombre}</span>
                {el.nombre === 'Inbox' && mensajesNoLeidos > 0 && (
                  <span className="bg-[var(--primary)] text-white text-[9px] font-bold w-5 h-5 rounded-full flex items-center justify-center">{mensajesNoLeidos}</span>
                )}
              </Link>
            )
          })}
        </nav>

        <div className="mt-auto pt-6 flex flex-col gap-1 px-4 border-t border-[var(--outline-variant)]/20 mx-4">
          <a href="#" className="flex items-center gap-3 px-4 py-2 text-[var(--on-surface)] opacity-60 text-sm rounded-full hover:bg-[var(--surface-variant)] transition-colors">
            <span className="material-symbols-outlined">help</span>
            <span>Soporte</span>
          </a>
          <button onClick={cerrarSesion} className="flex items-center gap-3 px-4 py-2 text-[var(--on-surface)] opacity-60 text-sm rounded-full hover:bg-[var(--surface-variant)] transition-colors w-full text-left">
            <span className="material-symbols-outlined">logout</span>
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-[var(--outline-variant)]/10 flex justify-around py-3 z-50">
        {elementosNavegacion.slice(0, 5).map((el) => {
          const activo = rutaActual === el.ruta
          return (
            <Link key={el.ruta} href={el.ruta} className={`flex flex-col items-center ${activo ? 'text-[var(--primary)]' : 'text-[var(--outline)]'}`}>
              <span className="material-symbols-outlined" style={activo ? { fontVariationSettings: "'FILL' 1" } : {}}>{el.icono}</span>
              <span className="text-[10px] font-medium mt-1">{el.nombre.split(' ')[0]}</span>
            </Link>
          )
        })}
      </nav>
    </>
  )
}
