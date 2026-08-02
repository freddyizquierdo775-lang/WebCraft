---
name: frontend-design-qa
description: >
  Skill unificada de inspección visual, de interfaz y de identidad de marca.
  Se ejecuta después de construir el frontend, antes de la auditoría
  funcional pesada. Verifica maquetación (alineación, desbordes, simetría),
  consistencia de componentes (botones, inputs), sistema de espaciado,
  jerarquía tipográfica, paleta de colores (branding), accesibilidad
  (contraste, alt texts) y feedback visual (hover, focus, active).
  Versión unificada que reemplaza a frontend-visual-qa y design-semantic-qa.
version: 1.0.0
metadata:
  hermes:
    tags: [frontend, ui, ux, diseño, branding, accesibilidad, qa-visual, layout]
---

# UI/UX & Design System Inspector (Frontend + Design QA)

## 0. Principios Rectores Unificados

1. **"Lo que no se mide, no se mejora"**: Todo hallazgo debe venir de una
   medición real del DOM renderizado (`getBoundingClientRect`, estilos
   computados), nunca de una suposición del código fuente.
2. **"La consistencia es la belleza del No-Code"**: El objetivo principal no
   es que sea "bonito", sino que sea **predecible**. Todos los botones deben
   verse igual, los márgenes deben seguir una pauta, y los colores deben
   repetirse con un propósito.
3. **"La jerarquía se lee, no se supone"**: El ojo humano necesita que los
   títulos sean más grandes que el texto normal. Si todo tiene el mismo
   tamaño, la app es "plana".
4. **"El diseño es la promesa de la marca"**: Si el color principal cambia
   entre páginas, el usuario pierde la confianza.
5. **"El feedback es cortesía"**: Un botón que no cambia al hacer clic es un
   botón "muerto" para el usuario.
6. **"Bloqueo por fealdad crítica"**: Si hay un problema de accesibilidad
   grave (texto ilegible) o desbordamiento horizontal en móvil, la skill
   pondrá el veredicto en **ROJO**, forzando la corrección antes de entregar.

---

## 1. Activación (Triggers)

Se activa **automáticamente** cuando:
- El Auditor Técnico (`auditor-tecnico-avanzado`) termine su Fase 3 (Arranque y compilación) y tenga el servidor corriendo.
- El usuario termine de pedir un desarrollo frontend y diga: *"Revisa el diseño"*, *"¿Está centrado?"*, *"Verifica la interfaz"*, *"Analiza el branding"*.

---

## 2. Flujo de Ejecución (5 Fases Integradas)

### Fase 1: Preparación del Entorno Visual
- Asegura que el servidor de desarrollo (o build estático) esté corriendo en el puerto asignado (ej. `http://localhost:3001`).
- Lanza un navegador headless (Playwright o Puppeteer) con resolución de **Escritorio (1920x1080)** y **Móvil (375x667)**.
- Navega a las 3 rutas principales de la app (ej. `/`, `/login`, `/dashboard`) para verificar coherencia entre páginas.

### Fase 2: Inspección de Layout, Simetría y Desbordes (Maquetación)
- **Desbordamiento (Overflow)**: Busca `overflow-x: hidden` en el body, o mide si algún elemento tiene `width > viewport width` en móvil. Si hay scroll horizontal no deseado, lo reporta como **GRAVE**.
- **Alineación y simetría**: Selecciona todos los contenedores con `display: flex` o `grid`. Mide la altura de los hijos directos. Si dos hijos tienen alturas que difieren en más de 5px (y no hay una razón clara como una imagen), reporta *"Desalineación en fila X"*.
- **Centrado**: Verifica que los elementos estén centrados vertical/horizontalmente según la propiedad `align-items` o `justify-content` esperada.

### Fase 3: Consistencia de Componentes y Lenguaje Visual (UI Kit)
- **Botones**: Busca en el DOM todos los `<button>`, `<a class="btn-*">`, y elementos con roles de botón.
  - **Regla**: Todos los botones primarios deben tener la misma combinación de:
    - `background-color`
    - `border-radius` (ej. todos `rounded-lg` o todos `4px`)
    - `padding-top` y `padding-bottom` (deben ser iguales entre sí)
    - `font-size`
  - Si encuentra 2 botones primarios con distinto padding o color, lo reporta como: *"Inconsistencia: Botón 'Guardar' tiene padding 10px, Botón 'Eliminar' tiene padding 14px."*
- **Inputs y formularios**: Verifica que todos los `<input>` y `<select>` compartan el mismo `border-radius`, `border-color` y `padding`.
- **Sombras (Box-shadow)**: Revisa que las sombras sean sutiles (ej. `0 4px 6px`) y no agresivas (`10px 10px 20px`). Si detecta sombras muy pesadas, sugiere suavizarlas para un look moderno.

### Fase 4: Auditoría de Identidad de Marca y Jerarquía (Diseño Semántico)
- **Paleta de Colores (Branding)**:
  - Extrae el color de fondo del `header` (o `navbar`) y el color de los botones primarios.
  - Define "Color Primario" como el que más se repite en elementos interactivos.
  - **Regla**: Si encuentra más de 2 tonos distintos para el mismo tipo de elemento (ej. botones azules y verdes mezclados), lo reporta como: *"Paleta inconsistente: Tienes botones en #3B82F6 y #10B981. Elige uno como primario y usa el otro solo para acciones secundarias."*
  - Si el color del `header` y el de los botones no tienen relación armónica (contraste muy alto o muy bajo), lo sugiere.
- **Jerarquía Tipográfica**:
  - Recolecta todos los `font-size` y `font-weight` de `h1`, `h2`, `h3`, `p` y `button`.
  - **Regla de Jerarquía**: El `h1` debe ser al menos 2 veces más grande que el `p` (texto normal). Si la diferencia es menor a 1.5x, advierte: *"Tus títulos no se diferencian suficiente del texto normal. Recomiendo un h1 de 32px y un p de 16px."*
  - **Regla de Familias**: Si detecta más de 2 familias de fuentes diferentes (ej. `'Inter'` y `'Times New Roman'` mezclados), lo reporta como *"Mezcla tipográfica que rompe la armonía visual."*
- **Sistema de Espaciado (Grid/Cuadrícula)**:
  - Mide los `padding` y `margin` de 5 elementos aleatorios (cards, contenedores, botones).
  - **Regla de la Escala Mágica**: El diseño profesional usa la escala de 4px (4, 8, 12, 16, 24, 32, 48, 64).
  - Si encuentra valores como `13px`, `17px`, `22px`, reporta: *"Espaciado irregular: usas valores no estándar. Cambia a valores múltiplos de 4 para que el diseño se vea más limpio y profesional."*

### Fase 5: Accesibilidad, Contraste y Feedback Visual
- **Contraste de colores**: Calcula el contraste entre `color` y `background-color` de todos los textos usando la fórmula WCAG 2.1.
  - **CRÍTICO**: Si el contraste es < 4.5:1, el hallazgo es **GRAVE** (texto ilegible).
- **Atributos Alt**: Verifica que todas las imágenes tengan atributo `alt`. Si falta, reporta *"Imagen sin texto alternativo en el carrusel"*.
- **Estados de Interacción (Feedback)**:
  - Busca en el CSS reglas `:hover`, `:focus`, `:active` para botones e inputs.
  - Si faltan, te dice: *"Los elementos no tienen feedback visual (hover/focus). El usuario no sabrá si está interactuando correctamente."*

---

## 3. Veredicto Unificado de Frontend y Diseño

La skill genera un **"Certificado de Salud Visual y de Marca"** con un semáforo global:

| Color | Condición | ¿Qué muestra al usuario? |
| :--- | :--- | :--- |
| **🟢 Élite Visual (APTO)** | Todas las reglas pasan. Layout perfecto, botones consistentes, paleta de marca única, jerarquía tipográfica clara, contraste alto, feedback visual presente. | *"✅ Tu interfaz es profesional, consistente y accesible. Tiene identidad de marca clara y se ve bien en móvil y escritorio. Puedes mostrarlo sin miedo."* |
| **🟡 Aceptable (CON RESERVAS)** | El layout es correcto y accesible, pero hay inconsistencias de marca (mezcla de colores), jerarquía plana (títulos pequeños), espaciado irregular o falta de feedback visual en algunos elementos. | *"⚠️ La aplicación funciona y se ve decente, pero parece 'genérica' o 'plana'. Te sugiero pedir a Hermes: 'Unifica los colores bajo un solo tono principal y aumenta el tamaño de los títulos'."* |
| **🔴 Crítico (NO APTO VISUAL)** | Desbordamiento horizontal en móvil, contraste muy bajo (texto ilegible), o falta total de identidad visual (botones de colores distintos y fuentes mezcladas). | *"❌ La interfaz tiene problemas graves de maquetación o accesibilidad. No puedo certificar el diseño. [Problema exacto]. Por favor, pide a Hermes que ajuste los anchos, colores o fuentes antes de mostrar esto a nadie."* |

---

## 4. Modo "Corrección de Diseño" (Opcional, para No-Code)

Si el veredicto es 🔴 o 🟡, la skill puede ofrecer **una solución automática** (similar a la Fase 5 del Auditor Técnico, pero para estilos), dentro del sandbox:

- *"Aplica una clase CSS global para unificar todos los botones primarios con el color #3B82F6, radio 8px y padding 8px 16px."*
- *"Cambia todos los padding de 13px a 12px y los de 17px a 16px para respetar la escala de 4."*
- **Importante**: Esto se hace dentro del sandbox, nunca en tu código original, y te muestra el diff (qué líneas cambió) para que tú decidas si aplicarlo o no al proyecto real.

---

## 5. Integración con el Ecosistema Completo

Esta skill se ubica **justo después del arranque** y **antes de las pruebas pesadas de integración** del Auditor Técnico.

**Flujo completo ahora**:
1. **Analista** → Define qué negocio (requisitos).
2. **Hermes** → Construye el código.
3. **Arranque** → El servidor se levanta (Fase 3 del Auditor).
4. **🆕 Frontend & Design QA** → Revisa maquetación, diseño, branding y accesibilidad (esta skill).
5. **Auditor Técnico** → Ejecuta las pruebas de integración, funcionales y de seguridad (Fase 4 del Auditor).

Si esta skill da **🔴 Crítico**, el Auditor Técnico principal **no se bloquea** (porque la funcionalidad puede ser perfecta), pero el veredicto global del entregable **baja automáticamente a AMARILLO**, y el reporte final dirá: *"La funcionalidad es correcta, pero el diseño requiere atención urgente."*

---

## 6. Nota Técnica para Hermes (Ejecución)

- **Dependencias**: Esta skill requiere que `playwright` o `puppeteer` estén instalados en el sandbox. Si no lo están, el agente los instalará automáticamente (igual que hace con Jest/Pytest).
- **Tiempo de ejecución**: Máximo 45 segundos. Si tarda más, se interrumpe y reporta *"TimeOut visual"*, pero no bloquea la entrega (para no frustrar al usuario).
- **Resoluciones**: Siempre prueba en **Escritorio (1920x1080)** y **Móvil (375x667)** para garantizar que el diseño sea responsive.