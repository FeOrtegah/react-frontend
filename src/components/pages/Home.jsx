import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { fetchUsuarios, fetchAsignaturas } from '../../api'
import '../../styles/home.css'

const Tag = ({ label, bg, color }) => (
  <span className="home-tag" style={{ background: bg, color }}>{label}</span>
)

const noticias = [
  { tag: 'Académico',      tagBg: '#e6f1fb', tagColor: '#0c447c',  titulo: 'Inicio de evaluaciones del segundo semestre',           fecha: '12 jun 2026' },
  { tag: 'Actividades',    tagBg: '#faeeda', tagColor: '#633806',  titulo: 'Acto por el aniversario del colegio el próximo viernes', fecha: '10 jun 2026' },
  { tag: 'Logros',         tagBg: '#eaf3de', tagColor: '#27500a',  titulo: 'Alumnos destacados en olimpiada regional de matemáticas',fecha: '5 jun 2026'  },
  { tag: 'Administrativo', tagBg: '#e6f1fb', tagColor: '#0c447c',  titulo: 'Actualización del reglamento interno 2026 disponible',  fecha: '1 jun 2026'  },
]

const accesos = [
  { titulo: 'Gestión de usuarios', desc: 'Administra estudiantes, profesores y staff del colegio.', path: '/usuarios',    iconBg: '#e6f1fb', emoji: '👥', roles: ['ADMINISTRADOR'] },
  { titulo: 'Módulo académico',    desc: 'Cursos, evaluaciones, notas y calificaciones.',            path: '/academica',   iconBg: '#eaf3de', emoji: '📚', roles: ['ADMINISTRADOR', 'PROFESOR', 'ESTUDIANTE'] },
  { titulo: 'Asistencias',         desc: 'Registro diario y reportes de asistencia por curso.',      path: '/asistencias', iconBg: '#faeeda', emoji: '📅', roles: ['ADMINISTRADOR', 'PROFESOR', 'ESTUDIANTE'] },
  { titulo: 'Comunicación',        desc: 'Mensajes internos y notificaciones entre usuarios.',        path: '/comunicacion',iconBg: '#fbeaf0', emoji: '💬', roles: ['ADMINISTRADOR', 'PROFESOR', 'ESTUDIANTE'] },
]

function Home({ currentUser }) {
  const rol = currentUser?.rol
  const [stats, setStats] = useState({ estudiantes: '...', profesores: '...', asignaturas: '...' })

  useEffect(() => {
    if (rol !== 'ADMINISTRADOR') return
    Promise.all([fetchUsuarios(), fetchAsignaturas()])
      .then(([usuarios, asignaturas]) => {
        setStats({
          estudiantes: usuarios.filter(u => u.rol === 'ESTUDIANTE').length,
          profesores:  usuarios.filter(u => u.rol === 'PROFESOR').length,
          asignaturas: asignaturas.length,
        })
      })
      .catch(() => setStats({ estudiantes: '—', profesores: '—', asignaturas: '—' }))
  }, [rol])

  const saludo = () => {
    if (rol === 'ADMINISTRADOR') return `Bienvenido, ${currentUser?.nombre}`
    if (rol === 'PROFESOR')      return `Bienvenido, Prof. ${currentUser?.nombre}`
    if (rol === 'ESTUDIANTE')    return `Bienvenido, ${currentUser?.nombre}`
    return 'Bienvenido'
  }

  const accesosFiltrados = accesos.filter(a => a.roles.includes(rol))

  return (
    <div className="home-wrap">
      {/* ── Hero ── */}
      <div className="home-hero">
        <div className="home-hero__stripe" />
        <div className="home-hero__badge">Año escolar 2026</div>
        <h1 className="home-hero__h1">{saludo()}</h1>
        <p className="home-hero__p">Plataforma de gestión académica, comunicación y seguimiento estudiantil del Colegio Bernardo O'Higgins.</p>
        <div className="home-hero__btns">
          <Link to="/academica"   className="home-btn-gold">Ver académica →</Link>
          <Link to="/asistencias" className="home-btn-outline">Ver asistencias</Link>
        </div>
      </div>

      {/* ── Stats (solo admin) ── */}
      {rol === 'ADMINISTRADOR' && (
        <div className="home-stats-row">
          <div className="home-stat-card">
            <div className="home-stat-card__num">{stats.estudiantes}</div>
            <div className="home-stat-card__label">Estudiantes activos</div>
          </div>
          <div className="home-stat-card">
            <div className="home-stat-card__num">{stats.profesores}</div>
            <div className="home-stat-card__label">Profesores</div>
          </div>
          <div className="home-stat-card">
            <div className="home-stat-card__num">{stats.asignaturas}</div>
            <div className="home-stat-card__label">Asignaturas</div>
          </div>
        </div>
      )}

      {/* ── Acceso rápido ── */}
      <div className="home-section-label">Acceso rápido</div>
      <div className="home-section-title">¿Qué necesitas hacer hoy?</div>

      <div className="home-access-grid">
        {accesosFiltrados.map(a => (
          <Link key={a.path} to={a.path} className="home-access-card">
            <div className="home-access-card__icon" style={{ background: a.iconBg }}>
              <span>{a.emoji}</span>
            </div>
            <h3 className="home-access-card__h3">{a.titulo}</h3>
            <p className="home-access-card__p">{a.desc}</p>
          </Link>
        ))}
      </div>

      {/* ── Noticias ── */}
      <div className="home-section-label home-section-label--mt">Últimas noticias</div>
      <div className="home-section-title">Novedades del colegio</div>

      <div className="home-news-grid">
        {noticias.map((n, i) => (
          <div key={i} className="home-news-card">
            <Tag label={n.tag} bg={n.tagBg} color={n.tagColor} />
            <h4 className="home-news-card__h4">{n.titulo}</h4>
            <span className="home-news-card__fecha">{n.fecha}</span>
          </div>
        ))}
      </div>

      {/* ── CTA strip ── */}
      <div className="home-cta-strip">
        <div>
          <h3 className="home-cta-strip__h3">¿Necesitas ayuda con el sistema?</h3>
          <p className="home-cta-strip__p">Contacta al administrador o revisa la documentación disponible.</p>
        </div>
        <Link to="/comunicacion" className="home-btn-gold">Ir a comunicación →</Link>
      </div>
    </div>
  )
}

export default Home
