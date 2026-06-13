import LoginForm from '../molecules/LoginForm'

const InicioSesion = ({ onLogin }) => (
  <div style={{
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  }}>
    <div style={{
      background: 'white',
      padding: '48px 40px',
      borderRadius: '16px',
      boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
      width: '100%',
      maxWidth: '400px',
    }}>
      <h1 style={{ margin: '0 0 8px', color: '#1a1a2e', textAlign: 'center', fontSize: '28px' }}>
        📚 Sistema Escolar
      </h1>
      <p style={{ margin: '0 0 32px', color: '#666', textAlign: 'center' }}>
        Inicia sesión para continuar
      </p>
      <LoginForm onLogin={onLogin} />
    </div>
  </div>
)

export default InicioSesion