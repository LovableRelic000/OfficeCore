# OfficeCore — Registro de Progreso

Documento de seguimiento por fases según la Sección 15 de `plan.MD`.

## Estado Actual
- **Fase activa:** Fase 0 — Fundaciones y demo viva.
- **Fecha de inicio:** 2026-11-10

---

## Fases

### Fase 0 — Fundaciones y demo viva
- [ ] Monorepo y estructura base
- [ ] Base de datos MySQL `officecore`, `db/schema.sql`
- [ ] Generador de seed determinista (`npm run db:init`, `npm run seed`, `npm run seed:reset`, `npm run seed:verify`)
- [ ] Backend Node + Express + TypeScript con endpoints clave (`/health`, `/me`, `/energy/now`, `/energy/day`, etc.)
- [ ] App móvil Expo con tema Neumorphic según `skill.MD` y `design.MD`
- [ ] App reloj Wear OS (Wear Compose) con pantalla de energía y estructura de navegación
- [ ] Documentación inicial de sensores e investigación

### Fase 1 — Postura y tecleo
- [ ] Pantallas de postura (móvil y reloj)
- [ ] Calibración de 30 s
- [ ] Detección heurística de tecleo
- [ ] Ventanas de postura y cálculo de deuda ergonómica
- [ ] Alertas con háptica y posposición con bisel

### Fase 2 — Foco y agente de PC
- [ ] Agente de PC (Python Windows con bandeja, monitoreo pasivo respetando privacidad)
- [ ] Emparejado por código de 6 dígitos
- [ ] Ingesta periódica de actividad de PC (`/ingest/pc`)
- [ ] Detección automática de bloques de foco en backend
- [ ] Modo foco manual en reloj con ajuste por bisel

### Fase 3 — Cafeína, sueño y energía completa
- [ ] Registro de cafeína con bisel en reloj
- [ ] Modelo de vida media exponencial y cálculo de hora límite
- [ ] Registro manual de sueño
- [ ] Motor de energía unificado (`backend/src/engine/energy.ts`)
- [ ] Complicación y Tile para Wear OS

### Fase 4 — Bienestar y política de avisos
- [ ] Detección y mapa de estrés con detonantes seleccionables por bisel
- [ ] Respiración guiada en reloj con retroalimentación háptica
- [ ] Pausas inteligentes (20-20-20, agua, estiramiento)
- [ ] Muestreo ambiental (ruido dB sin guardar audio, lux)
- [ ] Motor de política de avisos (`backend/src/engine/policy.ts`)

### Fase 5 — Asistente IA y cierre del día
- [ ] Integración con Gemini (`@google/genai`)
- [ ] Resumen diario estructurado sin alucinaciones numéricas
- [ ] Chat contextual con métricas del usuario
- [ ] Ritual de cierre del día en reloj y móvil

### Fase 6 — Pulido y demostración
- [ ] Manejo de estados de carga, error y resiliencia offline
- [ ] Guion de demostración probado de inicio a fin
- [ ] Limpieza de código y verificación final
