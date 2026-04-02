import { NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabase'
import { consultarEvelyn } from '@/lib/evelynIA'
import axios from 'axios'

export async function GET(solicitud) {
  const { searchParams } = new URL(solicitud.url)
  const modo = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const desafio = searchParams.get('hub.challenge')

  if (modo === 'subscribe' && token === process.env.META_VERIFY_TOKEN) {
    return new Response(desafio, { status: 200 })
  }
  return NextResponse.json({ error: 'Verificación fallida' }, { status: 403 })
}

export async function POST(solicitud) {
  try {
    const cuerpo = await solicitud.json()

    if (cuerpo.object === 'whatsapp_business_account') {
      const entrada = cuerpo.entry?.[0]
      const cambios = entrada?.changes?.[0]
      const valor = cambios?.value

      if (valor?.messages && valor.messages.length > 0) {
        const mensajeObj = valor.messages[0]
        const contactoMeta = valor.contacts?.[0]
        const remitenteId = mensajeObj.from 
        const nombrePerfil = contactoMeta?.profile?.name || 'Invitado'
        
        // Soportar texto, botones interactivos
        let texto = ''
        if (mensajeObj.type === 'text') {
          texto = mensajeObj.text?.body || ''
        } else if (mensajeObj.type === 'interactive') {
          texto = mensajeObj.interactive?.button_reply?.title || mensajeObj.interactive?.list_reply?.title || ''
        } else if (mensajeObj.type === 'button') {
          texto = mensajeObj.button?.text || ''
        }

        if (!texto) {
          console.log(`📎 Tipo no soportado: ${mensajeObj.type} de ${remitenteId}`)
          return NextResponse.json({ estado: 'tipo_no_soportado' }, { status: 200 })
        }

        // 1. Buscar o crear conversación y contacto
        let { data: convExist } = await supabase.from('wp_conversaciones').select('*').eq('id_plataforma', remitenteId).eq('plataforma', 'whatsapp').maybeSingle()
        
        // Detectar si es invitado (buscar por teléfono en wp_invitados)
        const { data: invitadoMatch } = await supabase.from('wp_invitados').select('*, wp_eventos(*)').eq('telefono', remitenteId).maybeSingle()
        
        // --- FILTRO DE PALABRA MÁGICA PARA LEADS NUEVOS ---
        const PALABRA_CLAVE = 'boreal'
        const dijoPalabraClave = texto.toLowerCase().includes(PALABRA_CLAVE)

        if (!convExist && !invitadoMatch && !dijoPalabraClave) {
          console.log(`🚫 Ignorando mensaje de ${remitenteId}: No es invitado ni conversación activa, y no dijo '${PALABRA_CLAVE}'.`)
          return NextResponse.json({ estado: 'ignorado_por_palabra_clave' }, { status: 200 })
        }
        // -------------------------------------------------

        let prosExist = null
        let tipoContacto = 'desconocido'
        let invitadoData = null

        if (invitadoMatch) {
          tipoContacto = 'invitado'
          invitadoData = invitadoMatch
        }

        // Buscar o crear prospecto
        if (convExist && convExist.prospecto_id) {
          const { data: pData } = await supabase.from('wp_prospectos').select('id').eq('id', convExist.prospecto_id).single()
          if (pData) prosExist = pData
        }
        
        if (!prosExist) {
          const { data: nuevoP } = await supabase.from('wp_prospectos').insert({ 
            nombre: nombrePerfil, 
            telefono: remitenteId, 
            estado: 'nuevo' 
          }).select('id').single()
          prosExist = nuevoP

          if (convExist) {
            await supabase.from('wp_conversaciones').update({ 
              prospecto_id: prosExist.id,
              tipo_contacto: tipoContacto,
              invitado_id: invitadoMatch?.id || null
            }).eq('id', convExist.id)
          } else {
            const { data: nuevaC } = await supabase.from('wp_conversaciones').insert({ 
              prospecto_id: prosExist.id, 
              plataforma: 'whatsapp', 
              id_plataforma: remitenteId,
              tipo_contacto: tipoContacto,
              invitado_id: invitadoMatch?.id || null
            }).select('*').single()
            convExist = nuevaC
          }
        }

        // 2. Evitar duplicados de mensajes
        const { data: existeMsg } = await supabase.from('wp_mensajes').select('id').eq('id_mensaje_meta', mensajeObj.id).maybeSingle()
        if (existeMsg) return NextResponse.json({ estado: 'ya_procesado' }, { status: 200 })

        // 3. Guardar mensaje del usuario
        await supabase.from('wp_mensajes').insert({ 
          conversacion_id: convExist.id, 
          remitente: 'usuario', 
          contenido: texto, 
          id_mensaje_meta: mensajeObj.id,
          tipo: 'texto'
        })
        await supabase.from('wp_conversaciones').update({ 
          actualizado_en: new Date().toISOString(), 
          ultimo_mensaje: texto 
        }).eq('id', convExist.id)
        
        // 4. Preparar contexto y consultar EvelynIA
        const { data: historialRaw } = await supabase.from('wp_mensajes').select('remitente, contenido').eq('conversacion_id', convExist.id).order('creado_en', { ascending: false }).limit(30)
        const { data: freshPros } = await supabase.from('wp_prospectos').select('*').eq('id', prosExist.id).single()
        
        const historialFormat = (historialRaw || []).reverse().map(m => ({
          role: m.remitente === 'usuario' ? 'user' : 'assistant',
          content: m.contenido
        }))

        // Construir contexto del evento si es invitado
        let contextoEvento = ''
        if (invitadoData && invitadoData.wp_eventos) {
          const ev = invitadoData.wp_eventos
          contextoEvento = `
CONTEXTO_EVENTO:
Nombre del Evento: ${ev.nombre_evento}
Tipo: ${ev.tipo_evento}
Fecha: ${ev.fecha_evento || 'Por definir'}
Hora: ${ev.hora_evento || 'Por definir'}
Ubicación: ${ev.ubicacion || 'Por definir'}
Link Ubicación: ${ev.link_ubicacion || 'No disponible'}
Código de Vestimenta: ${ev.codigo_vestimenta || 'No especificado'}
Descripción: ${ev.descripcion || ''}
Max Acompañantes permitidos para este invitado: ${invitadoData.max_acompanantes || 0}
Estado RSVP actual: ${invitadoData.confirmado === null ? 'Sin confirmar' : invitadoData.confirmado ? 'Confirmado' : 'Declinado'}`
        }

        const fechaActualTexto = new Date().toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'America/Mexico_City' })
        const contextoCrm = `CONTEXTO ACTUAL:
Fecha de Hoy: ${fechaActualTexto}
CONTEXTO_TIPO: ${tipoContacto}
Nombre Contacto: ${freshPros.nombre || 'Desconocido'}
Teléfono: ${remitenteId}
Estado CRM: ${freshPros.estado || 'nuevo'}
Tipo Evento Interesado: ${freshPros.tipo_evento || 'Desconocido'}
Fecha Evento Aprox: ${freshPros.fecha_evento_aprox || 'Desconocida'}
${contextoEvento}
IMPORTANTE: Si ya conoces datos, NO los preguntes de nuevo. Avanza al siguiente paso.`

        const { respuesta, datos, intencion } = await consultarEvelyn([
          { role: 'system', content: contextoCrm },
          ...historialFormat
        ], nombrePerfil, 'WhatsApp')
        
        // Evitar respuestas repetidas
        const mensajesBot = (historialRaw || []).filter(m => m.remitente === 'bot')
        const ultimasRespuestasBot = mensajesBot.slice(0, 2).map(m => m.contenido?.trim())
        const respuestaTrimmed = respuesta?.trim()
        
        if (ultimasRespuestasBot.includes(respuestaTrimmed) && intencion !== 'CIERRE_CITA' && intencion !== 'RSVP_CONFIRM') {
          console.log(`⚠️ Respuesta repetida detectada para ${remitenteId}. Reformulando...`)
          const respuestaAlternativa = "¡Gracias por tu mensaje! 😊 ¿Puedo ayudarte con algo más?"
          await supabase.from('wp_mensajes').insert({ 
            conversacion_id: convExist.id, 
            remitente: 'bot', 
            contenido: respuestaAlternativa,
            tipo: 'texto'
          })
          await enviarMensajeWhatsApp(remitenteId, respuestaAlternativa)
          return NextResponse.json({ estado: 'reformulado' }, { status: 200 })
        }

        console.log(`🤖 EvelynIA (${remitenteId}):`, { intencion, datos })
        
        // 5. Actualizar CRM según intención
        if (datos && Object.keys(datos).length > 0) {
          try {
            const updateData = { actualizado_en: new Date().toISOString() }
            if (datos.nombre) updateData.nombre = datos.nombre
            if (datos.tipo_evento) updateData.tipo_evento = datos.tipo_evento
            if (datos.fecha_evento_aprox) updateData.fecha_evento_aprox = datos.fecha_evento_aprox
            if (datos.num_invitados_aprox) updateData.num_invitados_aprox = datos.num_invitados_aprox

            const { error: crmError } = await supabase.from('wp_prospectos').update(updateData).eq('id', prosExist.id)
            if (crmError) console.error('Error actualizando prospecto:', crmError.message)
          } catch (errSync) {
            console.error('❌ Error sync CRM:', errSync.message)
          }
        }

        // 6. Manejar RSVP
        if ((intencion === 'RSVP_CONFIRM' || intencion === 'RSVP_DECLINE') && invitadoData) {
          const rsvpUpdate = {
            confirmado: intencion === 'RSVP_CONFIRM',
            fecha_confirmacion: new Date().toISOString(),
            actualizado_en: new Date().toISOString()
          }
          if (datos.num_acompanantes !== null && datos.num_acompanantes !== undefined) {
            rsvpUpdate.num_acompanantes = Math.min(parseInt(datos.num_acompanantes) || 0, invitadoData.max_acompanantes || 0)
          }
          await supabase.from('wp_invitados').update(rsvpUpdate).eq('id', invitadoData.id)
        }

        // 7. Manejar Citas
        if (intencion === 'CIERRE_CITA') {
          const { data: citasExistentes } = await supabase.from('wp_citas')
            .select('id, fecha, hora')
            .eq('prospecto_id', prosExist.id)
            .eq('estado', 'pendiente')
            .order('creado_en', { ascending: false })
            .limit(1)
            
          const citaExistente = citasExistentes && citasExistentes.length > 0 ? citasExistentes[0] : null

          let fCitaStr = datos.fecha_cita
          const regexFecha = /^\d{4}-\d{2}-\d{2}$/
          if (!fCitaStr || !regexFecha.test(fCitaStr)) {
            const diaDefecto = new Date()
            diaDefecto.setDate(diaDefecto.getDate() + 1)
            fCitaStr = diaDefecto.toISOString().split('T')[0]
          }

          if (!citaExistente) {
            await supabase.from('wp_prospectos').update({ estado: 'agendado', lead_score: 'CALIENTE' }).eq('id', prosExist.id)
            const insertCita = { 
              prospecto_id: prosExist.id, 
              fecha: fCitaStr, 
              hora: datos.hora_cita || '16:00', 
              tipo: datos.tipo_cita || 'presencial', 
              estado: 'pendiente' 
            }
            console.log('📅 Creando cita:', insertCita)
            await supabase.from('wp_citas').insert(insertCita)
          } else {
            if (datos.fecha_cita || datos.hora_cita) {
              const updateCita = {
                fecha: (datos.fecha_cita && regexFecha.test(datos.fecha_cita)) ? datos.fecha_cita : citaExistente.fecha,
                hora: datos.hora_cita || citaExistente.hora
              }
              await supabase.from('wp_citas').update(updateCita).eq('id', citaExistente.id)
              await supabase.from('wp_prospectos').update({ lead_score: 'CALIENTE' }).eq('id', prosExist.id)
            }
          }
        }

        // 8. Enviar respuesta por WhatsApp
        const opcionesLimpias = (datos?.opciones && Array.isArray(datos.opciones) && datos.opciones.length > 0) 
          ? datos.opciones.filter(o => o && typeof o === 'string' && o.trim() !== '') 
          : null

        const enviadoCorrectamente = await enviarMensajeWhatsApp(remitenteId, respuesta, null, opcionesLimpias)
        
        const respuestaFinal = enviadoCorrectamente ? respuesta : `[⚠️ WHATSAPP BLOQUEÓ EL ENVÍO]\n${respuesta}`

        await supabase.from('wp_mensajes').insert({ 
          conversacion_id: convExist.id, 
          remitente: 'bot', 
          contenido: respuestaFinal,
          tipo: 'texto'
        })
        await supabase.from('wp_conversaciones').update({ ultimo_mensaje: respuestaFinal }).eq('id', convExist.id)
      }
    }
    return NextResponse.json({ estado: 'procesado' }, { status: 200 })
  } catch (error) {
    console.error('❌ Error Webhook:', error.message, error.stack)
    return NextResponse.json({ error: 'Error interno' }, { status: 200 })
  }
}

async function enviarMensajeWhatsApp(to, mensaje, imagen = null, opciones = null) {
  const token = process.env.META_WHATSAPP_TOKEN
  const phoneId = process.env.META_PHONE_NUMBER_ID
  const url = `https://graph.facebook.com/v18.0/${phoneId}/messages`

  let payload = {
    messaging_product: "whatsapp",
    to: to,
  }

  if (imagen) {
    payload.type = "image"
    payload.image = { link: imagen, caption: mensaje }
  } else if (opciones && opciones.length > 0) {
    payload.type = "interactive"
    payload.interactive = {
      type: "button",
      body: { text: mensaje },
      action: {
        buttons: opciones.slice(0, 3).map((opt, i) => ({
          type: "reply",
          reply: { id: `btn_${i}`, title: opt.substring(0, 20) }
        }))
      }
    }
  } else {
    payload.type = "text"
    payload.text = { body: mensaje }
  }

  const headers = {
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
  }

  try {
    await axios.post(url, payload, headers)
    return true
  } catch (error) {
    console.warn(`⚠️ Error envío a ${to}:`, error.response?.data || error.message)
    
    if (to.startsWith('521') && to.length === 13) {
      console.log(`🇲🇽 Reintentando sin el '1' para México...`)
      const toCorregido = to.replace('521', '52')
      payload.to = toCorregido
      try {
        await axios.post(url, payload, headers)
        return true
      } catch (retryError) {
        console.error(`❌ Falló reintento para ${toCorregido}:`, retryError.response?.data || retryError.message)
      }
    }
    return false
  }
}
