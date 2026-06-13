import { useState } from 'react'
import Input from '../atoms/Input'
import Button from '../atoms/Button'
import { fetchUsuarioPorUsername } from '../../api'

const LoginForm = ({ onLogin }) => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const usuario = await fetchUsuarioPorUsername(username)

      if (usuario.credenciales.password !== password) {
        setError('Contraseña incorrecta')
        return
      }

      onLogin(usuario)
    } catch (err) {
      if (err.message.includes('404')) {
        setError('Usuario no encontrado')
      } else {
        setError('Error al conectar con el servidor')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <Input
        placeholder="Usuario"
        value={username}
        onChange={e => setUsername(e.target.value)}
        required
      />
      <Input
        type="password"
        placeholder="Contraseña"
        value={password}
        onChange={e => setPassword(e.target.value)}
        required
      />
      {error && <p style={{ color: '#ef4444', margin: 0, fontSize: '14px' }}>{error}</p>}
      <Button type="submit" disabled={loading} fullWidth>
        {loading ? 'Iniciando sesión...' : 'Ingresar'}
      </Button>
    </form>
  )
}

export default LoginForm
