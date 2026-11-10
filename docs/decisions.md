# OfficeCore — Registro de Decisiones de Arquitectura

## Decisiones Técnicas

### D-001: Autenticación por Tokens de Dispositivo para Demo
- **Contexto:** El sistema integra reloj, teléfono y PC para el usuario demo "Alex Rivera".
- **Decisión:** Cada dispositivo utiliza un token de portador (`Bearer <token>`) emitido y administrado en la tabla `devices`. El seed genera y sincroniza estos tokens en `.demo-tokens.json` para facilitar la configuración rápida de cada entorno sin fricción de login interactivo en la demo.

### D-002: Enlace Reloj ↔ Teléfono a través del Backend
- **Contexto:** Mantener compatibilidad con Expo Go en el teléfono Samsung Galaxy S25 Ultra sin requerir compilación nativa o development build complejo en la fase inicial.
- **Decisión:** El reloj y el móvil se comunican de forma reactiva a través de la API REST y el servidor WebSocket del backend, ambos conectados a la misma red Wi-Fi local.

### D-003: Procesamiento de Postura y Detección de Tecleo en el Reloj
- **Contexto:** Ahorro de batería y reducción de consumo de red en el Galaxy Watch4.
- **Decisión:** El cálculo de orientación y heurística de tecleo se ejecuta localmente en ventanas de 5 segundos en el reloj; el backend solo recibe rollups e ingestas por lotes con cola local en SQLite/Room.

### D-004: Centralización del Motor de Presupuesto de Energía
- **Contexto:** Mantener coherencia absoluta entre el anillo del reloj, el dashboard del teléfono y los resúmenes del asistente.
- **Decisión:** El archivo `backend/src/engine/energy.ts` es la única fuente de verdad para el cálculo de los tres componentes de energía (Física, Mental, Cafeína) y la puntuación general.

### D-005: Privacidad Estricta en el Agente de PC
- **Contexto:** Salud ocupacional sin vigilancia invasiva.
- **Decisión:** El agente no almacena pulsaciones de teclas concretas ni títulos de ventanas; categoriza aplicaciones activas localmente a nivel de proceso (`editor`, `terminal`, `browser`, `meeting`, `chat`, `other`) y solo reporta conteos y cadencia agregada.
