import { useState } from 'react'

function EnviarCorreo({ currentUser }) {
  const [destinatario, setDestinatario] = useState('')
  const [asunto, setAsunto] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [status, setStatus] = useState({ type: '', msg: '' })

  const handleSend = (e) => {
    e.preventDefault()
    
    if (!destinatario || !asunto || !mensaje) {
      setStatus({ type: 'error', msg: 'Por favor, completa todos los campos.' })
      return
    }
    const subjectEncoded = encodeURIComponent(asunto)
    const bodyEncoded = encodeURIComponent(mensaje)
    const mailtoLink = `mailto:${destinatario}?subject=${subjectEncoded}&body=${bodyEncoded}`

    window.location.href = mailtoLink

    setStatus({ 
      type: 'success', 
      msg: 'Abriendo tu cliente de correo (Gmail/Outlook)...' 
    })
    setTimeout(() => {
      setDestinatario('')
      setAsunto('')
      setMensaje('')
      setStatus({ type: '', msg: '' })
    }, 3000)
  }

  return (
    <div style={{ 
      background: 'white', 
      borderRadius: '16px', 
      padding: '24px', 
      marginTop: '32px', 
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      border: '1px solid #e5e7eb'
    }}>
      <h3 style={{ margin: '0 0 8px', color: '#111827', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '1.2rem' }}>📧</span> Enviar Aviso Externo (Email Real)
      </h3>
      <p style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: '20px' }}>
        Envia avisos directos a los correos @duocuc.cl de tus estudiantes.
      </p>

      <form onSubmit={handleSend} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ fontSize: '0.8rem', fontWeight: '600', color: '#374151' }}>Destinatario:</label>
          <input 
            type="email" 
            placeholder="ejemplo: d.espinoza@duocuc.cl" 
            value={destinatario}
            onChange={(e) => setDestinatario(e.target.value)}
            required
            style={{ padding: '12px', borderRadius: '8px', border: '1px solid #d1d5db', outlineColor: '#2563eb' }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ fontSize: '0.8rem', fontWeight: '600', color: '#374151' }}>Asunto:</label>
          <input 
            type="text" 
            placeholder="Asunto del aviso académico" 
            value={asunto}
            onChange={(e) => setAsunto(e.target.value)}
            required
            style={{ padding: '12px', borderRadius: '8px', border: '1px solid #d1d5db', outlineColor: '#2563eb' }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ fontSize: '0.8rem', fontWeight: '600', color: '#374151' }}>Mensaje:</label>
          <textarea 
            placeholder="Escribe el contenido del correo aquí..." 
            value={mensaje}
            onChange={(e) => setMensaje(e.target.value)}
            required
            rows="4"
            style={{ 
              padding: '12px', 
              borderRadius: '8px', 
              border: '1px solid #d1d5db', 
              outlineColor: '#2563eb', 
              fontFamily: 'inherit',
              resize: 'none'
            }}
          />
        </div>
        
        {status.msg && (
          <div style={{ 
            padding: '12px', 
            borderRadius: '8px', 
            background: status.type === 'success' ? '#ecfdf5' : '#fef2f2',
            color: status.type === 'success' ? '#059669' : '#dc2626',
            fontSize: '0.9rem',
            fontWeight: '500',
            border: `1px solid ${status.type === 'success' ? '#10b981' : '#f87171'}`
          }}>
            {status.msg}
          </div>
        )}

        <button 
          type="submit"
          style={{ 
            background: '#2563eb', 
            color: 'white', 
            padding: '14px', 
            borderRadius: '8px', 
            border: 'none', 
            fontWeight: 'bold',
            cursor: 'pointer',
            marginTop: '8px',
            transition: 'all 0.2s'
          }}
          onMouseOver={(e) => e.target.style.background = '#1d4ed8'}
          onMouseOut={(e) => e.target.style.background = '#2563eb'}
        >
          Redactar Correo
        </button>
      </form>
    </div>
  )
}

export default EnviarCorreo