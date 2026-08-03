---
name: entregable-profesional
description: >
  Skill de cierre de ciclo (Release & Docs Manager). Se ejecuta después de
  que el Auditor Técnico (auditor-tecnico-avanzado) emita su veredicto.
  Genera un changelog trazable al reporte del Auditor y al spec del
  Analista de Requisitos, un manual de usuario que distingue lo verificado
  de lo no verificado, y actualiza el README. El despliegue a producción
  queda condicionado a que la Fase 6.5 del Auditor ya tenga el merge
  confirmado por el usuario — nunca antes.
version: 1.1.0
metadata:
  hermes:
    tags: [documentación, despliegue, release, manual, changelog, vercel]
    related_skills: [auditor-tecnico-avanzado, analista-requisitos-no-code, frontend-visual-qa, frontend-design-qa]
---

# Entregable Profesional (Release & Docs Manager)

## 0. Principios rectores (revisados)

1. **"El código no es el producto; el producto es lo que el usuario final
   ve"**: esta skill convierte el resultado técnico en algo que cualquier
   persona no técnica pueda entender y usar.
2. **"Documentar es tan importante como programar"**: sin un manual, tu MVP
   es un misterio, incluso para ti.
3. **"Un clic para desplegar — pero nunca sin saber a qué ambiente."** El
   usuario no-code no debe tocar una terminal para publicar, pero tampoco
   debe publicar por accidente. Esta skill nunca despliega a producción por
   su cuenta: sigue exactamente el mismo gate que la Fase 6.5 del Auditor.
4. **"Nunca documentes lo que no se probó."** Cada afirmación del manual o
   el changelog debe poder rastrearse a un criterio de aceptación que
   realmente pasó. Lo que no se verificó formalmente se marca como tal, no
   se omite ni se redacta con la misma confianza que lo verificado.
5. **"La fuente de verdad es el reporte, no la memoria de Hermes."** El
   changelog y el manual se generan leyendo el reporte del Auditor y el
   spec del Analista de Requisitos — nunca redactando de memoria lo que
   "probablemente" se construyó en la sesión.

---

## 1. Activación (Triggers) — corregida

- Se activa automáticamente cuando `auditor-tecnico-avanzado` emite
  veredicto 🟢 o 🟡. Esto dispara **solo las Fases 1–3** (changelog, manual,
  README) — son documentos, y pueden generarse sobre la misma rama de
  auditoría (`auditor/vX...`) antes de cualquier merge.
- La **Fase 4 (despliegue a producción)** tiene una condición adicional
  obligatoria: que la Fase 6.5 del Auditor ya registre el merge a `main`
  como confirmado explícitamente por el usuario. Si el usuario pide un
  despliegue de vista previa ("despliega una preview", "quiero ver cómo se
  ve") antes de ese punto, se despliega la rama de auditoría a un entorno
  de preview — nunca a producción.
- Activación manual: *"Prepara el entregable"*, *"Sube esto a producción"*,
  *"Genera la documentación"*.

---

## 2. Flujo de ejecución (4 fases reales)

### Fase 1 — Changelog
- Lee el reporte más reciente del Auditor en `/auditor/reportes/` —
  específicamente la matriz de 9 niveles y la sección "Correcciones
  aplicadas" de la Fase 6.5.
- Lee `/requisitos/spec_*.md` del Analista de Requisitos (si existe) para
  la sección "Añadido" — usa las listas "Incluye" ya confirmadas por el
  usuario, no lo que Hermes recuerda haber construido en la sesión.
- Redacta `CHANGELOG.md`:

  ```markdown
  # Registro de Cambios - [Nombre del Proyecto]
  ## Versión [X.Y.Z] - [Fecha]

  ### Añadido (según /requisitos/spec_*.md confirmado)
  - Pantalla de login con validación de correo.
  - Panel de ventas con gráfico diario.

  ### Corregido (según Fase 6.5 del Auditor)
  - 3 CVEs corregidos vía overrides (postcss, drizzle-orm).
  - Error que impedía guardar productos en la base de datos.

  ### Conocido / Pendiente (según niveles NO EJECUTADO del Auditor)
  - Integración: no verificada — depende de Supabase real, sin
    credenciales de prueba disponibles.
  - E2E: no verificado — sin Playwright instalado en esta corrida.
  ```

- **Versionado semántico honesto**: si "Añadido" está vacío y solo hay
  "Corregido", el incremento es de patch (`x.y.Z+1`). Si hay funcionalidad
  nueva confirmada en el spec, es minor (`x.Y+1.0`). Solo sube el major si
  el usuario confirma explícitamente un cambio incompatible con versiones
  anteriores — nunca lo decidas por tu cuenta.

### Fase 2 — Manual de usuario
- Por cada criterio de aceptación en `/requisitos/spec_*.md` con estado
  PASS real (Fase 4.5 del Auditor), redacta su sección del manual
  reutilizando la versión "cómo lo verificas tú" que ya escribió el
  Analista de Requisitos — no la reinventes.
- Por cada funcionalidad visible en el producto que **no** tenga un
  criterio de aceptación verificado (Fase 4.3/4.5 en `NO EJECUTADO` o
  `INFORMAL`), redacta la sección igual, pero con una nota visible al
  inicio: *"⚠️ Esta función no fue verificada formalmente en la última
  auditoría — pruébala tú mismo antes de confiar en ella con clientes
  reales."*
- Nunca redactes un manual completo "a ojo" del código sin cruzarlo contra
  lo que el Auditor certificó — es el error más grave de este skill, porque
  el usuario no-code confía en este documento sin poder verificarlo por sí
  mismo leyendo el código.

### Fase 3 — Actualización de README
- Badge de estado con el veredicto **combinado** (Auditor Técnico +
  `frontend-visual-qa` + `frontend-design-qa` si corrió, aplicando siempre
  "el peor de los que corrieron gana"), fecha, y enlace al reporte
  completo.
- Instrucciones de instalación derivadas de la Fase 1 del Auditor (el stack
  ya quedó detectado ahí — no lo re-adivines).
- Enlace directo al Manual de Usuario y al Changelog generados en las Fases
  1 y 2.

### Fase 4 — Despliegue (opcional y gateado)
- **Preview**: si el usuario pide ver cómo se ve, despliega la rama de
  auditoría (`auditor/vX...`) a un entorno de preview de Vercel/Netlify.
  Nunca toca producción.
- **Producción**: solo procede si la Fase 6.5 del Auditor ya registró el
  merge a `main` como confirmado por el usuario. Antes de desplegar,
  sugiere crear un checkpoint o punto de restauración (si la plataforma lo
  soporta) para poder revertir sin depender de comandos de git.
- Después de un despliegue a producción, actualiza el README con la URL
  real y la fecha, y notifica explícitamente: *"Publicado en producción:
  [URL]. Si algo se ve mal, dime 'revierte al checkpoint anterior'."*

---

## Common Pitfalls

- Redactar el manual de memoria en vez de cruzarlo contra los criterios de
  aceptación reales.
- Desplegar a producción solo porque el veredicto fue 🟡 APTO CON RESERVAS,
  sin confirmar que el merge de la Fase 6.5 ya fue aprobado por el usuario.
- Omitir la sección "Conocido/Pendiente" del changelog — sin ella, el
  usuario cree que todo quedó cubierto cuando en realidad hay niveles sin
  verificar.
- Redactar el changelog de memoria de la sesión en vez de leer el reporte
  del Auditor y el spec del Analista.

## Verification Checklist

- [ ] El changelog cita el reporte del Auditor y el spec del Analista, no
      la memoria de la sesión.
- [ ] La sección "Conocido/Pendiente" refleja exactamente los niveles
      `NO EJECUTADO` de la última auditoría.
- [ ] El manual marca explícitamente las funciones no verificadas
      formalmente, sin ocultarlas ni redactarlas con la misma confianza.
- [ ] El despliegue a producción, si ocurrió, solo pasó después de que la
      Fase 6.5 del Auditor registrara el merge como confirmado.
- [ ] Se sugirió un checkpoint o punto de restauración antes de cualquier
      despliegue a producción.
