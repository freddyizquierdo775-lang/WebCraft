# Registro de Cambios — WebCraft AI Studio

## Versión 0.3.0 — 2026-08-01

### Añadido
- Motor de renderizado AST nativo (AstRenderer) — reemplaza GrapesJS
- Tipo ASTNode estricto con búsqueda recursiva y clone profundo
- Store Zustand con historial undo/redo del AST (máx 50 snapshots)
- Lienzo infinito con fondo punteado (bg-dot-pattern)
- BottomAIPanel flotante con input de prompt IA
- RightFloatingBar con undo/redo/outline
- Barra superior mínima con navegación y estado de guardado
- Marco de navegador simulado alrededor del canvas
- Selección visual con anillo púrpura (ring-2 ring-purple-500)
- Skill analista-requisitos-no-code v1.0.0
- Skill frontend-design-qa v1.0.0
- Skill entregable-profesional v1.0.0
- Especificación en /requisitos/spec_ast-pivot.md

### Eliminado
- GrapesJS y dependencias (grapesjs-preset-webpage, grapesjs-blocks-basic)
- EditorCanvas legacy basado en GrapesJS

### Corregido
- 3 CVEs (postcss, drizzle-orm) actualizados a versiones seguras
- Historia del editor-store: corregido tipo ASTNode[][] a ASTNode[]

### Mejorado
- Skill auditor-tecnico-avanzado actualizado a v2.1.0
- Biome: 0 errores en todos los archivos modificados
- Build: 14/14 rutas, 0 type errors
