import { useEffect, useState } from 'react'
import '../../styles/asistencias.css'
import { fetchAsistencias, fetchUsuarios, fetchCursos, fetchAsignaturas, crearAsistencia, eliminarAsistencia, fetchNotas } from '../../api'

function Asistencias({ currentUser }) {
  const [asistencias, setAsistencias] = useState([])
  const [usuarios, setUsuarios] = useState([])
  const [cursos, setCursos] = useState([])
  const [asignaturas, setAsignaturas] = useState([])
  const [notas, setNotas] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [statusMessage, setStatusMessage] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [selectedAsignatura, setSelectedAsignatura] = useState(null)
  const [expandedAsignatura, setExpandedAsignatura] = useState(null)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [filtroCurso, setFiltroCurso] = useState('todos')

  const [formData, setFormData] = useState({
    estudiante_id: '',
    fecha: new Date().toISOString().split('T')[0],
    estado: 'PRESENTE',
    esTardanza: false,
    tieneJustificativo: false,
    observaciones: '',
    justificativo: ''
  })

  const rol = currentUser?.rol
  const isProfesorOrAdmin = rol === 'PROFESOR' || rol === 'ADMINISTRADOR'

  const loadData = async () => {
    setLoading(true)
    setError('')
    try {
      const [data, usuariosData, cursosData, asignaturasData, notasData] = await Promise.all([
        fetchAsistencias(),
        fetchUsuarios(),
        fetchCursos(),
        fetchAsignaturas(),
        fetchNotas().catch(() => []),
      ])
      setUsuarios(usuariosData)
      setCursos(cursosData)
      setAsignaturas(asignaturasData)
      setNotas(Array.isArray(notasData) ? notasData : [])

      let filteredAsistencias = data
      if (rol === 'ESTUDIANTE') {
        filteredAsistencias = data.filter(a => Number(a.estudiante_id || a.estudianteId) === Number(currentUser.id))
      } else if (rol === 'PROFESOR') {
        const misAsignaturas = asignaturasData.filter(a => Number(a.profesorId || a.profesor_id) === Number(currentUser.id))
        const misAsignaturasIds = new Set(misAsignaturas.map(a => Number(a.id)))
        const misCursosIds = new Set(misAsignaturas.map(a => Number(a.cursoId || a.curso_id)))
        filteredAsistencias = data.filter(a =>
          misAsignaturasIds.has(Number(a.asignatura_id)) ||
          misCursosIds.has(Number(a.curso_id || a.cursoId))
        )
      }
      setAsistencias(filteredAsistencias)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [currentUser])

  const resetForm = () => {
    setFormData({
      estudiante_id: '',
      fecha: selectedDate,
      estado: 'PRESENTE',
      esTardanza: false,
      tieneJustificativo: false,
      observaciones: '',
      justificativo: ''
    })
  }

  const calcularEstadoReal = (data) => {
    if (data.esTardanza) {
      if (data.tieneJustificativo) return 'PRESENTE'
      return 'AUSENTE'
    }
    return data.estado
  }

  const calcularObservaciones = (data) => {
    const partes = []
    if (data.esTardanza && data.tieneJustificativo) partes.push('[TARDANZA CON JUSTIFICATIVO]')
    if (data.esTardanza && !data.tieneJustificativo) partes.push('[TARDANZA SIN JUSTIFICATIVO]')
    if (data.justificativo) partes.push(`Justificativo: ${data.justificativo}`)
    if (data.observaciones) partes.push(data.observaciones)
    return partes.join(' | ')
  }

  const handleAddAsistencia = async (e) => {
    e.preventDefault()
    const asignatura = asignaturas.find(a => Number(a.id) === Number(selectedAsignatura))
    if (!formData.estudiante_id || !asignatura) {
      setStatusMessage({ type: 'error', text: 'Debes seleccionar estudiante y asignatura.' })
      return
    }
    const existeDuplicado = asistencias.some(a =>
      Number(a.estudiante_id || a.estudianteId) === Number(formData.estudiante_id) &&
      Number(a.asignatura_id) === Number(asignatura.id) &&
      (a.fecha || '').split('T')[0] === formData.fecha
    )
    if (existeDuplicado) {
      setStatusMessage({ type: 'error', text: 'Ya existe un registro de asistencia para este estudiante en esta fecha.' })
      setTimeout(() => setStatusMessage(null), 3000)
      return
    }
    if (formData.esTardanza && formData.tieneJustificativo && !formData.justificativo.trim()) {
      setStatusMessage({ type: 'error', text: 'Debes escribir el motivo del justificativo.' })
      setTimeout(() => setStatusMessage(null), 3000)
      return
    }
    try {
      setLoading(true)
      const estadoReal = calcularEstadoReal(formData)
      const obsReal = calcularObservaciones(formData)
      const payload = {
        estudiante_id: Number(formData.estudiante_id),
        curso_id: Number(asignatura.cursoId || asignatura.curso_id),
        profesor_id: Number(currentUser.id),
        asignatura_id: Number(asignatura.id),
        fecha: formData.fecha,
        estado: estadoReal,
        observaciones: obsReal
      }
      const res = await crearAsistencia(payload)
      setAsistencias(prev => [{ id: res?.id || Date.now(), ...payload }, ...prev])
      setStatusMessage({ type: 'success', text: 'Asistencia registrada correctamente.' })
      setShowForm(false)
      setSelectedAsignatura(null)
      resetForm()
      await loadData()
    } catch (err) {
      setStatusMessage({ type: 'error', text: err.message })
    } finally {
      setLoading(false)
      setTimeout(() => setStatusMessage(null), 3000)
    }
  }

  const handleDeleteAsistencia = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar este registro?')) return
    try {
      setLoading(true)
      await eliminarAsistencia(id)
      setAsistencias(prev => prev.filter(a => a.id !== id))
      setStatusMessage({ type: 'success', text: 'Asistencia eliminada correctamente.' })
      await loadData()
    } catch (err) {
      setStatusMessage({ type: 'error', text: err.message })
    } finally {
      setLoading(false)
      setTimeout(() => setStatusMessage(null), 3000)
    }
  }

  const getNombre = (id) => {
    const u = usuarios.find(u => Number(u.id) === Number(id))
    return u ? `${u.nombre} ${u.apellido}` : `ID ${id}`
  }

  const getAsistenciasPorAsignaturaYFecha = (asignatura, fecha) => {
    const fechaFiltro = fecha ? fecha.split('T')[0] : ''
    return asistencias.filter(a => {
      const fechaA = a.fecha ? a.fecha.split('T')[0] : ''
      if (fechaA !== fechaFiltro) return false
      if (a.asignatura_id) return Number(a.asignatura_id) === Number(asignatura.id)
      return Number(a.curso_id || a.cursoId) === Number(asignatura.cursoId || asignatura.curso_id)
    })
  }

  const getEstudiantesPorAsignatura = (asignaturaId, cursoId) => {
    const idsEnAsig = [...new Set(asistencias.filter(a => Number(a.asignatura_id) === Number(asignaturaId)).map(a => Number(a.estudiante_id || a.estudianteId)))]
    if (idsEnAsig.length > 0) return usuarios.filter(u => u.rol === 'ESTUDIANTE' && idsEnAsig.includes(Number(u.id)))
    const idsEnCurso = [...new Set(asistencias.filter(a => Number(a.curso_id || a.cursoId) === Number(cursoId)).map(a => Number(a.estudiante_id || a.estudianteId)))]
    if (idsEnCurso.length > 0) return usuarios.filter(u => u.rol === 'ESTUDIANTE' && idsEnCurso.includes(Number(u.id)))
    return usuarios.filter(u => u.rol === 'ESTUDIANTE')
  }

  const getMisAsignaturas = () => {
    if (rol === 'ESTUDIANTE') {
      const cursoIdEstudiante = currentUser.cursoId || currentUser.curso_id
      return asignaturas.filter(a => Number(a.cursoId || a.curso_id) === Number(cursoIdEstudiante))
    }
    if (rol === 'PROFESOR') return asignaturas.filter(a => Number(a.profesorId || a.profesor_id) === Number(currentUser.id))
    if (filtroCurso !== 'todos') return asignaturas.filter(a => Number(a.cursoId || a.curso_id) === Number(filtroCurso))
    return asignaturas
  }

  const getFechasDisponibles = () => {
    const fechas = [...new Set(asistencias.map(a => a.fecha ? a.fecha.split('T')[0] : ''))]
    return fechas.filter(Boolean).sort().reverse()
  }

  const calcularEstadisticas = (list) => {
    const presente    = list.filter(a => a.estado === 'PRESENTE').length
    const ausente     = list.filter(a => a.estado === 'AUSENTE').length
    const justificado = list.filter(a => a.estado === 'JUSTIFICADO').length
    const tardanza    = list.filter(a => a.observaciones && a.observaciones.includes('[TARDANZA')).length
    const total       = list.length
    const porcentaje  = total > 0 ? Math.round((presente / total) * 100) : 0
    return { presente, ausente, justificado, tardanza, total, porcentaje }
  }

  const tieneTardanza = (a) => a.observaciones && a.observaciones.includes('[TARDANZA')
  const tieneJustificativoObs = (a) => a.observaciones && a.observaciones.includes('[TARDANZA CON JUSTIFICATIVO]')

  const getJustificativo = (a) => {
    if (!a.observaciones) return ''
    const match = a.observaciones.match(/Justificativo: ([^|]+)/)
    return match ? match[1].trim() : ''
  }

  const getBadgeClass = (estado) => {
    if (estado === 'PRESENTE')    return 'asistencias-badge asistencias-badge--presente'
    if (estado === 'AUSENTE')     return 'asistencias-badge asistencias-badge--ausente'
    if (estado === 'JUSTIFICADO') return 'asistencias-badge asistencias-badge--justificado'
    if (estado === 'TARDANZA')    return 'asistencias-badge asistencias-badge--tardanza'
    return 'asistencias-badge'
  }

  const formatDate = (fecha) => {
    if (!fecha) return '-'
    const parts = fecha.split('-')
    return `${parts[2]}/${parts[1]}/${parts[0]}`
  }

  const irAFecha = (fecha) => {
    if (!fecha) return
    setSelectedDate(fecha)
    setFormData(prev => ({ ...prev, fecha }))
  }

  const irAHoy = () => irAFecha(new Date().toISOString().split('T')[0])

  const subtitulo = {
    ESTUDIANTE:    'Tu registro de asistencia por asignatura',
    PROFESOR:      'Gestiona las asistencias de tus asignaturas',
    ADMINISTRADOR: 'Vista completa — todos los alumnos y asignaturas',
  }

  const misAsignaturas = getMisAsignaturas()
  const fechasDisponibles = getFechasDisponibles()
  const asistenciasDelDia = asistencias.filter(a => (a.fecha ? a.fecha.split('T')[0] : '') === selectedDate)
  const asistenciasDelDiaFiltradas = asistenciasDelDia.filter(a => {
    if (filtroCurso === 'todos') return true
    return Number(a.curso_id || a.cursoId) === Number(filtroCurso)
  })
  const statsGlobales = calcularEstadisticas(asistenciasDelDiaFiltradas)

  const statsAdminCards = [
    { label: 'Total registros', value: statsGlobales.total,       color: '#1d4ed8', bg: '#dbeafe' },
    { label: 'Presentes',       value: statsGlobales.presente,    color: '#059669', bg: '#d1fae5' },
    { label: 'Ausentes',        value: statsGlobales.ausente,     color: '#dc2626', bg: '#fee2e2' },
    { label: 'Tardanzas',       value: statsGlobales.tardanza,    color: '#7c3aed', bg: '#ede9fe' },
    { label: 'Justificados',    value: statsGlobales.justificado, color: '#d97706', bg: '#fef3c7' },
  ]

  return (
    <section className="asistencias-panel">
      <div className="asistencias-header">
        <h2>Asistencias</h2>
        <p>{subtitulo[rol]}</p>
      </div>

      {error && <div className="asistencias-alert asistencias-alert--error">{error}</div>}
      {statusMessage && (
        <div className={`asistencias-alert asistencias-alert--${statusMessage.type === 'success' ? 'success' : 'error'}`}>
          {statusMessage.text}
        </div>
      )}

      {rol === 'ADMINISTRADOR' && (
        <div className="asistencias-stats-grid">
          {statsAdminCards.map(s => (
            <div key={s.label} className="asistencias-stat-card" style={{ background: s.bg, borderColor: s.bg }}>
              <div className="asistencias-stat-card__num" style={{ color: s.color }}>{s.value}</div>
              <div className="asistencias-stat-card__label" style={{ color: s.color }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      <div className="asistencias-controls">
        <div className="asistencias-controls__left">
          <div className="asistencias-fecha-picker">
            <input
              type="date"
              value={selectedDate}
              onChange={e => irAFecha(e.target.value)}
              className="asistencias-select asistencias-fecha-picker__input"
            />
            <button type="button" onClick={irAHoy} className="asistencias-btn-hoy">
              Hoy
            </button>
          </div>

          {fechasDisponibles.length > 0 && (
            <select
              value={fechasDisponibles.includes(selectedDate) ? selectedDate : ''}
              onChange={e => e.target.value && irAFecha(e.target.value)}
              className="asistencias-select"
              title="Fechas con registros existentes"
            >
              <option value="">📅 Fechas con registros...</option>
              {fechasDisponibles.map(fecha => (
                <option key={fecha} value={fecha}>{formatDate(fecha)}</option>
              ))}
            </select>
          )}

          {rol === 'ADMINISTRADOR' && (
            <select
              value={filtroCurso}
              onChange={e => { setFiltroCurso(e.target.value); setExpandedAsignatura(null) }}
              className="asistencias-select"
            >
              <option value="todos">📚 Todas las carreras</option>
              {cursos.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
          )}

          <div className="asistencias-controls__info">
            Mostrando <strong>{formatDate(selectedDate)}</strong>
          </div>
        </div>
        <div className="asistencias-controls__count">
          📊 {asistenciasDelDiaFiltradas.length} registros del día
        </div>
      </div>

      {loading && <div style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>Cargando asistencias...</div>}

      {!loading && misAsignaturas.length === 0 && (
        <div className="asistencias-empty">
          <div className="asistencias-empty__icon">📭</div>
          <p className="asistencias-empty__text">No hay asignaturas para mostrar.</p>
        </div>
      )}

      {!loading && misAsignaturas.length > 0 && (
        <div className="asistencias-lista">
          {misAsignaturas.map((asignatura) => {
            const cursoId = asignatura.cursoId || asignatura.curso_id
            const asistenciasAsignatura = getAsistenciasPorAsignaturaYFecha(asignatura, selectedDate)
            const todasAsistenciasAsignatura = asistencias.filter(a =>
              a.asignatura_id
                ? Number(a.asignatura_id) === Number(asignatura.id)
                : Number(a.curso_id || a.cursoId) === Number(cursoId)
            )
            const isExpanded = expandedAsignatura === asignatura.id
            const stats      = calcularEstadisticas(asistenciasAsignatura)
            const statsTotal = calcularEstadisticas(todasAsistenciasAsignatura)
            const curso      = cursos.find(c => Number(c.id) === Number(cursoId))
            const estudiantesDelCurso = getEstudiantesPorAsignatura(asignatura.id, cursoId)

            return (
              <div key={asignatura.id} className="asistencias-asig-card">
                <div
                  className={`asistencias-asig-card__header${isExpanded ? ' asistencias-asig-card__header--expanded' : ''}`}
                  onClick={() => setExpandedAsignatura(isExpanded ? null : asignatura.id)}
                >
                  <div>
                    <h3 className="asistencias-asig-card__nombre">{asignatura.nombre}</h3>
                    <p className="asistencias-asig-card__sub">
                      {curso?.nombre || 'Sin carrera'} · {estudiantesDelCurso.length} estudiantes
                      {rol === 'ADMINISTRADOR' && (
                        <span>· total histórico: {statsTotal.total} registros</span>
                      )}
                    </p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                    <div className="asistencias-mini-stats">
                      <div className="asistencias-mini-stat">
                        <span className="asistencias-mini-stat__label" style={{ color: '#94a3b8' }}>{formatDate(selectedDate)}</span>
                        <span className="asistencias-mini-stat__value">{stats.total}</span>
                      </div>
                      <div className="asistencias-mini-stat">
                        <span className="asistencias-mini-stat__label" style={{ color: '#059669' }}>✅</span>
                        <span className="asistencias-mini-stat__value" style={{ color: '#059669' }}>{stats.presente}</span>
                      </div>
                      <div className="asistencias-mini-stat">
                        <span className="asistencias-mini-stat__label" style={{ color: '#dc2626' }}>❌</span>
                        <span className="asistencias-mini-stat__value" style={{ color: '#dc2626' }}>{stats.ausente}</span>
                      </div>
                      {stats.tardanza > 0 && (
                        <div className="asistencias-mini-stat">
                          <span className="asistencias-mini-stat__label" style={{ color: '#7c3aed' }}>⏰</span>
                          <span className="asistencias-mini-stat__value" style={{ color: '#7c3aed' }}>{stats.tardanza}</span>
                        </div>
                      )}
                      {stats.justificado > 0 && (
                        <div className="asistencias-mini-stat">
                          <span className="asistencias-mini-stat__label" style={{ color: '#d97706' }}>📋</span>
                          <span className="asistencias-mini-stat__value" style={{ color: '#d97706' }}>{stats.justificado}</span>
                        </div>
                      )}
                    </div>
                    <span className="asistencias-chevron">{isExpanded ? '▲' : '▼'}</span>
                  </div>
                </div>

                {isExpanded && (
                  <div className="asistencias-asig-card__body">
                    {isProfesorOrAdmin && (
                      <div style={{ marginBottom: 20 }}>
                        {showForm && selectedAsignatura === asignatura.id ? (
                          <div className="asistencias-form-box">
                            <h4>📝 Registrar Asistencia — {asignatura.nombre}</h4>
                            <form onSubmit={handleAddAsistencia}>
                              <div className="asistencias-form-grid">
                                <div>
                                  <label className="asistencias-form-label">Estudiante *</label>
                                  <select required value={formData.estudiante_id}
                                    onChange={e => setFormData({ ...formData, estudiante_id: e.target.value })}
                                    className="asistencias-form-select">
                                    <option value="">Seleccionar estudiante</option>
                                    {estudiantesDelCurso.map(est => (
                                      <option key={est.id} value={est.id}>{est.nombre} {est.apellido}</option>
                                    ))}
                                  </select>
                                </div>
                                <div>
                                  <label className="asistencias-form-label">Fecha</label>
                                  <input type="date" value={formData.fecha}
                                    onChange={e => setFormData({ ...formData, fecha: e.target.value })}
                                    className="asistencias-form-input" />
                                </div>
                                <div>
                                  <label className="asistencias-form-label">Estado</label>
                                  <select value={formData.esTardanza ? 'TARDANZA' : formData.estado}
                                    onChange={e => {
                                      const val = e.target.value
                                      if (val === 'TARDANZA') {
                                        setFormData({ ...formData, esTardanza: true, estado: 'PRESENTE', tieneJustificativo: false, justificativo: '' })
                                      } else {
                                        setFormData({ ...formData, esTardanza: false, estado: val, tieneJustificativo: false, justificativo: '' })
                                      }
                                    }}
                                    className="asistencias-form-select">
                                    <option value="PRESENTE">✅ Presente</option>
                                    <option value="AUSENTE">❌ Ausente</option>
                                    <option value="TARDANZA">⏰ Tardanza</option>
                                    <option value="JUSTIFICADO">📋 Justificado</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="asistencias-form-label">Observaciones</label>
                                  <input type="text" value={formData.observaciones}
                                    onChange={e => setFormData({ ...formData, observaciones: e.target.value })}
                                    placeholder="Opcional"
                                    className="asistencias-form-input" />
                                </div>
                              </div>

                              {formData.esTardanza && (
                                <div className="asistencias-tardanza-box">
                                  <p className="asistencias-tardanza-box__title">⏰ Llegada con tardanza — ¿tiene justificativo?</p>
                                  <div className="asistencias-tardanza-box__btns">
                                    <button type="button"
                                      onClick={() => setFormData({ ...formData, tieneJustificativo: true })}
                                      className="asistencias-tardanza-btn"
                                      style={{
                                        border: formData.tieneJustificativo ? '2px solid #059669' : '1px solid #cbd5e1',
                                        background: formData.tieneJustificativo ? '#d1fae5' : 'white',
                                        color: formData.tieneJustificativo ? '#059669' : '#334155',
                                      }}>
                                      ✅ Sí, tiene justificativo → se marca PRESENTE
                                    </button>
                                    <button type="button"
                                      onClick={() => setFormData({ ...formData, tieneJustificativo: false, justificativo: '' })}
                                      className="asistencias-tardanza-btn"
                                      style={{
                                        border: !formData.tieneJustificativo ? '2px solid #dc2626' : '1px solid #cbd5e1',
                                        background: !formData.tieneJustificativo ? '#fee2e2' : 'white',
                                        color: !formData.tieneJustificativo ? '#dc2626' : '#334155',
                                      }}>
                                      ❌ No tiene justificativo → se marca AUSENTE
                                    </button>
                                  </div>
                                  {formData.tieneJustificativo && (
                                    <div>
                                      <label className="asistencias-form-label">Motivo del justificativo *</label>
                                      <input type="text" value={formData.justificativo}
                                        onChange={e => setFormData({ ...formData, justificativo: e.target.value })}
                                        placeholder="Ej: Certificado médico, problema de transporte..."
                                        className="asistencias-form-input" style={{ borderColor: '#fde68a' }} />
                                    </div>
                                  )}
                                  <p className="asistencias-tardanza-box__hint">
                                    {formData.tieneJustificativo
                                      ? '✅ Se guardará como PRESENTE con nota de tardanza justificada'
                                      : '❌ Se guardará como AUSENTE con nota de tardanza sin justificativo'}
                                  </p>
                                </div>
                              )}

                              <div className="asistencias-form-actions">
                                <button type="button"
                                  onClick={() => { setShowForm(false); setSelectedAsignatura(null); resetForm() }}
                                  className="asistencias-btn-cancel">
                                  Cancelar
                                </button>
                                <button type="submit" className="asistencias-btn-save">Guardar</button>
                              </div>
                            </form>
                          </div>
                        ) : (
                          <button
                            onClick={() => { setSelectedAsignatura(asignatura.id); setShowForm(true); setFormData(prev => ({ ...prev, fecha: selectedDate })) }}
                            className="asistencias-btn-agregar">
                            <span>+</span> Agregar Asistencia — {formatDate(selectedDate)}
                          </button>
                        )}
                      </div>
                    )}

                    {rol === 'ESTUDIANTE' && todasAsistenciasAsignatura.length > 0 && (
                      <div className="asistencias-progress-bar">
                        <div className="asistencias-progress-bar__top">
                          <span className="asistencias-progress-bar__label">Asistencia total</span>
                          <span className="asistencias-progress-bar__pct" style={{ color: statsTotal.porcentaje >= 75 ? '#059669' : '#dc2626' }}>{statsTotal.porcentaje}%</span>
                        </div>
                        <div className="asistencias-progress-bar__track">
                          <div
                            className={`asistencias-progress-bar__fill asistencias-progress-bar__fill--${statsTotal.porcentaje >= 75 ? 'ok' : 'low'}`}
                            style={{ width: `${statsTotal.porcentaje}%` }}
                          />
                        </div>
                        <p className="asistencias-progress-bar__hint">
                          {statsTotal.porcentaje >= 75 ? '✓ Asistencia suficiente' : '⚠ Asistencia insuficiente (mínimo 75%)'}
                        </p>
                      </div>
                    )}

                    {asistenciasAsignatura.length === 0 ? (
                      <div className="asistencias-sin-registros">
                        <div className="asistencias-sin-registros__icon">📭</div>
                        <p className="asistencias-sin-registros__text">Sin registros para el {formatDate(selectedDate)}.</p>
                      </div>
                    ) : (
                      <div className="asistencias-tabla-wrapper">
                        <div style={{ overflowX: 'auto' }}>
                          <table className="asistencias-tabla">
                            <thead>
                              <tr>
                                <th>Estudiante</th>
                                <th>Estado</th>
                                <th>Justificativo</th>
                                {isProfesorOrAdmin && <th style={{ textAlign: 'center' }}>Acciones</th>}
                              </tr>
                            </thead>
                            <tbody>
                              {asistenciasAsignatura.map((a) => (
                                <tr key={a.id}>
                                  <td style={{ fontWeight: 500 }}>{getNombre(a.estudiante_id || a.estudianteId)}</td>
                                  <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                                      <span className={getBadgeClass(a.estado)}>
                                        {a.estado === 'PRESENTE'    && '✅ Presente'}
                                        {a.estado === 'AUSENTE'     && '❌ Ausente'}
                                        {a.estado === 'JUSTIFICADO' && '📋 Justificado'}
                                        {a.estado === 'TARDANZA'    && '⏰ Tardanza'}
                                      </span>
                                      {tieneTardanza(a) && (
                                        <span className="asistencias-badge asistencias-badge--tardanza">⏰ Tardanza</span>
                                      )}
                                      {tieneJustificativoObs(a) && (
                                        <span className="asistencias-badge asistencias-badge--justificado">📋 Justificado</span>
                                      )}
                                    </div>
                                  </td>
                                  <td style={{ color: '#64748b' }}>{getJustificativo(a) || '—'}</td>
                                  {isProfesorOrAdmin && (
                                    <td style={{ textAlign: 'center' }}>
                                      <button onClick={() => handleDeleteAsistencia(a.id)} className="asistencias-btn-delete">🗑️</button>
                                    </td>
                                  )}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}

export default Asistencias
