# OfficeCore — Plan de proyecto

> Compañero de bienestar y productividad para trabajadores de oficina y home office (white collar), con un **smartwatch Wear OS como protagonista**, una app móvil y un agente de PC.
> Proyecto escolar. Este documento es la fuente de verdad funcional y técnica. **Lo visual se rige exclusivamente por `skill.MD` y `design.MD`.**

---

## 0. Cómo usar este documento (leer primero, agentes)

1. Archivos de referencia en la raíz del proyecto:
   - `plan.MD` (este archivo): qué construir, cómo y en qué orden.
   - `skill.MD`: skill de diseño neumórfico. **Fuente de verdad visual.**
   - `design.MD`: especificación de diseño. **Fuente de verdad visual.**
2. Antes de crear cualquier pantalla, componente o tema, **lee `skill.MD` y `design.MD`** y aplica sus tokens (colores, tipografías, sombras, radios, espaciados, componentes) tal como vienen.
3. Trabaja por fases (sección 15). Al terminar cada una, actualiza `docs/progress.md` con estado, decisiones y pendientes.
4. Si una decisión no está en este plan, elige la opción más simple, documéntala en `docs/decisions.md` y continúa. No te detengas a preguntar por detalles menores.
5. Idioma: **interfaz en español (es-MX)**; identificadores de código, commits y comentarios técnicos en inglés.

---

## 1. Visión y problema

Quienes trabajan sentados frente a una pantalla acumulan daños silenciosos: muñecas torcidas al teclear, horas sin pausa, cafeína a deshoras, estrés sin identificar, mala iluminación y ruido. Cada problema tiene su app, y todas interrumpen sin contexto.

**OfficeCore es un solo sistema que decide *cuándo y cómo* avisarte.** Todos los módulos alimentan un **presupuesto de energía diario** (física, mental y de cafeína) y un **motor de política de avisos** que usa ese estado para decidir si interrumpirte ahora, esperar a una pausa natural o no avisar.

**Por qué es un reloj:** toca la muñeca sin sacar el teléfono, mide pulso y movimiento de la mano que teclea, siempre está contigo y tiene **bisel rotatorio físico** para controles rápidos con una mano.

**Ámbito:** vida cotidiana (salud ocupacional y hábitos de trabajo), con componente social/económico en la prevención de lesiones y pérdida de productividad.

---

## 2. Reglas no negociables

1. **Diseño:** usar `skill.MD` y `design.MD` tal cual. No cambiar paleta, tipografías, sombras, radios ni componentes definidos allí. Si algo no se puede traducir directamente a Compose for Wear OS, documentarlo en `docs/design-notes.md` y usar la alternativa más cercana sin alterar los tokens.
2. **Cero "modo simulado".** No existen botones, banderas, menús ni pantallas que indiquen datos falsos. La demo se apoya en un **usuario real de la base de datos con una semana de información precargada** (sección 6).
3. **Demo primero:** cada pantalla debe funcionar con los datos precargados antes de integrarse con sensores en vivo. La app jamás debe verse vacía.
4. **Privacidad por diseño:**
   - El agente de PC **nunca** registra qué tecla se presiona ni títulos de ventana. Solo conteos, ritmos y una categoría derivada localmente.
   - El micrófono del reloj **solo calcula nivel de ruido en dB**; no graba ni guarda audio.
   - Mostrar siempre un indicador cuando un sensor sensible está activo.
   - Opción de exportar y borrar todos los datos.
5. **Secretos:** la API key de Gemini vive solo en `backend/.env`. Nunca en la app móvil, el reloj ni el repositorio. `.env` va en `.gitignore`.
6. **Las llaves y firmas no aplican:** OfficeCore no es una app financiera. No es un dispositivo médico; no diagnostica. Usar lenguaje como "sugerencia" y "tendencia", nunca "diagnóstico".
7. **Batería del reloj:** muestrear por lotes, solo cuando hace falta (sesión de trabajo activa y reloj puesto). Documentar el consumo medido.

---

## 3. Stack y arquitectura

### 3.1 Componentes

```
 ┌────────────────┐   HTTP + WebSocket   ┌──────────────────────┐   mysql2   ┌──────────┐
 │ Reloj (Wear OS)│ ───────────────────▶ │  Backend Node + TS   │ ─────────▶ │ MySQL 8  │
 │ Kotlin/Compose │ ◀─────────────────── │  Express + ws        │            │ (local)  │
 └────────────────┘                      │  Motor de energía    │            └──────────┘
 ┌────────────────┐                      │  Política de avisos  │
 │ Móvil (Expo)   │ ───────────────────▶ │  Integración Gemini  │ ───▶ Gemini API
 └────────────────┘                      └──────────────────────┘
 ┌────────────────┐         HTTP/WS                ▲
 │ Agente de PC   │ ───────────────────────────────┘
 │ Python/Windows │
 └────────────────┘
```

Todo corre en la laptop del desarrollador (Windows 11). Teléfono y reloj se conectan al backend por la **misma red Wi-Fi** usando la IP LAN de la laptop. En un despliegue real, el backend correría en servidores de la empresa bajo suscripción.

### 3.2 Tecnologías

| Parte | Tecnología |
|---|---|
| Backend | Node.js 20+, TypeScript, Express, `ws`, `mysql2`, `zod`, `dotenv`, `@google/genai` |
| Base de datos | MySQL 8 local, base `officecore`, `utf8mb4`, fechas en UTC |
| Móvil | Expo (SDK compatible con la versión de **Expo Go** instalada en el teléfono), TypeScript, `expo-router`, `react-native-svg`, TanStack Query, Zustand, `expo-calendar` |
| Reloj | Kotlin, Jetpack Compose for Wear OS, Health Services client, `SensorManager`, Foreground Service, Tiles (ProtoLayout), Complications, OkHttp (REST + WebSocket), Room (cola local), `kotlinx.serialization`. `minSdk 30` |
| Agente de PC | Python 3.11+, `pynput`, `psutil`, `pywin32`, `pystray` + `Pillow`, `requests` + `websockets` |
| IA | Gemini API, modelo desde variable de entorno `GEMINI_MODEL=gemini-3.8-flash` |

### 3.3 Dispositivos objetivo

- **Reloj:** Samsung Galaxy Watch4 Classic (pantalla redonda, bisel rotatorio, dos botones físicos). Instalación por `adb` con depuración inalámbrica. Verificar con `adb shell getprop` la versión de Wear OS instalada y documentarla.
- **Teléfono:** Samsung Galaxy S25 Ultra, Android más reciente, ejecutando la app en **Expo Go** (sin módulos nativos propios en el MVP).
- **PC:** Windows 11, laptop de desarrollo.

### 3.4 Decisiones de arquitectura

- **Reloj ↔ teléfono pasan por el backend** en el MVP. Esto permite desarrollar el móvil en Expo Go. El enlace directo (Wearable Data Layer) queda como mejora opcional (Fase 7) y requiere development build.
- **El reloj calcula localmente** postura y detección de tecleo (menos tráfico y batería). El backend recibe ventanas agregadas, no muestras crudas.
- **Un solo motor de energía** (`backend/src/engine/energy.ts`) calcula los anillos. Móvil y reloj solo los consumen.
- **WebSocket del reloj** solo mientras haya "sesión de trabajo" activa; fuera de ella, sondeo espaciado.
- El reloj debe funcionar **sin red** (cola local con Room y reintentos) y mostrar su último estado conocido.

---

## 4. Estructura del repositorio

```
officecore/
├── plan.MD
├── skill.MD
├── design.MD
├── docs/
│   ├── progress.md
│   ├── decisions.md
│   ├── design-notes.md
│   ├── watch-sensors.md        # inventario real de sensores del Watch4 Classic
│   └── research.md             # umbrales ergonómicos, referencias
├── db/
│   ├── schema.sql
│   └── seed/                   # generador determinista de la semana demo
├── backend/
│   ├── src/
│   │   ├── index.ts
│   │   ├── routes/
│   │   ├── engine/             # energy.ts, policy.ts, focus.ts, caffeine.ts
│   │   ├── ai/                 # gemini.ts, prompts/
│   │   ├── ws/
│   │   └── db/
│   ├── .env.example
│   └── package.json
├── mobile/                     # Expo
│   └── app/                    # rutas expo-router
├── watch/                      # proyecto Android Studio (Wear OS)
└── pc-agent/
    ├── agent.py
    ├── config.toml.example
    └── requirements.txt
```

---

## 5. Modelo de datos (MySQL)

Todas las tablas llevan `id` autoincremental, `user_id` y marcas de tiempo en UTC. Tipos enumerados con `ENUM`. Definir índices por `(user_id, ts)`.

| Tabla | Campos principales |
|---|---|
| `users` | nombre, email, `timezone`, `work_start`, `work_end`, `bedtime`, `caffeine_limit_mg` (400), `caffeine_half_life_h` (5), `settings_json` |
| `devices` | `type` (watch/phone/pc), nombre, `token_hash`, `last_seen`, `battery_pct`, `paired_at` |
| `pairing_codes` | código de 6 dígitos, `expires_at`, `claimed_by_device_id` |
| `calibrations` | `kind` (posture/typing), `data_json`, `created_at`, `device_id` |
| `posture_windows` | `ts_start`, `duration_s`, `typing` (bool), `roll_dev`, `pitch_dev`, `deviation_deg`, `band` (green/amber/red) |
| `pc_activity_windows` | rollups de 1 min: `keystrokes`, `keystroke_cv`, `mouse_events`, `idle_s`, `app_category` (editor/terminal/browser/meeting/chat/other) |
| `focus_sessions` | `start`, `end`, `planned_min`, `interruptions`, `quality_score`, `source` (auto/manual) |
| `caffeine_logs` | `ts`, `drink_type`, `size`, `mg` |
| `sleep_logs` | `date`, `bedtime`, `wake`, `duration_min`, `quality` (1–5), `source` (manual/seed) |
| `heart_samples` | `ts`, `bpm`, `moving` (bool); 1 por minuto |
| `stress_events` | `ts`, `peak_bpm`, `baseline_bpm`, `trigger_tag` (nullable), `tagged_at` |
| `breathing_sessions` | `start`, `duration_s`, `pattern`, `hr_before`, `hr_after` |
| `environment_samples` | `ts`, `noise_db`, `lux` |
| `break_events` | `ts`, `kind` (eye/water/stand/stretch), `outcome` (done/snoozed/dismissed), `amount_ml` (agua) |
| `alerts` | `ts`, `type`, `priority`, `deferred_until`, `delivered_to`, `outcome`, `snooze_min` |
| `alert_rules` | `type`, `enabled`, `intensity`, `quiet_start`, `quiet_end`, `priority`, `max_per_hour` |
| `calendar_events` | `start`, `end`, `title_hash`, `is_meeting` (solo metadatos, sin contenido) |
| `energy_snapshots` | `ts` (cada 30 min), `physical`, `mental`, `caffeine_load`, `overall` |
| `daily_summaries` | `date`, `metrics_json`, `ai_json`, `model`, `generated_at` |
| `chat_messages` | `role` (user/assistant), `content`, `ts` |

---

## 6. Datos de demostración (usuario precargado)

**Objetivo:** al abrir la app móvil o el reloj, el usuario demo ya tiene una semana completa de historia coherente. No hay indicador alguno de que son datos precargados: para la app es un usuario normal.

### 6.1 Comandos

```
npm run db:init       # crea la base y aplica schema.sql
npm run seed          # inserta el usuario demo y su semana
npm run seed:reset    # borra los datos del usuario demo y los regenera (< 1 min)
npm run seed:verify   # imprime conteos y valida las "historias" de la semana
```

El seed escribe tokens de dispositivo en `backend/.demo-tokens.json` (en `.gitignore`) y los imprime, para configurarlos en el móvil (`EXPO_PUBLIC_DEMO_TOKEN`), el reloj (`local.properties`) y el agente (`config.toml`). Ejecutar `seed:reset` justo antes de cada demostración.

### 6.2 Perfil del usuario demo

- Nombre: **Alex Rivera**, desarrollador de software, híbrido (oficina/casa).
- Jornada 9:00–18:00, duerme a las 23:30, límite de cafeína 400 mg.
- Zona horaria: tomar `DEMO_TIMEZONE` de `.env` o, si no existe, la del sistema.

### 6.3 La semana

Los **últimos 7 días terminando hoy** (relativos a la fecha de ejecución). Los fines de semana usan perfil ligero (un bloque de foco corto, sin reuniones, pulso bajo). El día actual se precarga hasta la hora de ejecución. Las historias se asignan a los días laborables, de más antiguo a más reciente:

| Día laboral | Historia |
|---|---|
| L1 | Reuniones pesadas (~4 h), picos de estrés, 2 sesiones de respiración, pulso alto tras reuniones |
| L2 | **Café tardío a las 16:10** (95 mg); foco normal; noche siguiente con sueño malo |
| L3 | Tras dormir 5 h 40 min (calidad 2): 3 cafés, foco fragmentado, **deuda ergonómica alta**, más desviaciones de postura por la tarde |
| L4 | **El mejor día:** 4 bloques de foco de ≥ 50 min, postura buena, un solo café a las 9:00, anillos altos |
| L5 | Día actual: arranque normal, parcial |

Reglas del generador:
- **Determinista** (semilla fija) y con ruido natural; nada de valores redondos o repetidos.
- Cobertura mínima en horario laboral: `heart_samples` cada minuto, `posture_windows` y `pc_activity_windows` por minuto cuando hay actividad, `environment_samples` cada 5 min, `energy_snapshots` cada 30 min, recordatorios de ojos/agua/pausa con resultados mezclados (hechos, pospuestos, descartados).
- Incluir `alerts` con resultados variados y 1–2 `daily_summaries` ya generados (con texto realista de IA) para días anteriores.
- Relaciones coherentes: más cafeína tarde → peor sueño; peor sueño → más café y peor postura al día siguiente.
- **No** incluir una calibración de postura para el reloj físico: la calibración se hace en vivo (30 s) al inicio de la demo, y el reloj la guarda y la sube. Los datos históricos de postura no dependen de ella.
- `seed:verify` debe comprobar las historias (por ejemplo: sueño de L3 < 6 h, café de L2 después de las 16:00, mayor cantidad de bloques de foco en L4).

---

## 7. Backend: API

Autenticación: `Authorization: Bearer <device_token>`. Cada dispositivo (reloj, móvil, PC) tiene su token, provisionado por el seed. Para la demo todos operan sobre el usuario demo. Validar entradas con `zod`. Limitar la tasa en `/ai/*`. CORS restringido a la red local.

| Área | Endpoints |
|---|---|
| Salud | `GET /health` |
| Perfil | `GET /me`, `PATCH /me/settings` |
| Energía | `GET /energy/now`, `GET /energy/day?date=` |
| Ingesta | `POST /ingest/watch` (lotes de posture/heart/environment/batería), `POST /ingest/pc` (ventanas de actividad) |
| Postura | `GET /posture/day?date=`, `GET /posture/week`, `GET/POST /posture/calibration` |
| Foco | `GET /focus/sessions?from=&to=`, `POST /focus/sessions`, `PATCH /focus/sessions/:id` |
| Cafeína | `GET /caffeine/day?date=`, `POST /caffeine/logs`, `DELETE /caffeine/logs/:id`, `GET /caffeine/cutoff` |
| Sueño | `GET /sleep/week`, `POST /sleep/logs` |
| Bienestar | `GET /wellbeing/stress?from=&to=`, `POST /wellbeing/stress/:id/tag`, `POST /wellbeing/breathing`, `GET /wellbeing/environment/day` |
| Pausas | `POST /breaks`, `GET /breaks/day` |
| Avisos | `POST /alerts/request` (el reloj pregunta si puede avisar), `POST /alerts/:id/outcome`, `GET /alerts/day` |
| Reglas | `GET /rules`, `PUT /rules/:type` |
| Historial | `GET /history/week`, `GET /history/trends?weeks=` |
| IA | `POST /ai/summary`, `GET /ai/summary?date=`, `POST /ai/chat`, `GET /ai/chat/history` |
| Emparejado | `POST /pairing/code` (móvil), `POST /pairing/claim` (agente de PC) |
| Dispositivos | `GET /devices` |
| Calendario | `POST /calendar/sync` (móvil envía metadatos de eventos) |

**WebSocket** `/ws?token=`
- Servidor → cliente: `alert`, `energy_update`, `calibration_command`, `focus_state`.
- Cliente → servidor: `ack`, `presence`.

El seed y el reset son **solo línea de comandos**; no se exponen endpoints ni botones de administración en las apps.

---

## 8. Motor de energía y política de avisos

### 8.1 Presupuesto de energía (`engine/energy.ts`)

Un solo archivo con los pesos como constantes configurables.

- **Física (0–100):** parte en 100 al inicio de la jornada. Resta por deuda ergonómica, tiempo sedentario sin pausa y fatiga visual (tiempo de pantalla sin descanso 20-20-20). Recupera con pausas de pie y estiramientos.
- **Mental (0–100):** resta por minutos de foco profundo acumulados, carga de reuniones y eventos de estrés. Recupera con respiración guiada y descansos reales.
- **Cafeína:** carga = `mg_actuales / caffeine_limit_mg`, más la hora límite sugerida.
- **General:** combinación ponderada de los tres; se guarda como `energy_snapshots` cada 30 min.

### 8.2 Política de avisos (`engine/policy.ts`)

Entrada: estado actual (foco, reunión, tecleo, inactivo), tipo y prioridad del aviso, historial reciente.

Reglas por defecto (todas configurables desde la app):
1. En **foco profundo**, solo pasan avisos de prioridad alta (por ejemplo, postura en banda roja prolongada o límite de cafeína superado). El resto se difiere.
2. Los avisos diferidos esperan una **pausa natural**: tecleo inactivo ≥ 20 s tras ≥ 5 min de tecleo, fin de reunión o fin de bloque de foco.
3. Máximo **4 avisos por hora** y enfriamiento por tipo (postura 20 min, ojos 20 min, agua 45 min).
4. Respetar horario de silencio y no molestar.
5. Si el usuario pospone repetidamente un tipo, reducir su frecuencia; si lo atiende, mantenerla.

Respuesta a `POST /alerts/request`: `{decision: "deliver" | "defer" | "drop", defer_until?, haptic_pattern, copy}`.

---

## 9. Módulos funcionales

### 9.1 Postura de muñeca
- **Limitación a documentar:** un solo reloj mide la **orientación respecto a la gravedad**, no el ángulo real de la articulación. La app habla de "desviación respecto a tu postura calibrada".
- **Calibración (30 s):** el usuario teclea en su mejor postura; el reloj guarda el vector de gravedad de referencia y la firma de tecleo. Se inicia desde el reloj o desde la app móvil (vía `calibration_command`).
- **En ejecución:** por ventana de 5 s con tecleo detectado, calcular desviación total y sus componentes de **rotación (roll)** y **extensión/flexión (pitch)** respecto a la referencia.
- **Bandas por defecto (a afinar y justificar en `docs/research.md`):** verde < 15°, ámbar 15–25°, rojo > 25°. Se considera desviación sostenida con ≥ 90 s acumulados de tecleo en ámbar o rojo.
- **Deuda ergonómica diaria:** suma de minutos de tecleo en ámbar (×1) y rojo (×2). Los avisos se emiten por umbral de deuda y en pausas naturales, no cada minuto.
- **Acción en el reloj:** descartar o posponer (el bisel elige 5/10/15/30 min).

### 9.2 Detección de tecleo (en el reloj)
- **MVP:** heurística sobre acelerómetro: energía en la banda de microvibración de tecleo (≈ 4–15 Hz), baja energía de marcha, orientación estable.
- **Fase 7 (opcional):** entrenar un clasificador (Python, gradient boosting) usando como etiquetas la actividad real del agente de PC, y exportarlo al reloj.

### 9.3 Protector de flujo
- **Bloques de foco automáticos (backend):** ≥ 10 min continuos con ≥ 60 % de minutos activos, pocos cambios de app y categoría editor/terminal dominante. Puntaje de calidad 0–100. Interrupciones: cambio a chat/redes, inactividad > 2 min, interacción con avisos.
- **Foco manual (reloj):** el bisel elige la duración (15–120 min, pasos de 5), al iniciar se activa el modo foco.
- **Durante el foco:** se silencian los avisos propios no urgentes y se muestra el temporizador en pantalla activa. En el reloj se activa **No molestar** si el usuario concede acceso a la política de notificaciones; el control de No molestar del teléfono queda fuera de alcance en Expo Go.
- **Al terminar:** vibración distintiva y propuesta de micro-descanso (ojos, agua, estiramiento).

### 9.4 Reloj de cafeína
- **Registro con el bisel:** girar para elegir bebida, girar para tamaño, tocar para confirmar. Valores aproximados y editables:

| Bebida | mg (tamaño mediano) |
|---|---|
| Espresso | 65 |
| Café americano | 95 |
| Té negro | 47 |
| Té verde | 28 |
| Refresco de cola | 34 |
| Bebida energética | 80 |

- **Modelo:** decaimiento exponencial con vida media configurable (5 h por defecto): `C(t) = Σ dosis_i · 0.5^((t − t_i) / vida_media)`.
- **Hora límite:** el último momento en que una dosis estándar adicional deja un residuo ≤ **30 mg** a la hora de dormir del usuario. Si la noche anterior se durmió < 6 h o con calidad ≤ 2, la hora límite se adelanta 1 h.
- **Límite diario:** 400 mg (referencia general para adultos sanos; editable).
- **Sueño:** la fuente en el MVP es el seed y el registro manual desde el móvil ("¿cómo dormiste?"). La lectura automática (Health Connect) requiere development build y queda en Fase 7.

### 9.5 Pausas inteligentes
- **20-20-20:** cada 20 min de pantalla activa (según el agente de PC), en pausa natural, cuenta regresiva de 20 s con vibración suave al terminar.
- **Agua:** meta diaria derivada de la duración de la jornada; recordatorios espaciados y adaptativos; se registra con el bisel (pasos de 50 ml) o un toque.
- **De pie/estiramiento:** si hay > 50 min sedentarios, aviso con rutina corta de 30–60 s.

### 9.6 Estrés y respiración
- **Mapa de estrés:** pulso > línea base + 20 bpm, con poco movimiento, sostenido ≥ 2 min. La línea base es la mediana de reposo de los últimos 30 min. El reloj pregunta (giro de bisel) qué lo detonó: *Reunión, Mensaje, Código/bug, Tráfico, Otro*. Máximo 3 preguntas por día. La app construye el mapa semanal de detonantes.
- **Respiración guiada:** se propone al terminar una reunión ≥ 45 min con pulso > línea base + 10. Sesión de 60–90 s, ritmo por vibración (inhalar: pulsos ascendentes; exhalar: una vibración larga), el bisel ajusta de 4 a 8 respiraciones por minuto. Se guardan pulso antes y después.

### 9.7 Entorno (experimental)
- **Ruido:** nivel en dB muestreado 5 s cada 5 min durante la sesión de trabajo. Sin grabar ni guardar audio.
- **Luz ambiental:** lux cada 5 min; si hay trabajo en pantalla con luz muy baja (< 100 lux), aviso máximo una vez cada 2 h.
- **Barómetro (muy experimental):** inferir cambios sentado/de pie por la altura relativa de la muñeca. Se implementa solo si el sensor está disponible y los resultados son fiables; si no, se documenta en `docs/watch-sensors.md` y se omite.

### 9.8 Cierre del día
- A la hora de salida (o manual): el reloj muestra tres cifras (foco, deuda ergonómica, cafeína) y un botón "Cerrar día" con respiración de 1 min como ritual de desconexión.
- El teléfono genera el **resumen con Gemini** y una sugerencia para mañana.

### 9.9 Lenguaje háptico (reloj)
Cada tipo de aviso tiene su patrón (`VibrationEffect.createWaveform`; usar control de amplitud si el hardware lo soporta y degradar con elegancia si no):

| Aviso | Patrón |
|---|---|
| Postura | Dos pulsos cortos |
| Descanso de vista | Una vibración larga y suave |
| Agua | Tres toques ligeros |
| Límite de cafeína | Pulsos ascendentes |
| Pregunta de estrés | Doble pulso lento |
| Fin de foco | Vibración larga creciente |
| Respiración | Ascendente (inhalar) / larga (exhalar) |

---

## 10. App del smartwatch (Wear OS)

**Navegación:** pantalla de inicio con lista rotatoria de módulos. **El bisel es el control principal** (scroll rotatorio de Compose). El botón físico Back vuelve atrás; el botón Home es del sistema. Dar retroalimentación háptica por detente del bisel cuando el sistema lo permita.

| # | Pantalla | Contenido | Uso del bisel | Hardware |
|---|---|---|---|---|
| 1 | **Energía (Tile + pantalla)** | Anillo con física, mental y cafeína | Cambia entre los tres anillos | Pantalla siempre activa |
| 2 | **Inicio** | Estado actual, último café, accesos | Recorre los módulos | — |
| 3 | **Postura** | Estado en vivo (banda), deuda del día, recalibrar | Ajusta sensibilidad | Acelerómetro, giroscopio |
| 4 | **Sesión de foco** | Duración, temporizador, estado | Elige duración (15–120 min) | Pantalla activa, háptico |
| 5 | **Cafeína** | Bebida, tamaño, hora límite, mg actuales | Bebida → tamaño | — |
| 6 | **Agua** | Progreso diario, registrar | Cantidad (50 ml/paso) | — |
| 7 | **Respiración** | Guía visual y háptica, pulso antes/después | Ritmo (4–8 resp/min) | Pulso, háptico |
| 8 | **Alerta a pantalla completa** | Mensaje corto y acciones | Pospone 5/10/15/30 min | Háptico |
| 9 | **Pregunta de estrés** | "¿Qué pasó?" con 5 opciones | Elige detonante | Pulso |
| 10 | **Entorno** | Ruido y luz recientes | — | Micrófono (dB), luz |
| 11 | **Cierre del día** | Tres cifras, botón de cerrar, respiración | — | — |
| 12 | **Calibración** | Guía de 30 s para postura | — | Acelerómetro |
| 13 | **Ajustes** | Intensidad háptica, horario, no molestar, estado de conexión | Ajusta valores | — |
| 14 | **Complicación** | Indicador de energía para la carátula | — | — |

Detalles técnicos:
- **Servicio en primer plano** durante la sesión de trabajo, con notificación persistente y el indicador de sensores activos.
- **Acelerómetro** ~25 Hz con `maxReportLatency` para agrupar lecturas y ahorrar batería; extracción de características por ventanas de 5 s.
- **Pulso:** Health Services (`MeasureClient`/pasivo) a baja frecuencia; muestreo a 1/min para el histórico.
- **Cola local (Room)** de lotes pendientes; sincronización con reintentos y *backoff*.
- **Conexión:** `BACKEND_URL` configurable (`local.properties`/`BuildConfig`); permitir tráfico HTTP en red local (`network_security_config` solo en `debug`).
- **Fase 0:** inventariar sensores reales con `adb shell dumpsys sensorservice` y documentar en `docs/watch-sensors.md` (luz, barómetro, pulso, micrófono). ECG y composición corporal de Samsung probablemente no estén disponibles para terceros; no depender de ellos.

---

## 11. App móvil (Expo)

Rutas con `expo-router`. Barra de pestañas inferior: **Inicio · Postura · Foco · Cafeína · Asistente**, y una pestaña "Más". Todos los componentes siguen `skill.MD` y `design.MD`.

| # | Pantalla | Contenido |
|---|---|---|
| 1 | **Inicio (dashboard)** | Anillo de energía principal, tarjetas de cada módulo con su dato clave, línea de tiempo del día, estado del reloj |
| 2 | **Postura** | Mapa de calor semanal por hora, deuda ergonómica del día, desviaciones frecuentes (rotación vs extensión), botón para iniciar calibración |
| 3 | **Foco** | Bloques del día, puntaje de calidad, interrupciones, mejores horas de concentración |
| 4 | **Cafeína** | Curva de vida media (gráfica), registro de tomas, hora límite sugerida, límite diario |
| 5 | **Bienestar** | Mapa de estrés y detonantes, historial de respiración, ruido y luz, pausas (ojos/agua/de pie) |
| 6 | **Asistente (Gemini)** | Resumen del día en tarjetas, chat con tus métricas, botón "Regenerar resumen" |
| 7 | **Historial y tendencias** | Semana y comparativa de 4 semanas |
| 8 | **Reglas de avisos** | Interruptores, intensidad, horario de silencio, prioridades y frecuencia máxima |
| 9 | **Dispositivos** | Reloj (batería, última sincronización), agente de PC (estado, emparejado con código), qué datos envía cada uno |
| 10 | **Sueño** | Registro manual rápido y semana de sueño (apoya el cálculo de la hora límite de cafeína) |
| 11 | **Calibración** | Asistente guiado de postura y tecleo |
| 12 | **Ajustes y privacidad** | Perfil y jornada, qué se guarda, exportar y borrar datos, versión y modelo de IA en uso |
| 13 | **Onboarding** | Explicación de privacidad y permisos; accesible desde Ajustes. El usuario demo ya lo tiene completado |

Notas:
- Las pantallas leen del backend con TanStack Query y se actualizan por WebSocket.
- Gráficas con `react-native-svg`, estilizadas según `design.MD`.
- Calendario: `expo-calendar` envía solo metadatos (inicio, fin, si es reunión) a `/calendar/sync`.
- Estados de carga, error de red y listas vacías reales deben estar diseñados, aunque en la demo no se vean.

---

## 12. Agente de PC (Windows)

- **Qué mide:** pulsaciones por minuto y variabilidad entre pulsaciones, movimiento de mouse, segundos de inactividad y **categoría de la app activa** (editor, terminal, navegador, reunión, chat, otro). La categoría se deriva localmente por nombre de proceso; el título de ventana se descarta y no se envía.
- **Qué NO hace:** no guarda teclas, texto, capturas ni historial de navegación.
- **Ciclo:** ventanas internas de 10 s para estado en vivo; se envían al backend y este persiste **rollups de 1 min**.
- **Interfaz:** ícono de bandeja (`pystray`) con estado de conexión, pausa/reanudación y salida. Emparejado por código de 6 dígitos generado desde la app móvil.
- **Configuración:** `config.toml` con `backend_url` y `token`.
- **Extensión opcional de VS Code (Fase 7):** reporta guardados, depuración y commits como señal extra de foco.

---

## 13. Integración con Gemini

- **Modelo:** `GEMINI_MODEL=gemini-3.8-flash` y `GEMINI_API_KEY` en `backend/.env`. Cargar el nombre del modelo siempre desde la variable de entorno; mostrarlo en Ajustes.
- **Principio:** el código calcula todas las métricas; **Gemini solo redacta**. Nunca debe inventar cifras: el *prompt* incluye las métricas en JSON y prohíbe usar números que no estén ahí.
- **Resumen diario:** `POST /ai/summary` genera salida estructurada (JSON con esquema): `resumen`, `lo_que_fue_bien`, `a_mejorar`, `sugerencia_manana`. Máximo ~180 palabras en total, español de México, tono cálido y profesional. Se guarda en `daily_summaries` y se reutiliza; "Regenerar" fuerza uno nuevo. Se dispara al cierre del día o por petición.
- **Chat:** `POST /ai/chat` con *system prompt* + contexto compacto (métricas de hoy, agregados de 7 días, últimas 10 intervenciones). Ejemplo esperado: "¿por qué dormí mal el jueves?" debe poder relacionarlo con el café tardío de ese día usando los datos reales.
- **Seguridad del *prompt*:** no dar consejos médicos ni diagnósticos; ante síntomas, sugerir consultar a un profesional; si faltan datos, decirlo.
- **Robustez:** tiempo máximo, un reintento, mensaje de error amable en la interfaz, límite de tasa, registro de latencia.
- Dejar el módulo detrás de una interfaz `generateSummary(metrics)` / `chat(context, message)` para poder cambiar de proveedor sin tocar el resto.

---

## 14. Diseño visual

- **`skill.MD` y `design.MD` son la fuente de verdad.** Léelos antes de crear cualquier interfaz y aplícalos sin alterarlos: paleta, tipografías, sombras, radios, espaciados y componentes.
- Si este plan y esos archivos difieren en algo visual, **gana `skill.MD` / `design.MD`**.
- **Móvil:** implementar los tokens y componentes en un tema central (`mobile/theme/`) y reutilizarlos en todas las pantallas.
- **Reloj:** traducir los mismos tokens y componentes a Compose for Wear OS (`watch/.../theme/`). Si algún efecto no se puede reproducir tal cual, registrar la diferencia en `docs/design-notes.md` sin cambiar los tokens.
- Usar tamaños táctiles y legibilidad adecuados para pantalla redonda (396–450 px según el modelo) y asegurar que el contenido no quede recortado por el borde circular.

---

## 15. Fases y criterios de aceptación

### Fase 0 — Fundaciones y demo viva
- Monorepo, MySQL, `schema.sql`, seed y `seed:verify`; backend con `/health`, `/me`, `/energy/now`, `/energy/day`.
- Móvil: tema central (según `skill.MD`/`design.MD`), navegación y Dashboard con datos reales del seed.
- Reloj: proyecto base, instalado por `adb`, pantalla de Energía leyendo `/energy/now`. Inventario de sensores en `docs/watch-sensors.md`.
- Red: variable `BACKEND_URL`, regla de firewall para el puerto del backend, instrucciones en `README`.
- **Aceptación:** en el S25 Ultra (Expo Go) se ve el dashboard con la semana del usuario demo; en el reloj se ve el anillo de energía con valores del seed. Ninguna pantalla vacía ni indicador de datos falsos.

### Fase 1 — Postura y tecleo
- Todas las pantallas de postura (móvil y reloj) funcionando con el seed.
- En vivo: calibración de 30 s, detección de tecleo heurística, ventanas de postura, deuda ergonómica, alertas con háptica y bisel para posponer.
- **Aceptación:** teclear en la laptop torciendo la muñeca genera una alerta en el reloj en una pausa natural; la deuda del día sube y se refleja en el móvil.

### Fase 2 — Foco y agente de PC
- Agente de PC con emparejado, ingesta y bandeja. Detección de foco en backend. Sesión de foco manual con bisel.
- **Aceptación:** al trabajar 10+ min en el editor aparece un bloque de foco; durante el foco, los avisos no urgentes se difieren.

### Fase 3 — Cafeína, sueño y energía completa
- Registro con bisel, curva de vida media, hora límite, registro manual de sueño, motor de energía completo y complicación/Tile.
- **Aceptación:** registrar un café en el reloj actualiza la hora límite y el anillo de cafeína en ambos dispositivos en pocos segundos.

### Fase 4 — Bienestar y política de avisos
- Estrés con etiquetado por bisel, respiración guiada, pausas (ojos/agua/de pie), entorno (ruido y luz), política de avisos completa con reglas editables en el móvil.
- **Aceptación:** el sistema difiere, agrupa o descarta avisos según las reglas; el móvil muestra el mapa de estrés y las pausas.

### Fase 5 — Asistente IA y cierre del día
- Integración con Gemini (resumen estructurado y chat), cierre del día en el reloj, pantalla de Asistente.
- **Aceptación:** el resumen usa solo cifras reales del usuario; el chat responde "¿por qué dormí mal después del día del café tardío?" con datos coherentes.

### Fase 6 — Pulido y demostración
- Estados de error y carga, rendimiento, batería (medir y documentar), revisión de privacidad (exportar/borrar), ensayo del guion (sección 17), README de despliegue.
- **Aceptación:** guion completo sin intervención manual, `seed:reset` listo antes de cada ensayo.

### Fase 7 — Opcional (si hay tiempo)
- Wearable Data Layer directo reloj↔teléfono (requiere development build y módulo nativo).
- Health Connect para sueño automático (development build).
- Clasificador de tecleo entrenado con las etiquetas del agente de PC.
- Extensión de VS Code, barómetro, No molestar del teléfono.

---

## 16. Entorno de desarrollo (Windows 11)

1. **MySQL 8:** instalar, crear la base `officecore` y un usuario dedicado. Copiar `backend/.env.example` a `backend/.env`:
   ```
   PORT=3000
   DB_HOST=127.0.0.1
   DB_USER=officecore
   DB_PASSWORD=...
   DB_NAME=officecore
   GEMINI_API_KEY=...
   GEMINI_MODEL=gemini-3.8-flash
   DEMO_TIMEZONE=
   ```
2. **Backend:** `npm install`, `npm run db:init`, `npm run seed`, `npm run dev`. Escuchar en `0.0.0.0`.
3. **Red:** laptop, teléfono y reloj en la misma Wi-Fi. Abrir en el firewall de Windows los puertos del backend (3000) y de Metro (8081). Fijar la IP de la laptop o usar un nombre de host estable.
4. **Móvil:** `npx expo start`, abrir con Expo Go en el S25 Ultra. Variables: `EXPO_PUBLIC_API_URL`, `EXPO_PUBLIC_DEMO_TOKEN`.
5. **Reloj:** activar depuración inalámbrica en el Watch4 Classic, `adb pair <ip:puerto>` y `adb connect <ip:puerto>`, luego `./gradlew installDebug`. El reloj debe estar en la misma Wi-Fi (la depuración inalámbrica lo exige, por lo que también alcanza al backend).
6. **Agente de PC:** `pip install -r requirements.txt`, copiar `config.toml.example` a `config.toml`, y `python agent.py`.

---

## 17. Guion de demostración (5–7 min)

1. **Levantar la muñeca:** la complicación muestra la energía del día.
2. **Bisel:** recorrer los anillos (física, mental, cafeína) y los módulos.
3. **Calibrar (30 s)** y **iniciar un foco de 25 min** eligiendo la duración con el bisel.
4. **Teclear en la laptop con la muñeca torcida:** al llegar a una pausa natural, el reloj vibra con el patrón de postura; posponer con el bisel.
5. **Registrar un café con el bisel:** cambia la hora límite y el anillo de cafeína; verlo en el móvil.
6. **Móvil:** la semana de Alex. Mostrar el mejor día, el día del café tardío y la deuda ergonómica del día difícil.
7. **Asistente:** preguntar "¿por qué dormí mal esa noche?" y mostrar la respuesta basada en datos reales.
8. **Cierre del día:** cifras en el reloj, respiración de 1 min y resumen en el móvil.

---

## 18. Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| El acelerómetro no basta para tecleo fiable | Heurística simple en MVP, ajuste de umbrales con la calibración, clasificador entrenado en Fase 7 |
| Falsas alarmas de postura | Calibración personal, ventanas sostenidas, política de avisos y enfriamiento |
| Batería del Watch4 | Muestreo por lotes, solo en sesión de trabajo, medir y documentar |
| Sensores no disponibles para terceros | Inventario en Fase 0; módulos experimentales opcionales |
| El reloj no alcanza el backend por la red | Wi-Fi compartida (exigida por `adb` inalámbrico), IP fija, cola local con reintentos |
| Cambios en versiones de Expo Go | Usar el SDK compatible con la versión instalada y no añadir módulos nativos en el MVP |
| Latencia o fallo de Gemini en la demo | Resúmenes ya generados en el seed, caché, mensajes de error amables |

---

## 19. Investigación pendiente (`docs/research.md`)

- Umbrales ergonómicos de extensión y desviación cubital de la muñeca al teclear en la literatura, para justificar las bandas verde/ámbar/rojo.
- Datos realmente accesibles para terceros en Galaxy Watch4 (pulso, variabilidad cardíaca, luz, barómetro, micrófono).
- Validez y límites de estimar ruido en dB con el micrófono del reloj.
- Consumo de batería medido por módulo y estrategias de muestreo.
- Valores de cafeína por bebida y vida media (rangos y variabilidad individual).

---

## 20. Checklist final de entrega

- [ ] `skill.MD` y `design.MD` aplicados sin modificaciones.
- [ ] Ninguna interfaz sugiere modo simulado o datos falsos.
- [ ] `seed:reset` deja la semana del usuario demo lista en menos de 1 minuto.
- [ ] La API key de Gemini solo existe en `backend/.env`.
- [ ] El agente de PC no registra teclas ni títulos de ventana; el micrófono no guarda audio.
- [ ] Exportar y borrar datos funcionan.
- [ ] `docs/progress.md`, `docs/decisions.md` y `README` actualizados.
- [ ] Guion de demostración ensayado de punta a punta.
