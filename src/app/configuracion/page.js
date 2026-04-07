'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function PaginaConfiguracion() {
  const [tabactiva, setTabActiva] = useState('bot')
  const [config, setConfig] = useState(null)
  const [usuarios, setUsuarios] = useState([])
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState('')

  // Formulario nuevo usuario
  const [nuevoUsuario, setNuevoUsuario] = useState({ nombre: '', email: '', password: '', rol: 'Planner' })
  const [creandoUsuario, setCreandoUsuario] = useState(false)

  const cargarConfig = async () => {
    const { data } = await supabase.from('wp_configuracion_bot').select('*').eq('id', 1).single()
    if (data) setConfig(data)
  }

  const cargarUsuarios = async () => {
    try {
      const resp = await fetch('/api/usuarios')
      const data = await resp.json()
      if (Array.isArray(data)) setUsuarios(data)
    } catch (e) { console.error(e) }
  }

  useEffect(() => {
    const cargarTodo = async () => {
      setCargando(true)
      await Promise.all([cargarConfig(), cargarUsuarios()])
      setCargando(false)
    }
    cargarTodo()
  }, [])

  const guardarConfig = async () => {
    if (!config) return
    setGuardando(true)
    const { error } = await supabase.from('wp_configuracion_bot').update({
      nombre_agente: config.nombre_agente,
      system_prompt: config.system_prompt,
      modelo: config.modelo,
      temperatura: config.temperatura,
      actualizado_en: new Date().toISOString()
    }).eq('id', 1)
    
    setGuardando(false)
    setMensaje(error ? '❌ Error al guardar' : '✅ Configuración guardada')
    setTimeout(() => setMensaje(''), 3000)
  }

  const handleCrearUsuario = async (e) => {
    e.preventDefault()
    setCreandoUsuario(true)
    try {
      const resp = await fetch('/api/usuarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nuevoUsuario)
      })
      const res = await resp.json()
      if (resp.ok) {
        alert('✅ Usuario creado con éxito. Ya puede iniciar sesión.')
        setNuevoUsuario({ nombre: '', email: '', password: '', rol: 'Planner' })
        cargarUsuarios()
      } else {
        alert('❌ Error: ' + res.error)
      }
    } catch (e) {
      alert('❌ Error de conexión')
    } finally {
      setCreandoUsuario(false)
    }
  }

  const handleEliminarUsuario = async (id) => {
    if (!confirm('¿Seguro que quieres eliminar a este miembro del equipo?')) return
    try {
      const resp = await fetch(`/api/usuarios?id=${id}`, { method: 'DELETE' })
      if (resp.ok) {
        cargarUsuarios()
      } else {
        const res = await resp.json()
        alert('❌ Error: ' + res.error)
      }
    } catch (e) { console.error(e) }
  }

  if (cargando) return (
    <div className="flex items-center justify-center h-screen bg-[var(--surface)]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-[var(--gold-soft)] border-t-[var(--primary)] rounded-full animate-spin"></div>
        <p className="text-[var(--on-surface-muted)] font-serif animate-pulse">Abriendo panel de control...</p>
      </div>
    </div>
  )

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-extrabold text-[var(--on-surface)] tracking-tight font-serif">Configuración</h1>
          <p className="text-[var(--on-surface-muted)] mt-1 italic">Personaliza tu entorno de trabajo y equipo.</p>
        </div>
        
        {/* Tabs */}
        <div className="flex bg-[var(--surface-container)] p-1 rounded-2xl">
          <button 
            onClick={() => setTabActiva('bot')}
            className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${tabactiva === 'bot' ? 'bg-white text-[var(--primary)] shadow-sm' : 'text-[var(--on-surface-variant)] hover:bg-white/50'}`}
          >
            🤖 Evelyn IA
          </button>
          <button 
            onClick={() => setTabActiva('equipo')}
            className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${tabactiva === 'equipo' ? 'bg-white text-[var(--primary)] shadow-sm' : 'text-[var(--on-surface-variant)] hover:bg-white/50'}`}
          >
            👥 Equipo
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-8 shadow-ambient-sm border border-[var(--outline-variant)]/10">
        
        {/* TAB: BOT CONFIG */}
        {tabactiva === 'bot' && config && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold uppercase tracking-widest text-[var(--primary)] opacity-70">Nombre del Agente AI</label>
                <input
                  type="text"
                  value={config.nombre_agente || ''}
                  onChange={e => setConfig({ ...config, nombre_agente: e.target.value })}
                  className="bg-[var(--surface-container-low)] border border-[var(--outline-variant)]/20 rounded-2xl px-5 py-4 outline-none text-[var(--on-surface)] focus:ring-2 focus:ring-[var(--primary)]/20 transition-all font-medium"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold uppercase tracking-widest text-[var(--primary)] opacity-70">Modelo de Inteligencia</label>
                <select
                  value={config.modelo || 'gpt-4o'}
                  onChange={e => setConfig({ ...config, modelo: e.target.value })}
                  className="bg-[var(--surface-container-low)] border border-[var(--outline-variant)]/20 rounded-2xl px-5 py-4 outline-none text-[var(--on-surface)] focus:ring-2 focus:ring-[var(--primary)]/20 transition-all font-bold"
                >
                  <option value="gpt-4o">OpenAI GPT-4o (Recomendado)</option>
                  <option value="gpt-4o-mini">OpenAI GPT-4o Mini (Económico)</option>
                  <option value="gpt-4-turbo">OpenAI GPT-4 Turbo</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-4 p-6 bg-[var(--surface-container-lowest)] rounded-2xl border border-[var(--outline-variant)]/10">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold uppercase tracking-widest text-[var(--primary)] opacity-70">Temperatura Creativa</label>
                <span className="bg-[var(--primary)] text-white px-3 py-1 rounded-full text-[10px] font-bold">{config.temperatura}</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={config.temperatura || 0.7}
                onChange={e => setConfig({ ...config, temperatura: parseFloat(e.target.value) })}
                className="w-full accent-[var(--primary)] cursor-pointer h-2 bg-gray-200 rounded-lg appearance-none"
              />
              <div className="flex justify-between text-[10px] font-bold text-[var(--on-surface-variant)] uppercase tracking-tighter opacity-50">
                <span>🤖 Literal / Preciso</span>
                <span>🎨 Creativo / Humano</span>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold uppercase tracking-widest text-[var(--primary)] opacity-70">Instrucciones Maestras (System Prompt)</label>
                <span className="material-symbols-outlined text-[14px] text-[var(--on-surface-variant)] cursor-help" title="Define cómo debe comportarse la IA con los novios.">info</span>
              </div>
              <textarea
                value={config.system_prompt || ''}
                onChange={e => setConfig({ ...config, system_prompt: e.target.value })}
                className="bg-[var(--surface-container-low)] border border-[var(--outline-variant)]/20 rounded-2xl px-5 py-4 outline-none text-sm text-[var(--on-surface)] focus:ring-2 focus:ring-[var(--primary)]/20 transition-all min-h-[350px] resize-y font-mono leading-relaxed"
                placeholder="Escribe aquí las directrices que seguirá Evelyn..."
              />
            </div>

            <div className="pt-6 border-t border-[var(--outline-variant)]/10 flex items-center gap-6">
              <button 
                onClick={guardarConfig} 
                disabled={guardando} 
                className="gold-gradient text-white px-10 py-4 rounded-2xl font-bold shadow-xl active:scale-95 transition-all disabled:opacity-50 flex items-center gap-3"
              >
                {guardando ? (
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                ) : (
                  <span className="material-symbols-outlined">save</span>
                )}
                {guardando ? 'Guardando...' : 'Aplicar Cambios'}
              </button>
              {mensaje && (
                <div className="animate-in fade-in slide-in-from-left-2 text-sm font-bold flex items-center gap-2">
                  <span className="material-symbols-outlined text-green-600">verified</span>
                  {mensaje}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB: EQUIPO / TEAM */}
        {tabactiva === 'equipo' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-10">
            
            {/* Lista de Miembros */}
            <div>
              <h3 className="text-lg font-serif font-bold text-[var(--primary)] mb-6">Miembros del Proyecto</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {usuarios.length === 0 ? (
                  <div className="col-span-2 py-10 text-center text-[var(--on-surface-variant)] italic">No se pudieron cargar los usuarios.</div>
                ) : usuarios.map(user => (
                  <div key={user.id} className="flex items-center justify-between p-5 bg-[var(--surface-container-lowest)] rounded-2xl border border-[var(--outline-variant)]/10 group hover:border-[var(--primary)]/30 transition-all">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-[var(--surface-container-highest)] flex items-center justify-center text-[var(--primary)] font-serif text-xl font-bold">
                        {user.nombre.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-[var(--on-surface)] leading-tight">{user.nombre}</p>
                        <p className="text-xs text-[var(--on-surface-variant)]">{user.email}</p>
                        <span className={`inline-block mt-2 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest ${user.rol === 'Admin' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                          {user.rol}
                        </span>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleEliminarUsuario(user.id)}
                      className="w-10 h-10 rounded-full flex items-center justify-center text-red-300 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                      title="Eliminar acceso"
                    >
                      <span className="material-symbols-outlined text-lg">delete</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Formulario Nuevo Miembro */}
            <div className="pt-10 border-t border-[var(--outline-variant)]/10">
              <div className="bg-[var(--surface-container-low)] rounded-3xl p-8">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 rounded-2xl gold-gradient flex items-center justify-center text-white">
                    <span className="material-symbols-outlined">person_add</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-serif font-bold text-[var(--on-surface)]">Añadir Nuevo Miembro</h3>
                    <p className="text-xs text-[var(--on-surface-variant)]">Crea un acceso manual para alguien de tu equipo.</p>
                  </div>
                </div>

                <form onSubmit={handleCrearUsuario} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--primary)]">Nombre Completo</label>
                    <input 
                      type="text" 
                      required
                      value={nuevoUsuario.nombre}
                      onChange={e => setNuevoUsuario({...nuevoUsuario, nombre: e.target.value})}
                      placeholder="Ej: Sofía López"
                      className="bg-white border border-[var(--outline-variant)]/20 rounded-2xl px-5 py-4 outline-none text-sm focus:ring-2 focus:ring-[var(--primary)]/20 transition-all"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--primary)]">Correo Electrónico</label>
                    <input 
                      type="email" 
                      required
                      value={nuevoUsuario.email}
                      onChange={e => setNuevoUsuario({...nuevoUsuario, email: e.target.value})}
                      placeholder="sofia@eventosboreal.com"
                      className="bg-white border border-[var(--outline-variant)]/20 rounded-2xl px-5 py-4 outline-none text-sm focus:ring-2 focus:ring-[var(--primary)]/20 transition-all"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--primary)]">Contraseña Inicial</label>
                    <input 
                      type="password" 
                      required
                      value={nuevoUsuario.password}
                      onChange={e => setNuevoUsuario({...nuevoUsuario, password: e.target.value})}
                      placeholder="••••••••"
                      className="bg-white border border-[var(--outline-variant)]/20 rounded-2xl px-5 py-4 outline-none text-sm focus:ring-2 focus:ring-[var(--primary)]/20 transition-all"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--primary)]">Rol en el Proyecto</label>
                    <select 
                      value={nuevoUsuario.rol}
                      onChange={e => setNuevoUsuario({...nuevoUsuario, rol: e.target.value})}
                      className="bg-white border border-[var(--outline-variant)]/20 rounded-2xl px-5 py-4 outline-none text-sm font-bold focus:ring-2 focus:ring-[var(--primary)]/20 transition-all"
                    >
                      <option value="Planner">Wedding Planner (Operativo)</option>
                      <option value="Admin">Administrador (Control Total)</option>
                    </select>
                  </div>
                  <div className="md:col-span-2 pt-4">
                    <button 
                      type="submit" 
                      disabled={creandoUsuario}
                      className="w-full md:w-auto bg-[var(--primary)] text-white px-12 py-4 rounded-2xl font-bold hover:scale-[1.02] active:scale-95 transition-all shadow-lg disabled:opacity-50"
                    >
                      {creandoUsuario ? 'Creando...' : 'Crear Acceso Manual'}
                    </button>
                  </div>
                </form>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  )
}
