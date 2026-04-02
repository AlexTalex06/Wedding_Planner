'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function PanelDeControl() {
  const [stats, setStats] = useState({ invitacionesEnviadas: 0, confirmaciones: 0, prospectos: 0 })
  const [ultimosProspectos, setUltimosProspectos] = useState([])
  const [totalInvitados, setTotalInvitados] = useState(0)
  const [confirmados, setConfirmados] = useState(0)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    const cargar = async () => {
      try {
        const [respI, respP, respInv] = await Promise.all([
          fetch('/api/invitados'),
          fetch('/api/prospectos'),
          fetch('/api/invitados')
        ])
        const invitados = await respI.json()
        const prospectos = await respP.json()
        const listaInv = Array.isArray(invitados) ? invitados : []
        const listaP = Array.isArray(prospectos) ? prospectos : []

        setTotalInvitados(listaInv.length)
        setConfirmados(listaInv.filter(i => i.confirmado === true).length)
        setStats({
          invitacionesEnviadas: listaInv.length,
          confirmaciones: listaInv.filter(i => i.confirmado === true).length,
          prospectos: listaP.filter(p => {
            const fecha = new Date(p.creado_en)
            const ahora = new Date()
            return fecha.getMonth() === ahora.getMonth() && fecha.getFullYear() === ahora.getFullYear()
          }).length,
        })
        setUltimosProspectos(listaP.slice(0, 3))
      } catch (e) { console.error(e) }
      finally { setCargando(false) }
    }
    cargar()
  }, [])

  const pulso = totalInvitados > 0 ? Math.round((confirmados / totalInvitados) * 100) : 0
  const circumference = 2 * Math.PI * 88
  const dashoffset = circumference - (pulso / 100) * circumference

  const pendientes = totalInvitados - confirmados

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-12">
      {/* Header */}
      <header className="mb-2">
        <h1 className="font-serif text-5xl text-[var(--on-surface)] mb-2 tracking-tight">Panel de Control</h1>
        <p className="text-[var(--on-surface-variant)]">Cuidando cada detalle de sus eventos de lujo.</p>
      </header>

      {/* Top Stats Bento Grid */}
      <div className="grid grid-cols-12 gap-6">
        {/* Invitations Sent */}
        <div className="col-span-12 md:col-span-3 bg-[var(--surface-container-low)] p-8 rounded-2xl flex flex-col justify-between h-48 border border-[var(--outline-variant)]/10">
          <div>
            <span className="material-symbols-outlined text-[var(--primary)] mb-4" style={{ fontVariationSettings: "'FILL' 1" }}>mail</span>
            <p className="text-[10px] uppercase tracking-widest text-[var(--on-surface-variant)] opacity-60 font-semibold">Invitaciones Enviadas</p>
          </div>
          <h2 className="text-4xl font-serif text-[var(--primary)]">{cargando ? '...' : stats.invitacionesEnviadas.toLocaleString()}</h2>
        </div>

        {/* RSVPs */}
        <div className="col-span-12 md:col-span-3 bg-[var(--surface-container-low)] p-8 rounded-2xl flex flex-col justify-between h-48 border border-[var(--outline-variant)]/10">
          <div>
            <span className="material-symbols-outlined text-[var(--primary)] mb-4" style={{ fontVariationSettings: "'FILL' 1" }}>event_available</span>
            <p className="text-[10px] uppercase tracking-widest text-[var(--on-surface-variant)] opacity-60 font-semibold">Confirmaciones</p>
          </div>
          <h2 className="text-4xl font-serif text-[var(--primary)]">{cargando ? '...' : stats.confirmaciones.toLocaleString()}</h2>
        </div>

        {/* Prospects */}
        <div className="col-span-12 md:col-span-6 bg-[var(--surface-container-low)] p-8 rounded-2xl flex items-center justify-between h-48 border border-[var(--outline-variant)]/10 relative overflow-hidden">
          <div className="z-10">
            <span className="material-symbols-outlined text-[var(--primary)] mb-4" style={{ fontVariationSettings: "'FILL' 1" }}>group</span>
            <p className="text-[10px] uppercase tracking-widest text-[var(--on-surface-variant)] opacity-60 font-semibold">Nuevos Prospectos</p>
            <h2 className="text-4xl font-serif text-[var(--primary)]">
              {cargando ? '...' : stats.prospectos}
              <span className="text-lg font-sans text-[var(--on-surface-variant)] opacity-50 ml-2">este mes</span>
            </h2>
          </div>
          <div className="w-32 h-32 absolute -right-4 -bottom-4 opacity-5">
            <span className="material-symbols-outlined" style={{ fontSize: '128px' }}>analytics</span>
          </div>
          <Link href="/prospectos" className="bg-[var(--surface-container-highest)] px-6 py-3 rounded-full text-[var(--primary)] font-semibold hover:bg-white transition-all text-sm z-10">
            Revisar Prospectos
          </Link>
        </div>
      </div>

      {/* Pulse and AI Concierge Row */}
      <div className="grid grid-cols-12 gap-8">
        {/* Invitation Pulse (SVG Ring) */}
        <div className="col-span-12 lg:col-span-8 bg-[var(--surface-container-low)] p-10 rounded-2xl flex items-center gap-12 border border-[var(--outline-variant)]/5">
          <div className="relative w-48 h-48 flex items-center justify-center shrink-0">
            <svg className="w-full h-full transform -rotate-90">
              <circle className="text-[var(--surface-container-highest)]" cx="96" cy="96" fill="transparent" r="88" stroke="currentColor" strokeWidth="8" />
              <circle className="text-[var(--primary)]" cx="96" cy="96" fill="transparent" r="88" stroke="currentColor" strokeWidth="8" strokeDasharray={circumference} strokeDashoffset={dashoffset} style={{ transition: 'stroke-dashoffset 1s ease-out' }} />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-4xl font-serif text-[var(--on-surface)]">{pulso}%</span>
              <span className="text-xs uppercase tracking-tighter opacity-50">Pulso</span>
            </div>
          </div>
          <div className="flex-1">
            <h3 className="font-serif text-2xl mb-4">Pulso de Invitaciones</h3>
            <p className="text-[var(--on-surface-variant)] leading-relaxed mb-6">
              {totalInvitados > 0
                ? `Su tasa de interacción actual en todas las invitaciones activas${pulso >= 50 ? ' muestra una participación saludable' : ' está en crecimiento'}. ${pendientes} invitaciones aún pendientes de respuesta.`
                : 'Agrega invitados a un evento para comenzar a rastrear las confirmaciones.'}
            </p>
            <div className="flex gap-4">
              <div className="flex flex-col">
                <span className="text-xs font-semibold opacity-40 uppercase">Tasa de Respuesta</span>
                <span className="text-xl font-serif">{pulso}%</span>
              </div>
              <div className="w-px h-10 bg-[var(--outline-variant)]/20"></div>
              <div className="flex flex-col">
                <span className="text-xs font-semibold opacity-40 uppercase">Pendientes</span>
                <span className="text-xl font-serif">{pendientes}</span>
              </div>
            </div>
          </div>
        </div>

        {/* AI Concierge Entry */}
        <div className="col-span-12 lg:col-span-4 gold-gradient rounded-2xl p-10 text-white flex flex-col justify-between shadow-xl relative overflow-hidden">
          <div className="z-10">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mb-6 backdrop-blur-md">
              <span className="material-symbols-outlined">auto_awesome</span>
            </div>
            <h3 className="font-serif text-3xl mb-4">Concierge IA</h3>
            <p className="opacity-90 mb-8">Listo para asistir con consultas de invitados, coordinación de proveedores o ajustes en el cronograma.</p>
          </div>
          <Link href="/concierge" className="w-full bg-white text-[var(--primary)] py-4 rounded-full font-bold shadow-lg hover:bg-[var(--surface-container-lowest)] transition-all z-10 text-center">
            Entrar al Chat Concierge
          </Link>
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
        </div>
      </div>

      {/* Latest Prospects Grid */}
      <section>
        <div className="flex justify-between items-end mb-8">
          <div>
            <h3 className="font-serif text-3xl mb-1">Últimos Prospectos</h3>
            <p className="text-[var(--on-surface-variant)] opacity-70">Nuevas consultas de bodas a la espera de seguimiento.</p>
          </div>
          <Link href="/prospectos" className="text-[var(--primary)] font-bold flex items-center gap-2 hover:underline">
            Ver Todo <span className="material-symbols-outlined">arrow_forward</span>
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {cargando ? (
            <div className="col-span-3 text-center py-16 text-[var(--on-surface-variant)] opacity-50">Cargando prospectos...</div>
          ) : ultimosProspectos.length === 0 ? (
            <div className="col-span-3 text-center py-16 text-[var(--on-surface-variant)] opacity-50">
              <span className="material-symbols-outlined text-5xl mb-3 block text-[var(--primary)]/30">group</span>
              <p>Aún no hay prospectos. Aparecerán aquí cuando Evelyn capture leads.</p>
            </div>
          ) : ultimosProspectos.map((pros, idx) => (
            <div key={pros.id} className="bg-[var(--surface-container-low)] rounded-2xl overflow-hidden group border border-[var(--outline-variant)]/10">
              <div className="h-48 overflow-hidden relative bg-[var(--surface-container-highest)] flex items-center justify-center">
                <span className="material-symbols-outlined text-[var(--outline-variant)]" style={{ fontSize: '64px' }}>photo_camera</span>
                {idx === 0 && (
                  <div className="absolute top-4 right-4 bg-white/80 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-[var(--primary)]">Nuevo</div>
                )}
              </div>
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="font-serif text-xl">{pros.nombre}</h4>
                    <p className="text-sm opacity-60">
                      {pros.tipo_evento || 'Evento'} • {pros.fecha_evento_aprox || 'Fecha por definir'}
                    </p>
                  </div>
                  {pros.presupuesto && <span className="text-[var(--primary)] font-bold">${(pros.presupuesto / 1000).toFixed(0)}k</span>}
                </div>
                {pros.notas && (
                  <p className="text-sm text-[var(--on-surface-variant)] mb-6 line-clamp-2 italic">"{pros.notas}"</p>
                )}
                <div className="flex gap-2">
                  <span className="bg-[var(--surface-container-highest)] px-3 py-1 rounded-full text-[10px] uppercase font-bold opacity-70">
                    {pros.estado?.replace('_', ' ') || 'Nuevo'}
                  </span>
                  {pros.lead_score && (
                    <span className="bg-[var(--surface-container-highest)] px-3 py-1 rounded-full text-[10px] uppercase font-bold opacity-70">
                      {pros.lead_score}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
