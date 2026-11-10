# Samsung Galaxy Watch4 Classic — Inventario de Sensores

Referencia técnica para la integración de hardware Wear OS en OfficeCore.

## Sensores del Dispositivo
1. **Acelerómetro (`Sensor.TYPE_ACCELEROMETER`):**
   - Rango: ±8g / ±16g.
   - Frecuencia de muestreo: ~25 Hz por lotes (`maxReportLatencyUs = 2000000`).
   - Uso: Estimación de orientación del antebrazo respecto a la gravedad (roll y pitch) y detección de microvibración de tecleo (4–15 Hz).
2. **Giroscopio (`Sensor.TYPE_GYROSCOPE`):**
   - Rango: ±2000 dps.
   - Uso: Detección de giros bruscos o transiciones entre reposo y escritura.
3. **Sensor de Frecuencia Cardíaca (Health Services / `Sensor.TYPE_HEART_RATE`):**
   - Frecuencia: 1 muestra/minuto en fondo o continuo en ejercicios de respiración.
   - Uso: Monitoreo de pulso en reposo, detección de picos de estrés y retroalimentación en sesiones de respiración.
4. **Sensor de Luz Ambiental (`Sensor.TYPE_LIGHT`):**
   - Uso: Monitoreo de iluminación del entorno de trabajo (alertar ante fatiga visual en penumbra < 100 lux).
5. **Micrófono (AudioRecord / MediaRecorder - SPL):**
   - Modo seguro: Muestreo de 5 segundos cada 5 minutos en nivel RMS / Decibeles (dB).
   - Privacidad: Sin grabación persistente de audio ni compresión de voz; descarte inmediato de buffers.
6. **Bisel Rotatorio (Rotary Input):**
   - Mapeado mediante `Modifier.rotaryScrollable` o `RotaryScrollEvent` para ajuste analógico de temporizadores de foco, cafeína, agua y navegación de lista.
