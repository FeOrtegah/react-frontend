function DataTable({ data, title, columnas }) {
  if (!Array.isArray(data) || data.length === 0) {
    return <div className="empty">No hay datos disponibles</div>
  }

  const formatValue = (value) => {
    if (value === null || value === undefined) return '-'
    if (typeof value === 'boolean') return value ? 'Sí' : 'No'
    if (typeof value === 'object') return '-'
    return String(value)
  }

  const allColumns = Array.from(new Set(data.flatMap(item => Object.keys(item))))
  const columns = columnas || allColumns.filter(col => {
    const sample = data[0][col]
    return typeof sample !== 'object'
  }).slice(0, 12)

  return (
    <div className="data-table">
      {title && <h3 style={{ margin: '0 0 12px', color: '#111827' }}>{title}</h3>}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col} style={{ textTransform: 'capitalize', fontWeight: 600, color: '#374151' }}>
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((item, index) => (
              <tr key={index} style={{ background: index % 2 === 0 ? 'white' : '#f9fafb' }}>
                {columns.map((col) => (
                  <td key={col} style={{ color: '#374151' }}>
                    {formatValue(item[col])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default DataTable