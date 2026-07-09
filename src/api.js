const GATEWAY_URL = import.meta.env.VITE_GATEWAY_URL || 'https://sistema-gateway.onrender.com';

const fetchJson = async (url, options = {}) => {
    const token = localStorage.getItem('token');
    const res = await fetch(url, {
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        ...options,
    });
 
    let text = ''
    try { text = await res.text() } catch (e) { /* ignore */ }

    let body = null
    if (text) {
        try { body = JSON.parse(text) } catch (e) { /* no era JSON válido, se deja null */ }
    }

    if (!res.ok) {
        const err = new Error(`Error ${res.status}: ${res.statusText}`)
        err.status = res.status
        err.data = body
        throw err
    }

    return body;
};

// USUARIOS
export const fetchUsuarios = () =>
    fetchJson(`${GATEWAY_URL}/api/v1/usuarios`);
export const fetchUsuarioPorId = (id) =>
    fetchJson(`${GATEWAY_URL}/api/v1/usuarios/${id}`);
export const fetchUsuarioPorUsername = (username) =>
    fetchJson(`${GATEWAY_URL}/api/v1/usuarios/buscar?username=${username}`);
export const crearUsuario = (data) =>
    fetchJson(`${GATEWAY_URL}/api/v1/usuarios`, {
        method: 'POST',
        body: JSON.stringify(data),
    });
export const actualizarUsuario = (id, data) =>
    fetchJson(`${GATEWAY_URL}/api/v1/usuarios/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    });
export const eliminarUsuario = (id) =>
    fetchJson(`${GATEWAY_URL}/api/v1/usuarios/${id}`, { method: 'DELETE' });

// PERFILES
export const fetchPerfiles = () =>
    fetchJson(`${GATEWAY_URL}/api/v1/perfiles`);

// ACADEMICA
export const fetchCursos = () =>
    fetchJson(`${GATEWAY_URL}/api/cursos`);
export const fetchAsignaturas = () =>
    fetchJson(`${GATEWAY_URL}/api/asignaturas`);
export const actualizarAsignatura = (id, data) =>
    fetchJson(`${GATEWAY_URL}/api/asignaturas/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    });
export const matricularEstudiante = (data) =>
    fetchJson(`${GATEWAY_URL}/api/matriculas`, {
        method: 'POST',
        body: JSON.stringify(data),
    });
export const fetchMatriculas = () =>
    fetchJson(`${GATEWAY_URL}/api/matriculas`);
export const fetchAsignaturasPorCurso = (cursoId) =>
    fetchJson(`${GATEWAY_URL}/api/asignaturas/curso/${cursoId}`);
export const fetchEvaluaciones = () =>
    fetchJson(`${GATEWAY_URL}/api/evaluaciones`);
export const fetchEvaluacionesPorAsignatura = (asignaturaId) =>
    fetchJson(`${GATEWAY_URL}/api/evaluaciones/asignatura/${asignaturaId}`);
export const fetchNotas = () =>
    fetchJson(`${GATEWAY_URL}/api/notas`);
export const eliminarMatricula = (id) =>
    fetchJson(`${GATEWAY_URL}/api/matriculas/${id}`, { method: 'DELETE' });
export const fetchNotasPorEstudiante = (estudianteId) =>
    fetchJson(`${GATEWAY_URL}/api/notas/estudiante/${estudianteId}`);
export const saveNota = (data) =>
    fetchJson(`${GATEWAY_URL}/api/notas`, {
        method: 'POST',
        body: JSON.stringify(data),
    });
export const updateNota = (id, data) =>
    fetchJson(`${GATEWAY_URL}/api/notas/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    });

// ASISTENCIA
export const fetchAsistencias = () =>
    fetchJson(`${GATEWAY_URL}/api/v1/asistencias`);
export const crearAsistencia = (data) =>
    fetchJson(`${GATEWAY_URL}/api/v1/asistencias`, {
        method: 'POST',
        body: JSON.stringify(data),
    });
export const eliminarAsistencia = (id) =>
    fetchJson(`${GATEWAY_URL}/api/v1/asistencias/${id}`, { method: 'DELETE' });
export const fetchAnotaciones = () =>
    fetchJson(`${GATEWAY_URL}/api/v1/anotaciones`);
export const fetchJustificaciones = () =>
    fetchJson(`${GATEWAY_URL}/api/v1/justificaciones`);

// COMUNICACION
export const fetchConversaciones = (usuarioId) =>
    fetchJson(`${GATEWAY_URL}/api/comunicacion/conversaciones/${usuarioId}`);
export const fetchNotificaciones = (usuarioId) =>
    fetchJson(`${GATEWAY_URL}/api/comunicacion/notificaciones/${usuarioId}`);
export const fetchMensajesEntrada = (usuarioId) =>
    fetchJson(`${GATEWAY_URL}/api/comunicacion/mensajes/entrada/${usuarioId}`);
export const enviarMensaje = (data) =>
    fetchJson(`${GATEWAY_URL}/api/comunicacion/mensajes`, {
        method: 'POST',
        body: JSON.stringify(data),
    });
export const crearConversacion = (data) =>
    fetchJson(`${GATEWAY_URL}/api/comunicacion/conversaciones`, {
        method: 'POST',
        body: JSON.stringify(data),
    });
export const fetchMensajesConversacion = (conversacionId) =>
    fetchJson(`${GATEWAY_URL}/api/comunicacion/conversaciones/${conversacionId}/mensajes`);
