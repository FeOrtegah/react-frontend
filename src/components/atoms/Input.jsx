const Input = ({ type = 'text', placeholder, value, onChange, required }) => (
  <input
    type={type}
    placeholder={placeholder}
    value={value}
    onChange={onChange}
    required={required}
    style={{
      width: '100%',
      padding: '12px 16px',
      borderRadius: '8px',
      border: '1px solid #ddd',
      fontSize: '15px',
      outline: 'none',
      boxSizing: 'border-box',
      transition: 'border-color 0.2s',
    }}
  />
)

export default Input