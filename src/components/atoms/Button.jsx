const Button = ({ children, onClick, type = 'button', disabled, fullWidth }) => (
  <button
    type={type}
    onClick={onClick}
    disabled={disabled}
    style={{
      width: fullWidth ? '100%' : 'auto',
      padding: '12px 24px',
      borderRadius: '8px',
      border: 'none',
      background: disabled ? '#a5b4fc' : '#4f46e5',
      color: 'white',
      fontSize: '15px',
      fontWeight: 'bold',
      cursor: disabled ? 'not-allowed' : 'pointer',
      transition: 'background 0.2s',
    }}
  >
    {children}
  </button>
)

export default Button