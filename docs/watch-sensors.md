# Samsung Galaxy Watch4 Classic (SM-R880) — Inventario Real de Sensores

Inventario verificado en vivo mediante `adb shell dumpsys sensorservice` y `adb shell getprop`.

## Información del Dispositivo
- **Modelo:** Samsung Galaxy Watch4 Classic 42mm (SM-R880)
- **Versión de Android / Wear OS:** Android 16 (API Level 36)
- **Conectividad:** Wi-Fi LAN (`10.0.0.28:39335`)

## Sensores Hardware Confirmados
1. **Acelerómetro:** `LSM6DSV Accelerometer` (STM)
   - Tipo: `android.sensor.accelerometer (1)`
   - Frecuencia: 6.25 Hz a 100 Hz, FIFO de 300 eventos.
   - Uso: Estimación de orientación angular de muñeca (roll/pitch) y microvibración de tecleo (4–15 Hz).
2. **Giroscopio:** `LSM6DSO Gyroscope` (STM)
   - Tipo: `android.sensor.gyroscope (4)`
   - Frecuencia: 6.25 Hz a 100 Hz.
3. **Sensor de Luz:** `OPT3007 Light` (AMS, Inc.)
   - Tipo: `android.sensor.light (5)`
   - Rango: en cambios de luz ambiente (lux).
   - Uso: Detección de penumbra en pantalla (< 100 lux).
4. **Barómetro / Presión:** `LPS25H Barometer` (STM)
   - Tipo: `android.sensor.pressure (6)`
   - Frecuencia: 1.00 Hz a 10.00 Hz, FIFO de 250 eventos.
   - Sensor de altitud derivado: `Samsung Altitude Sensor`.
5. **Frecuencia Cardíaca:** `Samsung HR Raw Sensor`
   - Permiso: `android.permission.health.READ_HEART_RATE` / `BODY_SENSORS`.
   - Muestreo: 25.00 Hz en ráfagas.
6. **Detector Fuera del Cuerpo:** `Samsung LowPower Offbody Detector` / `Samsung Offbody Detector`
   - Tipo: estado de reloj puesto para pausar muestreos y ahorrar batería cuando no está en la muñeca.
7. **Bisel Rotatorio Físico:**
   - Detectado como eventos de scroll rotatorio (`RotaryScrollEvent`), con detentes hápticos.
