# Especificación: Pivoteo a Motor AST Nativo
Fecha de confirmación: 2026-08-01

## Objetivo de negocio
Reemplazar GrapesJS por un motor de renderizado AST (Abstract Syntax Tree) nativo,
ligero e integrado con flujos de IA, ofreciendo un lienzo infinito minimalista
con barras flotantes para usuarios no-técnicos.

## Usuarios
Usuarios de negocio no-técnicos que crean y editan sitios web mediante prompts de IA.
No necesitan conocimientos de código.

## Incluye (este MVP)
- [Imprescindible] Desinstalar grapesjs y dependencias
- [Imprescindible] Tipo ASTNode estricto con id, tag, classes, styles, text, children
- [Imprescindible] Store Zustand con AST, selección, historial undo/redo
- [Imprescindible] Componente AstRenderer recursivo con React.createElement
- [Imprescindible] Selección visual con ring-2 ring-purple-500 al hacer clic
- [Imprescindible] Lienzo con fondo punteado y marco de navegador
- [Imprescindible] BottomAIPanel flotante con input de prompt
- [Imprescindible] RightFloatingBar con undo/redo/outline
- [Deseable] Autoguardado cada 30s

## No incluye (fuera de alcance por ahora)
- Parsing real de HTML → AST (usa AST de ejemplo)
- Edición de texto inline en el canvas
- Drag & drop de elementos
- Preview multi-dispositivo

## Complejidad detectada y decisión
- Integraciones externas (OpenRouter): ya existente, se reutiliza API /api/granular-edit
- Tiempo real: no aplica en esta fase

## Criterios de aceptación

### Criterio 1: Build sin grapesjs
Dado que se desinstaló grapesjs del package.json
Cuando se ejecuta pnpm build
Entonces compila exitosamente con 0 errores
Cómo lo verificas tú: ejecuta pnpm build y confirma "✓ Compiled successfully"

### Criterio 2: Renderizado AST
Dado un ASTNode con children
Cuando se monta AstRenderer
Entonces renderiza recursivamente todos los nodos con sus tags HTML
Cómo lo verificas tú: abre /projects/[id]/editor y verifica que se vean header, hero y footer

### Criterio 3: Selección visual
Dado un elemento renderizado en el canvas
Cuando el usuario hace clic en él
Entonces se resalta con un anillo púrpura (ring-2 ring-purple-500)
Cómo lo verificas tú: haz clic en cualquier elemento y confirma el borde púrpura

### Criterio 4: Panel IA flotante
Dado el editor abierto
Cuando el usuario escribe un prompt en la barra inferior
Entonces el payload captura prompt + selectedElementId + AST completo
Cómo lo verificas tú: escribe en la barra, presiona Enter, abre la consola y verifica [AI Payload]

### Criterio 5: Undo/Redo
Dado cambios aplicados al AST
Cuando el usuario presiona Ctrl+Z o el botón de deshacer
Entonces el AST regresa al estado anterior
Cómo lo verificas tú: haz un cambio, presiona Ctrl+Z, confirma que el canvas vuelve atrás

## Historial de cambios
- 2026-08-01: Especificación inicial del pivoteo AST
