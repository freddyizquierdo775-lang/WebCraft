# Especificación: Stitch Canvas Panels
Fecha: 2026-08-02
Commit: a968d3e

## Criterios de aceptación

### 1. Prevención de navegación en modo edición
- [x] El AstRenderer intercepta clics en enlaces y botones usando `e.preventDefault()` y `e.stopPropagation()`
- [x] Un clic en cualquier componente establece `selectedElementId` en Zustand
- [x] El toggle "Editar / Preview" alterna entre modo bloqueado y modo navegable

### 2. Dashboard de "Mis Sitios"
- [x] DropdownMenu con Editar → `/projects/[id]/editor`
- [x] DropdownMenu con Configurar Dominio → Modal SEO
- [x] DropdownMenu con Duplicar → duplicado en Supabase
- [x] DropdownMenu con Eliminar → eliminación en Supabase
- [x] Badge de estado interactivo → Modal de Publicación 1-Click

### 3. Stitch Canvas — Secciones interactivas
- [x] Cada hijo del AST se envuelve en `CanvasSectionPanel` con bordes hover y etiqueta
- [x] Toolbar flotante al seleccionar: 🪄 Editar con IA, ⬆️ Reordenar, 🗑️ Eliminar
- [x] Barra de IA global flotante en la parte inferior (solo modo edición)

### 4. Generación y deploy
- [x] Build: `pnpm --filter @webcraft/web build` compila sin errores
- [x] Biome: `pnpm biome check` 0 errores en archivos modificados
- [x] Deploy: Vercel auto-deploy desde main

### Verificación funcional
1. Build exitoso → evidencia en terminal
2. 9 rutas responden HTTP 200/307 → evidencia curl
3. Editor renderiza AST con CanvasSectionPanels → evidencia browser snapshot
4. Dashboard carga proyectos reales desde Supabase → evidencia browser
