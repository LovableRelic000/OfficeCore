# OfficeCore — Registro de Progreso

Documento de seguimiento por fases según la Sección 15 de `plan.MD`.

## Estado Actual
- **Fase activa:** Fase 0 a Fase 6 — Completadas e integradas.
- **Fecha:** 2026-11-10

---

## Resumen de Componentes Construidos

### 1. Base de Datos y Seed Determinista (`db/`)
- [x] Esquema completo de 20 tablas en MySQL 8 (`db/schema.sql`).
- [x] Generador determinista de 7 días para Alex Rivera (`backend/src/db/seed/generator.ts`).
- [x] Comandos de soporte: `npm run db:init`, `npm run seed`, `npm run seed:reset` (< 1 min), `npm run seed:verify`.
- [x] Verificación de historias: L3 insomnio (<6h), L2 café después de las 16:00 (16:10), L4 mejor día con 4 bloques de foco.

### 2. Backend Centralizado (`backend/`)
- [x] Servidor Express + TypeScript con API REST modular en `0.0.0.0:3000`.
- [x] Servidor WebSocket en `/ws?token=` para sincronización en tiempo real de energía, alertas, calibración y foco.
- [x] Motor de presupuesto de energía unificado (`engine/energy.ts`).
- [x] Motor de farmacocinética de cafeína (`engine/caffeine.ts`).
- [x] Motor de política de avisos inteligentes (`engine/policy.ts`).
- [x] Motor de análisis de foco y flujo (`engine/focus.ts`).
- [x] Integración con Gemini AI (`ai/gemini.ts`) para resúmenes diarios estructurados y chat contextual sobre métricas reales.

### 3. Agente de PC Windows 11 (`pc-agent/`)
- [x] Aplicación Python 3.11+ con bandeja del sistema (`pystray`) e ícono neumórfico.
- [x] Monitoreo pasivo de cadencia de tecleo, coeficiente de variación y mouse.
- [x] Clasificación local por proceso (`editor`, `terminal`, `browser`, `meeting`, `chat`, `other`) sin registrar pulsaciones de teclas ni títulos de ventanas.
- [x] Ingesta automática de ventanas agregadas de 1 minuto a `POST /ingest/pc`.

### 4. App Móvil Expo (`mobile/`)
- [x] Tema neumórfico centralizado (`theme/tokens.ts`, `theme/components.tsx`) según `skill.MD` y `design.MD`.
- [x] 13 pantallas implementadas con React Native y Expo Router:
  1. `(tabs)/index.tsx`: Dashboard con anillo de energía concéntrico y tarjetas de módulos.
  2. `(tabs)/posture.tsx`: Historial de deuda ergonómica y distribución de bandas.
  3. `(tabs)/focus.tsx`: Sesiones de foco, calidad y selector de duración.
  4. `(tabs)/caffeine.tsx`: Curva de decaimiento SVG, nivel activo, hora límite y registro de bebidas.
  5. `(tabs)/assistant.tsx`: Resumen estructurado diario y chat con Gemini AI.
  6. `(tabs)/more.tsx`: Directorio de módulos y ajustes.
  7. `wellbeing.tsx`: Mapa de estrés con detonantes, descansos 20-20-20 y entorno.
  8. `history.tsx`: Resumen semanal y tendencias comparativas de 4 semanas.
  9. `rules.tsx`: Política de interrupciones y límites horarios.
  10. `devices.tsx`: Estado de dispositivos y generación de código de emparejamiento de 6 dígitos.
  11. `sleep.tsx`: Registro manual de sueño y semana de descanso.
  12. `calibration.tsx`: Asistente de calibración de postura neutral de 30 segundos.
  13. `settings.tsx`: Horarios, exportación y borrado de datos, versión y modelo de IA.
  14. `onboarding.tsx`: Explicación de privacidad y permisos.

### 5. App de Smartwatch Wear OS (`watch/`)
- [x] Proyecto Kotlin con Jetpack Compose for Wear OS (minSdk 30, compileSdk 34).
- [x] Soporte completo de bisel rotatorio físico (`onRotaryScrollEvent`).
- [x] Las 14 pantallas y componentes para Galaxy Watch4 Classic:
  - Pantalla y Tile de Anillo de Energía
  - Inicio con scroll rotatorio de módulos
  - Postura en vivo con deuda y estado de banda
  - Modo foco con selector de duración por bisel
  - Registro de cafeína con bisel
  - Registro de agua en pasos de 50 ml
  - Respiración guiada 4-7-8 con háptica y ajuste de ritmo
  - Alerta de pantalla completa con posposición en bisel
  - Pregunta de detonante de estrés con bisel
  - Sensor de ruido y luz ambiental
  - Cierre del día con ritual de desconexión
  - Calibración guiada de 30 segundos
  - Ajustes de háptica y estado de conexión
  - Complicación de energía para la carátula
- [x] Servicio en primer plano (`SensorService`) con acelerómetro a 25 Hz.
- [x] Lenguaje háptico personalizado (`HapticController`).
