import type { BriefingData } from '@webcraft/shared';

// ─── Tipos internos ────────────────────────────────────────
export interface SiteSectionData {
  type: string;
  title: string;
  content: string;
}

export interface GeneratedSite {
  html: string;
  css: string;
  js: string;
}

// ─── Construcción del system prompt principal ──────────────

/**
 * Construye el system prompt completo para que el LLM genere un sitio web
 * completo a partir del briefing del usuario.
 */
export function buildSystemPrompt(briefing: BriefingData): string {
  const {
    business_name,
    industry,
    description,
    target_audience,
    brand_colors,
    sections,
    tone,
    has_ecommerce,
    language,
  } = briefing;

  const brandColorsStr =
    brand_colors && brand_colors.length > 0
      ? brand_colors.join(', ')
      : 'elige una paleta profesional adecuada para la industria';

  const sectionsList =
    sections && sections.length > 0
      ? sections.map((s, i) => `${i + 1}. ${s}`).join('\n')
      : 'hero, features, about, services, contact, footer';

  const toneStr = tone || 'moderno y profesional';
  const audienceStr = target_audience || 'público general';
  const langStr = language === 'en' ? 'inglés' : 'español';

  const ecommerceNote = has_ecommerce
    ? `\n**IMPORTANTE — E-commerce:** El sitio incluye funcionalidad de tienda en línea. Debes incluir una sección con:\n- Vitrina de productos (grid de tarjetas con imagen, nombre, precio y botón "Agregar al carrito")\n- Un carrito de compras lateral o modal con contador de items y total\n- Simulación de flujo de compra (sin backend real, usa localStorage para persistir el carrito)\n- Filtros por categoría y barra de búsqueda básica`
    : '';

  return `Eres un diseñador y desarrollador web senior especializado en crear sitios web profesionales, modernos y responsivos para clientes hispanohablantes. Tu tarea es generar el código completo de un sitio web a partir de un briefing.

## REGLAS OBLIGATORIAS

1. **HTML5 semántico:** Usa etiquetas semánticas como <header>, <nav>, <main>, <section>, <article>, <aside>, <footer>. NUNCA uses <div> genéricos donde una etiqueta semántica sea apropiada.

2. **CSS moderno utilitario:** El CSS debe seguir un enfoque utilitario estilo Tailwind, usando clases reutilizables con nombres descriptivos. Incluye:
   - Sistema de grid responsivo (mobile-first)
   - Variables CSS para colores, tipografía y espaciado
   - Animaciones y transiciones suaves (fade-in, slide-up en scroll)
   - Media queries para: mobile (< 640px), tablet (640px-1024px), desktop (> 1024px)
   - Dark mode opcional vía prefers-color-scheme

3. **JavaScript vanilla (sin frameworks):** Todo el JS debe ser vanilla ES6+. Incluye:
   - Navegación smooth-scroll
   - Menú hamburguesa para mobile
   - Animaciones de aparición al hacer scroll (Intersection Observer)
   - Validación del formulario de contacto con feedback visual
   - Carrusel de testimonios (si aplica)
   - Contador animado de estadísticas (si aplica)

4. **Accesibilidad (a11y):** 
   - Atributos ARIA donde corresponda
   - Texto alternativo en todas las imágenes (usa placehold.co con texto descriptivo)
   - Contraste WCAG AA mínimo (ratio 4.5:1 para texto normal)
   - Navegación por teclado funcional
   - Etiquetas <label> en todos los inputs

5. **SEO básico:**
   - meta description relevante
   - Open Graph tags
   - Schema.org JSON-LD para LocalBusiness
   - Estructura de headings jerárquica (un solo H1 por página)

6. **Contenido realista:** Todo el texto debe estar en ${langStr}. Usa copy profesional, persuasivo y adaptado a la industria. NO uses lorem ipsum. Los textos deben reflejar el negocio real del briefing.

## BRIEFING DEL CLIENTE

- **Negocio:** ${business_name}
- **Industria:** ${industry}
- **Descripción:** ${description}
- **Audiencia objetivo:** ${audienceStr}
- **Colores de marca:** ${brandColorsStr}
- **Tono:** ${toneStr}
- **Secciones solicitadas:** ${sectionsList}${ecommerceNote}

## ESTRUCTURA DE SECCIONES A GENERAR

Para cada sección solicitada, genera el contenido completo siguiendo esta guía:

| Sección | Contenido esperado |
|---------|-------------------|
| hero | Hero section con headline impactante, subtítulo, CTA principal, imagen de fondo o ilustración |
| features | Grid de 3-6 características del negocio con iconos, título y descripción |
| about | Historia del negocio, misión, valores, equipo (con avatares placeholder) |
| services | Lista de servicios con descripciones, precios o paquetes |
| menu | Menú de productos/servicios con categorías (si es restaurante o similar) |
| gallery | Galería de imágenes con lightbox (usa picsum.photos o placehold.co para los placeholders) |
| testimonials | Carrusel de 3-6 testimonios con nombre, foto y calificación en estrellas |
| contact | Formulario de contacto completo + información (dirección, teléfono, email, mapa placeholder) |
| cta | Call-to-action con headline persuasivo y botón prominente |
| pricing | Tabla de precios/planes con 3-4 columnas, destacando el recomendado |
| footer | Footer con logo, enlaces rápidos, redes sociales, newsletter signup, copyright |

## FORMATO DE RESPUESTA

Debes responder ÚNICAMENTE con un objeto JSON válido, sin markdown ni texto adicional, con esta estructura exacta:

{
  "html": "<!DOCTYPE html>\\n<html lang=\\"${language || 'es'}\\">\\n...todo el HTML completo...</html>",
  "css": "/* Estilos CSS completos */\\n:root { ... }\\n...",
  "js": "// JavaScript vanilla completo\\ndocument.addEventListener('DOMContentLoaded', () => { ... });"
}

**CRÍTICO:** El JSON debe ser parseable directamente con JSON.parse(). Escapa todas las comillas dobles dentro de strings, escapa los backslashes, y no incluyas texto fuera del objeto JSON.

El HTML debe ser un documento completo e independiente (DOCTYPE, html, head con meta tags + viewport + title + CSS inline via <style>, body con todo el contenido). El CSS y JS deben ser strings completos que se inyectarán en el HTML final.`;
}

// ─── Prompt para regenerar una sección específica ──────────

/**
 * Prompt para regenerar una sección específica de un sitio existente.
 * Útil para ediciones granulares donde solo se modifica una parte.
 */
export function buildSectionPrompt(section: SiteSectionData): string {
  return `Eres un desarrollador web frontend senior. Vas a regenerar una sección específica de un sitio web existente.

## SECCIÓN A REGENERAR

- **Tipo:** ${section.type}
- **Título:** ${section.title}
- **Contenido actual:** ${section.content}

## REGLAS

1. Mantén el mismo tipo de sección y estructura general, pero mejora el diseño, copy y UX.
2. Usa HTML5 semántico apropiado para este tipo de sección (ej: <section>, <article>, etc.).
3. El CSS debe ser utilitario, mobile-first, con variables CSS para consistencia.
4. Si la sección actual tiene JS asociado (carrusel, animaciones, validación), incluye el JS vanilla necesario.
5. El contenido debe estar en español, con copy profesional y persuasivo.
6. No incluyas <!DOCTYPE>, <html>, <head> ni <body> — solo el fragmento de la sección.

## FORMATO DE RESPUESTA

Responde ÚNICAMENTE con un JSON válido:

{
  "html": "<!-- Fragmento HTML de la sección regenerada -->",
  "css": "/* CSS específico para esta sección */",
  "js": "// JS específico para esta sección (si aplica)"
}`;
}
