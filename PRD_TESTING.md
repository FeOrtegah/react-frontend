# 📋 PRD - React Frontend Testing con TestSprite

**Proyecto:** react-frontend (DEFA)  
**Branch:** develop  
**Stack Actual:** React 19.2.5 + Vite 8.0.10 + React Router 7.15.0  
**Backend:** https://sistema-gateway.onrender.com  
**Herramienta de Testing:** TestSprite  
**Fecha:** Junio 2026

---

## 1. VISIÓN DEL PROYECTO

Establecer una suite de pruebas comprehensiva para la aplicación React (DEFA) en desarrollo, asegurando la calidad de componentes, rutas, integraciones con API y flujos de usuario críticos utilizando TestSprite.

---

## 2. OBJETIVOS

- ✅ Configurar TestSprite en el proyecto existente (rama develop)
- ✅ Crear pruebas para componentes React existentes
- ✅ Validar integraciones con backend en `sistema-gateway.onrender.com`
- ✅ Automatizar testing de rutas con React Router 7.15.0
- ✅ Implementar mock de APIs para testing sin dependencias externas
- ✅ Lograr cobertura mínima del 80% en componentes críticos
- ✅ Integrar CI/CD con GitHub Actions en rama develop
- ✅ Generar reports de coverage automáticos

---

## 3. REQUISITOS FUNCIONALES

### 3.1 Pruebas Unitarias
- [ ] Tests para componentes React individuales
- [ ] Tests para hooks personalizados
- [ ] Tests para utilidades y helpers
- [ ] Mocking de servicios de API
- [ ] Validación de props y tipos

### 3.2 Pruebas de Integración
- [ ] Flujos de navegación con React Router 7.15.0
- [ ] Interacción entre componentes
- [ ] Llamadas a API con mock de `sistema-gateway`
- [ ] Validación de respuestas del backend
- [ ] Manejo de errores de API

### 3.3 Pruebas E2E
- [ ] Flujos críticos de usuario
- [ ] Validación de formularios
- [ ] Navegación completa de la app
- [ ] Testing con proxy `/api` configurado en Vite

### 3.4 Cobertura de Código
- [ ] Coverage reports generados automáticamente
- [ ] Coverage >= 80% en módulos críticos
- [ ] Exclusión de node_modules y archivos generados

---

## 4. REQUISITOS TÉCNICOS

```json
{
  "framework": "React 19.2.5",
  "routing": "React Router DOM 7.15.0",
  "buildTool": "Vite 8.0.10",
  "port": 5174,
  "proxyTarget": "https://sistema-gateway.onrender.com/api",
  "testingTool": "TestSprite",
  "testFramework": "Vitest",
  "assertionLibrary": "@testing-library/react",
  "coverage": "c8",
  "ci": "GitHub Actions",
  "eslint": "10.2.1"
}
```

**Dependencias a instalar:**
```bash
npm install --save-dev testsprite vitest @testing-library/react @testing-library/user-event @testing-library/jest-dom c8 jsdom
```

---

## 5. ESTRUCTURA DE TESTING

```
src/
├── components/
│   ├── [Componentes existentes]
│   └── __tests__/
│       ├── Component.test.jsx
│       ├── Header.test.jsx
│       └── Navigation.test.jsx
├── pages/
│   ├── [Páginas existentes]
│   └── __tests__/
│       ├── Home.test.jsx
│       ├── Dashboard.test.jsx
│       └── NotFound.test.jsx
├── hooks/
│   ├── [Hooks personalizados]
│   └── __tests__/
│       ├── useCustomHook.test.js
│       └── useAPI.test.js
├── services/
│   ├── api.js
│   └── __tests__/
│       └── api.test.js
├── utils/
│   ├── [Helpers]
│   └── __tests__/
│       └── helpers.test.js
├── test/
│   ├── setup.ts
│   ├── mocks/
│   │   ├── server.js (MSW - Mock Service Worker)
│   │   └── handlers.js
│   └── fixtures/
│       └── mockData.js
└── testsprite/
    ├── e2e/
    │   ├── navigation.spec.ts
    │   ├── api-integration.spec.ts
    │   ├── forms.spec.ts
    │   └── user-flows.spec.ts
    └── config/
        └── testsprite.config.ts
```

---

## 6. CASOS DE PRUEBA PRINCIPALES

### 6.1 Componentes React
- ✅ Renderizado correcto de componentes
- ✅ Validación de props
- ✅ Manejo de callbacks y eventos
- ✅ Estados condicionales
- ✅ Componentes con hooks

### 6.2 Rutas (React Router 7.15.0)
- ✅ Navegación correcta entre rutas
- ✅ Parámetros de ruta dinámicos
- ✅ Redirecciones
- ✅ Rutas protegidas (si aplica)

### 6.3 Integraciones API
- ✅ Llamadas GET/POST a `/api/*`
- ✅ Mock de respuestas con MSW (Mock Service Worker)
- ✅ Manejo de errores HTTP
- ✅ Loading states
- ✅ Retry logic

### 6.4 Flujos de Usuario Críticos
- ✅ Autenticación (si existe)
- ✅ Operaciones CRUD
- ✅ Validación de formularios
- ✅ Notificaciones y feedback visual

---

## 7. CONFIGURACIÓN TESTSPRITE

### 7.1 vitest.config.ts
```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{js,jsx,ts,tsx}'],
    coverage: {
      provider: 'c8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'src/test/',
        'dist/',
        '**/*.spec.ts'
      ],
      lines: 80,
      functions: 80,
      branches: 75,
      statements: 80
    },
    environment: 'jsdom'
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
})
```

### 7.2 src/test/setup.ts
```typescript
import '@testing-library/jest-dom'
import { setupServer } from 'msw/node'
import { handlers } from './mocks/handlers'

export const server = setupServer(...handlers)

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
```

### 7.3 src/test/mocks/handlers.js
```javascript
import { http, HttpResponse } from 'msw'

export const handlers = [
  // Mock de endpoints del backend
  http.get('https://sistema-gateway.onrender.com/api/*', ({ request }) => {
    return HttpResponse.json({ /* response data */ })
  }),
  http.post('https://sistema-gateway.onrender.com/api/*', ({ request }) => {
    return HttpResponse.json({ /* response data */ })
  })
]
```

---

## 8. SCRIPTS NPM

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "lint": "eslint .",
    "preview": "vite preview",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage",
    "test:watch": "vitest --watch",
    "test:e2e": "testsprite run"
  }
}
```

---

## 9. CRITERIOS DE ACEPTACIÓN

- ✅ Suite de testing ejecuta sin errores en rama develop
- ✅ Cobertura >= 80% en componentes críticos
- ✅ Tests pasan en pre-commit hook
- ✅ Tests pasan en CI/CD (GitHub Actions)
- ✅ Mocks de API funcionan correctamente
- ✅ Navegación con React Router validada
- ✅ Reports de TestSprite generados
- ✅ Documentación de testing actualizada

---

## 10. TIMELINE

| Fase | Duración | Tareas |
|------|----------|--------|
| Setup | 2-3 días | Instalación TestSprite, Vitest, MSW en develop |
| Unit Tests | 5-7 días | Tests unitarios de componentes existentes |
| API Mocking | 2-3 días | Configurar MSW para endpoint `/api` |
| Integration | 3-5 días | Pruebas de integración con React Router |
| E2E | 3-5 días | Pruebas end-to-end con TestSprite |
| CI/CD | 2-3 días | GitHub Actions en rama develop |
| Dokumentación | 1-2 días | Guías de testing y reportes |

**Total estimado:** 18-28 días

---

## 11. RECURSOS Y REFERENCIAS

- 📖 [TestSprite Docs](https://testsprite.com)
- 📖 [Vitest Docs](https://vitest.dev)
- 📖 [React Testing Library](https://testing-library.com/react)
- 📖 [Mock Service Worker (MSW)](https://mswjs.io)
- 📖 [React Router v7 Testing](https://reactrouter.com/en/main/guides/testing)
- 📖 [GitHub Actions](https://docs.github.com/actions)

---

## 12. CONSIDERACIONES ESPECIALES

### 12.1 Backend en Render
- El backend está en `https://sistema-gateway.onrender.com`
- En desarrollo, Vite proxea `/api` → backend
- En tests, usar MSW para mockear respuestas
- Considerar rate limiting de Render en CI/CD

### 12.2 React Router v7
- Nuevas features en routing
- Validar transiciones entre páginas
- Testing de componentes con useLoaderData/useActionData

### 12.3 ESLint
- Mantener reglas consistentes
- Validar code style en pre-commit

---

## 13. CRITERIOS DE ÉXITO

- ✅ 100% de tests pasando en rama develop
- ✅ Cobertura de código >= 80%
- ✅ Tiempo de ejecución de suite < 5 minutos
- ✅ Zero test flakiness
- ✅ Documentación completa y actualizada
- ✅ CI/CD automático en cada commit a develop
- ✅ Reports de coverage públicos (opcional)

---

## 14. PRÓXIMOS PASOS

1. Revisar estructura actual en rama develop
2. Instalar dependencias de testing
3. Crear archivos de configuración (vitest.config.ts, setup.ts)
4. Implementar primeros tests unitarios
5. Configurar MSW para mocking de API
6. Crear GitHub Action para tests automáticos
7. Documentar patrones de testing para el equipo
