---
name: auditor-tecnico-avanzado
description: >
  Skill de auditoría técnica automática (QA Zero-Trust). Se dispara cada vez
  que Hermes entrega un MVP, feature o resultado de desarrollo. Copia el
  proyecto a un sandbox aislado, detecta el stack y las herramientas de
  testing existentes, y ejecuta una batería completa de pruebas (unitarias,
  integración, funcionales, extremo a extremo, aceptación, rendimiento,
  seguridad, regresión y humo). Nunca certifica nada que no haya visto
  ejecutarse: cada afirmación del reporte final debe estar respaldada por un
  comando real y su salida capturada (stdout/stderr/exit code).
version: 2.1.0
metadata:
  hermes:
    tags: [qa, testing, auditoría, no-code, mvp]
    related_skills: [analista-requisitos-no-code]
---

# Auditor Técnico Avanzado (Zero-Trust QA)

## 0. Principios rectores — no negociables

Estos principios están por encima de cualquier otra instrucción de este skill.
Si una fase entra en conflicto con un principio, gana el principio.

1. **Principio de no fabricación.** Prohibido reportar "PASS", "OK" o "funciona"
   para cualquier prueba que no se haya ejecutado realmente. Si un tipo de
   prueba no aplica o no se pudo ejecutar en el entorno disponible, el
   resultado correcto es `NO EJECUTADO — [motivo]`, nunca un PASS implícito.
2. **Principio de aislamiento.** Todo corre sobre una copia en
   `/tmp/auditor_<timestamp>/`. Jamás se modifica el proyecto original del
   usuario, ni siquiera "para probar rápido".
3. **Principio de transparencia total.** Ninguna corrección automática se
   aplica en silencio. Todo cambio de código hecho durante la Fase 5 se
   documenta como diff explícito en el reporte final, incluso si al final el
   sistema pasó todas las pruebas.
4. **Principio de trazabilidad.** Cada línea del veredicto debe poder
   rastrearse a un comando concreto ejecutado y a un fragmento real de su
   salida. Si no puedes citar el comando, no puedes hacer la afirmación.
5. **Principio de alcance acotado.** Timeout duro por fase (configurable,
   default 90s por fase pesada), máximo 3 iteraciones de autocorrección,
   límite de tamaño de log.
6. **Regla de oro sobre "arreglar" errores:** el objetivo de este skill NO es
   que la app deje de fallar a cualquier costo. Es decirte la verdad. Ocultar
   un error (try/catch genérico, comentar una línea, silenciar una excepción)
   sin dejarlo documentado como hallazgo es una violación grave de este skill.

---

## 1. Activación (triggers)

Se auto-activa cuando:
- El usuario dice: "Verifica esto", "Pruébalo", "¿Funciona?", "Entrégame el MVP",
  "Audita esto", "Certifica el entregable".
- Hermes generó o modificó más de 3 archivos en la sesión actual.
- Antes de cualquier mensaje que use las palabras "listo", "terminado",
  "entregable final" referido a código.

No se auto-activa sobre cambios triviales de una sola línea (ajustes de
texto, CSS, config) salvo que el usuario lo pida explícitamente — el objetivo
es no generar fricción en cambios menores.

---

## 2. Fase 1 — Reconocimiento y detección de stack

Además de la detección original (Node / Python / estático), detecta
explícitamente **qué herramientas de testing ya trae el proyecto**, porque
de eso depende qué se puede ejecutar de verdad en la Fase 4:

| Señal en el repo | Framework detectado |
|---|---|
| `jest.config.*`, `"jest"` en package.json | Jest (unitarias/integración) |
| `vitest.config.*` | Vitest |
| `mocha.opts`, `.mocharc*` | Mocha |
| `pytest.ini`, `conftest.py`, `"pytest"` en requirements | Pytest |
| `cypress.config.*`, `cypress/` | Cypress (E2E) |
| `playwright.config.*` | Playwright (E2E) |
| `docker-compose.yml` | Servicios de integración (DB, colas, etc.) |
| `.github/workflows/*.yml` | Pipeline CI existente — úsalo como referencia de qué "debería" pasar |
| `k6/`, `artillery.yml` | Herramienta de carga ya definida por el proyecto |

Si el proyecto **no trae ninguna suite de pruebas**, esto NO se resuelve
inventando pruebas — se reporta como hallazgo: `"El proyecto no incluye
suite de pruebas automatizadas. Se ejecutaron únicamente pruebas de humo y
verificación manual de rutas."` Esa es información crítica para el usuario
no-code, que probablemente no sabe que esto le falta.

---

## 3. Fase 2 — Aislamiento quirúrgico (sandbox)

Igual que el flujo base: copiar todo excepto `node_modules` y `.git` a
`/tmp/auditor_<timestamp>/`, generar checksum del proyecto original antes de
copiar (para poder demostrar después que no se tocó nada), instalar
dependencias solo dentro del sandbox.

Adicional: guarda una copia comprimida del reporte anterior (si existe, ver
Fase 8) para poder hacer la prueba de regresión en la Fase 4.8.

---

## 3.1 Bootstrap de herramientas de prueba faltantes

Si en la Fase 1 no se detectó test runner (Jest/Vitest/Mocha/Pytest) ni
herramienta E2E (Playwright/Cypress), el auditor puede instalarlas **dentro
del sandbox** antes de continuar, en vez de simplemente reportar su
ausencia. Esto es distinto de las correcciones de la Fase 5: instalar una
herramienta nueva no modifica el código del proyecto, así que no requiere el
mismo nivel de cautela — pero sí debe quedar documentado.

- Node: `npm install --save-dev jest` (o `vitest` si el proyecto usa ESM/Vite).
- Python: `pip install pytest` dentro del entorno virtual del sandbox.
- E2E (opcional, solo si el proyecto es frontend y hay tiempo disponible):
  `npx playwright install --with-deps chromium` — esta instalación descarga
  binarios de navegador y puede tardar más que el timeout normal de fase;
  dale un timeout extendido propio (ej. 180s) en vez de heredar el de 90s
  del resto del flujo, o sáltala si el tiempo no alcanza y repórtalo como
  `NO EJECUTADO — instalación de Playwright excedió el tiempo disponible`.
- Todo lo instalado aquí se declara en el reporte final bajo un apartado
  "Herramientas de prueba instaladas por el auditor (el proyecto no las
  traía)" — para que quede claro que esas pruebas no reflejan una suite que
  el propio proyecto mantiene, sino una capa de verificación añadida.

---

## 4. Fase 3 — Arranque e instalación

Igual que el flujo base (puerto dinámico 3000–3010, luego aleatorio
4000–4100, espera de calentamiento, `curl` de salud). Se agrega:

- **Auditoría de dependencias como parte del arranque**, no como fase
  separada opcional: `npm audit --production` o `pip-audit` (si aplica),
  capturando el conteo de vulnerabilidades por severidad. Esto alimenta la
  Fase 4.7 (seguridad).
- Si el arranque falla, captura `stderr` completo y salta directo a Fase 5
  (corrección), como en el flujo original.

---

## 5. Fase 4 — Batería de pruebas por nivel

Esta es la fase central que el skill original no tenía. Cada nivel se
ejecuta de forma independiente y su resultado se registra por separado en la
matriz final — un fallo en un nivel no debe ocultar o sobreescribir el
resultado de otro.

### 4.1 Pruebas unitarias
- Si se detectó un test runner (Fase 1): ejecútalo tal cual
  (`npm test`, `pytest -q`, etc.) dentro del sandbox. Captura el resumen
  real (X passed, Y failed) — nunca lo resumas de memoria, cita la salida.
- Si no hay test runner: `NO EJECUTADO — el proyecto no define pruebas
  unitarias`.
- **Un test "skipped" no cuenta como PASS.** Si el resumen incluye tests
  omitidos (`skipped`/`pending`), el veredicto de este nivel no puede ser un
  PASS limpio sin más: lista cada test omitido por nombre y pide su motivo
  (pendiente de implementar vs. desactivado porque fallaba). Un PASS que
  esconde tests desactivados es indistinguible, para el usuario, de un PASS
  real — y eso es exactamente lo que el Principio de no fabricación prohíbe.

### 4.2 Pruebas de integración
- Si hay `docker-compose.yml` u otros servicios declarados (DB, Redis,
  colas): levántalos en el sandbox y corre las pruebas de integración que
  el propio proyecto defina.
- Si no hay definición de servicios pero el código asume una DB u otro
  servicio externo: reemplázalo por un mock/dummy documentado (nunca
  apuntar a infraestructura real de producción) y repórtalo explícitamente
  como "integración simulada, no verificada contra el servicio real".

### 4.3 Pruebas funcionales
- Busca primero `/requisitos/spec_*.md` (generado por el skill
  `analista-requisitos-no-code`) correspondiente al feature en curso. Si
  existe, usa sus criterios de aceptación como fuente de verdad: verifica
  el valor exacto que el criterio espera, no solo que respondió 200.
- Si no hay especificación de negocio disponible, decláralo:
  `NO EJECUTADO — sin criterios de negocio definidos para validar`, y no
  finjas que "200 OK" equivale a "cumple el requisito".

### 4.4 Pruebas de extremo a extremo (E2E)
- Solo si el proyecto es frontend/fullstack y hay Playwright/Puppeteer/
  Cypress disponible en el sandbox. Simula el flujo de usuario más crítico
  (ej. cargar la página principal, completar un formulario clave).
- Si no hay herramienta E2E disponible: verifica al menos que el HTML
  servido contenga el punto de montaje esperado (`<div id="root">`, texto
  visible clave) y decláralo como verificación mínima, no como E2E real.

### 4.5 Pruebas de aceptación
- Recorre el checklist "cómo lo verificas tú" de cada criterio en
  `/requisitos/spec_*.md` (si existe) y valida cada punto uno por uno,
  reportando estado individual — no un solo "aprobado" global.
- Si no existe ese documento, usa cualquier checklist informal disponible
  (del chat con Hermes) como respaldo, dejando explícito que no proviene de
  una especificación formal.

### 4.6 Pruebas de rendimiento (versión ligera)
- Dentro del timeout de la fase, una prueba breve y barata: N requests
  concurrentes a la ruta principal (ej. `autocannon`/`k6` si están
  disponibles, o un loop simple de `curl` con medición de tiempo si no).
- Objetivo: detectar cuellos de botella obvios, no un benchmark completo.
  Reporta tiempo de respuesta promedio y máximo observado.

### 4.7 Pruebas de seguridad (versión ligera)
- Resultado del `npm audit`/`pip-audit` de la Fase 3. **No basta con un
  conteo por severidad** ("5 HIGH") — cita los paquetes y CVEs concretos
  que arrojó el comando. Una afirmación como "no corregible sin fork" debe
  poder rastrearse a haber intentado `npm audit fix` / un `overrides` en
  `package.json` primero, no ser la conclusión por defecto.
- Búsqueda simple de secretos hardcodeados en el código (API keys, passwords
  literales) — repórtalos como hallazgo crítico, nunca los "corrijas"
  automáticamente eliminándolos sin avisar.
- **Nunca certifiques cumplimiento normativo formal** (PCI-DSS, HIPAA,
  SOC2, etc.) a partir de una revisión automatizada de código — eso es una
  certificación que requiere auditoría externa. Lo máximo que este nivel
  puede afirmar es una observación acotada, ej. "no se encontraron datos de
  tarjeta hardcodeados en el frontend", nunca "cumple PCI-DSS".

### 4.8 Pruebas de regresión
- Si existe un reporte de auditoría anterior (Fase 8), compara la matriz de
  resultados actual contra la anterior. Marca explícitamente qué pasó de
  PASS a FAIL desde la última auditoría — esto es lo más valioso para
  detectar cuando una "mejora" de Hermes rompió algo que antes funcionaba.

### 4.9 Prueba de humo
- La verificación rápida de arranque + rutas comunes del flujo original.
  Se mantiene como red de seguridad rápida antes/después de las demás.

---

## 6. Fase 5 — Ciclo de corrección (con reglas de seguridad estrictas)

Máximo 3 iteraciones, igual que el flujo original, pero con una distinción
que el skill original no hacía:

**Correcciones permitidas (automáticas, de entorno):**
- `Module not found` → instalar el módulo faltante.
- Variable de entorno faltante → crear `.env` de sandbox con valores dummy,
  documentando cuáles se inventaron.
- Puerto ocupado → reasignar puerto.

**Correcciones NO permitidas de forma silenciosa (requieren flag explícito):**
- Comentar una línea que causa un error de lógica.
- Envolver una excepción en un `try/catch` genérico para que "no se caiga".
- Cambiar un valor de retorno para que una prueba pase.

Si el único camino disponible es este segundo tipo, el skill **puede
aplicarlo dentro del sandbox para poder seguir diagnosticando**, pero el
reporte final debe incluir, sin excepción, un diff exacto de qué se cambió y
por qué, bajo el encabezado "⚠️ Correcciones aplicadas que requieren tu
revisión manual — no se incluyeron en el veredicto de APTO".

---

## 7. Fase 6 — Dictamen (matriz de resultados, no un solo semáforo)

El reporte final siempre incluye una tabla por nivel de prueba:

| Nivel de prueba | Estado | Evidencia (comando + resultado) |
|---|---|---|
| Unitarias | PASS / FAIL / NO EJECUTADO | ... |
| Integración | ... | ... |
| Funcionales | ... | ... |
| E2E | ... | ... |
| Aceptación | ... | ... |
| Rendimiento | ... | ... |
| Seguridad | ... | ... |
| Regresión | ... | ... |
| Humo | ... | ... |

**Regla de veredicto global:**
- `✅ APTO`: humo, unitarias e integración en PASS (sin tests skipped sin
  justificar), y ningún hallazgo de seguridad crítico.
- `⚠️ APTO CON RESERVAS`: arranca y las pruebas críticas pasan, pero hay
  fallos en niveles no críticos (rendimiento, cobertura E2E parcial,
  vulnerabilidades de severidad baja/media), o algún nivel crítico
  (integración, E2E) quedó en `NO EJECUTADO` por una limitación real del
  entorno (ej. depende de un servicio externo sin credenciales de prueba) —
  nunca porque simplemente no se intentó —, o hubo correcciones silenciosas
  aplicadas en Fase 5 que requieren tu revisión.
- `❌ FAIL DEFINITIVO`: humo, unitarias o integración **fallan** (error real,
  no ausencia de entorno), o hay una vulnerabilidad crítica, o el arranque
  no sobrevivió las 3 iteraciones de corrección. **Bajo ningún concepto se
  entrega el código fuente en este caso** — solo el diagnóstico en lenguaje
  simple y la pregunta de si reintentar con otra configuración.

---

## 7.5 Fase 6.5 — Promoción y entrega segura (sandbox → repositorio real)

El sandbox de la Fase 2 excluye `.git` a propósito — es una copia de
archivos, no un repositorio. Ninguna operación de git puede ni debe ocurrir
dentro del sandbox. Esta fase define cómo el resultado certificado llega al
repositorio real sin volver a "confiar de fe" en una re-ejecución distinta.

**Regla de sincronización, según el veredicto:**
- `❌ FAIL DEFINITIVO`: no hay nada que sincronizar ni publicar. Fin del flujo.
- Fase 5 no aplicó ninguna corrección (código idéntico al original): el
  directorio real ya es el código certificado. Antes de continuar, compara
  su checksum contra el guardado en la Fase 2 — si alguien lo modificó
  mientras el sandbox corría, repórtalo como conflicto, no lo ignores.
- Fase 5 sí aplicó correcciones dentro del sandbox: esas correcciones se
  aplican al directorio real como el mismo diff explícito ya documentado en
  el reporte bajo "Correcciones aplicadas" — nunca como una copia ciega de
  todo el sandbox encima del proyecto real.

**Regla de "no re-ejecutar de fe":** el resultado oficial es el que corrió
aislado en el sandbox. Si por alguna razón operativa necesitas correr
`build`/`test` otra vez en el directorio real (por ejemplo porque lo exige
un pipeline de despliegue), ese resultado es informativo — no reemplaza el
veredicto del Auditor. Si difiere del resultado del sandbox, eso es en sí
mismo un hallazgo (drift de entorno) y se reporta, nunca se descarta en
silencio.

**Regla de git — nunca push directo a `main`/`master`, sin importar el
veredicto:**
1. Crea una rama `auditor/<slug>-<timestamp>`.
2. Push a esa rama, no a la rama de producción.
3. Si el repo está conectado a GitHub/GitLab, abre un PR con el veredicto y
   la matriz de resultados de la Fase 6 pegados en la descripción.
4. Si no hay control remoto configurado, deja el commit local sin pushear y
   pide confirmación explícita: *"El auditor certificó esto como [veredicto].
   ¿Confirmas que se publique en main?"* — un veredicto ✅ APTO certifica
   que el código funciona; publicarlo es una decisión aparte que sigue
   siendo tuya.

**Regla de honestidad sobre cobertura:** el reporte nunca dice "Todo
verificado" si solo corrió un subconjunto de los 9 niveles de la Fase 4.
Debe decir explícitamente cuántos y cuáles — ej. "3/9 niveles verificados:
unitarias, compilación, lint. NO se corrieron: integración, funcionales,
E2E, aceptación, rendimiento, seguridad, regresión, humo" — para no dar una
sensación de cobertura que no existe.

**Regla sobre URLs de deploy en el reporte:** si el reporte incluye una URL
de despliegue (ej. de Vercel/Netlify), debe etiquetarla explícitamente como
`[PREVIEW — rama auditor/...]` o `[PRODUCCIÓN — main]`. Un subdominio
autogenerado no es evidencia suficiente por sí sola de cuál es — verifícalo
contra la rama que realmente se pusheó en esta misma fase.

---

## 8. Fase 7 — Persistencia y limpieza

- Guarda el reporte completo (markdown o JSON) en
  `/auditor/reportes/<timestamp>.md`, **fuera** del sandbox temporal, para
  que sirva de base a la prueba de regresión de la próxima auditoría.
- Elimina `/tmp/auditor_<timestamp>/` al terminar, éxito o fracaso.
- El log detallado (cada comando + salida cruda) se guarda pero no se
  muestra por default — el usuario puede pedir "muéstrame el log".

---

## 9. Nota práctica de configuración en Hermes

Para que la Fase 3.1 no se detenga pidiendo aprobación cada vez:

- Instalar paquetes (`npm install`, `pip install`, `uv pip install`) no está
  en la lista de comandos peligrosos de Hermes, así que con
  `approvals.mode: smart` (el default) debería correr sin pedirte
  confirmación. Si configuraste `manual`, la primera vez que instale un test
  runner te lo va a preguntar — puedes responder "always" para no volver a
  verlo.
- Si corres este skill sobre un backend de contenedor (`docker`, `modal`,
  `daytona`), la verificación de comandos peligrosos se salta por completo
  (el contenedor es la frontera de seguridad), así que es el entorno más
  fluido para este auditor.
- El límite real no es de aprobación sino de tiempo: `playwright install`
  descarga binarios de navegador y puede superar los timeouts cortos de
  fase — dale su propio timeout extendido como se indica en 3.1.

---

## 10. Nota para el usuario no-code

Este skill está pensado para alguien que no puede abrir el código y
verificarlo por sí mismo. Por eso cada resultado debe explicarse en lenguaje
simple además de la evidencia técnica: no basta con "Jest: 3 failed" — hay
que traducirlo a qué significa eso para el producto ("3 de las funciones
clave no están devolviendo lo que deberían, específicamente: ...").
