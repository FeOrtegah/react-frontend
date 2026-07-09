import { useEffect, useState } from 'react'
import '../../styles/usuarios.css'
import { fetchUsuarios, fetchAsignaturas, crearUsuario, fetchCursos, fetchAsignaturasPorCurso, actualizarAsignatura, matricularEstudiante, fetchMatriculas, eliminarMatricula, eliminarUsuario } from '../../api'
import DataTable from '../orgnanism/DataTable'

const CURSO_NOMBRE = {
  1: 'Ing. Informática',
  2: 'Adm. de Empresas',
  3: 'Diseño Gráfico',
}

const REGION_COMUNAS = {
  'Arica y Parinacota': ['Arica', 'Camarones'],
  'Tarapacá': ['Iquique', 'Alto Hospicio', 'Pozo Almonte'],
  'Antofagasta': ['Antofagasta', 'Calama', 'Taltal'],
  'Atacama': ['Copiapó', 'Vallenar', 'Diego de Almagro'],
  'Coquimbo': ['La Serena', 'Coquimbo', 'Illapel'],
  'Valparaíso': ['Valparaíso', 'Viña del Mar', 'San Antonio', 'Quilpué'],
  'Metropolitana': ['Santiago', 'Providencia', 'Puente Alto', 'Maipú', 'Pudahuel', 'San José de Maipo',
    'Cerrillos', 'San Bernardo', 'Cerro Navia', 'Lo Barnechea', 'Las Condes', 'Vitacura', 'Independencia',
    'Recoleta', 'Huechuraba', 'Renca', 'Paine', 'Buin', 'Colina', 'Lampa', 'Melipilla', 'Padre Hurtado',
    'San Pedro', 'Talagante', 'Isla de Maipo'],
  "O'Higgins": ['Rancagua', 'Machalí', 'San Fernando'],
  'Maule': ['Talca', 'Curicó', 'Linares'],
  'Ñuble': ['Chillán', 'Chillán Viejo', 'San Carlos'],
  'Biobío': ['Concepción', 'Los Ángeles', 'Chillán'],
  'La Araucanía': ['Temuco', 'Villarrica', 'Pucón'],
  'Los Ríos': ['Valdivia', 'Río Bueno', 'La Unión'],
  'Los Lagos': ['Puerto Montt', 'Osorno', 'Ancud'],
  'Aysén': ['Coyhaique', 'Puerto Aysén', 'Chile Chico'],
  'Magallanes': ['Punta Arenas', 'Puerto Natales', 'Porvenir'],
}

const Field = ({ label, children, required }) => (
  <div className="usuarios-field">
    <label>{label}{required && <span className="required">*</span>}</label>
    {children}
  </div>
)

const Overlay = ({ children }) => (
  <div className="usuarios-overlay">{children}</div>
)

const EMPTY_FORM = {
  nombre: '', apellido: '', email: '', username: '', password: '',
  rol: 'ESTUDIANTE', cursoId: '1',
  telefono: '',
  calle: '', numero: '', comuna: '', region: '', codigoPostal: '',
}

function NuevoUsuarioModal({ onClose, onCreated }) {
  const [form, setForm]       = useState(EMPTY_FORM)
  const [status, setStatus]   = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError]     = useState('')
  const [fieldErrors, setFieldErrors] = useState({})

  const set = (k, v) => {
    setForm(f => ({ ...f, [k]: v }))
    setFieldErrors(prev => {
      if (!prev || !prev[k]) return prev
      const copy = { ...prev }
      delete copy[k]
      return copy
    })
    setError('')
    setStatus('')
  }

  const sanitizeLetters = (v) => (v || '').replace(/[^A-Za-zÀ-ÿ\s'\-]/g, '')
  const sanitizeDigits = (v, max) => (v || '').replace(/\D/g, '').slice(0, max)
  const validateEmailDomain = (v) => /^(?:[\w.+-]+)@(duocuc\.cl|profesor\.duoc\.cl)$/.test((v || '').toLowerCase())
  const validateLettersOnly = (v) => /^[A-Za-zÀ-ÿ\s'\-]+$/.test(v || '')
  const validateDigitsOnly = (v) => /^\d+$/.test(v || '')

  const validateForm = () => {
    if (!form.nombre || !form.apellido || !form.email || !form.username) return { ok: false, message: 'Completa los campos obligatorios.' }
    if (!validateEmailDomain(form.email)) return { ok: false, message: 'El email debe ser @duocuc.cl o @profesor.duoc.cl' }
    if (!validateLettersOnly(form.nombre)) return { ok: false, message: 'El nombre solo debe contener letras y espacios.' }
    if (!validateLettersOnly(form.apellido)) return { ok: false, message: 'El apellido solo debe contener letras y espacios.' }
    if (!form.region) return { ok: false, message: 'Selecciona una región.' }
    if (!form.comuna) return { ok: false, message: 'Selecciona una comuna.' }
    if (form.numero && (!validateDigitsOnly(form.numero) || form.numero.length > 4)) return { ok: false, message: 'El número de calle debe ser numérico y máximo 4 dígitos.' }
    if (form.codigoPostal && (!validateDigitsOnly(form.codigoPostal) || form.codigoPostal.length !== 7)) return { ok: false, message: 'El código postal debe ser numérico y tener 7 dígitos.' }
    if (form.telefono && (!validateDigitsOnly(form.telefono) || form.telefono.length > 9)) return { ok: false, message: 'El teléfono debe contener solo números y como máximo 9 dígitos.' }
    return { ok: true }
  }

  const handleSubmit = async () => {
    const v = validateForm()
    if (!v.ok) { setError(v.message); return }
    const defaultPasswordByRole = (rol) => rol === 'ESTUDIANTE' ? 'alumno123' : rol === 'PROFESOR' ? 'profe123' : rol === 'ADMINISTRADOR' ? 'admin123' : 'usuario123'
    const passwordToUse = form.password && form.password.trim() ? form.password : defaultPasswordByRole(form.rol)
    setSending(true); setError(''); setFieldErrors({})
    try {
      const perfilId = form.rol === 'ADMINISTRADOR' ? 1 : form.rol === 'PROFESOR' ? 2 : 3
      const payload = {
        nombre: form.nombre, apellido: form.apellido, email: form.email, rol: form.rol,
        telefono: form.telefono || '-', perfilId, username: form.username, password: passwordToUse,
        calle: form.calle || '-', numero: form.numero || '-', ciudad: form.comuna || '-',
        region: form.region || '-', pais: 'Chile', codigoPostal: form.codigoPostal || '-',
      }
      await crearUsuario(payload)
      setStatus('ok')
      setTimeout(() => { onCreated(); onClose() }, 900)
    } catch (e) {
      const data = e?.data || e?.response?.data || null
      if (data && typeof data === 'object') {
        const fieldMap = {}
        const flatStringValues = Object.values(data).length > 0 && Object.values(data).every(v => typeof v === 'string')
        if (flatStringValues) Object.assign(fieldMap, data)
        if (Array.isArray(data.errors)) {
          data.errors.forEach(it => {
            const rawField = it.field || it.param || it.propertyPath || it.name || ''
            const field = rawField.replace(/^credenciales\./, '')
            if (field) fieldMap[field] = it.message || it.defaultMessage || it.msg || JSON.stringify(it)
          })
        }
        if (data.credenciales && typeof data.credenciales === 'object') Object.entries(data.credenciales).forEach(([k, v]) => { fieldMap[k] = v })
        if (data.fieldErrors && typeof data.fieldErrors === 'object') Object.assign(fieldMap, data.fieldErrors)
        if (Array.isArray(data.violations)) data.violations.forEach(v => { const field = (v.field || '').replace(/^credenciales\./, ''); if (field) fieldMap[field] = v.message || v.msg || JSON.stringify(v) })
        if (Object.keys(fieldMap).length === 0) {
          setError(typeof data === 'string' ? data : 'Error del servidor, revisa la consola para más detalles.')
        } else {
          setFieldErrors(fieldMap)
          setError('Corrige los errores del formulario.')
        }
      } else {
        setError(`Error al crear usuario: ${e.message || String(e)}`)
      }
    } finally { setSending(false) }
  }

  return (
    <Overlay>
      <div className="usuarios-modal" style={{ maxWidth: 600 }}>
        <div className="usuarios-modal__header">
          <div>
            <div className="usuarios-modal__header-title">Nuevo usuario</div>
            <div className="usuarios-modal__header-sub">Completa los datos para registrar el usuario</div>
          </div>
          <button onClick={onClose} className="usuarios-modal__close">×</button>
        </div>
        <div className="usuarios-modal__body">
          <Field label="Rol" required>
            <select value={form.rol} onChange={e => set('rol', e.target.value)} className="usuarios-input">
              <option value="ESTUDIANTE">🎓 Estudiante</option>
              <option value="PROFESOR">👨‍🏫 Profesor</option>
              <option value="ADMINISTRADOR">👑 Administrador</option>
            </select>
          </Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Nombre" required>
              <input value={form.nombre} onChange={e => set('nombre', sanitizeLetters(e.target.value))} placeholder="Ej: Juan" className="usuarios-input" />
              {fieldErrors.nombre && <div className="usuarios-field-error">{fieldErrors.nombre}</div>}
            </Field>
            <Field label="Apellido" required>
              <input value={form.apellido} onChange={e => set('apellido', sanitizeLetters(e.target.value))} placeholder="Ej: García" className="usuarios-input" />
              {fieldErrors.apellido && <div className="usuarios-field-error">{fieldErrors.apellido}</div>}
            </Field>
          </div>
          <Field label="Email" required>
            <input type="email" value={form.email} onChange={e => set('email', e.target.value.trim())} placeholder="usuario@duocuc.cl" className="usuarios-input" />
            {fieldErrors.email && <div className="usuarios-field-error">{fieldErrors.email}</div>}
          </Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Username" required>
              <input value={form.username} onChange={e => set('username', e.target.value)} placeholder="Ej: j.garcia" className="usuarios-input" />
              {fieldErrors.username && <div className="usuarios-field-error">{fieldErrors.username}</div>}
            </Field>
            <Field label="Contraseña" required>
              <input type="password" value={form.password} onChange={e => set('password', e.target.value)} placeholder="••••••••" className="usuarios-input" />
              {fieldErrors.password && <div className="usuarios-field-error">{fieldErrors.password}</div>}
            </Field>
          </div>
          {form.rol === 'ESTUDIANTE' && (
            <Field label="Carrera">
              <select value={form.cursoId} onChange={e => set('cursoId', e.target.value)} className="usuarios-input">
                <option value="1">Ingeniería en Informática</option>
                <option value="2">Administración de Empresas</option>
                <option value="3">Diseño Gráfico</option>
              </select>
            </Field>
          )}
          <Field label="Teléfono">
            <input value={form.telefono} onChange={e => set('telefono', sanitizeDigits(e.target.value, 9))} placeholder="912345678" className="usuarios-input" />
            {fieldErrors.telefono && <div className="usuarios-field-error">{fieldErrors.telefono}</div>}
          </Field>
          <div>
            <div className="usuarios-ramos-label">Dirección</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Field label="Calle">
                <input value={form.calle} onChange={e => set('calle', e.target.value)} placeholder="Av. Principal" className="usuarios-input" />
                {fieldErrors.calle && <div className="usuarios-field-error">{fieldErrors.calle}</div>}
              </Field>
              <Field label="Número">
                <input value={form.numero} onChange={e => set('numero', sanitizeDigits(e.target.value, 4))} placeholder="123" className="usuarios-input" />
                {fieldErrors.numero && <div className="usuarios-field-error">{fieldErrors.numero}</div>}
              </Field>
              <Field label="Región" required>
                <select value={form.region} onChange={e => { set('region', e.target.value); set('comuna', '') }} className="usuarios-input">
                  <option value="">Selecciona una región</option>
                  {Object.keys(REGION_COMUNAS).map(region => <option key={region} value={region}>{region}</option>)}
                </select>
                {fieldErrors.region && <div className="usuarios-field-error">{fieldErrors.region}</div>}
              </Field>
              <Field label="Comuna" required>
                <select value={form.comuna} onChange={e => set('comuna', e.target.value)} className="usuarios-input" disabled={!form.region}>
                  <option value="">Selecciona una comuna</option>
                  {form.region && REGION_COMUNAS[form.region]?.map(comuna => <option key={comuna} value={comuna}>{comuna}</option>)}
                </select>
                {fieldErrors.comuna && <div className="usuarios-field-error">{fieldErrors.comuna}</div>}
              </Field>
              <Field label="Código postal">
                <input value={form.codigoPostal} onChange={e => set('codigoPostal', sanitizeDigits(e.target.value, 7))} placeholder="8320000" className="usuarios-input" />
                {fieldErrors.codigoPostal && <div className="usuarios-field-error">{fieldErrors.codigoPostal}</div>}
              </Field>
            </div>
          </div>
          {error && <div className="usuarios-alert-error">{error}</div>}
          {status === 'ok' && <div className="usuarios-alert-ok">✓ Usuario creado correctamente</div>}
        </div>
        <div className="usuarios-modal__footer">
          <button onClick={onClose} className="usuarios-btn-cancel">Cancelar</button>
          <button onClick={handleSubmit} disabled={sending} className="usuarios-btn-primary">
            {sending ? 'Creando...' : 'Crear usuario →'}
          </button>
        </div>
      </div>
    </Overlay>
  )
}

function EditUsuarioModal({ usuario, asignaturas, matriculas, onClose, onSaved, onDelete }) {
  const [cursos, setCursos] = useState([])
  const [selectedCurso, setSelectedCurso] = useState(usuario.cursoId ? String(usuario.cursoId) : '')
  const [selectedAsigs, setSelectedAsigs] = useState(new Set())
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')
  const [status, setStatus] = useState('')

  const availableAsigs = asignaturas.filter(a => String(a.cursoId) === selectedCurso)

  useEffect(() => {
    let active = true
    fetchCursos()
      .then(c => {
        if (!active) return
        setCursos(Array.isArray(c) ? c : [])
        if (!selectedCurso && Array.isArray(c) && c.length) setSelectedCurso(String(c[0].id))
      })
      .catch(() => { if (active) setCursos([]) })
    return () => { active = false }
  }, [])

  useEffect(() => {
    if (!selectedCurso) return
    const selection = new Set(
      asignaturas
        .filter(a => String(a.cursoId) === selectedCurso)
        .filter(a => usuario.rol === 'PROFESOR'
          ? Number(a.profesorId) === Number(usuario.id)
          : matriculas.some(m => Number(m.estudianteId) === Number(usuario.id) && Number(m.asignaturaId) === Number(a.id))
        )
        .map(a => a.id)
    )
    setSelectedAsigs(selection)
  }, [selectedCurso, asignaturas, matriculas, usuario])

  const toggleAsig = (id) => {
    setSelectedAsigs(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
    setError(''); setStatus('')
  }

  const handleSave = async () => {
    if (!selectedCurso) { setError('Selecciona una carrera antes de guardar.'); return }
    setSaving(true); setError(''); setStatus('')
    try {
      const updates = []
      if (usuario.rol === 'PROFESOR') {
        availableAsigs.forEach(a => {
          const selected = selectedAsigs.has(a.id)
          const currently = Number(a.profesorId) === Number(usuario.id)
          if (selected && !currently) updates.push(actualizarAsignatura(a.id, { nombre: a.nombre, cursoId: a.cursoId || a.curso_id, profesorId: usuario.id }))
          if (!selected && currently) updates.push(actualizarAsignatura(a.id, { nombre: a.nombre, cursoId: a.cursoId || a.curso_id, profesorId: 0 }))
        })
      }
      if (usuario.rol === 'ESTUDIANTE') {
        const enrolled = matriculas.filter(m => Number(m.estudianteId) === Number(usuario.id))
        const enrolledAsigIds = new Set(enrolled.map(m => Number(m.asignaturaId)))
        enrolled.forEach(m => { if (!selectedAsigs.has(Number(m.asignaturaId))) updates.push(eliminarMatricula(m.id)) })
        selectedAsigs.forEach(asigId => { if (!enrolledAsigIds.has(asigId)) updates.push(matricularEstudiante({ estudianteId: usuario.id, asignaturaId: asigId })) })
      }
      if (updates.length > 0) await Promise.all(updates)
      setStatus('ok')
      setTimeout(() => { onSaved(); onClose() }, 700)
    } catch (e) {
      setError(e.message || 'Error al guardar los cambios.')
    } finally { setSaving(false) }
  }

  const handleDelete = async () => {
    if (!onDelete) return
    setDeleting(true); setError('')
    try {
      const confirmado = await onDelete(usuario)
      if (confirmado) onClose()
    } catch (e) {
      setError(e.message || 'Error al eliminar el usuario.')
    } finally {
      setDeleting(false)
    }
  }

  const title = usuario.rol === 'PROFESOR' ? 'Editar profesor' : 'Editar estudiante'
  const subtitle = usuario.rol === 'PROFESOR'
    ? 'Cambia la carrera y los ramos que imparte.'
    : 'Actualiza la carrera y asigna los ramos del estudiante.'

  return (
    <Overlay>
      <div className="usuarios-modal" style={{ maxWidth: 850 }}>
        <div className="usuarios-modal__header">
          <div>
            <div className="usuarios-modal__header-title">{title}</div>
            <div className="usuarios-modal__header-sub">{subtitle}</div>
          </div>
          <button onClick={onClose} className="usuarios-modal__close">×</button>
        </div>
        <div className="usuarios-modal__body">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Nombre"><input value={usuario.nombre || ''} disabled className="usuarios-input" /></Field>
            <Field label="Apellido"><input value={usuario.apellido || ''} disabled className="usuarios-input" /></Field>
          </div>
          <Field label="Carrera" required>
            <select value={selectedCurso} onChange={e => setSelectedCurso(e.target.value)} className="usuarios-input">
              <option value="">Selecciona una carrera</option>
              {cursos.map(c => <option key={c.id} value={String(c.id)}>{c.nombre}</option>)}
            </select>
          </Field>
          <div>
            <div className="usuarios-ramos-label">Ramos</div>
            <div className="usuarios-ramos-box">
              {availableAsigs.length === 0 ? (
                <div style={{ color: '#6b7280' }}>No hay ramos disponibles para esta carrera.</div>
              ) : (
                <div style={{ display: 'grid', gap: 10 }}>
                  {availableAsigs.map(a => (
                    <label key={a.id} className="usuarios-ramos-item">
                      <input type="checkbox" checked={selectedAsigs.has(a.id)} onChange={() => toggleAsig(a.id)} />
                      <div>
                        <div className="usuarios-ramos-item__nombre">{a.nombre}</div>
                        <div className="usuarios-ramos-item__sub">
                          {usuario.rol === 'PROFESOR'
                            ? a.profesorId ? `Profesor actual: ${a.profesorId}` : 'Profesor sin asignar'
                            : matriculas.some(m => Number(m.estudianteId) === Number(usuario.id) && Number(m.asignaturaId) === Number(a.id)) ? 'Ya matriculado' : 'No matriculado'}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>
          {error && <div className="usuarios-alert-error">{error}</div>}
          {status === 'ok' && <div className="usuarios-alert-ok">✓ Cambios guardados correctamente</div>}
        </div>
        <div className="usuarios-modal__footer">
          {onDelete && (
            <button onClick={handleDelete} disabled={deleting || saving} className="usuarios-btn-eliminar-modal" style={{ marginRight: 'auto' }}>
              {deleting ? 'Eliminando...' : '🗑️ Eliminar cuenta'}
            </button>
          )}
          <button onClick={onClose} className="usuarios-btn-cancel">Cancelar</button>
          <button onClick={handleSave} disabled={saving || deleting} className="usuarios-btn-primary">
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </div>
    </Overlay>
  )
}

const rolColor = {
  ADMINISTRADOR: { bg: '#fef3c7', color: '#d97706', border: '#fde68a' },
  PROFESOR:      { bg: '#ede9fe', color: '#7c3aed', border: '#ddd6fe' },
  ESTUDIANTE:    { bg: '#dbeafe', color: '#2563eb', border: '#bfdbfe' },
}

function UsuarioCard({ usuario, asignaturas, matriculas, currentUser, onRefresh, onAssignClick, onEditClick, onDeleteClick }) {
  const colors = rolColor[usuario.rol] || { bg: '#f3f4f6', color: '#6b7280', border: '#e5e7eb' }
  const esActivo = String(currentUser?.id) === String(usuario.id)

  const misAsignaturas = usuario.rol === 'PROFESOR'
    ? asignaturas.filter(a => Number(a.profesorId) === Number(usuario.id))
    : []

  const porCarrera = {}
  misAsignaturas.forEach(a => {
    const carrera = CURSO_NOMBRE[Number(a.cursoId)] || `Carrera ${a.cursoId}`
    if (!porCarrera[carrera]) porCarrera[carrera] = []
    porCarrera[carrera].push(a.nombre)
  })

  const misRamos = usuario.rol === 'ESTUDIANTE'
    ? (matriculas || []).filter(m => Number(m.estudianteId) === Number(usuario.id))
        .map(m => asignaturas.find(a => Number(a.id) === Number(m.asignaturaId)))
        .filter(Boolean)
    : []

  return (
    <article className={`usuario-card${esActivo ? ' usuario-card--activo' : ''}`}>
      <div className="usuario-card__top">
        <div className="usuario-card__avatar" style={{ background: colors.bg, border: `1px solid ${colors.border}` }}>
          {usuario.rol === 'ADMINISTRADOR' ? '👑' : usuario.rol === 'PROFESOR' ? '👨‍🏫' : '🎓'}
        </div>
        <div style={{ flex: 1 }}>
          <span className="usuario-card__rol-badge" style={{ background: colors.bg, color: colors.color, border: `1px solid ${colors.border}` }}>
            {usuario.rol}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          {onEditClick && (
            <button onClick={onEditClick} className="usuario-card__btn-editar">Editar</button>
          )}
          {onDeleteClick && !esActivo && (
            <button onClick={onDeleteClick} className="usuario-card__btn-eliminar" title="Eliminar cuenta">🗑️ Eliminar</button>
          )}
        </div>
      </div>
      <div>
        <strong className="usuario-card__nombre">{usuario.nombre} {usuario.apellido}</strong>
        <p className="usuario-card__email">{usuario.email}</p>
        {usuario.rol === 'ESTUDIANTE' && usuario.cursoId && (
          <p className="usuario-card__carrera">{CURSO_NOMBRE[usuario.cursoId] || `Carrera ${usuario.cursoId}`}</p>
        )}
        {usuario.rol === 'ESTUDIANTE' && (
          <div style={{ marginTop: 8 }}>
            {misRamos.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
                <div className="usuario-card__sin-ramos">Sin ramos asignados</div>
                {onAssignClick && <button onClick={onAssignClick} className="usuario-card__btn-asignar">Asignar ramos</button>}
              </div>
            ) : (
              <div className="usuario-card__ramos">
                {misRamos.map(r => (
                  <span key={r.id} className="usuario-card__ramo-tag" style={{ background: '#dbeafe', color: '#1e40af' }}>{r.nombre}</span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      {usuario.rol === 'PROFESOR' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {misAsignaturas.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
              <div className="usuario-card__sin-ramos">Sin asignaturas asignadas</div>
              {onAssignClick && <button onClick={onAssignClick} className="usuario-card__btn-asignar">Asignar asignaturas</button>}
            </div>
          ) : Object.entries(porCarrera).map(([carrera, materias]) => (
            <div key={carrera}>
              <div className="usuario-card__carrera-label">{carrera}</div>
              <div className="usuario-card__asig-tags">
                {materias.map(m => <span key={m} className="usuario-card__asig-tag">{m}</span>)}
              </div>
            </div>
          ))}
        </div>
      )}
      <div className={`usuario-card__footer usuario-card__footer--${esActivo ? 'activo' : 'inactivo'}`}>
        {esActivo ? '✓ Sesión activa' : usuario.credenciales?.username}
      </div>
    </article>
  )
}

const GrupoUsuarios = ({ titulo, lista, emoji, asignaturas, matriculas, currentUser, onRefresh, onAssignClick, onEditClick, onDeleteClick }) => (
  lista.length > 0 && (
    <div className="usuarios-grupo">
      <h3>{emoji} {titulo} <span className="usuarios-grupo__count">({lista.length})</span></h3>
      <div className="usuarios-cards-grid">
        {lista.map(u => (
          <UsuarioCard
            key={u.id} usuario={u} asignaturas={asignaturas} matriculas={matriculas}
            currentUser={currentUser} onRefresh={onRefresh}
            onAssignClick={onAssignClick ? () => onAssignClick(u) : null}
            onEditClick={onEditClick ? () => onEditClick(u) : null}
            onDeleteClick={onDeleteClick ? () => { onDeleteClick(u).catch(() => {}) } : null}
          />
        ))}
      </div>
    </div>
  )
)

function Usuarios({ currentUser }) {
  const [usuarios, setUsuarios]       = useState([])
  const [asignaturas, setAsignaturas] = useState([])
  const [matriculas, setMatriculas]   = useState([])
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState('')
  const [showModal, setShowModal]     = useState(false)
  const [editModalOpen, setEditModalOpen]         = useState(false)
  const [selectedUsuarioToEdit, setSelectedUsuarioToEdit] = useState(null)
  const [assignModalOpen, setAssignModalOpen]     = useState(false)
  const [selectedProfesor, setSelectedProfesor]   = useState(null)
  const [assignStudentModalOpen, setAssignStudentModalOpen] = useState(false)
  const [selectedEstudiante, setSelectedEstudiante] = useState(null)
  const [cursosList, setCursosList]   = useState([])
  const [selectedCurso, setSelectedCurso] = useState(null)
  const [cursoAsignaturas, setCursoAsignaturas] = useState([])
  const [selectedAsigs, setSelectedAsigs] = useState(new Set())
  const [assigning, setAssigning]     = useState(false)
  const [deletingId, setDeletingId]   = useState(null)

  const load = async () => {
    setLoading(true); setError('')
    try {
      const [u, a] = await Promise.all([fetchUsuarios(), fetchAsignaturas()])
      setUsuarios(u); setAsignaturas(a)
      try {
        const m = await fetchMatriculas()
        setMatriculas(Array.isArray(m) ? m : [])
      } catch { setMatriculas([]) }
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  const openAssignModal = async (profesor) => {
    setSelectedProfesor(profesor); setAssignModalOpen(true); setSelectedAsigs(new Set())
    try {
      const c = await fetchCursos()
      setCursosList(Array.isArray(c) ? c : [])
      if (c && c.length) setSelectedCurso(c[0].id)
    } catch { setCursosList([]) }
  }

  const openAssignStudentModal = async (estudiante) => {
    setSelectedEstudiante(estudiante); setAssignStudentModalOpen(true); setSelectedAsigs(new Set())
    try {
      const c = await fetchCursos()
      setCursosList(Array.isArray(c) ? c : [])
      if (estudiante.cursoId) setSelectedCurso(Number(estudiante.cursoId))
      else if (c && c.length) setSelectedCurso(c[0].id)
    } catch { setCursosList([]) }
  }

  const openEditModal = (usuario) => { setSelectedUsuarioToEdit(usuario); setEditModalOpen(true) }
  const closeEditModal = () => { setEditModalOpen(false); setSelectedUsuarioToEdit(null) }
  const handleEditSaved = async () => { await load(); closeEditModal() }

  const handleDeleteUsuario = async (usuario) => {
    if (String(currentUser?.id) === String(usuario.id)) return false
    const confirmado = window.confirm(
      `¿Seguro que quieres eliminar la cuenta de ${usuario.nombre} ${usuario.apellido}? Esta acción no se puede deshacer.`
    )
    if (!confirmado) return false
    setDeletingId(usuario.id)
    setError('')
    try {
      await eliminarUsuario(usuario.id)
      await load()
      return true
    } catch (e) {
      setError(e.message || 'Error al eliminar el usuario.')
      throw e
    } finally {
      setDeletingId(null)
    }
  }

  const toggleSelectAsig = (id) => {
    setSelectedAsigs(s => {
      const copy = new Set(s)
      if (copy.has(id)) copy.delete(id); else copy.add(id)
      return copy
    })
  }

  const handleAssign = async () => {
    if (!selectedProfesor || selectedAsigs.size === 0) return
    setAssigning(true)
    try {
      await Promise.all(Array.from(selectedAsigs).map(id => actualizarAsignatura(id, { profesorId: selectedProfesor.id })))
      setAssignModalOpen(false); setSelectedAsigs(new Set()); setSelectedProfesor(null)
      await load()
    } catch (e) { console.error(e); alert('Error al asignar asignaturas. Revisa la consola.') }
    finally { setAssigning(false) }
  }

  const handleAssignStudent = async () => {
    if (!selectedEstudiante || selectedAsigs.size === 0) return
    setAssigning(true)
    try {
      await Promise.all(Array.from(selectedAsigs).map(asigId => matricularEstudiante({ estudianteId: selectedEstudiante.id, asignaturaId: asigId })))
      setAssignStudentModalOpen(false); setSelectedAsigs(new Set()); setSelectedEstudiante(null)
      await load()
    } catch (e) { console.error(e); alert('Error al asignar ramos. Revisa la consola.') }
    finally { setAssigning(false) }
  }

  useEffect(() => {
    if ((!assignModalOpen && !assignStudentModalOpen) || !selectedCurso) return
    let cancelled = false
    fetchAsignaturasPorCurso(Number(selectedCurso))
      .then(a => { if (!cancelled) setCursoAsignaturas(Array.isArray(a) ? a : []) })
      .catch(() => { if (!cancelled) setCursoAsignaturas([]) })
    return () => { cancelled = true }
  }, [assignModalOpen, assignStudentModalOpen, selectedCurso])

  useEffect(() => { load() }, [])

  const profesores  = usuarios.filter(u => u.rol === 'PROFESOR')
  const estudiantes = usuarios.filter(u => u.rol === 'ESTUDIANTE')
  const admins      = usuarios.filter(u => u.rol === 'ADMINISTRADOR')

  const statsCards = [
    { label: 'Administradores', value: admins.length,      color: '#d97706', bg: '#fef3c7' },
    { label: 'Profesores',      value: profesores.length,  color: '#7c3aed', bg: '#ede9fe' },
    { label: 'Estudiantes',     value: estudiantes.length, color: '#2563eb', bg: '#dbeafe' },
  ]

  const inp = { width: '100%', padding: '9px 12px', borderRadius: 9, border: '1px solid var(--usr-border)', fontSize: '0.88rem', color: 'var(--usr-text)', background: '#fff', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }

  // Robustecido: compara sin importar mayúsculas/minúsculas o espacios extra en el rol
  const puedeEliminar = String(currentUser?.rol || '').trim().toUpperCase() === 'ADMINISTRADOR'

  return (
    <section className="usuarios-panel">
      <div className="usuarios-header">
        <div>
          <h2>Usuarios</h2>
          <p>Gestión de usuarios del sistema.</p>
        </div>
        <button onClick={() => setShowModal(true)} className="usuarios-btn-nuevo">+ Nuevo usuario</button>
      </div>

      {!loading && (
        <div className="usuarios-stats-grid">
          {statsCards.map(s => (
            <div key={s.label} className="usuarios-stat-card" style={{ background: s.bg }}>
              <div className="usuarios-stat-card__num" style={{ color: s.color }}>{s.value}</div>
              <div className="usuarios-stat-card__label">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {error   && <div className="usuarios-alert">{error}</div>}
      {loading && <div className="usuarios-empty">Cargando usuarios...</div>}

      {!loading && (
        <>
          <GrupoUsuarios titulo="Administradores" lista={admins}      emoji="👑"   asignaturas={asignaturas} matriculas={matriculas} currentUser={currentUser} onRefresh={load} onAssignClick={null} onEditClick={puedeEliminar ? openEditModal : null} onDeleteClick={null} />
          <GrupoUsuarios titulo="Profesores"      lista={profesores}  emoji="👨‍🏫" asignaturas={asignaturas} matriculas={matriculas} currentUser={currentUser} onRefresh={load} onAssignClick={openAssignModal} onEditClick={puedeEliminar ? openEditModal : null} onDeleteClick={puedeEliminar ? handleDeleteUsuario : null} />
          <GrupoUsuarios titulo="Estudiantes"     lista={estudiantes} emoji="🎓"   asignaturas={asignaturas} matriculas={matriculas} currentUser={currentUser} onRefresh={load} onAssignClick={openAssignStudentModal} onEditClick={puedeEliminar ? openEditModal : null} onDeleteClick={puedeEliminar ? handleDeleteUsuario : null} />

          {assignModalOpen && selectedProfesor && (
            <Overlay>
              <div className="usuarios-modal" style={{ maxWidth: 900 }}>
                <div className="usuarios-modal__header">
                  <div>
                    <div className="usuarios-modal__header-title">Asignar asignaturas a {selectedProfesor.nombre} {selectedProfesor.apellido}</div>
                    <div className="usuarios-modal__header-sub">{selectedProfesor.email}</div>
                  </div>
                  <button onClick={() => setAssignModalOpen(false)} className="usuarios-modal__close">×</button>
                </div>
                <div style={{ padding: 16, display: 'flex', gap: 12 }}>
                  <div style={{ width: 280 }}>
                    <div className="usuarios-ramos-label">Selecciona carrera</div>
                    <select value={selectedCurso ?? ''} onChange={e => setSelectedCurso(e.target.value)} style={inp}>
                      <option value="">-- Elegir carrera --</option>
                      {cursosList.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                    </select>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div className="usuarios-ramos-label">Asignaturas disponibles</div>
                    <div className="usuarios-ramos-box" style={{ maxHeight: 300, overflowY: 'auto' }}>
                      {cursoAsignaturas.length === 0 && <div style={{ color: '#94a3b8' }}>No hay asignaturas en esta carrera.</div>}
                      {cursoAsignaturas.map(a => (
                        <label key={a.id} className="usuarios-ramos-item">
                          <input type="checkbox" checked={selectedAsigs.has(a.id)} onChange={() => toggleSelectAsig(a.id)} />
                          <div>
                            <div className="usuarios-ramos-item__nombre">{a.nombre}</div>
                            {a.profesorId && <div className="usuarios-ramos-item__sub">Asignada a profesor id: {a.profesorId}</div>}
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="usuarios-modal__footer" style={{ alignItems: 'center' }}>
                  {cursoAsignaturas.filter(a => selectedAsigs.has(a.id) && a.profesorId).length > 0 && (
                    <div style={{ marginRight: 'auto', color: '#92400e', fontSize: '0.85rem' }}>Al reasignar, se sobrescribirá el profesor anterior.</div>
                  )}
                  <button onClick={() => setAssignModalOpen(false)} className="usuarios-btn-cancel">Cancelar</button>
                  <button onClick={handleAssign} disabled={assigning || selectedAsigs.size === 0} className="usuarios-btn-primary">
                    {assigning ? 'Asignando...' : `Asignar (${selectedAsigs.size})`}
                  </button>
                </div>
              </div>
            </Overlay>
          )}

          {assignStudentModalOpen && selectedEstudiante && (
            <Overlay>
              <div className="usuarios-modal" style={{ maxWidth: 900 }}>
                <div className="usuarios-modal__header">
                  <div>
                    <div className="usuarios-modal__header-title">Asignar ramos a {selectedEstudiante.nombre} {selectedEstudiante.apellido}</div>
                    <div className="usuarios-modal__header-sub">{selectedEstudiante.email} • {CURSO_NOMBRE[selectedEstudiante.cursoId] || `Carrera ${selectedEstudiante.cursoId}`}</div>
                  </div>
                  <button onClick={() => setAssignStudentModalOpen(false)} className="usuarios-modal__close">×</button>
                </div>
                <div style={{ padding: 16, display: 'flex', gap: 12, flex: 1, minHeight: 0 }}>
                  <div style={{ width: 280 }}>
                    <div className="usuarios-ramos-label">Carrera</div>
                    <div style={{ padding: '8px 12px', borderRadius: 8, background: 'var(--usr-bg)', fontSize: '0.92rem', fontWeight: 500 }}>
                      {CURSO_NOMBRE[selectedEstudiante.cursoId] || `Carrera ${selectedEstudiante.cursoId}`}
                    </div>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="usuarios-ramos-label">Ramos disponibles</div>
                    <div className="usuarios-ramos-box" style={{ height: 400, overflowY: 'auto' }}>
                      {cursoAsignaturas.length === 0 && <div style={{ color: '#94a3b8' }}>No hay ramos en esta carrera.</div>}
                      {cursoAsignaturas.map(a => (
                        <label key={a.id} className="usuarios-ramos-item">
                          <input type="checkbox" checked={selectedAsigs.has(a.id)} onChange={() => toggleSelectAsig(a.id)} />
                          <div>
                            <div className="usuarios-ramos-item__nombre">{a.nombre}</div>
                            <div className="usuarios-ramos-item__sub">Profesor: {a.profesorId ? `ID ${a.profesorId}` : 'Sin asignar'}</div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="usuarios-modal__footer">
                  <button onClick={() => setAssignStudentModalOpen(false)} className="usuarios-btn-cancel">Cancelar</button>
                  <button onClick={handleAssignStudent} disabled={assigning || selectedAsigs.size === 0} className="usuarios-btn-primary">
                    {assigning ? 'Asignando...' : `Asignar (${selectedAsigs.size})`}
                  </button>
                </div>
              </div>
            </Overlay>
          )}

          <div className="usuarios-datatable-section">
            <h3>📋 Datos completos</h3>
            <DataTable data={usuarios} title="" />
          </div>
        </>
      )}

      {showModal && <NuevoUsuarioModal onClose={() => setShowModal(false)} onCreated={load} />}
      {editModalOpen && selectedUsuarioToEdit && (
        <EditUsuarioModal
          usuario={selectedUsuarioToEdit} asignaturas={asignaturas} matriculas={matriculas}
          onClose={closeEditModal} onSaved={handleEditSaved}
          onDelete={selectedUsuarioToEdit.rol !== 'ADMINISTRADOR' ? handleDeleteUsuario : null}
        />
      )}
    </section>
  )
}

export default Usuarios
