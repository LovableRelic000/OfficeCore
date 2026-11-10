# OfficeCore ⌚️💻📱

Compañero integral de bienestar y productividad para trabajadores de oficina y home office (*white collar*).
El sistema pone al **smartwatch Wear OS como protagonista**, complementado por una **app móvil (Expo)** y un **agente de PC (Windows 11)**, impulsado por un backend centralizado con motor de energía y política de avisos en tiempo real.

---

## 🏗 Arquitectura del Sistema

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

---

## 🚀 Guía Rápida de Puesta en Marcha

### 1. Base de Datos (MySQL 8)
Acceso con credenciales configuradas en `backend/.env`:
```powershell
# Inicializar esquema
npm run db:init

# Generar datos deterministas de 7 días para Alex Rivera
npm run seed

# Comprobar historias de la semana
npm run seed:verify
```

### 2. Backend (Node.js 20+ / TypeScript)
```powershell
cd backend
npm install
npm run dev
```
Servicios iniciados:
- **API REST:** `http://0.0.0.0:3000`
- **WebSocket:** `ws://0.0.0.0:3000/ws`

### 3. App Móvil (Expo / Samsung Galaxy S25 Ultra)
```powershell
cd mobile
npm install
npx expo start
```
Escanea el código QR desde **Expo Go** en tu dispositivo conectado a la misma red Wi-Fi.

### 4. Smartwatch (Wear OS / Samsung Galaxy Watch4 Classic)
Compilación del APK de depuración:
```powershell
cd watch
.\gradlew.bat assembleDebug
```
Instalación en el reloj mediante depuración inalámbrica:
```powershell
adb connect <IP_DEL_RELOJ>:<PUERTO>
.\gradlew.bat installDebug
```

### 5. Agente de PC (Windows 11)
```powershell
cd pc-agent
pip install -r requirements.txt
python agent.py
```
Aparecerá el ícono neumórfico en la bandeja del sistema (*System Tray*) monitoreando de forma privada y sin registrar pulsaciones de teclas ni títulos de ventana.

---

## 🎨 Principios de Diseño Visual (Neumorphism / Soft UI)
- Diseñado estrictamente según `skill.MD` y `design.MD`.
- **Superficie base:** `#e0e5ec` (Stone Gray).
- **Color de acento:** Lavanda suave (`#9b72cf`) exclusivo para estados activos y acciones primarias.
- **Sin bordes visibles:** La elevación y relieve se logran mediante doble sombra suave.
- **Lenguaje háptico en el reloj:** Patrones específicos para postura, agua, corte de cafeína, respiración y fin de foco.

---

## 🎬 Guion de Demostración (5 a 7 minutos)
1. **Complicación / Carátula:** Levantar la muñeca para ver el nivel de energía general.
2. **Anillos con Bisel:** Recorrer los 3 anillos concéntricos (física, mental, cafeína) con el bisel rotatorio.
3. **Calibrar (30s) y Modo Foco:** Calibrar postura neutral e iniciar bloque de foco de 25 min.
4. **Alerta de Postura en Pausa Natural:** Al teclear con desviación prolongada, el reloj vibra al detectar una pausa en el ritmo de escritura; posponer 10 min con el bisel.
5. **Registro de Cafeína:** Seleccionar café americano con el bisel y confirmar. Observar cómo se actualiza la hora límite y la curva en la app móvil.
6. **Dashboard Móvil:** Explorar la semana precargada de Alex Rivera (L4 el mejor día, L2 café tardío a las 16:10, L3 insomnio y fatiga).
7. **Asistente IA:** Preguntar al chat: *"¿Por qué dormí mal esa noche?"* y verificar la explicación causal fundamentada en datos reales.
8. **Cierre de Día:** Revisar las cifras en el reloj y ejecutar el ritual de respiración guiada de desconexión.

