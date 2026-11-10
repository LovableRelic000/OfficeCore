# OfficeCore — Notas de Diseño y Adaptación Neumórfica

## Fidelidad Visual (`skill.MD` y `design.MD`)
- Superficie base: `#e0e5ec` (Stone Gray).
- Superficie rebajada (deep): `#d1d9e6`.
- Superficie elevada (raised): `#e8edf4`.
- Acento principal: `#9b72cf` (Lavanda suave) usado exclusivamente en estados activos, indicadores de progreso y CTA principal.
- Sombras duales:
  - Luz (arriba-izquierda): `rgba(255, 255, 255, 0.80)`.
  - Oscuridad (abajo-derecha): `rgba(163, 177, 198, 0.60)`.
- Sin bordes visibles (`border: none`).
- Iconos: SVG de línea delgada (stroke 1.5–2px), sin contenedores ni emojis.

## Adaptación a Wear OS (Jetpack Compose)
1. **Pantalla Redonda:**
   - Todo el contenido centralizado respetando el padding perimetral de un display circular de ~450px para evitar recorte de esquinas.
   - Uso de `ScalingLazyColumn` con items curvados y control táctil/rotatorio de bisel (`rotaryScrollable`).
2. **Sombras en Compose for Wear OS:**
   - En Wear OS no hay drop-shadow nativo multi-capa idéntico a CSS `box-shadow` múltiple; se adapta utilizando canvas draws y degradados de elevación simulando la luz difusa superior izquierda y sombra inferior derecha sin cambiar la paleta de colores `#e0e5ec`, `#d1d9e6` y acento `#9b72cf`.
3. **Modo Ambiente / Always-On Display:**
   - En reposo ambiental se conserva el trazo del anillo de energía simplificado para minimizar consumo de batería AMOLED.
