'use client'

import { useState, useEffect, useRef } from 'react'

export default function PaginaInvitaciones() {
  const [eventos, setEventos] = useState([])
  const [eventoId, setEventoId] = useState('')
  const [listaInvitados, setListaInvitados] = useState([])
  const [archivoCSV, setArchivoCSV] = useState(null)
  const [nombreArchivo, setNombreArchivo] = useState('')
  const [mensajeEncabezado, setMensajeEncabezado] = useState('✨ Estás Invitado')
  const [mensajePersonalizado, setMensajePersonalizado] = useState('Hola {{first_name}}, nos encantaría que nos acompañaras en nuestro día especial. Por favor, mira la invitación oficial a continuación y confirma tu asistencia.')
  const [canal, setCanal] = useState('whatsapp')
  const [tipoEnvio, setTipoEnvio] = useState('template') // 'template' o 'text'
  const [nombrePlantilla, setNombrePlantilla] = useState('invitacion_boreal_v1')
  const [enviando, setEnviando] = useState(false)
  const [progresoEnvio, setProgresoEnvio] = useState({ total: 0, enviados: 0, exitosos: 0, fallidos: 0 })
  const [invitadosEnviados, setInvitadosEnviados] = useState([])
  const [eventoDetalle, setEventoDetalle] = useState(null)
  const [subiendoPdf, setSubiendoPdf] = useState(false)
  const fileInputRef = useRef(null)

  useEffect(() => {
    const cargar = async () => {
      const resp = await fetch('/api/eventos')
      const data = await resp.json()
      setEventos(Array.isArray(data) ? data : [])
    }
    cargar()
  }, [])

  useEffect(() => {
    if (eventoId) {
      const ev = eventos.find(e => e.id === eventoId)
      setEventoDetalle(ev || null)
    } else {
      setEventoDetalle(null)
    }
  }, [eventoId, eventos])

  const alSubirPDF = async (e) => {
    const file = e.target.files[0]
    if (!file || !eventoId) return
    setSubiendoPdf(true)
    const formData = new FormData()
    formData.append('archivo', file)
    formData.append('eventoId', eventoId)

    try {
      const resp = await fetch('/api/eventos/upload', { method: 'POST', body: formData })
      if (resp.ok) {
        const data = await resp.json()
        // Actualizar lista de eventos localmente para reflejar el cambio
        setEventos(prev => prev.map(ev => ev.id === eventoId ? { ...ev, pdf_url: data.url } : ev))
        alert('✅ ¡Invitación PDF cargada con éxito!')
      }
    } catch (err) {
      console.error(err)
    } finally {
      setSubiendoPdf(false)
    }
  }

  const procesarCSV = (e) => {
    const archivo = e.target.files[0]
    if (!archivo) return
    setNombreArchivo(archivo.name)
    setArchivoCSV(archivo)

    const reader = new FileReader()
    reader.onload = (evt) => {
      const texto = evt.target.result
      const lineas = texto.split('\n').filter(l => l.trim())
      const cabeceras = lineas[0].split(',').map(c => c.trim().toLowerCase())

      const idxNombre = cabeceras.findIndex(c => c.includes('nombre') || c.includes('name'))
      const idxTelefono = cabeceras.findIndex(c => c.includes('telefono') || c.includes('phone') || c.includes('tel'))
      const idxCorreo = cabeceras.findIndex(c => c.includes('correo') || c.includes('email') || c.includes('mail'))

      const invitados = lineas.slice(1).map((linea, i) => {
        const cols = linea.split(',').map(c => c.trim())
        return {
          id: i,
          nombre: idxNombre >= 0 ? cols[idxNombre] : cols[0] || '',
          telefono: idxTelefono >= 0 ? cols[idxTelefono] : '',
          correo: idxCorreo >= 0 ? cols[idxCorreo] : '',
        }
      }).filter(inv => inv.nombre)

      setListaInvitados(invitados)
    }
    reader.readAsText(archivo)
  }

  const importarDesdeEvento = async () => {
    if (!eventoId) return
    const resp = await fetch('/api/invitados')
    const data = await resp.json()
    const inv = (Array.isArray(data) ? data : []).filter(i => i.evento_id === eventoId)
    setListaInvitados(inv.map((i, idx) => ({ id: idx, nombre: i.nombre, telefono: i.telefono || '', correo: i.correo || '' })))
    setNombreArchivo(`Importado del evento (${inv.length} invitados)`)
  }

  const enviarInvitaciones = async () => {
    if (listaInvitados.length === 0) return
    
    if (tipoEnvio === 'template' && !nombrePlantilla) {
      alert('Debes ingresar el nombre de la plantilla de Meta.')
      return
    }

    setEnviando(true)
    setProgresoEnvio({ total: listaInvitados.length, enviados: 0, exitosos: 0, fallidos: 0 })
    setInvitadosEnviados([])

    if (tipoEnvio === 'template') {
       // --- ENVÍO PRO (MOTOR DE PLANTILLAS) ---
       const resp = await fetch('/api/invitaciones/enviar', {
          method: 'POST', 
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ invitados: listaInvitados, nombrePlantilla, eventoId })
       })
       const data = await resp.json()
       
       if (data.resultados) {
          data.resultados.forEach(res => {
             setProgresoEnvio(prev => ({ 
                ...prev, 
                enviados: prev.enviados + 1, 
                exitosos: res.exito ? prev.exitosos + 1 : prev.exitosos,
                fallidos: res.exito ? prev.fallidos : prev.fallidos + 1
             }))
             setInvitadosEnviados(prev => [...prev, { nombre: res.nombre, estado: res.exito ? 'enviado' : 'fallido', tiempo: 'Ahora' }])
          })
       }
    } else {
       // --- ENVÍO SIMPLE (MANUAL / TEXTO) ---
       for (let i = 0; i < listaInvitados.length; i++) {
         const inv = listaInvitados[i]
         const mensajeFinal = mensajePersonalizado.replace('{{first_name}}', inv.nombre.split(' ')[0])
         const textoCompleto = `${mensajeEncabezado}\n\n${mensajeFinal}`

         try {
           if (canal === 'whatsapp' && inv.telefono) {
             const resp = await fetch('/api/enviar-mensaje', {
               method: 'POST', headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify({ to: inv.telefono, text: textoCompleto, plataforma: 'whatsapp' })
             })
             if (resp.ok) {
               setProgresoEnvio(prev => ({ ...prev, enviados: prev.enviados + 1, exitosos: prev.exitosos + 1 }))
               setInvitadosEnviados(prev => [...prev, { nombre: inv.nombre, estado: 'enviado', tiempo: 'Ahora mismo' }])
             } else {
               setProgresoEnvio(prev => ({ ...prev, enviados: prev.enviados + 1, fallidos: prev.fallidos + 1 }))
               setInvitadosEnviados(prev => [...prev, { nombre: inv.nombre, estado: 'fallido', tiempo: 'Error' }])
             }
           }
         } catch {
           setProgresoEnvio(prev => ({ ...prev, enviados: prev.enviados + 1, fallidos: prev.fallidos + 1 }))
         }
         await new Promise(r => setTimeout(r, 500)) // throttle
       }
    }
    setEnviando(false)
  }

  const tasaExito = progresoEnvio.total > 0 ? Math.round((progresoEnvio.exitosos / progresoEnvio.total) * 100) : 0

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center gap-4 mb-10">
        <h1 className="font-serif text-4xl font-bold tracking-tight">Invitaciones Masivas</h1>
        <span className="text-xs font-bold uppercase tracking-widest bg-[var(--surface-container-highest)] text-[var(--on-surface-variant)] px-3 py-1 rounded-full border border-[var(--outline-variant)]/20">Beta</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left: Steps */}
        <div className="lg:col-span-7 space-y-10">
          {/* Step 1: Curate List */}
          <div className="flex gap-6">
            <div className="w-10 h-10 rounded-full gold-gradient text-white flex items-center justify-center font-bold text-sm shrink-0">1</div>
            <div className="flex-1">
              <h2 className="font-serif text-2xl font-bold mb-4">Curar Lista de Invitados</h2>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="bg-[var(--surface-container-low)] p-10 rounded-xl border-2 border-dashed border-[var(--outline-variant)]/40 flex flex-col items-center justify-center cursor-pointer hover:border-[var(--primary)]/40 transition-colors"
              >
                <span className="material-symbols-outlined text-4xl text-[var(--primary)] mb-3">upload_file</span>
                <p className="text-sm font-semibold text-[var(--on-surface)]">Arrastra tu archivo CSV o Excel aquí</p>
                <p className="text-xs text-[var(--on-surface-variant)]">O importa desde los invitados de un evento</p>
                <input ref={fileInputRef} type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={procesarCSV} />
              </div>

              {/* Import from event */}
              <div className="mt-4 flex items-center gap-3">
                <select value={eventoId} onChange={e => setEventoId(e.target.value)}
                  className="bg-[var(--surface-container-low)] border border-[var(--outline-variant)]/30 rounded-full px-4 py-2 text-sm flex-1 focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)]">
                  <option value="">Seleccionar evento...</option>
                  {eventos.map(e => <option key={e.id} value={e.id}>{e.nombre_evento}</option>)}
                </select>
                <button onClick={importarDesdeEvento} className="bg-[var(--surface-container-highest)] text-[var(--primary)] px-4 py-2 rounded-full text-sm font-semibold hover:bg-white transition-colors">
                  Importar
                </button>
              </div>

              {nombreArchivo && (
                <div className="mt-4 flex items-center gap-3 bg-[var(--surface-container-low)] p-3 rounded-xl">
                  <span className="material-symbols-outlined text-[var(--primary)]">check_circle</span>
                  <span className="text-sm font-semibold">{nombreArchivo}</span>
                  <span className="text-sm text-[var(--on-surface-variant)]">{listaInvitados.length} Invitados Encontrados</span>
                </div>
              )}

              {/* PDF Status and Quick Action */}
              {eventoId && (
                <div className="mt-6 p-5 rounded-2xl border border-[var(--outline-variant)]/20 bg-white shadow-sm animate-in fade-in duration-300">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-[var(--primary)] mb-3">Documento de Invitación</h4>
                  {eventoDetalle?.pdf_url ? (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600">
                          <span className="material-symbols-outlined text-sm">description</span>
                        </div>
                        <div>
                          <p className="text-sm font-bold text-[var(--on-surface)]">Invitación PDF Lista</p>
                          <a href={eventoDetalle.pdf_url} target="_blank" className="text-[10px] text-emerald-600 hover:underline font-bold">Ver Archivo Actual</a>
                        </div>
                      </div>
                      <label className="cursor-pointer text-[10px] font-bold text-[var(--on-surface-variant)] hover:text-[var(--primary)] underline transition-colors">
                        Reemplazar
                        <input type="file" className="hidden" accept=".pdf" onChange={alSubirPDF} />
                      </label>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-amber-50 rounded-full flex items-center justify-center text-amber-600">
                          <span className="material-symbols-outlined text-sm">warning</span>
                        </div>
                        <div>
                          <p className="text-sm font-bold text-amber-900 leading-tight text-balance">Falta el PDF de la invitación</p>
                          <p className="text-[10px] text-amber-700">Sin el PDF, solo se enviará el texto de la plantilla.</p>
                        </div>
                      </div>
                      <label className="gold-gradient text-white px-6 py-2 rounded-full text-xs font-bold shadow-md cursor-pointer text-center active:scale-95 transition-all">
                        {subiendoPdf ? 'Subiendo...' : 'Sube el PDF ahora'}
                        <input type="file" className="hidden" accept=".pdf" onChange={alSubirPDF} />
                      </label>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Step 2: Message Customization */}
          <div className="flex gap-6">
            <div className="w-10 h-10 rounded-full gold-gradient text-white flex items-center justify-center font-bold text-sm shrink-0">2</div>
            <div className="flex-1">
              <h2 className="font-serif text-2xl font-bold mb-4">Personalización del Mensaje</h2>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-[var(--primary)] opacity-60 block mb-2">Encabezado de WhatsApp</label>
                  <input type="text" value={mensajeEncabezado} onChange={e => setMensajeEncabezado(e.target.value)}
                    className="w-full bg-[var(--surface-container-low)] border border-[var(--outline-variant)]/30 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)]" />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-[var(--primary)] opacity-60 block mb-2">Mensaje Personalizado</label>
                  <textarea value={mensajePersonalizado} onChange={e => setMensajePersonalizado(e.target.value)}
                    className="w-full bg-[var(--surface-container-low)] border border-[var(--outline-variant)]/30 rounded-xl px-4 py-3 text-sm min-h-[120px] resize-y focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)]" />
                  <p className="text-xs text-[var(--on-surface-variant)] mt-2">Usa {"{{first_name}}"} para insertar el nombre del invitado automáticamente.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Step 3: Channel & Send */}
          <div className="flex gap-6">
            <div className="w-10 h-10 rounded-full gold-gradient text-white flex items-center justify-center font-bold text-sm shrink-0">3</div>
            <div className="flex-1">
              <h2 className="font-serif text-2xl font-bold mb-4">Método de Envío</h2>
              
              <div className="flex bg-[var(--surface-container-low)] rounded-full p-1 w-fit mb-6">
                <button onClick={() => setTipoEnvio('template')}
                  className={`px-6 py-2 rounded-full text-sm font-medium transition-colors ${tipoEnvio === 'template' ? 'bg-white text-[var(--primary)] shadow-sm font-bold' : 'text-[var(--on-surface-variant)]'}`}>
                  Plantilla (Pro)
                </button>
                <button onClick={() => setTipoEnvio('text')}
                  className={`px-6 py-2 rounded-full text-sm font-medium transition-colors ${tipoEnvio === 'text' ? 'bg-white text-[var(--on-surface)] shadow-sm font-bold' : 'text-[var(--on-surface-variant)]'}`}>
                  Texto Simple
                </button>
              </div>

              {tipoEnvio === 'template' ? (
                <div className="mb-6 animate-in slide-in-from-top-2 duration-300">
                   <label className="text-xs font-bold uppercase tracking-widest text-[var(--primary)] opacity-60 block mb-2">Nombre Plantilla Meta</label>
                   <input type="text" placeholder="ej: invitacion_boreal_v1" value={nombrePlantilla} onChange={e => setNombrePlantilla(e.target.value)}
                    className="w-full bg-white border border-[var(--primary)]/30 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)]" />
                   <p className="text-[10px] text-emerald-600 font-bold mt-2 flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">verified_user</span>
                      Recomendado para evitar bloqueos por spam.
                   </p>
                </div>
              ) : (
                <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl animate-in slide-in-from-top-2 duration-300">
                   <p className="text-xs text-amber-800 flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm">warning</span>
                      El envío de texto simple sin plantilla oficial puede causar que tu número sea bloqueado si mandas muchos mensajes.
                   </p>
                </div>
              )}

              <button onClick={enviarInvitaciones} disabled={enviando || listaInvitados.length === 0}
                className="w-full gold-gradient text-white py-4 rounded-full font-bold shadow-lg active:scale-95 transition-transform disabled:opacity-50 text-sm">
                <span className="flex items-center justify-center gap-2">
                   <span className="material-symbols-outlined">{tipoEnvio === 'template' ? 'bolt' : 'send'}</span>
                   {enviando ? `Enviando... ${progresoEnvio.enviados}/${progresoEnvio.total}` : `Lanzar Invitaciones a ${listaInvitados.length} Personas`}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Right: Preview & Progress */}
        <div className="lg:col-span-5 space-y-6">
          {/* WhatsApp Preview */}
          <div className="bg-[var(--surface-container-low)] rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-widest text-[var(--primary)] opacity-60">Vista Previa</span>
            </div>
            <div className="bg-[#1a1a2e] rounded-2xl overflow-hidden shadow-xl">
              <div className="bg-[#2d2d3f] px-4 py-3 flex items-center gap-3">
                <span className="material-symbols-outlined text-white/60">arrow_back</span>
                <div className="w-8 h-8 rounded-full bg-[var(--primary)] flex items-center justify-center text-white font-bold text-xs">C</div>
                <div>
                  <p className="text-white text-sm font-semibold">Concierge de Bodas</p>
                  <p className="text-white/50 text-xs">en línea</p>
                </div>
              </div>
              <div className="p-4 space-y-3 min-h-[250px]">
                <div className="bg-[#2d2d3f] rounded-xl rounded-tl-sm p-3 max-w-[85%]">
                  <p className="text-white/90 text-sm font-semibold">{mensajeEncabezado}</p>
                </div>
                <div className="bg-[#2d2d3f] rounded-xl rounded-tl-sm p-3 max-w-[85%]">
                  <div className="w-full h-32 rounded-lg gold-gradient flex items-center justify-center mb-2">
                    <span className="text-white/80 font-serif text-lg italic">Invitación</span>
                  </div>
                </div>
                <div className="bg-[#2d2d3f] rounded-xl rounded-tl-sm p-3 max-w-[85%]">
                  <p className="text-white/80 text-xs leading-relaxed">
                    {mensajePersonalizado.replace('{{first_name}}', 'María')}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Send Progress */}
          {(enviando || progresoEnvio.total > 0) && (
            <div className="bg-white rounded-2xl p-6 border border-[var(--outline-variant)]/10 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-bold text-[var(--on-surface)]">Progreso de Envío</h4>
                {enviando && <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">VIVO</span>}
              </div>
              <div className="flex items-baseline gap-2 mb-3">
                <span className="text-xs text-[var(--on-surface-variant)]">Tasa de Éxito</span>
                <span className="font-serif text-3xl font-bold">{progresoEnvio.exitosos}</span>
                <span className="text-[var(--on-surface-variant)]">/ {progresoEnvio.total}</span>
              </div>
              <div className="w-full h-2 bg-[var(--surface-container-highest)] rounded-full overflow-hidden mb-4">
                <div className="h-full bg-emerald-500 rounded-full transition-all duration-300" style={{ width: `${progresoEnvio.total > 0 ? (progresoEnvio.enviados / progresoEnvio.total) * 100 : 0}%` }}></div>
              </div>
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {invitadosEnviados.slice(-5).map((inv, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${inv.estado === 'enviado' ? 'bg-emerald-500' : 'bg-red-400'}`}></span>
                      <span>Enviado a {inv.nombre}</span>
                    </div>
                    <span className="text-[var(--on-surface-variant)]">{inv.tiempo}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Stats */}
          {progresoEnvio.total > 0 && !enviando && (
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-[var(--surface-container-low)] rounded-xl p-4 text-center">
                <p className="font-serif text-2xl font-bold">{tasaExito}%</p>
                <p className="text-[9px] uppercase tracking-widest text-[var(--on-surface-variant)] font-bold">Tasa de Entrega</p>
              </div>
              <div className="bg-[var(--surface-container-low)] rounded-xl p-4 text-center">
                <p className="font-serif text-2xl font-bold">0.5s</p>
                <p className="text-[9px] uppercase tracking-widest text-[var(--on-surface-variant)] font-bold">Latencia Promedio</p>
              </div>
              <div className="bg-[var(--surface-container-low)] rounded-xl p-4 text-center">
                <p className="font-serif text-2xl font-bold">{progresoEnvio.exitosos}</p>
                <p className="text-[9px] uppercase tracking-widest text-[var(--on-surface-variant)] font-bold">Confirmaciones</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
