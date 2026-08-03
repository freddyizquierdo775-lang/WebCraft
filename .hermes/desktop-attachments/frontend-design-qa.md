---
name: frontend-design-qa
description: >
  Skill de inspección de identidad de marca y diseño — profunda, bajo
  demanda. Complementa a frontend-visual-qa (que cubre estructura y
  accesibilidad básica de forma rápida y automática); esta skill se enfoca
  en paleta de colores, jerarquía tipográfica, sistema de espaciado y
  estilo visual de marca. Reutiliza el reporte de frontend-visual-qa en vez
  de re-medir layout, contraste o accesibilidad.
version: 1.1.0
metadata:
  hermes:
    tags: [frontend, ui, ux, diseño, branding, tipografía, qa-visual, profundo]
    related_skills: [auditor-tecnico-avanzado, frontend-visual-qa, entregable-profesional]
---

# Design System & Brand Identity Inspector (Profundo)

## 0. Principios rectores

1. **"Lo que no se mide, no se mejora."** Todo hallazgo viene de una
   medición real del DOM renderizado, nunca de una suposición del código.
2. **"La consistencia es la belleza del no-code."** No se trata de que sea
   "bonito", sino **predecible**: los colores se repiten con un propósito,
   la tipografía sigue una jerarquía, el espaciado sigue una escala.
3. **"El diseño es la promesa de la marca."** Si el color principal cambia
   entre páginas, el usuario pierde la confianza.
4. **"Estándar formal vs. heurística — nunca se confunden."** Todo lo que
   audita este skill (paleta, proporción tipográfica, escala de espaciado,
   estilo de sombras) es **heurística de diseño recomendada**, no un
   estándar formal verificable como el contraste WCAG. El reporte nunca usa
   la palabra "regla" o "error" para esto — usa "sugerencia" o
   "recomendación", para no darle a una opinión de diseño el peso de un
   estándar de accesibilidad (eso ya lo cubre `frontend-visual-qa`).
5. **"No remidas lo que ya se midió."** Antes de arrancar, busca el reporte
   más reciente de `frontend-visual-qa`. Si existe y es de la misma corrida
   (mismo commit/checksum), reutiliza su contraste, layout y accesibilidad
   ya verificados — este skill no vuelve a medirlos.

---

## 1. Activación (Triggers)

- **Manual, explícita**: *"Analiza el branding"*, *"Revisa la identidad de
  marca"*, *"Profundiza en el diseño"*, *"¿Se ve profesional?"*.
- **Encadenada opcional**: si el usuario pide una auditoría completa
  ("Audita todo", "Certifica el entregable a fondo"), puede correr después
  de `frontend-visual-qa`, no en su lugar.
- **No se auto-activa** en cada arranque de servidor — es la capa costosa
  (~45s) y basada en criterio, así que corre cuando el usuario
  específicamente quiere esa profundidad, no por defecto en cada ciclo.

---

## 2. Flujo de ejecución

### Fase 1 — Preparación (reutilización, no repetición)
- Busca el reporte más reciente de `frontend-visual-qa` para el mismo
  commit. Si existe, reutiliza su navegador headless activo y sus rutas ya
  visitadas — si no, lanza su propia sesión con las mismas 3 rutas.
- **Timeout total: 45s**, adicional al de `frontend-visual-qa` si corrieron
  encadenadas.

### Fase 2 — Paleta de colores (identidad de marca)
- Si `/requisitos/spec_*.md` o un archivo de guía de marca declaran colores
  oficiales, verifica contra esos valores exactos. Si no existe esa
  referencia, usa como respaldo el heurístico de "color más repetido en
  elementos interactivos = color primario", y decláralo explícitamente como
  heurístico, no como verificación contra una guía real.
- Si hay más de 2 tonos distintos para el mismo tipo de elemento sin una
  guía de marca que lo respalde: *"Sugerencia: tienes botones en #3B82F6 y
  #10B981. Considera elegir uno como primario y usar el otro solo para
  acciones secundarias."*

### Fase 3 — Jerarquía tipográfica
- Recolecta `font-size`/`font-weight` de `h1`, `h2`, `h3`, `p`, `button`.
- Si el `h1` es menos de 1.5x el tamaño del `p`: *"Sugerencia: tus títulos
  no se diferencian suficiente del texto normal. Un h1 de 32px con un p de
  16px suele leerse mejor."*
- Si detecta más de 2 familias tipográficas mezcladas: *"Sugerencia: mezclas
  'Inter' y 'Times New Roman' — usar una sola familia (con variantes de
  peso) suele verse más cohesivo."*

### Fase 4 — Sistema de espaciado
- Mide `padding`/`margin` de 5 elementos representativos (cards,
  contenedores, botones).
- Si encuentra valores fuera de la escala de 4px (13px, 17px, 22px):
  *"Sugerencia: espaciado irregular — cambiar a múltiplos de 4 (4, 8, 12,
  16, 24, 32) suele dar un aspecto más profesional."*

### Fase 5 — Estilo visual (sombras y feedback)
- **Sombras**: sugiere suavizar sombras agresivas (`10px 10px 20px`) hacia
  algo más sutil (`0 4px 6px`).
- **Feedback de interacción**: si faltan reglas `:hover`/`:active` visibles
  en botones e inputs (más allá del `:focus` que ya cubre
  `frontend-visual-qa` por accesibilidad), lo señala como oportunidad de
  pulido, no como error.

---

## 3. Veredicto de identidad y diseño

Este veredicto es **aditivo** al de `frontend-visual-qa`, nunca lo
reemplaza ni lo mejora — si la estructura ya venía en 🔴, este skill no
puede subirla a 🟢.

| Color | Condición | Qué muestra al usuario |
|---|---|---|
| **🟢 Identidad sólida** | Paleta consistente (o alineada a guía de marca), jerarquía clara, espaciado regular. | *"✅ Tu identidad visual es consistente y se ve profesional."* |
| **🟡 Genérico** | Funciona y es accesible (según frontend-visual-qa), pero la marca se siente plana o inconsistente: paleta mezclada, jerarquía débil, espaciado irregular. | *"⚠️ Se ve decente pero genérico: [lista de sugerencias]. Ninguna es bloqueante, son mejoras de percepción de marca."* |

No emite un 🔴 propio — los problemas verdaderamente graves (contraste,
overflow, accesibilidad) son responsabilidad de `frontend-visual-qa`; este
skill trabaja exclusivamente en el terreno de la percepción de marca, que
por definición no bloquea funcionalidad ni accesibilidad.

---

## 4. Modo "Corrección de diseño" (opcional)

- Ejemplo: *"Aplica una clase CSS global para unificar todos los botones
  primarios con el color #3B82F6, radio 8px y padding 8px 16px."*
- **Siempre en el mismo sandbox y la misma rama que está usando el Auditor
  Técnico** (`auditor/vX...`) — si ya hay un PR abierto para esa rama, las
  correcciones de marca se suman al mismo PR, no crean uno nuevo.
- Muestra el diff exacto antes de aplicarlo al proyecto real.

---

## 5. Persistencia y comparación

- Guarda paleta detectada, escala tipográfica y espaciado en
  `/auditor/reportes/design_marca_<timestamp>.json`, separado del snapshot
  estructural de `frontend-visual-qa`.
- En la siguiente corrida, compara y señala cambios no explicados: *"El
  color primario era #3B82F6 y ahora aparece #10B981 en la mayoría de
  botones — ¿fue intencional?"*

---

## Common Pitfalls

- Re-medir contraste, overflow o accesibilidad — eso ya lo hizo
  `frontend-visual-qa`; duplicarlo desperdicia el timeout de 45s en
  mediciones redundantes.
- Reportar una sugerencia de marca (espaciado, tipografía) como si fuera un
  error bloqueante — este skill no tiene autoridad para dar 🔴.
- Aplicar correcciones de marca en una rama distinta a la del Auditor
  Técnico.
- Inventar una guía de marca cuando no existe — si no hay
  `/requisitos/spec_*.md` con colores oficiales, decláralo y usa el
  heurístico de frecuencia explícitamente etiquetado como tal.

## Verification Checklist

- [ ] Se reutilizó el reporte de `frontend-visual-qa` en vez de remedir
      contraste/layout/accesibilidad.
- [ ] Cada hallazgo usa lenguaje de "sugerencia", no de "error" o "regla".
- [ ] El veredicto de esta skill nunca subió por encima del de
      `frontend-visual-qa` cuando ese venía en 🔴.
- [ ] Si hubo correcciones, se aplicaron en la misma rama/PR que el
      Auditor Técnico está usando.
