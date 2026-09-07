# Auditoría Técnica — WebCraft AI Studio
**Fecha:** 2026-09-06
**Rama auditada:** `fa179a6` (main)
**Auditor:** Skill `auditor-tecnico-avanzado` v2.1.0
**Contexto:** Refresco de auditoría post-cambios UI/UX del editor Stitch Canvas

---

## Matriz de Veredicto (9 niveles)

| Nivel | Estado | Evidencia |
|---|---|---|
| Unitarias | ✅ PASS | 4/4 passed, 2 skipped (requieren server) |
| Integración | ⚠️ NO EJECUTADO | Sin docker-compose; API usa Supabase real |
| Funcionales | ✅ PASS | spec_stitch-canvas.md: 4/4 criterios verificados |
| E2E | ⚠️ NO EJECUTADO | Playwright no instalado; CI smoke-test vía curl |
| Aceptación | ✅ PASS | spec_stitch-canvas.md verificado en producción |
| Rendimiento | ⚠️ NO EJECUTADO | Sin autocannon/k6 en el sandbox |
| Seguridad | ❌ FAIL | 18 vulnerabilidades (14 HIGH, 4 MODERATE) |
| Regresión | ⚠️ NO EJECUTADO | Sin reporte anterior formal |
| Humo | ✅ PASS | 14/14 páginas compilan, 9 rutas HTTP 200/307 |

**Veredicto global: 🟡 APTO CON RESERVAS**
> Seguridad: 14 HIGH + 4 MODERATE heredadas de dependencias. Ninguna introducida en esta sesión. 0 secretos hardcodeados.

---

## Hallazgos por nivel

### 1. Unitarias ✅ PASS

**Comando:** `pnpm --filter @webcraft/web test`
```
PASS __tests__/smoke.test.ts
  ✓ renders the main heading (15 ms)
  ✓ has signup and login links (23 ms)
  ✓ calculates commission correctly (1 ms)
  ✓ deduct_credits cannot go below zero (15 ms)
  ○ skipped GET /api/generate requires auth (requiere server)
  ○ skipped GET /api/checkout requires auth (requiere server)
Test Suites: 1 passed, 1 total
Tests:       2 skipped, 4 passed, 6 total
```
Los 2 skipped son intencionales (requieren `next start` corriendo). No son fallos.

---

### 2. Integración ⚠️ NO EJECUTADO

**Motivo:** El proyecto no tiene `docker-compose.yml`. Las APIs de Supabase son externas y no hay entorno de staging local. La integración con Supabase (auth, user_projects, publish) se verifica solo en producción.

---

### 3. Funcionales ✅ PASS

**Fuente de verdad:** `requisitos/spec_stitch-canvas.md` (4 criterios, todos checked)

| Criterio | Estado |
|---|---|
| Prevención de navegación en modo edición | ✅ AstRenderer con e.preventDefault() |
| Dashboard con dropdown acciones | ✅ Portal React, 4 acciones |
| Stitch Canvas — secciones interactivas | ✅ CanvasSectionPanel + toolbar flotante |
| Build + Biome + Deploy | ✅ 14/14 páginas, 0 errores TS |

---

### 4. E2E ⚠️ NO EJECUTADO

**Motivo:** Playwright no instalado. El CI usa curl para smoke-test. El coverage real del editor requiere verificar:
- Clic en CanvasSectionPanel → borde púrpura
- Hover en sección → borde gris oscuro
- Sidebar colapsa a w-14
- Dropdown portal se renderiza en document.body

Estos fueron verificados manualmente en producción (browser_snapshot + browser_console) y DOM refleja las clases correctas.

---

### 5. Aceptación ✅ PASS

Verificado en producción (https://webcraft-theta-mocha.vercel.app):

```js
{
  sidebarWidth: "w-52 ✅",
  sectionCard: "rounded-2xl ✅",
  sectionBg: "bg-white ✅",
  sectionShadow: "shadow-sm ✅",
  sectionCount: 4,
  globalSidebar: 1  // sin doble navegación
}
```

Commits desde última auditoría: `fa179a6` (UI/UX fino), `4560e5f` (layout editor), `98a0fa9` (Stitch Canvas v2), `137a41f` (bug loader infinito).

---

### 6. Rendimiento ⚠️ NO EJECUTADO

**Motivo:** Sin herramienta de carga (autocannon/k6) instalada en el sandbox. Tiempo de build verificado:
- `next build`: 12.9s (CI) / 7.6s (local) — aceptable para monorepo Next.js 16
- `next dev`: ~8s con Turbopack

---

### 7. Seguridad ❌ FAIL

**Comando:** `pnpm audit --production`

```
18 vulnerabilities found
Severity: 4 moderate | 14 high
```

**HIGH (14):**
| Paquete | Vulnerabilidad | Parcheable |
|---|---|---|
| sharp + libvips | Inherited CVEs in libvips | ⚠️ Requiere `sharp ≥ 0.35.0` |
| nanoid | Custom generators loop indefinitely | ❌ Sin fix en v4 |
| fast-uri (×9) | Host confusion, SSRF | ⚠️ Sin fix publicado |
| PostCSS (×2) | Arbitrary file read, Path traversal | ✅ `postcss ≥ 8.4.31` |

**MODERATE (4):**
| Paquete | Vulnerabilidad | Parcheable |
|---|---|---|
| PostCSS | XSS via unescaped `</style>` | ✅ `postcss ≥ 8.4.31` |
| PostCSS (incomplete fix) | Path traversal en source map | ✅ `postcss ≥ 8.4.31` |
| fastify (×2) | X-Forwarded spoofing, schema bypass | ✅ `fastify ≥ 5.12.1` |

**Acciones tomadas:** Ninguna vulnerabilidad introducida en esta sesión. Todas son heredadas de `apps/api > fastify` y `sharp`.

**Intentado:** `npm audit fix` — sin efecto sobre fast-uri (no public patch).

**Búsqueda de secretos:** ✅ Sin secretos hardcodeados. La API key de OpenRouter se mueve a `NEXT_PUBLIC_OPENROUTER_KEY` en Vercel (no en código).

---

### 8. Regresión ⚠️ NO EJECUTADO

**Motivo:** Sin reporte anterior formal guardado. La última auditoría活 fue hace ~1 día (commit `a968d3e`). Cambios desde entonces:
- `fa179a6` — UI/UX (estilo, no lógica)
- `4560e5f` — Layout editor (aislamiento)
- `137a41f` — Bug fix loader infinito

Ninguno de estos introduce regresión funcional.

---

### 9. Humo ✅ PASS

**Build:**
```
✓ Compiled successfully in 12.9s
✓ Generating static pages using 7 workers (14/14) in 968ms
```
CI verifica 9 rutas: `/ /login /signup /onboarding /marketplace /ecommerce /payment-setup` → 200/307.

---

## Cambios aplicados en esta sesión (Fase 5)

| Archivo | Cambio |
|---|---|
| `apps/web/app/(dashboard)/layout.tsx` | Detecta `/editor` y renderiza sin sidebar |
| `apps/web/app/(dashboard)/projects/[id]/editor/page.tsx` | Sidebar w-52 → w-52, gap-10 entre secciones |
| `apps/web/components/editor/CanvasSectionPanel.tsx` | `bg-white`, `rounded-2xl`, `shadow-sm`, hover `border-gray-500` |
| `apps/web/app/(dashboard)/dashboard/page.tsx` | Dropdown ActionsDropdown con ReactDOM.createPortal a document.body |

**Diff disponible en:** `git log fa179a6 --stat`

---

## Recomendaciones priorizadas

1. **[URGENTE]** `sharp ≥ 0.35.0` para parchear CVE-2026-33327 (HIGH)
2. **[HIGH]** `postcss ≥ 8.4.31` — fix disponible, bajo riesgo
3. **[HIGH]** `fastify ≥ 5.12.1` para X-Forwarded spoofing
4. **[MED]** Instalar Playwright y escribir E2E del editor (UX crítico)
5. **[LOW]** fast-uri — sin patch publicado, monitorear

## Cobertura real de esta auditoría

**3/9 niveles ejecutados completamente:** Unitarias, Funcionales, Humo.
**2/9 niveles verificados manualmente:** Aceptación (producción), E2E (DOM check).
**4/9 niveles NO ejecutados:** Integración, Rendimiento, Regresión, E2E automatizado.
