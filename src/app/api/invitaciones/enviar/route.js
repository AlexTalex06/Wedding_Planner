import { NextResponse } from 'next/server'
import axios from 'axios'
import { supabaseAdmin as supabase } from '@/lib/supabase'

export async function POST(solicitud) {
  try {
    const { invitados, nombrePlantilla, eventoId } = await solicitud.json()
    
    if (!invitados || !Array.isArray(invitados) || invitados.length === 0) {
      return NextResponse.json({ error: 'No hay invitados para procesar' }, { status: 400 })
    }

    if (!nombrePlantilla) {
      return NextResponse.json({ error: 'El nombre de la plantilla es obligatorio para envíos pro' }, { status: 400 })
    }

    // 0. Obtener PDF del evento si existe
    let pdfUrl = null
    if (eventoId) {
       const { data: ev } = await supabase.from('wp_eventos').select('pdf_url').eq('id', eventoId).single()
       pdfUrl = ev?.pdf_url
    }

    const token = process.env.META_WHATSAPP_TOKEN
    const phoneId = process.env.META_PHONE_NUMBER_ID
    const url = `https://graph.facebook.com/v18.0/${phoneId}/messages`
    
    const h = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }

    const resultados = []

    for (let inv of invitados) {
      // Normalización de número
      let to = inv.telefono?.replace(/\D/g, '')
      if (!to) {
        resultados.push({ nombre: inv.nombre, exito: false, error: 'Sin teléfono' })
        continue
      }

      // Preparar payload de plantilla
      const payload = {
        messaging_product: 'whatsapp',
        to: to,
        type: 'template',
        template: {
          name: nombrePlantilla,
          language: { code: 'es_MX' },
          components: [
            {
              type: 'body',
              parameters: [
                { type: 'text', text: inv.nombre.split(' ')[0] } // {{1}} - Primer nombre
              ]
            }
          ]
        }
      }

      // Si hay PDF, enviar como header
      if (pdfUrl) {
        payload.template.components.unshift({
          type: 'header',
          parameters: [
            {
              type: 'document',
              document: { 
                link: pdfUrl, 
                filename: 'Invitacion.pdf' 
              }
            }
          ]
        })
      }

      try {
        const res = await axios.post(url, payload, { headers: h })
        resultados.push({ nombre: inv.nombre, exito: true, messageId: res.data.messages[0].id })
        
        // Registrar mensaje en la DB si tenemos el ID del invitado real
        if (inv.real_id) {
           // Opcional: registrar en wp_mensajes o log de envíos
        }

      } catch (error) {
        console.warn(`❌ Fallo envío template a ${to}:`, error.response?.data || error.message)
        
        // Intento de corrección para México (521 -> 52)
        if (to.startsWith('521') && to.length === 13) {
           payload.to = to.replace('521', '52')
           try {
             const retry = await axios.post(url, payload, { headers: h })
             resultados.push({ nombre: inv.nombre, exito: true, corregido: true, messageId: retry.data.messages[0].id })
             continue
           } catch (e2) {}
        }
        
        resultados.push({ nombre: inv.nombre, exito: false, error: error.response?.data?.error?.message || 'Error Meta' })
      }
      
      // Throttle para no saturar la API
      await new Promise(r => setTimeout(r, 200))
    }

    return NextResponse.json({ exito: true, resultados }, { status: 200 })

  } catch (error) {
    console.error('Error en motor de invitaciones:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
