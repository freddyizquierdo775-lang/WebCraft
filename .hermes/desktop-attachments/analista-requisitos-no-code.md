---
name: analista-requisitos-no-code
description: >
  Traduce una descripción de negocio en lenguaje natural, escrita por un
  usuario no-programador, en una especificación verificable ANTES de que
  Hermes escriba una sola línea de código. Se activa cuando el usuario
  describe una funcionalidad, un MVP o un proyecto nuevo ("quiero...",
  "necesito una app que...", "agrega la función de...", "hazme un sistema
  para..."). Detecta ambigüedad, complejidad oculta (pagos, autenticación,
  integraciones externas, cumplimiento legal) y huecos de alcance; exige
  una confirmación explícita del usuario antes de construir; y deja un
  documento de criterios de aceptación en /requisitos/ que el skill
  auditor-tecnico-avanzado usa después para validar el resultado contra lo
  que realmente se pidió, no contra una suposición de Hermes.
version: 1.0.0
metadata:
  hermes:
    tags: [requisitos, planificación, no-code, mvp, especificación, qa]
    related_skills: [auditor-tecnico-avanzado]
---

# Analista de Requisitos (No-Code)

## Overview

Este skill es la contraparte del `auditor-tecnico-avanzado`, pero corre
**antes** de construir, no después. El Auditor verifica que el código
funcione; este skill define, en un documento verificable, *qué significa
"funcionar"* para este proyecto en concreto — algo que un usuario no-code no
puede especificar en términos técnicos, pero sí puede confirmar en términos
de negocio si se le pregunta bien.

Sin este skill, Hermes interpreta la descripción del usuario y avanza
directo a construir, rellenando cada ambigüedad con su propio criterio. Ese
relleno silencioso es la causa más común de que el "MVP terminado" no sea lo
que el usuario tenía en mente.

## When to Use

Se auto-activa cuando el usuario:
- Describe una funcionalidad, módulo o proyecto nuevo por primera vez.
- Usa frases como "quiero...", "necesito una app/sistema/plataforma que...",
  "hazme un MVP de...", "agrega la función de...", "necesito que se pueda...".
- Pide un cambio grande a algo ya existente (no un ajuste menor de una línea).

No se activa para:
- Correcciones puntuales de bugs ya reportados con pasos claros para
  reproducirlos.
- Ajustes triviales (texto, color, orden de una lista) que no cambian el
  comportamiento del sistema.
- Preguntas exploratorias donde el usuario todavía está decidiendo si quiere
  construir algo ("¿sería posible...?", "¿qué tan difícil sería...?") — para
  esas, responde la pregunta primero; activa el skill solo cuando el usuario
  confirma que sí quiere avanzar.

## Principios rectores

1. **Traducción explícita, nunca silenciosa.** Cada parte ambigua de la
   descripción del usuario se convierte en una pregunta cerrada, nunca en
   una suposición del agente. Si Hermes se encuentra "interpretando lo más
   probable", esa es la señal de que debe preguntar, no de que puede seguir.
2. **Alcance cerrado por escrito.** Todo requisito confirmado incluye tanto
   lo que SÍ se va a construir como lo que explícitamente NO — el "no" es
   tan parte del contrato como el "sí".
3. **Confirmación obligatoria antes de construir.** Ninguna sesión de
   desarrollo empieza sin que el usuario haya dicho, en algún formato
   explícito, "sí, esto es lo que quiero". Un silencio o un "ok" ambiguo a
   una pregunta técnica no cuenta como confirmación de alcance.
4. **Honestidad sobre complejidad oculta.** Si una petición que suena simple
   en realidad requiere integrar pagos, autenticación, servicios externos o
   cumplimiento legal, eso se advierte ANTES de construir, con una
   estimación honesta de que va a tomar más que "un rato" — nunca se
   descubre a medio desarrollo.
5. **El documento de salida es la fuente de verdad, no la conversación.**
   Una vez confirmado, ni Hermes ni el Auditor deben volver a interpretar la
   conversación original — todos leen el mismo documento persistido.

## Procedimiento

### Fase 1 — Captura del requisito en lenguaje natural

Registra la descripción del usuario tal cual la dio, sin traducirla todavía.
Si la descripción ya viene acompañada de ejemplos, capturas de pantalla de
referencia, o "algo parecido a X pero con Y", regístralos también — son
información de alcance, no adorno.

### Fase 2 — Traducción a lenguaje funcional

Descompón la descripción en cuatro preguntas simples y muéstraselas al
usuario como resumen, no como jerga técnica:

| Pregunta | Ejemplo |
|---|---|
| ¿Para qué sirve esto? (objetivo de negocio) | "Para que mis clientes vean el tipo de cambio del día sin llamarme" |
| ¿Quién lo va a usar? | "Cualquier visitante de la página, sin necesidad de registrarse" |
| ¿Qué acción principal hace? | "Consulta el tipo de cambio actual" |
| ¿Qué debe pasar como resultado? | "Ve un número actualizado y la hora de la última actualización" |

Si el usuario ya respondió esto implícitamente en su mensaje original, no
se lo vuelvas a preguntar — resume lo que entendiste y pide solo
confirmación de ese resumen.

### Fase 3 — Detección de huecos y ambigüedad

Revisa la traducción de la Fase 2 contra esta lista de huecos típicos que un
no-code casi nunca menciona espontáneamente, y pregunta SOLO los que
apliquen, como preguntas cerradas (opción múltiple o sí/no), nunca abiertas:

- ¿Qué pasa si la acción falla o no hay datos disponibles?
- ¿Los datos se guardan permanentemente o es solo de consulta?
- ¿Quién puede ver/usar esto — todos, usuarios registrados, o solo tú?
- ¿Hay un límite esperado de uso (10 personas al día, 10,000)?
- ¿Debe verse bien en celular, o solo se va a usar en computadora?

Máximo 4-5 preguntas por ronda. Si hay más huecos que eso, agrúpalos por
tema y pregunta por rondas — bombardear al usuario con 15 preguntas técnicas
de golpe es tan malo como no preguntar nada.

### Fase 4 — Detección de complejidad oculta

Compara el requisito contra este catálogo de categorías que casi siempre
esconden más trabajo del que aparentan. Si alguna aplica, decláralo
explícitamente y espera confirmación antes de seguir — no lo agregues en
silencio ni lo omitas en silencio:

| Categoría | Por qué es más grande de lo que parece |
|---|---|
| Cobros o pagos | Requiere pasarela de pago, manejo de errores de transacción, y usualmente cumplimiento (PCI) |
| Cuentas de usuario / login | Requiere manejo seguro de contraseñas, recuperación de acceso, sesiones |
| Envío de correo/SMS/notificaciones | Depende de un servicio externo con límites y costos propios |
| Integración con servicios externos (bancos, paqueterías, redes sociales) | Depende de una API que Hermes no controla — puede cambiar o fallar |
| Archivos grandes o multimedia | Necesita almacenamiento y límites de tamaño definidos |
| Tiempo real (chat, tracking en vivo) | Arquitectura distinta a una app de consulta simple |
| Cumplimiento legal o fiscal (facturación, datos personales) | El requisito funcional no es solo "que funcione", sino "que cumpla" |

Para cada bandera detectada, pregunta explícitamente: *"Esto que pediste
normalmente implica [X]. ¿Quieres que lo incluyamos completo desde ahora, o
prefieres una versión simplificada para el MVP y lo agregamos después?"*

### Fase 5 — Definición de alcance

Con las Fases 2–4 resueltas, redacta dos listas cortas y en español simple:

- **Incluye (este MVP sí hace esto):** lista de 3-8 puntos concretos.
- **No incluye (fuera de alcance por ahora):** todo lo que el usuario
  mencionó o que surgió en la Fase 4 y decidió posponer.

Etiqueta cada punto de "Incluye" con una prioridad simple:
`Imprescindible` (sin esto no hay MVP) / `Deseable` (mejora la experiencia
pero se puede lanzar sin ello) / `Futuro` (ya se decidió posponerlo).

### Fase 6 — Criterios de aceptación verificables

Por cada punto "Imprescindible" y "Deseable", redacta un criterio en formato
Dado/Cuando/Entonces, pero explicado también en una versión que el usuario
pueda verificar él mismo sin abrir el código:

```
Criterio: Consultar tipo de cambio
Dado que un visitante entra a la página principal
Cuando la página termina de cargar
Entonces debe ver un número de tipo de cambio y la hora de la última
actualización, sin necesidad de hacer clic en nada

Cómo lo verificas tú: abre la página en el celular y en la computadora —
en ambos debe aparecer el número sin que tengas que buscarlo.
```

Esta doble versión (técnica + verificación humana) es lo que luego usa
`auditor-tecnico-avanzado` en sus Fases 4.3 (funcionales) y 4.5
(aceptación) — y lo que te permite a ti confirmar que el MVP quedó bien sin
depender de que el reporte del Auditor te lo diga en jerga técnica.

### Fase 7 — Confirmación obligatoria (gate)

Presenta el documento completo de las Fases 5–6 como un resumen corto (no
la conversación completa) y pide una confirmación explícita:

*"Esto es lo que voy a construir. ¿Confirmas que es correcto, o quieres
ajustar algo antes de que empecemos?"*

Reglas del gate:
- Un "ok", "va" o silencio ambiguo **no** cuenta como confirmación de
  alcance — pide una respuesta afirmativa clara sobre el documento
  específico.
- Si el usuario pide cambios, regresa a la Fase 3 o 5 según corresponda;
  no reinicies todo el proceso desde cero.
- Ningún archivo de código se crea antes de que este gate se cierre con un
  "sí" explícito.

### Fase 8 — Persistencia y entrega

Guarda el documento confirmado en `/requisitos/spec_<slug-del-feature>.md`
dentro del proyecto (no en un sandbox temporal — este documento debe
sobrevivir y ser consultado durante todo el desarrollo). Estructura mínima:
ver plantilla abajo.

A partir de aquí:
- Hermes debe consultar este archivo como referencia mientras construye.
- `auditor-tecnico-avanzado`, en sus Fases 4.3 y 4.5, busca el
  `/requisitos/spec_*.md` más reciente para el feature en curso y valida
  contra los criterios ahí definidos — no contra suposiciones del código de
  estado HTTP.

### Fase 9 — Control de cambios

Si el usuario cambia de opinión a medio desarrollo, este skill se
re-activa, pero en vez de reescribir el documento desde cero, genera un
apartado `## Cambios respecto a la versión anterior` dentro del mismo
archivo, con fecha, para que el Auditor pueda usarlo también como base de
su prueba de regresión (Fase 4.8 del Auditor).

## Formato del documento de salida (plantilla)

```markdown
# Especificación: <nombre del feature>
Fecha de confirmación: <fecha>

## Objetivo de negocio
<una frase>

## Usuarios
<quién lo usa>

## Incluye (este MVP)
- [Imprescindible] ...
- [Deseable] ...

## No incluye (fuera de alcance por ahora)
- ...

## Complejidad detectada y decisión del usuario
- <categoría>: <qué se decidió — incluir completo / simplificar / posponer>

## Criterios de aceptación
### Criterio 1: <nombre>
Dado ... Cuando ... Entonces ...
Cómo lo verificas tú: ...

## Historial de cambios
- <fecha>: <qué cambió y por qué>
```

## Common Pitfalls

- Preguntar en jerga técnica ("¿quieres autenticación JWT o sesiones?") en
  vez de en términos de negocio ("¿los usuarios necesitan crear una cuenta
  para usar esto?"). El usuario no-code no puede responder la primera.
- Hacer 15 preguntas de golpe — agota al usuario y hace que responda
  "lo que sea" solo para terminar, lo que reintroduce el problema que este
  skill existe para evitar.
- Aceptar un "ok" genérico como si fuera el gate de la Fase 7. El gate debe
  cerrarse sobre el documento específico, no sobre la idea general.
- Omitir la Fase 4 (complejidad oculta) porque "se ve simple" — es
  precisamente en los casos que se ven simples donde más se esconde.
- Dejar que el documento de la Fase 8 vaya solo en el chat y no se guarde
  en `/requisitos/` — sin el archivo persistido, el Auditor no tiene contra
  qué validar y vuelve a caer en `NO EJECUTADO`.

## Verification Checklist

Antes de dar por cerrada una sesión de este skill, confirma:

- [ ] Las cuatro preguntas de la Fase 2 tienen respuesta, propia o
      confirmada por el usuario.
- [ ] Toda ambigüedad detectada en la Fase 3 se resolvió con una pregunta
      cerrada, no con una suposición.
- [ ] Cada categoría de complejidad oculta aplicable (Fase 4) fue declarada
      y el usuario decidió explícitamente qué hacer con ella.
- [ ] Existen las listas "Incluye" y "No incluye", con prioridad en cada
      punto de "Incluye".
- [ ] Cada criterio de aceptación tiene su versión Dado/Cuando/Entonces Y su
      versión "cómo lo verificas tú".
- [ ] El usuario dio una confirmación explícita sobre el documento final,
      no una aprobación ambigua.
- [ ] El documento quedó guardado en `/requisitos/spec_<slug>.md`, no solo
      en el chat.
