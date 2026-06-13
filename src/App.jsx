import { useState } from 'react'
import { BrowserRouter, NavLink, Route, Routes, Navigate } from 'react-router-dom'
import Home from './components/pages/Home'
import Usuarios from './components/pages/Usuarios'
import Asistencias from './components/pages/Asistencias'
import Academica from './components/pages/Academica'
import Comunicacion from './components/pages/Comunicacion'
import InicioSesion from './components/tameplates/InicioSesion'
import './App.css'

const navItems = [
  { path: '/', label: 'Inicio' },
  { path: '/usuarios', label: 'Usuarios', soloAdmin: true },
  { path: '/asistencias', label: 'Asistencias' },
  { path: '/academica', label: 'Académica' },
  { path: '/comunicacion', label: 'Comunicación' },
]

function App() {
  const [currentUser, setCurrentUser] = useState(null)

  return (
    <BrowserRouter>
      <Routes>
        {!currentUser ? (
          <Route path="*" element={<InicioSesion onLogin={setCurrentUser} />} />
        ) : (
          <Route path="/*" element={
            <div className="app-shell">
              <aside className="sidebar">
                <div className="brand">📚 Academia App</div>
                <nav>
                  {navItems
                    .filter(item => !item.soloAdmin || currentUser?.rol === 'ADMINISTRADOR')
                    .map((item) => (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
                      >
                        {item.label}
                      </NavLink>
                    ))}
                </nav>
                <div className="sidebar-footer">
                  <p style={{ margin: '0 0 4px', fontSize: '12px', color: '#9ca3af' }}>Usuario actual </p>
                  <strong>{currentUser.nombre} {currentUser.apellido}</strong>
                  <p style={{ fontSize: '12px', color: '#a5b4fc', margin: '4px 0 0' }}>
                    {currentUser.rol}
                  </p>
                  <button
                    type="button"
                    onClick={() => setCurrentUser(null)}
                    style={{
                      marginTop: '12px',
                      width: '100%',
                      padding: '8px',
                      borderRadius: '8px',
                      border: 'none',
                      background: '#ef4444',
                      color: 'white',
                      cursor: 'pointer',
                      fontWeight: 'bold'
                    }}
                  >
                    Cerrar sesión
                  </button>
                </div>
              </aside>

              <main className="main-content">
                <header className="main-header">
                  <div>
                    <h1>Bienvenido, {currentUser.nombre} {currentUser.apellido}</h1>
                    <p>Selecciona una sección para trabajar con tus APIs desplegadas.</p>
                  </div>
                  <div className="header-status">
                    <span style={{ fontSize: '12px', color: '#6b7280' }}>{currentUser.rol} : </span>
                    <strong>{currentUser.nombre} {currentUser.apellido}</strong>
                  </div>
                </header>

                <div className="page-wrapper">
                  <Routes>
                    <Route path="/" element={<Home currentUser={currentUser} />} />
                    <Route path="/usuarios" element={<Usuarios currentUser={currentUser} />} />
                    <Route path="/asistencias" element={<Asistencias currentUser={currentUser} />} />
                    <Route path="/academica" element={<Academica currentUser={currentUser} />} />
                    <Route path="/comunicacion" element={<Comunicacion currentUser={currentUser} />} />
                    <Route path="*" element={<Navigate to="/" />} />
                  </Routes>
                </div>
              </main>
            </div>
          } />
        )}
      </Routes>
    </BrowserRouter>
  )
}

export default App