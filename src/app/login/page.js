'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function PaginaLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)
  const [mostrarPassword, setMostrarPassword] = useState(false)
  const router = useRouter()

  const iniciarSesion = async (e) => {
    e.preventDefault()
    setError('')
    setCargando(true)

    const { data, error: err } = await supabase.auth.signInWithPassword({ email, password })
    
    if (err) {
      if (err.message.includes('Invalid login')) {
        setError('Correo o contraseña incorrectos.')
      } else {
        setError(err.message)
      }
      setCargando(false)
      return
    }

    if (data.session) {
      router.push('/')
    }
    setCargando(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--surface-dim)] p-6">
      <div className="w-full max-w-5xl bg-white rounded-3xl shadow-2xl overflow-hidden flex min-h-[600px]" style={{ animation: 'fadeIn 0.5s ease-out' }}>
        {/* Left: Hero Image */}
        <div className="hidden lg:flex w-1/2 relative overflow-hidden">
          <div className="absolute inset-0 gold-gradient opacity-90 z-10"></div>
          <div className="absolute inset-0 z-20 flex flex-col justify-end p-12">
            <h2 className="text-white text-4xl font-serif leading-tight mb-4">La excelencia en cada detalle.</h2>
            <p className="text-white/80 leading-relaxed">
              Acceda a su panel exclusivo de gestión para eventos que definen el lujo moderno.
            </p>
          </div>
        </div>

        {/* Right: Form */}
        <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-12">
          <div className="w-full max-w-sm">
            <div className="text-center mb-10">
              <h1 className="font-serif text-3xl tracking-[0.15em] text-[var(--primary)] mb-2">
                Concierge Moderno
              </h1>
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--on-surface-variant)]">Especialista en Eventos</p>
            </div>

            <h2 className="font-serif text-2xl text-center mb-8">Bienvenido de nuevo</h2>

            <form onSubmit={iniciarSesion} className="space-y-5">
              <div>
                <label className="text-sm font-medium text-[var(--on-surface)] block mb-2">Correo Electrónico</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="nombre@ejemplo.com"
                  className="w-full bg-[var(--surface-container)] rounded-xl px-5 py-3.5 text-sm outline-none focus:ring-2 focus:ring-[var(--primary)]/20 transition-all border-none"
                  required
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-medium text-[var(--on-surface)]">Contraseña</label>
                  <button type="button" className="text-[10px] uppercase tracking-widest text-[var(--primary)] font-bold hover:underline">
                    ¿Olvidó su contraseña?
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={mostrarPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-[var(--surface-container)] rounded-xl px-5 py-3.5 text-sm outline-none focus:ring-2 focus:ring-[var(--primary)]/20 transition-all border-none pr-12"
                    required
                  />
                  <button type="button" onClick={() => setMostrarPassword(!mostrarPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--on-surface-variant)]">
                    <span className="material-symbols-outlined text-lg">{mostrarPassword ? 'visibility_off' : 'visibility'}</span>
                  </button>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 text-red-600 text-xs font-semibold rounded-xl px-4 py-3 border border-red-200">
                  {error}
                </div>
              )}

              <button type="submit" disabled={cargando}
                className="w-full gold-gradient text-white py-4 rounded-full font-bold text-sm uppercase tracking-[0.15em] shadow-lg hover:opacity-90 transition-all active:scale-[0.98] disabled:opacity-50">
                {cargando ? 'Iniciando sesión...' : 'Iniciar Sesión'}
              </button>
            </form>

            <div className="mt-8 text-center">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 h-px bg-[var(--outline-variant)]/30"></div>
                <span className="text-[10px] uppercase tracking-widest text-[var(--on-surface-variant)]">Autenticación Segura</span>
                <div className="flex-1 h-px bg-[var(--outline-variant)]/30"></div>
              </div>
              <p className="text-[10px] uppercase tracking-widest text-[var(--on-surface-variant)] opacity-50">
                © 2024 Concierge Moderno. Acceso restringido para administradores.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
