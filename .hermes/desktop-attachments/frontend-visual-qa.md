---
name: frontend-visual-qa
description: >
  Skill de inspección visual estructural — rápida y automática. Se ejecuta
  justo cuando el servidor arranca (Fase 3 del Auditor Técnico), antes de
  sus pruebas pesadas. Verifica layout, desbordamientos, consistencia
  básica de componentes y accesibilidad basada en estándares formales
  (contraste WCAG, navegación por teclado, tamaño de zona táctil). No cubre
  identidad de marca ni tipografía profunda — eso lo hace
  frontend-design-qa, bajo demanda, reutilizando este reporte.
version: 1.1.0
metadata:
  hermes:
    tags: [frontend, ui, accesibilidad, qa-visual, layout, rápido]
    related_skills: [auditor-tecnico-avanzado, frontend-design-qa, entregable-profesional]
---

# Frontend Visual QA (Estructural, Rápida)

## 0. Principios rectores

1. **"Lo que no se mide, no se mejora."** Todo hallazgo viene de una
   medición real del DOM renderizado (`getBoundingClientRect`, estilos
   computados), nunca de una suposición del código fuente.
2. **"Rápida y automática — por eso se queda en lo objetivo."** Este skill
   solo cubre lo que se puede medir sin ambigüedad: overflow, contraste,
   operabilidad. Todo lo que requiere criterio de diseño (paleta, jerarquía
   tipográfica, espaciado) es trabajo de `frontend-design-qa`, no de este.
3. **"Un timeout es un `NO VERIFICADO`, no un silencio."** Si una fase no
   termina dentro de los 30s, se reporta explícitamente — nunca desaparece
   del reporte final "para no frustrar al usuario".
4. **"Bloqueo por fealdad crítica."** Desbordamiento horizontal en móvil o
   contraste ilegible pone el veredicto en 🔴, sin excepción.

---

## 1. Activación (Triggers)

- **Automática**: cuando el Auditor Técnico (`auditor-tecnico-avanzado`)
  termina su Fase 3 (arranque y compilación) y tiene el servidor corriendo
  — antes de que el Auditor empiece su Fase 4 de pruebas pesadas.
- **Manual**: *"Revisa el diseño"*, *"¿Está centrado?"*, *"Verifica la
  interfaz"*.

Este skill y `frontend-design-qa` están pensados para coexistir — no se
solapan porque cubren capas distintas (estructura/accesibilidad vs.
identidad/marca) y una reutiliza el reporte de la otra en vez de
re-ejecutar las mismas mediciones.

---

## 2. Flujo de ejecución

### Fase 1 — Preparación del entorno
- Usa el servidor ya levantado por la Fase 3 del Auditor — no abre uno
  nuevo ni reinicia nada.
- Si Playwright/Puppeteer no están instalados, los instala dentro del
  mismo sandbox del Auditor (documentado, igual que la Fase 3.1 del
  Auditor con Jest/Pytest).
- Lanza el navegador headless en **Escritorio (1920×1080)** y **Móvil
  (375×667)**, y navega a las 3 rutas principales (`/`, `/login`,
  `/dashboard` o equivalentes).
- **Timeout total: 30s.** Si una fase individual no termina, se marca
  `NO VERIFICADO (timeout)` en la matriz final.

### Fase 2 — Layout y desbordes [estándar objetivo]
- **Desbordamiento horizontal en móvil**: si algún elemento excede el
  ancho del viewport, es **GRAVE** — bloquea, no es negociable.
- **Alineación y simetría**: mide altura de hijos directos en contenedores
  flex/grid. Diferencias mayores a 5px sin razón clara (ej. una imagen) se
  reportan como "Desalineación en fila X".
- **Centrado**: verifica `align-items`/`justify-content` donde se esperaría
  contenido centrado (ej. un modal).

### Fase 3 — Consistencia básica de componentes [medible, no opinión]
- **Botones**: todos los botones primarios deben compartir
  `background-color`, `border-radius`, `padding-top/bottom` y `font-size`.
  Si hay 2 con distinto padding o color: *"Inconsistencia: Botón 'Guardar'
  tiene padding 10px, Botón 'Eliminar' tiene padding 14px."*
- **Inputs y formularios**: mismo `border-radius`, `border-color` y
  `padding` entre todos los `<input>`/`<select>`.

### Fase 4 — Accesibilidad basada en estándares formales
- **Contraste WCAG 2.1 AA**: `< 4.5:1` es **GRAVE** — estándar real, no
  opinión de diseño.
- **Atributo `alt`** en imágenes: ausencia se reporta como hallazgo.
- **Operabilidad por teclado**: todos los elementos interactivos deben ser
  alcanzables con `Tab` en orden lógico, con un estado `:focus` visible
  (outline o equivalente). Sin esto, alguien que no puede usar mouse queda
  bloqueado — tan grave como el contraste.
- **Tamaño de zona táctil en móvil**: botones y enlaces interactivos deben
  medir al menos 44×44px (WCAG 2.5.5) en la vista móvil.

---

## 3. Veredicto (estructural)

| Color | Condición | Qué muestra al usuario |
|---|---|---|
| **🟢 APTO (Estructural)** | Sin desbordes, componentes consistentes, contraste alto, teclado operable, zonas táctiles viables. | *"✅ La estructura y accesibilidad básica están correctas."* |
| **🟡 CON RESERVAS** | Inconsistencias menores de componentes o alguna zona táctil ajustada, pero navegable y accesible. | *"⚠️ Funciona, pero hay inconsistencias menores: [lista]."* |
| **🔴 CRÍTICO** | Overflow horizontal en móvil, contraste ilegible, o elementos no alcanzables por teclado. | *"❌ Hay problemas graves de estructura o accesibilidad: [detalle]. Corrígelo antes de mostrarlo a nadie."* |

Cualquier fila `NO VERIFICADO (timeout)` se lista aparte — nunca cuenta
como si hubiera pasado.

---

## 4. Combinación con el resto del ecosistema

El veredicto global del entregable es siempre **el peor de los que
corrieron**, nunca un promedio:

| Auditor Técnico | Visual QA (esta) | Design QA (si corrió) | Global |
|---|---|---|---|
| 🟢 | 🟢 | — o 🟢 | 🟢 |
| 🟢 | 🟡/🔴 | cualquiera | 🟡 (mínimo) |
| 🔴 | cualquiera | cualquiera | 🔴 |

Un 🔴 de este skill **no bloquea** las pruebas del Auditor Técnico (siguen
corriendo, para no perder información), pero sí baja el veredicto global
como mínimo a 🟡.

---

## 5. Corrección automática (opcional)

Si el veredicto es 🔴 o 🟡, puede ofrecer una corrección de estilos con las
mismas reglas de seguridad que la Fase 5 del Auditor Técnico:

- Ejemplo: *"Agrega `outline: 2px solid` en `:focus` a todos los botones
  para que sean navegables por teclado."*
- **Siempre en el mismo sandbox y la misma rama que está usando el Auditor
  Técnico** (`auditor/vX...`) — nunca una rama paralela.
- Muestra el diff exacto antes de aplicarlo al proyecto real.

---

## 6. Persistencia y comparación

- Guarda las medidas clave (overflow detectado, contraste mínimo,
  capturas de las 3 rutas en ambas resoluciones) en
  `/auditor/reportes/visual_estructural_<timestamp>.json`.
- En la siguiente corrida, compara contra el snapshot anterior y señala
  cambios no explicados — mismo espíritu que la Fase 4.8 (regresión) del
  Auditor Técnico.

---

## Common Pitfalls

- Añadir aquí verificaciones de paleta de color o tipografía — eso es
  trabajo de `frontend-design-qa`, no de este skill. Mezclarlos hace que
  este skill deje de ser rápido.
- Dejar que un timeout haga desaparecer una fila de la matriz en vez de
  marcarla `NO VERIFICADO (timeout)`.
- Aplicar correcciones de estilo en una rama distinta a la que ya está
  usando el Auditor Técnico.

## Verification Checklist

- [ ] Ninguna fase con timeout desapareció del reporte final.
- [ ] Contraste, teclado y zona táctil se verificaron con evidencia medida,
      no supuestos.
- [ ] El veredicto global aplicó "el peor de los que corrieron gana".
- [ ] Se guardó el snapshot para la comparación de la próxima auditoría.
