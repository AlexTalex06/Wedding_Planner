'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

const EMOJIS_RAPIDOS = ['😊','👍','❤️','🎉','🙌','💍','✨','👋','✅','🔥','💐','📅','⭐','💒','💯','😃','🙏','👏','📝','🎊']

export default function PaginaInbox() {
  const [conversaciones, setConversaciones] = useState([])
  const [mensajes, setMensajes] = useState([])
  const [chatActivo, setChatActivo] = useState(null)
  const [nuevoMensaje, setNuevoMensaje] = useState('')
  const [filtroBusqueda, setFiltroBusqueda] = useState('')
  const [cargando, setCargando] = useState(true)
  const [mostrarEmojis, setMostrarEmojis] = useState(false)
  const [modalNuevoChat, setModalNuevoChat] = useState(false)
  const [telefonoNuevo, setTelefonoNuevo] = useState('')
  const [nombreNuevo, setNombreNuevo] = useState('')

  const chatActivoRef = useRef(null)
  const cargarMensajesRef = useRef(null)
  const cargarConversacionesRef = useRef(null)
  const textareaRef = useRef(null)

  useEffect(() => { chatActivoRef.current = chatActivo }, [chatActivo])

  const cargarMensajes = useCallback(async (id) => {
    if (!id) return
    const { data } = await supabase.from('wp_mensajes').select('*').eq('conversacion_id', id).order('creado_en', { ascending: true })
    if (data) setMensajes(data)
  }, [])

  const cargarConversaciones = useCallback(async () => {
    const { data, error } = await supabase.from('wp_conversaciones').select('*, wp_prospectos(*), wp_mensajes(id, leido, remitente)').order('actualizado_en', { ascending: false })
    if (!error && data) {
      setConversaciones(data)
      if (!chatActivoRef.current && data.length > 0) {
        setChatActivo(data[0])
        cargarMensajes(data[0].id)
      } else if (chatActivoRef.current) {
        const up = data.find(c => c.id === chatActivoRef.current.id)
        if (up) setChatActivo(up)
      }
    }
    setCargando(false)
  }, [cargarMensajes])

  useEffect(() => {
    cargarMensajesRef.current = cargarMensajes
    cargarConversacionesRef.current = cargarConversaciones
  })

  useEffect(() => {
    cargarConversacionesRef.current?.()
    const channel = supabase.channel('wp_inbox_v1')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'wp_conversaciones' }, () => {
        cargarConversacionesRef.current?.()
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'wp_mensajes' }, (payload) => {
        cargarConversacionesRef.current?.()
        if (chatActivoRef.current && payload.new.conversacion_id === chatActivoRef.current.id) {
          cargarMensajesRef.current?.(chatActivoRef.current.id)
          if (payload.new.remitente === 'usuario') {
            fetch('/api/mensajes/leer', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ conversacion_id: chatActivoRef.current.id })
            }).then(() => cargarConversacionesRef.current?.()).catch(console.error)
          }
        }
      })
      .subscribe()

    const interval = setInterval(() => {
      cargarConversacionesRef.current?.()
      if (chatActivoRef.current) cargarMensajesRef.current?.(chatActivoRef.current.id)
    }, 5000)

    return () => { supabase.removeChannel(channel); clearInterval(interval) }
  }, [])

  const enviarMensaje = async (e) => {
    e.preventDefault()
    if (!nuevoMensaje.trim() || !chatActivo) return
    const texto = nuevoMensaje
    setNuevoMensaje('')
    setMostrarEmojis(false)
    try {
      const res = await fetch('/api/enviar-mensaje', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: chatActivo.id_plataforma, text: texto, plataforma: 'whatsapp' })
      })
      if (res.ok) {
        await supabase.from('wp_mensajes').insert({ conversacion_id: chatActivo.id, remitente: 'humano', contenido: texto })
        await supabase.from('wp_conversaciones').update({ ultimo_mensaje: texto, actualizado_en: new Date().toISOString() }).eq('id', chatActivo.id)
      }
    } catch (err) { console.error(err) }
  }

  const cambiarChat = async (c) => {
    setChatActivo(c)
    cargarMensajes(c.id)
    setMostrarEmojis(false)
    const unreadCount = c.wp_mensajes?.filter(m => !m.leido && m.remitente === 'usuario').length || 0
    if (unreadCount > 0) {
      try {
        await fetch('/api/mensajes/leer', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ conversacion_id: c.id }) })
        cargarConversacionesRef.current?.()
      } catch (err) { console.error(err) }
    }
  }

  const crearNuevoChat = async () => {
    if (!telefonoNuevo.trim()) { alert('Escribe un número de teléfono'); return }
    const { data: existing } = await supabase.from('wp_conversaciones').select('*').eq('id_plataforma', telefonoNuevo).eq('plataforma', 'whatsapp').maybeSingle()
    if (existing) {
      const conv = conversaciones.find(c => c.id === existing.id)
      if (conv) cambiarChat(conv)
      setModalNuevoChat(false); setTelefonoNuevo(''); setNombreNuevo(''); return
    }
    const { data: nuevoP } = await supabase.from('wp_prospectos').insert({ nombre: nombreNuevo || telefonoNuevo, telefono: telefonoNuevo, estado: 'nuevo' }).select('id').single()
    if (nuevoP) {
      const { data: nuevaC } = await supabase.from('wp_conversaciones').insert({ prospecto_id: nuevoP.id, plataforma: 'whatsapp', id_plataforma: telefonoNuevo }).select('id').single()
      
      // Enviar primer mensaje por API
      const textoSaludo = '✨ ¡Hola! Nos comunicamos de Eventos Boreal. ¿En qué podemos ayudarte?'
      try {
        const res = await fetch('/api/enviar-mensaje', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ to: telefonoNuevo, text: textoSaludo, plataforma: 'whatsapp' })
        })
        if (res.ok) {
          await supabase.from('wp_mensajes').insert({ conversacion_id: nuevaC.id, remitente: 'bot', contenido: textoSaludo })
          await supabase.from('wp_conversaciones').update({ ultimo_mensaje: textoSaludo, actualizado_en: new Date().toISOString() }).eq('id', nuevaC.id)
        }
      } catch (err) { console.error('Error enviando mensaje inicial:', err) }
      
      await cargarConversaciones()
    }
    setModalNuevoChat(false); setTelefonoNuevo(''); setNombreNuevo('')
  }

  const conversacionesFiltradas = conversaciones.filter(c => 
    (c.wp_prospectos?.nombre || '').toLowerCase().includes(filtroBusqueda.toLowerCase()) || 
    c.id_plataforma.includes(filtroBusqueda)
  )

  const obtenerTiempoRelativo = (fecha) => {
    if (!fecha) return ''
    const diff = Date.now() - new Date(fecha).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'ahora'
    if (mins < 60) return `${mins}m`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h`
    const dias = Math.floor(hrs / 24)
    return dias === 1 ? 'ayer' : `${dias}d`
  }

  if (cargando) return <div className="p-10 flex text-[var(--gold)] items-center gap-2 h-full"><span className="material-symbols-outlined animate-spin">refresh</span> Conectando al Inbox...</div>

  return (
    <div className="h-[calc(100vh-65px)] w-full flex overflow-hidden bg-[var(--surface)]">
      
      {/* SIDEBAR */}
      <div className={`${chatActivo ? 'hidden md:flex' : 'flex'} w-full md:w-[340px] lg:w-[380px] bg-[var(--cream)] border-r border-[var(--gold-soft)]/20 flex-col h-full shrink-0`}>
        <div className="px-4 py-3 flex items-center justify-between" style={{ background: 'linear-gradient(135deg, #775a19, #d4ad65)' }}>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-[20px]">forum</span>
            </div>
            <h2 className="text-[16px] font-bold text-white">Inbox Evelyn</h2>
          </div>
          <button onClick={() => setModalNuevoChat(true)} className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
            <span className="material-symbols-outlined text-white text-[20px]">edit_square</span>
          </button>
        </div>

        <div className="p-2">
          <div className="bg-[var(--ivory)] rounded-xl px-3 py-2 flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-[var(--on-surface-muted)]">search</span>
            <input type="text" placeholder="Buscar contacto..." className="bg-transparent w-full text-sm outline-none text-[var(--on-surface)] placeholder:text-[var(--on-surface-muted)]" value={filtroBusqueda} onChange={(e) => setFiltroBusqueda(e.target.value)} />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {conversacionesFiltradas.length === 0 ? (
            <div className="p-6 text-center text-[var(--on-surface-muted)] text-sm">
              <span className="material-symbols-outlined text-4xl mb-2 block text-[var(--gold-soft)]">chat_bubble_outline</span>
              No hay conversaciones
            </div>
          ) : conversacionesFiltradas.map(conv => {
            const unreadCount = conv.wp_mensajes?.filter(m => !m.leido && m.remitente === 'usuario').length || 0
            const isActive = chatActivo?.id === conv.id
            const isInvitado = conv.tipo_contacto === 'invitado'
            return (
              <div key={conv.id} onClick={() => cambiarChat(conv)} className={`flex items-center gap-3 px-4 py-3.5 cursor-pointer transition-all border-l-4 ${
                isActive ? 'bg-[var(--gold)]/5 border-[var(--gold)]' : 'border-transparent hover:bg-[var(--ivory)]'
              }`}>
                <div className="relative">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm uppercase ${
                    isActive ? 'text-white' : 'text-white'
                  }`} style={{ background: isInvitado ? 'linear-gradient(135deg, #059669, #34d399)' : 'linear-gradient(135deg, #775a19, #d4ad65)' }}>
                    {conv.wp_prospectos?.nombre?.[0] || '?'}
                  </div>
                  {unreadCount > 0 && (
                    <div className="absolute -top-1 -right-1 bg-[var(--gold)] text-white text-[9px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-sm">{unreadCount}</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-0.5">
                    <h3 className={`text-[14px] truncate ${isActive ? 'font-bold text-[var(--gold)]' : 'font-semibold text-[var(--on-surface)]'}`}>
                      {conv.wp_prospectos?.nombre || conv.id_plataforma}
                    </h3>
                    <span className="text-[11px] text-[var(--on-surface-muted)] shrink-0 ml-2">{obtenerTiempoRelativo(conv.actualizado_en)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {isInvitado && <span className="text-[9px] bg-emerald-100 text-emerald-700 px-1 rounded font-bold">INVITADO</span>}
                    <p className="text-[12px] truncate text-[var(--on-surface-muted)]">{conv.ultimo_mensaje || 'Conversación vacía'}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* CHAT AREA */}
      {chatActivo ? (
        <div className="flex-1 flex flex-col h-full min-w-0">
          <div className="h-[65px] bg-[var(--cream)] border-b border-[var(--gold-soft)]/20 px-5 flex items-center justify-between z-10 shadow-ambient-sm">
            <div className="flex items-center gap-3">
              <button onClick={() => setChatActivo(null)} className="md:hidden material-symbols-outlined text-[var(--on-surface-muted)]">arrow_back</button>
              <div className="w-10 h-10 rounded-full text-white flex items-center justify-center font-bold text-sm uppercase" style={{ background: 'linear-gradient(135deg, #775a19, #d4ad65)' }}>
                {chatActivo.wp_prospectos?.nombre?.[0] || '?'}
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-[var(--on-surface)] text-[15px]">{chatActivo.wp_prospectos?.nombre || chatActivo.id_plataforma}</span>
                <span className="text-[11px] text-[var(--on-surface-muted)] font-medium">
                  {chatActivo.id_plataforma} • {chatActivo.tipo_contacto === 'invitado' ? '🎉 INVITADO' : chatActivo.wp_prospectos?.estado?.toUpperCase() || 'NUEVO'}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className={`px-3 py-1.5 rounded-full text-[10px] font-bold text-white shadow-sm ${chatActivo.asignado_a_humano ? 'bg-amber-500' : ''}`} style={!chatActivo.asignado_a_humano ? { background: 'linear-gradient(135deg, #775a19, #d4ad65)' } : {}}>
                <span className="material-symbols-outlined text-[12px] mr-1 align-middle">{chatActivo.asignado_a_humano ? 'person' : 'smart_toy'}</span>
                {chatActivo.asignado_a_humano ? 'HUMANO' : 'EVELYN IA'}
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ backgroundColor: 'var(--surface)' }}>
            {mensajes.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-[var(--gold-soft)]">
                <span className="material-symbols-outlined text-6xl mb-3">chat</span>
                <p className="font-medium">Sin mensajes aún</p>
              </div>
            ) : mensajes.map((msj) => {
              const esBot = msj.remitente === 'bot'
              const esHumano = msj.remitente === 'humano'
              const soyYo = esBot || esHumano
              return (
                <div key={msj.id} className={`flex w-full ${soyYo ? 'justify-end' : 'justify-start'}`}>
                  <div className="max-w-[75%] relative group">
                    {esBot && (
                      <div className="flex items-center gap-1 mb-1">
                        <span className="material-symbols-outlined text-[11px] text-[var(--gold)]">smart_toy</span>
                        <span className="text-[10px] text-[var(--gold)] font-bold">Evelyn IA</span>
                      </div>
                    )}
                    {esHumano && (
                      <div className="flex items-center gap-1 mb-1 justify-end">
                        <span className="text-[10px] text-[var(--gold)] font-bold">Tú</span>
                        <span className="material-symbols-outlined text-[11px] text-[var(--gold)]">person</span>
                      </div>
                    )}
                    <div className={`px-3.5 py-2.5 rounded-2xl text-[13.5px] leading-relaxed shadow-ambient-sm ${
                      esBot ? 'bg-[var(--gold-soft)]/30 text-[var(--on-surface)] rounded-tr-sm' :
                      esHumano ? 'text-white rounded-tr-sm' :
                      'bg-[var(--cream)] text-[var(--on-surface)] rounded-tl-sm'
                    }`} style={esHumano ? { background: 'linear-gradient(135deg, #775a19, #d4ad65)' } : {}}>
                      <p className="whitespace-pre-wrap">{msj.contenido}</p>
                      <span className={`text-[9px] block text-right mt-1 ${soyYo ? 'opacity-50' : 'text-[var(--on-surface-muted)]'}`}>
                        {new Date(msj.creado_en).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
            <div ref={x => { if(x) x.scrollIntoView({behavior:'smooth'}) }}></div>
          </div>

          {mostrarEmojis && (
            <div className="bg-[var(--cream)] border-t border-[var(--gold-soft)]/20 px-4 py-3">
              <div className="flex flex-wrap gap-1.5">
                {EMOJIS_RAPIDOS.map(emoji => (
                  <button key={emoji} onClick={() => { setNuevoMensaje(prev => prev + emoji); textareaRef.current?.focus() }}
                    className="w-9 h-9 rounded-lg hover:bg-[var(--ivory)] flex items-center justify-center text-xl transition-colors active:scale-90">
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          )}

          <form onSubmit={enviarMensaje} className="px-4 py-3 bg-[var(--cream)] border-t border-[var(--gold-soft)]/20 flex items-end gap-2">
            <button type="button" onClick={() => setMostrarEmojis(!mostrarEmojis)}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors shrink-0 ${mostrarEmojis ? 'bg-[var(--gold)]/10 text-[var(--gold)]' : 'text-[var(--on-surface-muted)] hover:bg-[var(--ivory)]'}`}>
              <span className="material-symbols-outlined text-[22px]">mood</span>
            </button>
            <textarea ref={textareaRef} value={nuevoMensaje} onChange={(e) => setNuevoMensaje(e.target.value)} 
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviarMensaje(e) } }} 
              placeholder="Escribe un mensaje..." 
              className="flex-1 bg-[var(--ivory)] rounded-2xl px-4 py-2.5 outline-none resize-none text-[14px] text-[var(--on-surface)] placeholder:text-[var(--on-surface-muted)] focus:ring-2 focus:ring-[var(--gold-soft)] transition-all" 
              rows={1} />
            <button type="submit" className="w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-colors shrink-0 active:scale-95 text-white" style={{ background: 'linear-gradient(135deg, #775a19, #d4ad65)' }}>
              <span className="material-symbols-outlined text-[20px]">send</span>
            </button>
          </form>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center bg-[var(--surface)]">
          <div className="w-20 h-20 rounded-full bg-[var(--gold)]/10 flex items-center justify-center mb-4">
            <span className="material-symbols-outlined text-5xl text-[var(--gold)]">forum</span>
          </div>
          <h3 className="text-xl font-bold text-[var(--on-surface)] mb-1 font-serif">Wedding Planner Inbox</h3>
          <p className="text-[var(--on-surface-muted)] text-sm">Selecciona una conversación o inicia un nuevo chat</p>
        </div>
      )}

      {/* Right panel - Contact info */}
      {chatActivo && (
        <div className="hidden xl:flex w-[320px] border-l border-[var(--gold-soft)]/20 bg-[var(--cream)] flex-col h-full shrink-0 overflow-y-auto">
          <div className="p-5 text-center flex flex-col items-center" style={{ background: 'linear-gradient(135deg, #775a19, #d4ad65)' }}>
            <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center text-3xl text-white font-bold mb-3 uppercase ring-4 ring-white/10">
              {chatActivo.wp_prospectos?.nombre?.[0] || '?'}
            </div>
            <h3 className="text-[18px] font-bold text-white font-serif">{chatActivo.wp_prospectos?.nombre || 'Contacto'}</h3>
            <p className="text-[12px] text-white/70 mt-0.5">{chatActivo.id_plataforma}</p>
            {chatActivo.tipo_contacto === 'invitado' && (
              <span className="mt-2 px-3 py-1 rounded-full text-[10px] font-bold bg-white/20 text-white">🎉 INVITADO</span>
            )}
          </div>

          <div className="p-4">
            <h4 className="text-[10px] font-bold text-[var(--on-surface-muted)] uppercase tracking-widest mb-3 flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">info</span>
              Datos del Contacto
            </h4>
            <div className="space-y-2.5">
              <div className="flex justify-between items-center">
                <span className="text-[11px] text-[var(--on-surface-muted)] font-medium">Estado</span>
                <span className="text-[12px] font-bold uppercase text-[var(--gold)] bg-[var(--gold)]/10 px-2 py-0.5 rounded">
                  {chatActivo.wp_prospectos?.estado || 'NUEVO'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[11px] text-[var(--on-surface-muted)] font-medium">Tipo</span>
                <span className="text-[12px] font-semibold text-[var(--on-surface)]">
                  {chatActivo.tipo_contacto === 'invitado' ? '🎉 Invitado' : '💼 Lead'}
                </span>
              </div>
              {chatActivo.wp_prospectos?.tipo_evento && (
                <div className="flex justify-between items-center">
                  <span className="text-[11px] text-[var(--on-surface-muted)] font-medium">Evento</span>
                  <span className="text-[12px] font-semibold text-[var(--on-surface)]">{chatActivo.wp_prospectos.tipo_evento}</span>
                </div>
              )}
              {chatActivo.wp_prospectos?.fecha_evento_aprox && (
                <div className="flex justify-between items-center">
                  <span className="text-[11px] text-[var(--on-surface-muted)] font-medium">Fecha Aprox.</span>
                  <span className="text-[12px] font-semibold text-[var(--on-surface)]">{chatActivo.wp_prospectos.fecha_evento_aprox}</span>
                </div>
              )}
              {chatActivo.wp_prospectos?.lead_score && (
                <div className="flex justify-between items-center">
                  <span className="text-[11px] text-[var(--on-surface-muted)] font-medium">Lead Score</span>
                  <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                    chatActivo.wp_prospectos.lead_score === 'CALIENTE' ? 'bg-red-100 text-red-600' :
                    chatActivo.wp_prospectos.lead_score === 'TIBIO' ? 'bg-amber-100 text-amber-700' :
                    'bg-slate-100 text-slate-600'
                  }`}>{chatActivo.wp_prospectos.lead_score}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal New Chat */}
      {modalNuevoChat && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setModalNuevoChat(false)}></div>
          <div className="relative bg-[var(--surface-container-high)] rounded-2xl shadow-xl w-full max-w-md mx-4 animate-[fadeIn_0.2s_ease-out]">
            <div className="flex items-center justify-between p-5 border-b border-[var(--outline-variant)]/30">
              <h2 className="text-lg font-bold text-[var(--primary)] font-serif">Nuevo Chat de WhatsApp</h2>
              <button type="button" onClick={() => setModalNuevoChat(false)} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[var(--surface-variant)] transition-colors">
                <span className="material-symbols-outlined text-[var(--on-surface-variant)]">close</span>
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="bg-[var(--primary)]/10 border border-[var(--primary)]/20 p-3 rounded-lg mb-4">
                <p className="text-[11px] text-[var(--primary)] leading-tight">
                  <span className="font-bold">Aviso de Meta:</span> Solo puedes iniciar conversaciones enviando un mensaje mediante esta acción. Si es un contacto nuevo y no han pasado 24h desde su último mensaje, debe haber una comunicación previa aprobada para evitar bloqueos.
                </p>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-bold text-[var(--on-surface)] uppercase tracking-wider">Número de WhatsApp (con prefijo)</label>
                <input type="tel" placeholder="Ej: 5213412345678" className="w-full rounded-xl bg-[var(--surface-container-lowest)] text-sm p-3 outline-none border border-[var(--outline-variant)] focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-colors" value={telefonoNuevo} onChange={(e) => setTelefonoNuevo(e.target.value)} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-bold text-[var(--on-surface)] uppercase tracking-wider">Nombre (opcional)</label>
                <input type="text" placeholder="Ej: María García" className="w-full rounded-xl bg-[var(--surface-container-lowest)] text-sm p-3 outline-none border border-[var(--outline-variant)] focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-colors" value={nombreNuevo} onChange={(e) => setNombreNuevo(e.target.value)} />
              </div>
              <div className="flex items-center justify-end gap-3 pt-5 mt-2 border-t border-[var(--outline-variant)]/30">
                <button type="button" onClick={() => setModalNuevoChat(false)} className="px-5 py-2.5 text-sm font-semibold text-[var(--on-surface-variant)] hover:bg-[var(--surface-variant)] rounded-xl transition-colors">Cancelar</button>
                <button onClick={crearNuevoChat} className="px-6 py-2.5 bg-[var(--primary)] text-white text-sm font-bold rounded-xl shadow-md hover:bg-[#5b4000] active:scale-95 transition-all">
                  Iniciar Charla
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
