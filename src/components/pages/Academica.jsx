import { useEffect, useState } from 'react'
import '../../styles/academica.css'
import { fetchAsignaturas, fetchCursos, fetchEvaluaciones, fetchNotas, fetchUsuarios, saveNota, updateNota } from '../../api'

const fmt = (v) => (v != null && v !== '' ? Number(v).toFixed(1) : null)
const color = (v) => v == null ? '#94a3b8' : Number(v) >= 4 ? '#16a34a' : '#dc2626'

const Badge = ({ v }) => {
  const val = fmt(v)
  const cls = val == null
    ? 'academica-badge academica-badge--sin-nota'
    : Number(val) >= 4
      ? 'academica-badge academica-badge--aprobado'
      : 'academica-badge academica-badge--reprobado'
  return <span className={cls}>{val ?? 'S/N'}</span>
}

function FilaEst({ est, ev, notas, onSave, guardadas, notaFinalEst }) {
  const nota = notas.find(n =>
    (Number(n.evaluacionId) === Number(ev.id) || Number(n.evaluacion_id) === Number(ev.id)) &&
    (Number(n.estudianteId) === Number(est.id) || Number(n.estudiante_id) === Number(est.id))
  )
  const actual = nota ? (nota.nota ?? nota.valor) : null
  const key = `${ev.id}-${est.id}`
  const [editing, setEditing] = useState(false)
  const [val, setVal] = useState('')

  const guardar = async () => {
    const n = parseFloat(val)
    if (isNaN(n) || n < 1 || n > 7) return
    await onSave(ev.id, est.id, n, key)
    setEditing(false)
  }

  return (
    <div className="academica-fila-est">
      <div className="academica-fila-est__left">
        <div className="academica-fila-est__avatar">
          {(est.nombre?.[0] ?? '').toUpperCase()}{(est.apellido?.[0] ?? '').toUpperCase()}
        </div>
        <div>
          <span className="academica-fila-est__nombre">{est.nombre} {est.apellido}</span>
          {notaFinalEst != null && (
            <span className="academica-fila-est__nf" style={{ color: Number(notaFinalEst) >= 4 ? '#16a34a' : '#dc2626' }}>
              NF: {Number(notaFinalEst).toFixed(1)}
            </span>
          )}
        </div>
      </div>
      <div className="academica-fila-est__right">
        {editing ? (
          <>
            <input
              autoFocus type="number" min="1" max="7" step="0.1" value={val}
              onChange={e => setVal(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && guardar()}
              className="academica-nota-input"
            />
            <button onClick={guardar} className="academica-btn-guardar">✓</button>
            <button onClick={() => setEditing(false)} className="academica-btn-cancelar">✕</button>
          </>
        ) : (
          <>
            <Badge v={actual} />
            {guardadas.has(key)
              ? <span className="academica-guardada-label">✓ Guardada</span>
              : (
                <button
                  onClick={() => { setVal(actual != null ? String(actual) : ''); setEditing(true) }}
                  className="academica-btn-agregar-nota"
                  style={{
                    background: actual != null ? '#eff6ff' : '#f0fdf4',
                    color: actual != null ? '#2563eb' : '#16a34a',
                    borderColor: actual != null ? '#bfdbfe' : '#bbf7d0',
                  }}
                >
                  {actual != null ? '✏ Editar' : '+ Agregar'}
                </button>
              )
            }
          </>
        )}
      </div>
    </div>
  )
}

function VistaProfesor({ evsDeAsignatura, notas, usuarios, onSave, guardadas, calcHitoEst }) {
  const [selEv, setSelEv] = useState(evsDeAsignatura[0]?.id ?? null)

  useEffect(() => {
    if (evsDeAsignatura.length && (!selEv || !evsDeAsignatura.some(e => Number(e.id) === Number(selEv)))) {
      setSelEv(evsDeAsignatura[0].id)
    }
  }, [evsDeAsignatura])

  if (!evsDeAsignatura.length) return <p className="academica-sin-ev">Sin evaluaciones programadas.</p>
  const ev = evsDeAsignatura.find(e => Number(e.id) === Number(selEv))

  return (
    <div className="academica-vista-prof">
      <p className="academica-vista-prof__label">Seleccionar evaluación</p>
      <div className="academica-ev-btns">
        {evsDeAsignatura.map(e => {
          const sel = Number(selEv) === Number(e.id)
          const pct = e.ponderacion < 1 ? e.ponderacion * 100 : e.ponderacion
          const cnt = usuarios.filter(u => notas.some(n =>
            (Number(n.evaluacionId) === Number(e.id) || Number(n.evaluacion_id) === Number(e.id)) &&
            (Number(n.estudianteId) === Number(u.id) || Number(n.estudiante_id) === Number(u.id))
          )).length
          return (
            <button
              key={e.id}
              onClick={() => setSelEv(e.id)}
              className={`academica-ev-btn academica-ev-btn--${sel ? 'sel' : 'nosel'}`}
            >
              <span>{e.nombre}</span>
              <span className="academica-ev-btn__sub">{pct}% · {cnt}/{usuarios.length} notas</span>
            </button>
          )
        })}
      </div>
      {ev && (
        <div className="academica-estudiantes-lista">
          {usuarios.length === 0
            ? <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Sin estudiantes asignados a este curso.</p>
            : usuarios.map(est => {
                const { final: nf } = calcHitoEst ? calcHitoEst(evsDeAsignatura, est.id) : { final: null }
                return <FilaEst key={est.id} est={est} ev={ev} notas={notas} onSave={onSave} guardadas={guardadas} notaFinalEst={nf} />
              })
          }
        </div>
      )}
    </div>
  )
}

const CARRERA_ICONS = {
  default: '🎓',
  'informática': '💻',
  'software': '💻',
  'ingeniería': '⚙️',
  'administración': '📊',
  'empresas': '📊',
  'diseño': '🎨',
  'gráfico': '🎨',
  'contabilidad': '🧾',
  'marketing': '📣',
}

function getCarreraIcon(nombre) {
  const lower = nombre.toLowerCase()
  for (const [key, icon] of Object.entries(CARRERA_ICONS)) {
    if (lower.includes(key)) return icon
  }
  return CARRERA_ICONS.default
}

export default function Academica({ currentUser }) {
  const [cursos, setCursos] = useState([])
  const [asignaturas, setAsignaturas] = useState([])
  const [evaluaciones, setEvaluaciones] = useState([])
  const [notas, setNotas] = useState([])
  const [usuarios, setUsuarios] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [status, setStatus] = useState(null)
  const [expanded, setExpanded] = useState(null)
  const [guardadas, setGuardadas] = useState(new Set())
  const [tabActiva, setTabActiva] = useState(null)
  const rol = currentUser?.rol
  const uid = currentUser ? Number(currentUser.id) : null

  useEffect(() => {
    if (!currentUser) return
    setLoading(true)
    Promise.all([fetchCursos(), fetchAsignaturas(), fetchEvaluaciones(), fetchNotas(), fetchUsuarios()])
      .then(([c, a, ev, n, u]) => {
        setCursos(c)
        setEvaluaciones(ev)
        setUsuarios(u.filter(x => x.rol === 'ESTUDIANTE'))

        if (rol === 'ESTUDIANTE') {
          const misNotas = n.filter(x => Number(x.estudianteId) === uid || Number(x.estudiante_id) === uid)
          setNotas(misNotas)
          const userObj = u.find(x => Number(x.id) === uid)
          const cursoId = userObj?.cursoId ?? userObj?.curso_id ?? userObj?.curso?.id
          let misAsigs = []
          if (cursoId) {
            misAsigs = a.filter(x => Number(x.cursoId ?? x.curso_id) === Number(cursoId))
          } else {
            const misEvalIds = new Set(misNotas.map(x => Number(x.evaluacionId ?? x.evaluacion_id)))
            misAsigs = a.filter(asig =>
              ev.some(e =>
                (Number(e.asignaturaId) === Number(asig.id) || Number(e.asignatura_id) === Number(asig.id)) &&
                misEvalIds.has(Number(e.id))
              )
            )
          }
          setAsignaturas(misAsigs.length > 0 ? misAsigs : a)
        } else if (rol === 'PROFESOR') {
          setAsignaturas(a.filter(x => Number(x.profesorId ?? x.profesor_id) === uid))
          setNotas(n)
        } else {
          setAsignaturas(a)
          setNotas(n)
        }
      })
      .catch(() => setError('Error al cargar datos. Intenta de nuevo.'))
      .finally(() => setLoading(false))
  }, [currentUser])

  const carreraMap = {}
  asignaturas.forEach(asig => {
    const cursoId = asig.cursoId ?? asig.curso_id
    const cursoNombre = cursos.find(c => Number(c.id) === Number(cursoId))?.nombre ?? 'General / Común'
    if (!carreraMap[cursoNombre]) carreraMap[cursoNombre] = []
    carreraMap[cursoNombre].push(asig)
  })
  const carreras = Object.entries(carreraMap)

  useEffect(() => {
    if (carreras.length > 0 && (tabActiva === null || !carreraMap[tabActiva])) {
      setTabActiva(carreras[0][0])
    }
  }, [carreras.length])

  const handleSave = async (evId, estId, val, key) => {
    try {
      const notaExistente = notas.find(n =>
        (Number(n.evaluacionId) === Number(evId) || Number(n.evaluacion_id) === Number(evId)) &&
        (Number(n.estudianteId) === Number(estId) || Number(n.estudiante_id) === Number(estId))
      )
      if (notaExistente && notaExistente.id) {
        await updateNota(notaExistente.id, { evaluacionId: Number(evId), estudianteId: Number(estId), valor: val, nota: val })
      } else {
        await saveNota({ evaluacionId: Number(evId), estudianteId: Number(estId), valor: val, nota: val })
      }
      setNotas(prev => {
        const existe = prev.some(n =>
          (Number(n.evaluacionId) === Number(evId) || Number(n.evaluacion_id) === Number(evId)) &&
          (Number(n.estudianteId) === Number(estId) || Number(n.estudiante_id) === Number(estId))
        )
        return existe
          ? prev.map(n =>
              (Number(n.evaluacionId) === Number(evId) || Number(n.evaluacion_id) === Number(evId)) &&
              (Number(n.estudianteId) === Number(estId) || Number(n.estudiante_id) === Number(estId))
                ? { ...n, valor: val, nota: val } : n
            )
          : [...prev, { evaluacionId: Number(evId), evaluacion_id: Number(evId), estudianteId: Number(estId), estudiante_id: Number(estId), valor: val, nota: val }]
      })
      setGuardadas(prev => new Set([...prev, key]))
      setStatus({ ok: true, msg: 'Nota guardada correctamente.' })
      setTimeout(() => setStatus(null), 3000)
    } catch (e) {
      setStatus({ ok: false, msg: e.message })
    }
  }

  const detectarExamen = (evs) => {
    const keywords = ['examen', 'exam', 'final', '3']
    let ev = evs.find(e => keywords.some(k => e.nombre.toLowerCase().includes(k)))
    if (!ev && evs.length > 0) {
      ev = evs.reduce((max, e) => {
        const p = e.ponderacion < 1 ? e.ponderacion * 100 : e.ponderacion
        const mp = max.ponderacion < 1 ? max.ponderacion * 100 : max.ponderacion
        return p > mp ? e : max
      })
    }
    return ev
  }

  const calcHito = (evs, estudianteId = null) => {
    const examenEv = detectarExamen(evs)
    const parciales = evs.filter(e => e.id !== examenEv?.id)
    const targetEstId = rol === 'ESTUDIANTE' ? uid : estudianteId

    const getNota = (evId) => notas.find(x =>
      (Number(x.evaluacionId) === Number(evId) || Number(x.evaluacion_id) === Number(evId)) &&
      (targetEstId == null || Number(x.estudianteId) === Number(targetEstId) || Number(x.estudiante_id) === Number(targetEstId))
    )

    let sp = 0, sw = 0
    parciales.forEach(e => {
      const n = getNota(e.id)
      const v = n ? Number(n.nota ?? n.valor) : null
      if (v != null) { const p = e.ponderacion < 1 ? e.ponderacion * 100 : e.ponderacion; sp += v * (p / 100); sw += p / 100 }
    })
    const pres = sw > 0 ? Number((sp / sw).toFixed(1)) : null
    const exN  = examenEv ? getNota(examenEv.id) : null
    const exam = exN ? Number(exN.nota ?? exN.valor) : null
    const final = pres != null && exam != null ? Number((pres * .6 + exam * .4).toFixed(1)) : null
    return { pres, exam, final }
  }

  const promedioCurso = (evs, alumnosAsignados) => {
    if (!evs.length || !alumnosAsignados.length) return null
    const finales = alumnosAsignados.map(u => calcHito(evs, u.id).final).filter(f => f != null)
    if (finales.length === 0) {
      const notasFiltradas = notas.filter(n =>
        evs.some(e => Number(e.id) === Number(n.evaluacionId) || Number(e.id) === Number(n.evaluacion_id))
      ).map(n => Number(n.nota ?? n.valor))
      if (notasFiltradas.length === 0) return null
      return Number((notasFiltradas.reduce((a, b) => a + b, 0) / notasFiltradas.length).toFixed(1))
    }
    return Number((finales.reduce((a, b) => a + b, 0) / finales.length).toFixed(1))
  }

  const asignaturasActivas = tabActiva ? (carreraMap[tabActiva] ?? []) : []

  return (
    <section className="academica-section">
      <div className="academica-header">
        <h2>Notas Académicas</h2>
        <p>
          {{ ESTUDIANTE: 'Revisa el estado de tus notas por cada ramo del semestre.', PROFESOR: 'Selecciona una asignatura y evaluación para gestionar calificaciones.', ADMINISTRADOR: 'Panel global de administración: visualiza y edita notas por asignatura.' }[rol]}
        </p>
      </div>

      {error  && <div className="academica-alert academica-alert--error">⚠ {error}</div>}
      {status && <div className={`academica-alert academica-alert--${status.ok ? 'success' : 'error'}`}>{status.ok ? '✓ ' : '⚠ '}{status.msg}</div>}
      {loading && <div className="academica-loading">Cargando...</div>}
      {!loading && asignaturas.length === 0 && <div className="academica-empty">No se encontraron asignaturas.</div>}

      {!loading && carreras.length > 0 && (
        <>
          <div className="academica-tabs">
            {carreras.map(([nombreCarrera]) => {
              const activa = tabActiva === nombreCarrera
              const icon = getCarreraIcon(nombreCarrera)
              return (
                <button
                  key={nombreCarrera}
                  onClick={() => { setTabActiva(nombreCarrera); setExpanded(null) }}
                  className={`academica-tab${activa ? ' academica-tab--activa' : ''}`}
                >
                  <span>{icon}</span>
                  <span>{nombreCarrera}</span>
                </button>
              )
            })}
          </div>

          <div className="academica-panel">
            <div className="academica-panel__header">
              <span className="academica-panel__header-icon">{getCarreraIcon(tabActiva ?? '')}</span>
              <span>{tabActiva}</span>
            </div>

            <div className="academica-panel__body">
              {asignaturasActivas.length === 0 ? (
                <div className="academica-empty">No hay asignaturas registradas.</div>
              ) : (
                asignaturasActivas.map((asig, idx) => {
                  const isOpen  = expanded === asig.id
                  const cursoId = asig.cursoId ?? asig.curso_id
                  const evs     = evaluaciones.filter(e => Number(e.asignaturaId) === Number(asig.id) || Number(e.asignatura_id) === Number(asig.id))

                  const alumnosAsignados = (rol === 'PROFESOR' || rol === 'ADMINISTRADOR')
                    ? usuarios.filter(u =>
                        notas.some(n =>
                          evs.some(e => Number(e.id) === Number(n.evaluacionId) || Number(e.id) === Number(n.evaluacion_id)) &&
                          (Number(n.estudianteId) === Number(u.id) || Number(n.estudiante_id) === Number(u.id))
                        )
                      )
                    : usuarios.filter(u => Number(u.cursoId ?? u.curso_id) === Number(cursoId))

                  const { pres, exam, final } = calcHito(evs)
                  const notaHeader = (rol === 'PROFESOR' || rol === 'ADMINISTRADOR') ? promedioCurso(evs, alumnosAsignados) : final

                  return (
                    <div key={asig.id} className="academica-asig-row">
                      <div
                        onClick={() => setExpanded(isOpen ? null : asig.id)}
                        className={`academica-asig-row__header${isOpen ? ' academica-asig-row__header--open' : ''}`}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div className={`academica-asig-row__icon academica-asig-row__icon--${isOpen ? 'open' : 'closed'}`}>
                            {isOpen ? '📖' : '📚'}
                          </div>
                          <div>
                            <div className="academica-asig-row__nombre">{asig.nombre}</div>
                            <div className="academica-asig-row__sub">
                              {cursos.find(c => Number(c.id) === Number(cursoId))?.nombre ?? 'Curso General'} · {alumnosAsignados.length} Alumnos
                            </div>
                          </div>
                        </div>
                        <div className="academica-asig-row__right">
                          <div style={{ textAlign: 'right' }}>
                            <div className="academica-asig-row__nota-label">
                              {rol === 'PROFESOR' || rol === 'ADMINISTRADOR' ? 'Promedio General' : 'Tu Nota'}
                            </div>
                            {notaHeader != null
                              ? <Badge v={notaHeader} />
                              : <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#cbd5e1' }}>--</span>
                            }
                          </div>
                          <svg
                            width="15" height="15" viewBox="0 0 24 24" fill="none"
                            stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round"
                            className={`academica-chevron${isOpen ? ' academica-chevron--open' : ''}`}
                          >
                            <polyline points="6 9 12 15 18 9" />
                          </svg>
                        </div>
                      </div>

                      {isOpen && (
                        <div className="academica-asig-body">
                          {rol === 'PROFESOR' || rol === 'ADMINISTRADOR' ? (
                            <VistaProfesor
                              evsDeAsignatura={evs}
                              notas={notas}
                              usuarios={alumnosAsignados}
                              onSave={handleSave}
                              guardadas={guardadas}
                              calcHitoEst={calcHito}
                            />
                          ) : (
                            <div style={{ padding: '20px 22px' }}>
                              <p className="academica-parciales-label">Evaluaciones parciales</p>
                              <div className="academica-parciales-grid">
                                {evs.length === 0
                                  ? <span style={{ color: '#cbd5e1', fontSize: '0.85rem' }}>Sin parciales registradas</span>
                                  : evs.map(ev => {
                                      const n = notas.find(x =>
                                        (Number(x.evaluacionId) === Number(ev.id) || Number(x.evaluacion_id) === Number(ev.id)) &&
                                        (Number(x.estudianteId) === uid || Number(x.estudiante_id) === uid)
                                      )
                                      const v = n ? Number(n.nota ?? n.valor) : null
                                      return (
                                        <div key={ev.id} className="academica-parcial-card">
                                          <div>
                                            <div className="academica-parcial-card__nombre">{ev.nombre}</div>
                                            <div className="academica-parcial-card__pct">{ev.ponderacion < 1 ? ev.ponderacion * 100 : ev.ponderacion}%</div>
                                          </div>
                                          <Badge v={v} />
                                        </div>
                                      )
                                    })
                                }
                              </div>
                              <p className="academica-cierre-label">Cierre de semestre</p>
                              <div className="academica-cierre-table">
                                {[{ label: 'Nota Presentación', sub: '60% del total', v: pres }, { label: 'Nota Examen', sub: '40% del total', v: exam }].map((row, i) => (
                                  <div key={i} className="academica-cierre-row">
                                    <div>
                                      <div className="academica-cierre-row__nombre">{row.label}</div>
                                      <div className="academica-cierre-row__sub">{row.sub}</div>
                                    </div>
                                    <Badge v={row.v} />
                                  </div>
                                ))}
                                <div className={`academica-cierre-final academica-cierre-final--${final != null ? (Number(final) >= 4 ? 'ok' : 'mal') : 'neutral'}`}>
                                  <span className="academica-cierre-final__label">Nota Final</span>
                                  <span className="academica-cierre-final__nota" style={{ color: color(final) }}>
                                    {final != null ? Number(final).toFixed(1) : '--'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </>
      )}
    </section>
  )
}
