import { useEffect, useState, useRef } from 'react'
import '../../styles/comunicacion.css'
import {
  fetchConversaciones,
  fetchNotificaciones,
  fetchUsuarios,
  fetchMensajesEntrada,
  fetchAsignaturas,
  fetchNotas,
} from '../../api'

const CURSO_NOMBRE = {
  1: 'Ingeniería en Informática',
  2: 'Diseño Gráfico',
  3: 'Administración de Empresas',
}

const fmtDate = (d) => {
  if (!d) return '—'
  const dt = new Date(d)
  if (isNaN(dt)) return d
  const diff = Date.now() - dt
  if (diff < 86400000)  return dt.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })
  if (diff < 604800000) return dt.toLocaleDateString('es-CL', { weekday: 'short' })
  return dt.toLocaleDateString('es-CL', { day: '2-digit', month: 'short' })
}

const hashHue = (s = '') => [...s].reduce((a, c) => a + c.charCodeAt(0), 0) % 360

const Avatar = ({ name = '?', size = 40 }) => {
  const initials = name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || '?'
  const h = hashHue(name)
  return (
    <div
      className="comunicacion-avatar"
      style={{
        width: size, height: size,
        background: `hsl(${h},50%,88%)`,
        color: `hsl(${h},50%,32%)`,
        fontSize: size * 0.36,
      }}
    >
      {initials}
    </div>
  )
}

const Pill = ({ label, color, bg }) => (
  <span className="comunicacion-pill" style={{ color, background: bg }}>{label}</span>
)

const Alert = ({ type, children }) => (
  <div className={`com-alert com-alert--${type === 'ok' ? 'ok' : 'error'}`}>{children}</div>
)

const Field = ({ label, children }) => (
  <div className="com-field">
    <label>{label}</label>
    {children}
  </div>
)

const Empty = ({ icon, title, sub }) => (
  <div className="comunicacion-empty">
    <div className="comunicacion-empty__icon">{icon}</div>
    <div className="comunicacion-empty__title">{title}</div>
    <div className="comunicacion-empty__sub">{sub}</div>
  </div>
)

const Overlay = ({ children }) => (
  <div className="com-overlay">{children}</div>
)

const GATEWAY_URL = typeof window !== 'undefined'
  ? (window._env_?.VITE_GATEWAY_URL || 'https://sistema-gateway.onrender.com')
  : 'https://sistema-gateway.onrender.com'

async function getOrCreateConversacion(emisorId, receptorId) {
  const token = localStorage.getItem('token')
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
  const res = await fetch(`${GATEWAY_URL}/api/comunicacion/conversaciones/${emisorId}`, { headers })
  if (res.ok) {
    const convs = await res.json()
    const existing = convs.find(c =>
      (Number(c.participante1Id) === Number(emisorId) && Number(c.participante2Id) === Number(receptorId)) ||
      (Number(c.participante1Id) === Number(receptorId) && Number(c.participante2Id) === Number(emisorId))
    )
    if (existing) return existing
  }
  const crear = await fetch(`${GATEWAY_URL}/api/comunicacion/conversaciones`, {
    method: 'POST', headers,
    body: JSON.stringify({ participante1Id: emisorId, participante2Id: receptorId }),
  })
  if (crear.ok) return await crear.json()
  throw new Error('No se pudo crear la conversación')
}

async function fetchMensajesConversacion(convId) {
  const token = localStorage.getItem('token')
  const headers = { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
  const res = await fetch(`${GATEWAY_URL}/api/comunicacion/conversaciones/${convId}/mensajes`, { headers })
  if (!res.ok) return []
  return res.json()
}

async function enviarMensajeConConv(payload) {
  const token = localStorage.getItem('token')
  const res = await fetch(`${GATEWAY_URL}/api/comunicacion/mensajes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(`Error ${res.status}`)
  return res.json()
}

function MensajeDetalle({ mensaje, getName, onClose }) {
  return (
    <Overlay>
      <div className="com-conv-modal" style={{ height: 'auto', maxWidth: 540 }}>
        <div className="com-conv-modal__header">
          <Avatar name={getName(mensaje.emisorId)} size={40} />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700 }}>{getName(mensaje.emisorId)}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--com-text-sub)' }}>{fmtDate(mensaje.fechaEnvio)}</div>
          </div>
          <button onClick={onClose} className="com-btn-ghost" style={{ padding: '0', width: 32, height: 32, borderRadius: 8 }}>×</button>
        </div>
        {mensaje.asunto && mensaje.asunto !== 'Re:' && mensaje.asunto !== 'Sin asunto' && (
          <div style={{ padding: '14px 22px 0', fontWeight: 700, fontSize: '1rem' }}>{mensaje.asunto}</div>
        )}
        <div style={{ padding: '16px 22px 24px', fontSize: '0.92rem', lineHeight: 1.65 }}>{mensaje.contenido}</div>
      </div>
    </Overlay>
  )
}

function NotificacionDetalle({ notif, onClose }) {
  const tipoMap = {
    NUEVO_MENSAJE:  { icon: '💬', label: 'Mensaje'  },
    MENSAJE_GRUPAL: { icon: '👥', label: 'Grupal'   },
    RECORDATORIO:   { icon: '⏰', label: 'Recordar' },
    ANUNCIO:        { icon: '📢', label: 'Anuncio'  },
  }
  const t = tipoMap[notif.tipo] || { icon: '🔔', label: notif.tipo }
  return (
    <Overlay>
      <div className="com-conv-modal" style={{ height: 'auto', maxWidth: 480 }}>
        <div className="com-conv-modal__header">
          <div className="comunicacion-stat-card__icon" style={{ background: 'var(--com-primary-lt)', borderRadius: 12, fontSize: '1.3rem' }}>{t.icon}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700 }}>{t.label}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--com-text-sub)' }}>{fmtDate(notif.fechaCreacion)}</div>
          </div>
          <button onClick={onClose} className="com-btn-ghost" style={{ padding: 0, width: 32, height: 32, borderRadius: 8 }}>×</button>
        </div>
        <div style={{ padding: '20px 22px 28px', fontSize: '0.95rem', lineHeight: 1.65 }}>{notif.contenido}</div>
      </div>
    </Overlay>
  )
}

function ConversacionDetalle({ conv, currentUser, getName, getAsignaturaLabel, onClose, onReply }) {
  const [thread, setThread]               = useState([])
  const [reply, setReply]                 = useState('')
  const [sending, setSending]             = useState(false)
  const [loadingThread, setLoadingThread] = useState(true)
  const bottomRef = useRef(null)

  const other = Number(conv.participante1Id) === Number(currentUser.id)
    ? conv.participante2Id : conv.participante1Id
  const otherName = getName(other)
  const asigLabel = getAsignaturaLabel ? getAsignaturaLabel(Number(other)) : ''

  const loadThread = async () => {
    setLoadingThread(true)
    const msgs = await fetchMensajesConversacion(conv.id)
    setThread(Array.isArray(msgs) ? msgs.sort((a, b) => new Date(a.fechaEnvio) - new Date(b.fechaEnvio)) : [])
    setLoadingThread(false)
  }

  useEffect(() => { loadThread() }, [conv.id])
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [thread])

  const handleReply = async () => {
    if (!reply.trim()) return
    setSending(true)
    try {
      await enviarMensajeConConv({
        emisorId: currentUser.id,
        receptorId: Number(other),
        conversacionId: conv.id,
        asunto: 'Re:',
        contenido: reply,
      })
      setReply('')
      await loadThread()
      onReply()
    } catch (e) { console.error('Error al responder:', e) }
    finally { setSending(false) }
  }

  return (
    <Overlay>
      <div className="com-conv-modal">
        <div className="com-conv-modal__header">
          <Avatar name={otherName} size={40} />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: '1rem' }}>{otherName}</div>
            {asigLabel && <div className="comunicacion-asig-label">{asigLabel}</div>}
            <div style={{ fontSize: '0.73rem', color: 'var(--com-text-sub)', marginTop: 2 }}>
              {loadingThread ? 'Cargando…' : `${thread.length} mensaje${thread.length !== 1 ? 's' : ''}`}
            </div>
          </div>
          <button onClick={onClose} className="com-btn-ghost" style={{ padding: 0, width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
        </div>

        <div className="com-conv-modal__body">
          {loadingThread && <div style={{ textAlign: 'center', color: 'var(--com-text-sub)', paddingTop: 40, fontSize: '0.88rem' }}>Cargando mensajes…</div>}
          {!loadingThread && thread.length === 0 && <div style={{ textAlign: 'center', color: 'var(--com-text-sub)', paddingTop: 40, fontSize: '0.9rem' }}>Sé el primero en escribir.</div>}
          <div style={{ display: 'block', width: '100%' }}>
            {thread.map(m => {
              const mine = Number(m.emisorId) === Number(currentUser.id)
              return (
                <div key={m.id} style={{ display: 'block', width: '100%', marginBottom: 10, textAlign: mine ? 'right' : 'left', clear: 'both' }}>
                  <div className={`com-bubble com-bubble--${mine ? 'mine' : 'other'}`}>
                    {m.asunto && m.asunto !== 'Re:' && m.asunto !== 'Sin asunto' && (
                      <div style={{ fontWeight: 700, fontSize: '0.72rem', marginBottom: 4, opacity: 0.65, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{m.asunto}</div>
                    )}
                    <span>{m.contenido}</span>
                    <span className="com-bubble__time">{fmtDate(m.fechaEnvio)}</span>
                  </div>
                </div>
              )
            })}
          </div>
          <div ref={bottomRef} />
        </div>

        <div className="com-conv-modal__footer">
          <textarea
            value={reply}
            onChange={e => setReply(e.target.value)}
            placeholder="Escribe tu respuesta..."
            className="com-reply-textarea"
          />
          <button
            onClick={handleReply}
            disabled={sending || !reply.trim()}
            className="com-send-btn"
            style={{ background: reply.trim() && !sending ? 'var(--com-primary)' : '#c7d2fe' }}
          >
            {sending ? '…' : '➜'}
          </button>
        </div>
      </div>
    </Overlay>
  )
}

function NuevoMensaje({ currentUser, usuarios, asignaturas, notas, onClose, onSent }) {
  const [selectedKey, setSelectedKey] = useState('')
  const [asunto, setAsunto]           = useState('')
  const [contenido, setContenido]     = useState('')
  const [status, setStatus]           = useState('')
  const [sending, setSending]         = useState(false)

  const rol = currentUser?.rol
  const opcionesProfesores = []
  const opcionesCompaneros = []

  if (rol === 'ESTUDIANTE') {
    const cursoId = currentUser.cursoId || currentUser.curso_id
    const misAsig = asignaturas.filter(a => Number(a.cursoId) === Number(cursoId))
    const profMap = {}
    misAsig.forEach(a => {
      const prof = usuarios.find(u => Number(u.id) === Number(a.profesorId))
      if (!prof) return
      if (!profMap[prof.id]) profMap[prof.id] = { prof, asigs: [] }
      profMap[prof.id].asigs.push(a.nombre)
    })
    Object.values(profMap).forEach(({ prof, asigs }) => {
      opcionesProfesores.push({ key: `prof-${prof.id}`, receptorId: prof.id, label: `${prof.nombre} ${prof.apellido} — ${asigs.join(', ')}` })
    })
    usuarios
      .filter(u => u.rol === 'ESTUDIANTE' && Number(u.cursoId) === Number(cursoId) && Number(u.id) !== Number(currentUser.id))
      .forEach(u => {
        opcionesCompaneros.push({ key: `comp-${u.id}`, receptorId: u.id, label: `${u.nombre} ${u.apellido}` })
      })
  }

  const gruposProfesor = []
  if (rol === 'PROFESOR') {
    const misAsig = asignaturas.filter(a => Number(a.profesorId) === Number(currentUser.id))
    misAsig.forEach(asig => {
      const carreraNombre = CURSO_NOMBRE[asig.cursoId] || `Carrera ${asig.cursoId}`
      const groupLabel = `📚 ${asig.nombre} — ${carreraNombre}`
      const estudiantesDeCurso = usuarios.filter(u => u.rol === 'ESTUDIANTE' && Number(u.cursoId) === Number(asig.cursoId))
      const opciones = estudiantesDeCurso.map(u => ({ key: `est-${u.id}-${asig.id}`, receptorId: u.id, label: `${u.nombre} ${u.apellido}` }))
      if (opciones.length > 0) gruposProfesor.push({ groupKey: `asig-${asig.id}`, groupLabel, opciones })
    })
  }

  const opcionesAdmin = []
  if (rol === 'ADMINISTRADOR') {
    usuarios.filter(u => Number(u.id) !== Number(currentUser.id)).forEach(u => {
      let extra = ''
      if (u.rol === 'PROFESOR') {
        const asigs = asignaturas.filter(a => Number(a.profesorId) === Number(u.id))
        if (asigs.length > 0) extra = ` (${asigs.map(a => a.nombre).join(', ')})`
      }
      opcionesAdmin.push({ key: `admin-${u.id}`, receptorId: u.id, label: `${u.nombre} ${u.apellido} — ${u.rol}${extra}` })
    })
  }

  const todasOpciones = [...opcionesProfesores, ...opcionesCompaneros, ...gruposProfesor.flatMap(g => g.opciones), ...opcionesAdmin]
  const opcionSeleccionada = todasOpciones.find(o => o.key === selectedKey)
  const profesorSinEstudiantes = rol === 'PROFESOR' && gruposProfesor.length === 0

  const handleSend = async () => {
    if (!opcionSeleccionada || !contenido.trim()) { setStatus('error'); return }
    setSending(true)
    try {
      const conv = await getOrCreateConversacion(Number(currentUser.id), Number(opcionSeleccionada.receptorId))
      await enviarMensajeConConv({
        emisorId: currentUser.id,
        receptorId: Number(opcionSeleccionada.receptorId),
        conversacionId: conv.id,
        asunto: asunto || 'Sin asunto',
        contenido,
      })
      setStatus('ok')
      setTimeout(() => { onSent(); onClose() }, 900)
    } catch (e) {
      console.error(e)
      setStatus('error')
    } finally { setSending(false) }
  }

  return (
    <Overlay>
      <div className="com-conv-modal" style={{ height: 'auto', maxWidth: 520, padding: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22 }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>Nuevo mensaje</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--com-text-sub)', marginTop: 3 }}>
              {rol === 'ESTUDIANTE' ? 'Escribe a tus profesores o compañeros'
                : rol === 'PROFESOR' ? 'Escribe a tus estudiantes por asignatura'
                : 'Elige destinatario'}
            </div>
          </div>
          <button onClick={onClose} className="com-btn-ghost" style={{ padding: 0, width: 30, height: 30, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
        </div>

        {profesorSinEstudiantes ? (
          <div style={{ textAlign: 'center', padding: '32px 0' }}>
            <div style={{ fontSize: '2rem', marginBottom: 10 }}>👥</div>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>Sin estudiantes asignados</div>
            <div style={{ fontSize: '0.83rem', color: 'var(--com-text-sub)' }}>
              No tienes estudiantes en tus asignaturas aún.<br />Contacta al administrador para revisar la asignación.
            </div>
            <button className="com-btn-ghost" style={{ marginTop: 20 }} onClick={onClose}>Cerrar</button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Field label="Para">
              <select value={selectedKey} onChange={e => setSelectedKey(e.target.value)} className="com-inp">
                <option value="">Selecciona destinatario…</option>
                {rol === 'ESTUDIANTE' && opcionesProfesores.length > 0 && (
                  <optgroup label="👨‍🏫 Mis profesores">
                    {opcionesProfesores.map(o => <option key={o.key} value={o.key}>{o.label}</option>)}
                  </optgroup>
                )}
                {rol === 'ESTUDIANTE' && opcionesCompaneros.length > 0 && (
                  <optgroup label="👥 Compañeros de curso">
                    {opcionesCompaneros.map(o => <option key={o.key} value={o.key}>{o.label}</option>)}
                  </optgroup>
                )}
                {rol === 'PROFESOR' && gruposProfesor.map(g => (
                  <optgroup key={g.groupKey} label={g.groupLabel}>
                    {g.opciones.map(o => <option key={o.key} value={o.key}>{o.label}</option>)}
                  </optgroup>
                ))}
                {rol === 'ADMINISTRADOR' && (
                  <>
                    <optgroup label="👑 Administradores">
                      {opcionesAdmin.filter(o => usuarios.find(u => Number(u.id) === Number(o.receptorId))?.rol === 'ADMINISTRADOR').map(o => <option key={o.key} value={o.key}>{o.label}</option>)}
                    </optgroup>
                    <optgroup label="👨‍🏫 Profesores">
                      {opcionesAdmin.filter(o => usuarios.find(u => Number(u.id) === Number(o.receptorId))?.rol === 'PROFESOR').map(o => <option key={o.key} value={o.key}>{o.label}</option>)}
                    </optgroup>
                    <optgroup label="🎓 Estudiantes">
                      {opcionesAdmin.filter(o => usuarios.find(u => Number(u.id) === Number(o.receptorId))?.rol === 'ESTUDIANTE').map(o => <option key={o.key} value={o.key}>{o.label}</option>)}
                    </optgroup>
                  </>
                )}
              </select>
            </Field>
            <Field label="Asunto (opcional)">
              <input value={asunto} onChange={e => setAsunto(e.target.value)} placeholder="Título del mensaje" className="com-inp" />
            </Field>
            <Field label="Mensaje">
              <textarea value={contenido} onChange={e => setContenido(e.target.value)} placeholder="Escribe aquí…" rows={4} className="com-inp" style={{ resize: 'vertical' }} />
            </Field>
            {status === 'error' && <Alert type="error">Completa destinatario y mensaje.</Alert>}
            {status === 'ok'    && <Alert type="ok">Mensaje enviado.</Alert>}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
              <button className="com-btn-ghost" onClick={onClose}>Cancelar</button>
              <button className="com-btn-primary" style={{ opacity: sending ? 0.6 : 1 }} onClick={handleSend} disabled={sending}>
                {sending ? 'Enviando…' : 'Enviar mensaje →'}
              </button>
            </div>
          </div>
        )}
      </div>
    </Overlay>
  )
}

function EmailForm() {
  const [dest, setDest]     = useState('')
  const [asunto, setAsunto] = useState('')
  const [msg, setMsg]       = useState('')
  const [status, setStatus] = useState('')
  const send = () => {
    if (!dest || !asunto || !msg) { setStatus('error'); return }
    window.location.href = `mailto:${dest}?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(msg)}`
    setStatus('ok')
    setTimeout(() => { setDest(''); setAsunto(''); setMsg(''); setStatus('') }, 3000)
  }
  return (
    <div className="comunicacion-email-form">
      <div className="comunicacion-email-form__grid">
        <Field label="Destinatario (email)">
          <input type="email" value={dest} onChange={e => setDest(e.target.value)} placeholder="alumno@duocuc.cl" className="com-inp" />
        </Field>
        <Field label="Asunto">
          <input value={asunto} onChange={e => setAsunto(e.target.value)} placeholder="Asunto del aviso" className="com-inp" />
        </Field>
      </div>
      <Field label="Mensaje">
        <textarea value={msg} onChange={e => setMsg(e.target.value)} placeholder="Contenido del correo…" rows={3} className="com-inp" style={{ resize: 'vertical' }} />
      </Field>
      {status === 'error' && <Alert type="error">Completa todos los campos.</Alert>}
      {status === 'ok'    && <Alert type="ok">Abriendo cliente de correo…</Alert>}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button className="com-btn-primary" onClick={send}>Redactar correo</button>
      </div>
    </div>
  )
}

function Comunicacion({ currentUser }) {
  const [conversaciones, setConversaciones] = useState([])
  const [notificaciones, setNotificaciones] = useState([])
  const [usuarios, setUsuarios]             = useState([])
  const [mensajes, setMensajes]             = useState([])
  const [asignaturas, setAsignaturas]       = useState([])
  const [notas, setNotas]                   = useState([])
  const [loading, setLoading]               = useState(false)
  const [error, setError]                   = useState('')
  const [tab, setTab]                       = useState('conversaciones')
  const [selectedConv, setSelectedConv]     = useState(null)
  const [selectedMsg, setSelectedMsg]       = useState(null)
  const [selectedNotif, setSelectedNotif]   = useState(null)
  const [showNuevo, setShowNuevo]           = useState(false)

  const rol = currentUser?.rol

  const load = async () => {
    if (!currentUser) return
    setLoading(true); setError('')
    try {
      const [c, n, u, m, a, nt] = await Promise.all([
        fetchConversaciones(currentUser.id),
        fetchNotificaciones(currentUser.id),
        fetchUsuarios(),
        fetchMensajesEntrada(currentUser.id),
        fetchAsignaturas(),
        fetchNotas(),
      ])
      setConversaciones(Array.isArray(c) ? c : [])
      setNotificaciones(Array.isArray(n) ? n : [])
      setUsuarios(Array.isArray(u) ? u : [])
      setMensajes(Array.isArray(m) ? m : [])
      setAsignaturas(Array.isArray(a) ? a : [])
      setNotas(Array.isArray(nt) ? nt : [])
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [currentUser])

  const getName = (id) => {
    const u = usuarios.find(u => Number(u.id) === Number(id))
    return u ? `${u.nombre} ${u.apellido}` : `Usuario ${id}`
  }

  const getAsignaturaLabel = (otherId) => {
    const otherUser = usuarios.find(u => Number(u.id) === otherId)
    if (!otherUser) return ''
    if (rol === 'ESTUDIANTE') {
      const cursoId = currentUser.cursoId || currentUser.curso_id
      if (otherUser.rol === 'PROFESOR') {
        const asigs = asignaturas.filter(a => Number(a.cursoId) === Number(cursoId) && Number(a.profesorId) === otherId)
        return asigs.map(a => a.nombre).join(', ')
      }
      if (otherUser.rol === 'ESTUDIANTE') return 'Compañero de curso'
    }
    if (rol === 'PROFESOR') {
      if (otherUser.rol === 'ESTUDIANTE') {
        const misAsig = asignaturas.filter(a => Number(a.profesorId) === Number(currentUser.id))
        for (const asig of misAsig) {
          const ests = usuarios.filter(u => u.rol === 'ESTUDIANTE' && Number(u.cursoId) === Number(asig.cursoId))
          if (ests.some(e => Number(e.id) === otherId)) return `${asig.nombre} — ${CURSO_NOMBRE[asig.cursoId] || ''}`
        }
      }
    }
    return ''
  }

  const convsFiltradas = (() => {
    if (rol === 'ESTUDIANTE') {
      const cursoId = currentUser.cursoId || currentUser.curso_id
      const misAsig = asignaturas.filter(a => Number(a.cursoId) === Number(cursoId))
      const profIds = new Set(misAsig.map(a => Number(a.profesorId)))
      return conversaciones.filter(c => {
        const other = Number(c.participante1Id) === Number(currentUser.id) ? Number(c.participante2Id) : Number(c.participante1Id)
        const otherUser = usuarios.find(u => Number(u.id) === other)
        if (!otherUser) return false
        if (otherUser.rol === 'PROFESOR') return profIds.has(other)
        if (otherUser.rol === 'ESTUDIANTE') return Number(otherUser.cursoId || otherUser.curso_id) === Number(cursoId)
        return false
      })
    }
    if (rol === 'PROFESOR') {
      const misAsig = asignaturas.filter(a => Number(a.profesorId) === Number(currentUser.id))
      const cursosIds = new Set(misAsig.map(a => Number(a.cursoId)))
      return conversaciones.filter(c => {
        const other = Number(c.participante1Id) === Number(currentUser.id) ? Number(c.participante2Id) : Number(c.participante1Id)
        const u = usuarios.find(u => Number(u.id) === other)
        if (!u || u.rol === 'ADMINISTRADOR') return true
        if (u.rol === 'ESTUDIANTE') {
          const estIds = new Set(usuarios.filter(u2 => u2.rol === 'ESTUDIANTE' && cursosIds.has(Number(u2.cursoId))).map(u2 => Number(u2.id)))
          return estIds.has(Number(other))
        }
        return cursosIds.has(Number(u.cursoId || u.curso_id))
      })
    }
    return conversaciones
  })()

  const noLeidas    = notificaciones.filter(n => n.leida === 'No' || n.leida === false).length
  const msgNoLeidos = mensajes.filter(m => m.leido === false || m.leido === 'No').length

  const tabs = [
    { id: 'conversaciones', label: 'Conversaciones', count: convsFiltradas.length },
    { id: 'mensajes',       label: 'Mensajes',       count: msgNoLeidos || null },
    { id: 'notificaciones', label: 'Notificaciones', count: noLeidas || null },
  ]

  const statsCards = [
    { label: 'Conversaciones', value: convsFiltradas.length, color: 'var(--com-primary)', bg: 'var(--com-primary-lt)', icon: '💬' },
    { label: 'Recibidos',      value: mensajes.length,       color: 'var(--com-violet)',  bg: 'var(--com-violet-lt)',  icon: '📥' },
    { label: 'Sin leer',       value: msgNoLeidos + noLeidas, color: 'var(--com-red)',    bg: 'var(--com-red-lt)',     icon: '●'  },
    { label: 'Notificaciones', value: notificaciones.length,  color: 'var(--com-amber)',  bg: 'var(--com-amber-lt)',   icon: '🔔' },
  ]

  return (
    <section className="comunicacion-section">
      <div className="comunicacion-header">
        <div className="comunicacion-header__left">
          <div className="comunicacion-header__icon">💬</div>
          <div>
            <h2>Comunicación</h2>
            <p>
              {rol === 'ADMINISTRADOR' ? 'Vista global del sistema'
                : rol === 'PROFESOR' ? 'Mensajes con tus estudiantes por asignatura'
                : 'Tus profesores, compañeros y notificaciones'}
            </p>
          </div>
        </div>
        <div className="comunicacion-header__right">
          {(msgNoLeidos + noLeidas) > 0 && (
            <div className="comunicacion-badge-noread">{msgNoLeidos + noLeidas} sin leer</div>
          )}
          <button className="comunicacion-btn-nuevo" onClick={() => setShowNuevo(true)}>+ Nuevo mensaje</button>
        </div>
      </div>

      <div className="comunicacion-stats-grid">
        {statsCards.map(s => (
          <div key={s.label} className="comunicacion-stat-card">
            <div className="comunicacion-stat-card__icon" style={{ background: s.bg, color: s.color }}>{s.icon}</div>
            <div>
              <div className="comunicacion-stat-card__num" style={{ color: s.color }}>{s.value}</div>
              <div className="comunicacion-stat-card__label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {error && <div style={{ marginBottom: 16 }}><Alert type="error">{error}</Alert></div>}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--com-text-sub)' }}>
          <div style={{ fontSize: '2rem', marginBottom: 10 }}>⏳</div>Cargando…
        </div>
      ) : (
        <>
          <div className="comunicacion-tabs">
            {tabs.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`comunicacion-tab${tab === t.id ? ' comunicacion-tab--activa' : ''}`}
              >
                {t.label}
                {t.count !== null && t.count > 0 && (
                  <span className="comunicacion-tab__badge">{t.count}</span>
                )}
              </button>
            ))}
          </div>

          {tab === 'conversaciones' && (
            <div className="comunicacion-lista">
              {convsFiltradas.length === 0 ? (
                <Empty icon="💬" title="Sin conversaciones" sub="Inicia una con el botón de arriba." />
              ) : convsFiltradas.map((c, i) => {
                const other = Number(c.participante1Id) === Number(currentUser.id) ? c.participante2Id : c.participante1Id
                const name  = getName(other)
                const activa = c.activa === true || c.activa === 'Sí'
                const etiqueta = getAsignaturaLabel(Number(other))
                return (
                  <div key={c.id} className="comunicacion-lista__item" onClick={() => setSelectedConv(c)}>
                    <Avatar name={name} size={44} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="comunicacion-lista__nombre">{name}</div>
                      {etiqueta && <div className="comunicacion-asig-label">{etiqueta}</div>}
                      <div className="comunicacion-lista__sub">{c.totalMensajes} mensaje{c.totalMensajes !== 1 ? 's' : ''}</div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                      <span className="comunicacion-lista__fecha">{fmtDate(c.ultimaMensajeEn)}</span>
                      <Pill
                        label={activa ? 'Activa' : 'Cerrada'}
                        color={activa ? 'var(--com-green)' : 'var(--com-text-sub)'}
                        bg={activa ? 'var(--com-green-lt)' : 'var(--com-border-lt)'}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {tab === 'mensajes' && (
            <div className="comunicacion-lista">
              {mensajes.length === 0 ? (
                <Empty icon="📥" title="Bandeja vacía" sub="No tienes mensajes recibidos." />
              ) : [...mensajes].sort((a, b) => new Date(b.fechaEnvio) - new Date(a.fechaEnvio)).map((m, i) => {
                const noLeido = m.leido === false || m.leido === 'No'
                const name = getName(m.emisorId)
                return (
                  <div
                    key={m.id}
                    className={`comunicacion-lista__item${noLeido ? ' comunicacion-lista__item--no-leido' : ''}`}
                    onClick={() => setSelectedMsg(m)}
                  >
                    <Avatar name={name} size={44} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontWeight: noLeido ? 700 : 500 }} className="comunicacion-lista__nombre">{name}</span>
                        {noLeido && <span className="comunicacion-lista__dot" />}
                      </div>
                      {m.asunto && m.asunto !== 'Re:' && m.asunto !== 'Sin asunto' && (
                        <div className="comunicacion-lista__asunto">{m.asunto}</div>
                      )}
                      <div className="comunicacion-lista__contenido">{m.contenido}</div>
                    </div>
                    <span className="comunicacion-lista__fecha">{fmtDate(m.fechaEnvio)}</span>
                  </div>
                )
              })}
            </div>
          )}

          {tab === 'notificaciones' && (
            <div className="comunicacion-lista">
              {notificaciones.length === 0 ? (
                <Empty icon="🔔" title="Sin notificaciones" sub="Todo al día por aquí." />
              ) : [...notificaciones].sort((a, b) => new Date(b.fechaCreacion) - new Date(a.fechaCreacion)).map((n, i) => {
                const noLeida = n.leida === false || n.leida === 'No'
                const tipoMap = {
                  NUEVO_MENSAJE:  { icon: '💬', color: 'var(--com-primary)', bg: 'var(--com-primary-lt)', label: 'Mensaje'  },
                  MENSAJE_GRUPAL: { icon: '👥', color: 'var(--com-violet)',  bg: 'var(--com-violet-lt)',  label: 'Grupal'   },
                  RECORDATORIO:   { icon: '⏰', color: 'var(--com-amber)',   bg: 'var(--com-amber-lt)',   label: 'Recordar' },
                  ANUNCIO:        { icon: '📢', color: 'var(--com-green)',   bg: 'var(--com-green-lt)',   label: 'Anuncio'  },
                }
                const t = tipoMap[n.tipo] || { icon: '🔔', color: 'var(--com-text-sub)', bg: 'var(--com-border-lt)', label: n.tipo }
                return (
                  <div
                    key={n.id}
                    className={`comunicacion-lista__item${noLeida ? ' comunicacion-lista__item--no-leido' : ''}`}
                    onClick={() => setSelectedNotif(n)}
                  >
                    <div className="comunicacion-stat-card__icon" style={{ background: t.bg, borderRadius: 12, fontSize: '1.15rem', flexShrink: 0 }}>{t.icon}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.88rem', lineHeight: 1.5, fontWeight: noLeida ? 600 : 400 }}>{n.contenido}</div>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 6 }}>
                        <Pill label={t.label} color={t.color} bg={t.bg} />
                        <span className="comunicacion-lista__fecha">{fmtDate(n.fechaCreacion)}</span>
                      </div>
                    </div>
                    {noLeida && <span className="comunicacion-lista__dot" />}
                  </div>
                )
              })}
            </div>
          )}

          {(rol === 'PROFESOR' || rol === 'ADMINISTRADOR') && (
            <div className="comunicacion-email-section">
              <div className="comunicacion-email-section__title">📧 Enviar aviso por correo externo</div>
              <p className="comunicacion-email-section__sub">Abre tu cliente de correo con el mensaje prellenado.</p>
              <EmailForm />
            </div>
          )}
        </>
      )}

      {selectedConv && (
        <ConversacionDetalle conv={selectedConv} currentUser={currentUser} getName={getName} getAsignaturaLabel={getAsignaturaLabel} onClose={() => setSelectedConv(null)} onReply={load} />
      )}
      {selectedMsg && (
        <MensajeDetalle mensaje={selectedMsg} getName={getName} onClose={() => setSelectedMsg(null)} />
      )}
      {selectedNotif && (
        <NotificacionDetalle notif={selectedNotif} onClose={() => setSelectedNotif(null)} />
      )}
      {showNuevo && (
        <NuevoMensaje currentUser={currentUser} usuarios={usuarios} asignaturas={asignaturas} notas={notas} onClose={() => setShowNuevo(false)} onSent={load} />
      )}
    </section>
  )
}

export default Comunicacion
