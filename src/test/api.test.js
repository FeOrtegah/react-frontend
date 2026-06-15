import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  fetchUsuarios,
  fetchUsuarioPorId,
  fetchUsuarioPorUsername,
  crearUsuario,
  actualizarUsuario,
  eliminarUsuario,
  fetchPerfiles,
  fetchCursos,
  fetchAsignaturas,
  actualizarAsignatura,
  matricularEstudiante,
  fetchMatriculas,
  fetchAsignaturasPorCurso,
  fetchEvaluaciones,
  fetchEvaluacionesPorAsignatura,
  fetchNotas,
  eliminarMatricula,
  fetchNotasPorEstudiante,
  saveNota,
  updateNota,
  fetchAsistencias,
  crearAsistencia,
} from '../api';

// Mock global fetch
global.fetch = vi.fn();

describe('API Functions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.getItem.mockReturnValue(null);
  });

  describe('fetchJson helper function', () => {
    it('should add Authorization header when token exists', async () => {
      localStorage.getItem.mockReturnValue('test-token');
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: 'test' }),
      });

      await fetchUsuarios();

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token',
            'Content-Type': 'application/json',
          }),
        })
      );
    });

    it('should not add Authorization header when token is null', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: 'test' }),
      });

      await fetchUsuarios();

      const callArgs = global.fetch.mock.calls[0];
      expect(callArgs[1].headers.Authorization).toBeUndefined();
    });

    it('should throw error with status and data on failed response', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({ error: 'Usuario no encontrado' }),
      });

      await expect(fetchUsuarios()).rejects.toMatchObject({
        message: 'Error 404: Not Found',
        status: 404,
        data: { error: 'Usuario no encontrado' },
      });
    });

    it('should handle JSON parse error gracefully', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => {
          throw new Error('Parse error');
        },
      });

      await expect(fetchUsuarios()).rejects.toMatchObject({
        message: 'Error 500: Internal Server Error',
        status: 500,
        data: null,
      });
    });
  });

  describe('USUARIOS endpoints', () => {
    it('fetchUsuarios should call correct endpoint', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [{ id: 1, nombre: 'Juan' }],
      });

      const result = await fetchUsuarios();

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/usuarios'),
        expect.any(Object)
      );
      expect(result).toEqual([{ id: 1, nombre: 'Juan' }]);
    });

    it('fetchUsuarioPorId should include id in URL', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 1, nombre: 'Juan' }),
      });

      await fetchUsuarioPorId(1);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/usuarios/1'),
        expect.any(Object)
      );
    });

    it('fetchUsuarioPorUsername should include username in query', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 1, username: 'juan123' }),
      });

      await fetchUsuarioPorUsername('juan123');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('buscar?username=juan123'),
        expect.any(Object)
      );
    });

    it('crearUsuario should send POST with data', async () => {
      const userData = { nombre: 'Juan', email: 'juan@example.com' };
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 1, ...userData }),
      });

      await crearUsuario(userData);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/usuarios'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(userData),
        })
      );
    });

    it('actualizarUsuario should send PUT with id and data', async () => {
      const userData = { nombre: 'Juan Actualizado' };
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 1, ...userData }),
      });

      await actualizarUsuario(1, userData);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/usuarios/1'),
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(userData),
        })
      );
    });

    it('eliminarUsuario should send DELETE request', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      await eliminarUsuario(1);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/usuarios/1'),
        expect.objectContaining({
          method: 'DELETE',
        })
      );
    });
  });

  describe('PERFILES endpoints', () => {
    it('fetchPerfiles should call correct endpoint', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [{ id: 1, nombre: 'Admin' }],
      });

      const result = await fetchPerfiles();

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/perfiles'),
        expect.any(Object)
      );
      expect(result).toEqual([{ id: 1, nombre: 'Admin' }]);
    });
  });

  describe('ACADEMICA endpoints', () => {
    it('fetchCursos should call correct endpoint', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [{ id: 1, nombre: 'Curso 1' }],
      });

      await fetchCursos();

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/cursos'),
        expect.any(Object)
      );
    });

    it('fetchAsignaturas should call correct endpoint', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [{ id: 1, nombre: 'Matemáticas' }],
      });

      await fetchAsignaturas();

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/asignaturas'),
        expect.any(Object)
      );
    });

    it('actualizarAsignatura should send PUT with id and data', async () => {
      const data = { nombre: 'Matemáticas Actualizado' };
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 1, ...data }),
      });

      await actualizarAsignatura(1, data);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/asignaturas/1'),
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(data),
        })
      );
    });

    it('matricularEstudiante should send POST request', async () => {
      const data = { estudianteId: 1, cursoId: 1 };
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 1, ...data }),
      });

      await matricularEstudiante(data);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/matriculas'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(data),
        })
      );
    });

    it('fetchMatriculas should call correct endpoint', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [{ id: 1, estudianteId: 1 }],
      });

      await fetchMatriculas();

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/matriculas'),
        expect.any(Object)
      );
    });

    it('fetchAsignaturasPorCurso should include cursoId in URL', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [{ id: 1, nombre: 'Asignatura' }],
      });

      await fetchAsignaturasPorCurso(5);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/asignaturas/curso/5'),
        expect.any(Object)
      );
    });

    it('fetchEvaluaciones should call correct endpoint', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [{ id: 1, nombre: 'Evaluación 1' }],
      });

      await fetchEvaluaciones();

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/evaluaciones'),
        expect.any(Object)
      );
    });

    it('fetchEvaluacionesPorAsignatura should include asignaturaId in URL', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [{ id: 1, nombre: 'Evaluación' }],
      });

      await fetchEvaluacionesPorAsignatura(3);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/evaluaciones/asignatura/3'),
        expect.any(Object)
      );
    });

    it('fetchNotas should call correct endpoint', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [{ id: 1, nota: 8.5 }],
      });

      await fetchNotas();

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/notas'),
        expect.any(Object)
      );
    });

    it('fetchNotasPorEstudiante should include estudianteId in URL', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [{ id: 1, nota: 8.5 }],
      });

      await fetchNotasPorEstudiante(2);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/notas/estudiante/2'),
        expect.any(Object)
      );
    });

    it('saveNota should send POST request', async () => {
      const data = { estudianteId: 1, nota: 9.5 };
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 1, ...data }),
      });

      await saveNota(data);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/notas'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(data),
        })
      );
    });

    it('updateNota should send PUT request', async () => {
      const data = { nota: 9.0 };
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 1, ...data }),
      });

      await updateNota(1, data);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/notas/1'),
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(data),
        })
      );
    });

    it('eliminarMatricula should send DELETE with Authorization header', async () => {
      localStorage.getItem.mockReturnValue('test-token');
      global.fetch.mockResolvedValueOnce({
        ok: true,
      });

      await eliminarMatricula(1);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/matriculas/1'),
        expect.objectContaining({
          method: 'DELETE',
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token',
          }),
        })
      );
    });

    it('eliminarMatricula should throw error on failed response', async () => {
      localStorage.getItem.mockReturnValue('test-token');
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      await expect(eliminarMatricula(1)).rejects.toThrow('Error 404');
    });
  });

  describe('ASISTENCIA endpoints', () => {
    it('fetchAsistencias should call correct endpoint', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [{ id: 1, presente: true }],
      });

      await fetchAsistencias();

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/asistencias'),
        expect.any(Object)
      );
    });

    it('crearAsistencia should send POST request', async () => {
      const data = { estudianteId: 1, presente: true };
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 1, ...data }),
      });

      await crearAsistencia(data);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/asistencias'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(data),
        })
      );
    });
  });
});
