---
name: entregable-profesional
description: >
  Skill de cierre de ciclo. Se ejecuta DESPUÉS de que el Auditor Técnico dé
  su veredicto (verde o amarillo). Genera automáticamente un manual de
  usuario (en español), un registro de cambios (changelog), actualiza el
  README y, si el usuario lo pide, despliega la aplicación en Vercel/Netlify
  para que esté disponible en internet al instante.
version: 1.0.0
metadata:
  hermes:
    tags: [documentación, despliegue, release, manual, changelog, vercel]
---

# Entregable Profesional (Release & Docs Manager)

## 0. Principios Rectores (Para No-Code)

1. **"El código no es el producto; el producto es lo que el usuario final ve"**: 
   Esta skill convierte el código técnico en algo que cualquier persona no técnica pueda entender y usar.
2. **"Documentar es tan importante como programar"**: Sin un manual, tu MVP es un misterio. 
3. **"Un clic para desplegar"**: El usuario No-Code no debe tocar una terminal. Si la skill puede desplegar automáticamente, lo hace.

---

## 1. Activación (Triggers)

Se activa **inmediatamente después** de que el `auditor-tecnico-avanzado` emita un veredicto **🟢 APTO** o **🟡 APTO CON RESERVAS**, y justo antes de que Hermes te muestre el botón de "Descargar Código".

También se activa manualmente si dices: *"Prepara el entregable"*, *"Sube esto a producción"*, *"Genera la documentación"*.

---

## 2. Flujo de Ejecución (4 Fases)

### Fase 1: Generación del Changelog (Registro de Cambios)
- Lee el reporte más reciente del Auditor en `/auditor/reportes/`.
- Compara la lista de pruebas que fallaban antes vs. las que pasan ahora (prueba de regresión).
- Redacta un archivo `CHANGELOG.md` en la raíz del proyecto con un formato simple:
  ```markdown
  # Registro de Cambios - [Nombre del Proyecto]
  ## Versión 1.0.0 - [Fecha]
  ### Añadido
  - Pantalla de login con validación de correo.
  - Panel de ventas con gráfico diario.
  ### Corregido
  - Error que impedía guardar productos en la base de datos.
  - Alineación de botones en la versión móvil.                                                                                                                 # Manual de Usuario - [Nombre del Proyecto]

## 1. Iniciar Sesión
1. Abre la página principal.
2. Escribe tu correo electrónico en el campo "Email".
3. Escribe tu contraseña en el campo "Contraseña".
4. Haz clic en el botón "Entrar".
5. **Resultado**: Verás el panel de control.

## 2. Registrar una Venta
1. Ve a la pestaña "Ventas".
2. Haz clic en "Nueva Venta".
3. Llena el formulario...                                                                                                                                      
4. **Resultado**: La venta se guarda y aparece en el listado.