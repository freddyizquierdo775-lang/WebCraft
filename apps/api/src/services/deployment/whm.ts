import { config } from '../../config/env';
import { supabaseAdmin } from '../../config/supabase';

// ─── Tipos internos ────────────────────────────────────────
export interface DeployResult {
  success: boolean;
  preview_url: string;
  message: string;
  deployed_at: string;
}

// ─── Deploy a preview (stub WHM/cPanel) ────────────────────

/**
 * Despliega un sitio generado a un entorno de preview.
 *
 * **Fase actual — Stub funcional:**
 * Simula el despliegue generando una URL de preview ficticia y guardando
 * el estado en la base de datos.
 *
 * **Fase producción — Integración WHM/cPanel:**
 * 1. Crear subdominio en cPanel vía WHM API (`/json-api/createacct` o similar)
 * 2. Subir archivos HTML/CSS/JS al document root del subdominio
 * 3. Configurar SSL vía AutoSSL o Let's Encrypt
 * 4. Devolver la URL real del preview
 *
 * @param projectId - ID del proyecto a desplegar
 * @param html - Contenido HTML del sitio
 * @param css - Contenido CSS del sitio
 * @param js - Contenido JavaScript del sitio
 */
export async function deployToPreview(
  projectId: string,
  html: string,
  css: string,
  js: string,
): Promise<DeployResult> {
  const previewDomain = config.PREVIEW_DOMAIN || 'preview.webcraft.ai';
  const previewUrl = `https://${previewDomain}/${projectId}`;
  const deployedAt = new Date().toISOString();

  // ── Stub: Guardar la preview_url en user_projects ────────
  const { error: updateError } = await supabaseAdmin
    .from('user_projects')
    .update({
      status: 'ready',
      preview_url: previewUrl,
      html_content: html,
      css_content: css,
      js_content: js,
      updated_at: deployedAt,
    })
    .eq('id', projectId);

  if (updateError) {
    throw new Error(`Error al guardar preview del proyecto ${projectId}: ${updateError.message}`);
  }

  // ── TODO: Integración real con WHM/cPanel ────────────────
  // Cuando WHM_HOST y WHM_API_TOKEN estén configurados, el flujo real sería:
  //
  // if (config.WHM_HOST && config.WHM_API_TOKEN) {
  //   const whmClient = createWhmClient(config.WHM_HOST, config.WHM_API_TOKEN);
  //
  //   // 1. Verificar si el subdominio ya existe o crearlo
  //   const subdomain = `${projectId}.${previewDomain}`;
  //   await whmClient.ensureSubdomain(subdomain, config.CPANEL_USERNAME);
  //
  //   // 2. Construir el HTML completo con CSS y JS embebidos
  //   const fullHtml = buildFullPage(html, css, js);
  //
  //   // 3. Subir al document root del subdominio
  //   await whmClient.uploadFile(
  //     subdomain,
  //     '/public_html/index.html',
  //     fullHtml
  //   );
  //
  //   // 4. Solicitar certificado SSL
  //   await whmClient.enableAutoSSL(subdomain);
  //
  //   previewUrl = `https://${subdomain}`;
  // }

  console.log(`[deployToPreview] Preview desplegado: ${previewUrl} (stub)`);

  return {
    success: true,
    preview_url: previewUrl,
    message: 'Sitio desplegado en preview exitosamente',
    deployed_at: deployedAt,
  };
}

// ─── Helpers para la fase de producción ────────────────────

/**
 * Construye una página HTML completa con CSS y JS embebidos.
 * Utilidad para cuando se despliega realmente a WHM/cPanel.
 */
export function buildFullPage(html: string, css: string, js: string): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="generator" content="WebCraft AI Studio">
  <style>${css}</style>
</head>
<body>
${html}
<script>${js}</script>
</body>
</html>`;
}

// ─── Stub del cliente WHM para referencia futura ───────────

/**
 * Cliente WHM/cPanel — stub para referencia de la integración futura.
 * En producción, esta interfaz se implementará usando fetch() contra la
 * WHM API v1 (puerto 2087) con autenticación por token.
 */
export interface WhmClient {
  ensureSubdomain(subdomain: string, cpanelUser?: string): Promise<void>;
  uploadFile(subdomain: string, path: string, content: string): Promise<void>;
  enableAutoSSL(subdomain: string): Promise<void>;
  createDatabase(
    subdomain: string,
    dbName: string,
  ): Promise<{ db_name: string; db_user: string; db_pass: string }>;
}

/**
 * Factory para crear el cliente WHM real.
 * Retorna null si las credenciales no están configuradas.
 */
export function createWhmClient(host: string, apiToken: string): WhmClient | null {
  if (!host || !apiToken) {
    console.warn('[WHM] Credenciales WHM no configuradas — usando modo stub');
    return null;
  }

  // TODO: Implementar cliente real con fetch a WHM API
  // const baseUrl = `https://${host}:2087/json-api`;
  // const headers = { Authorization: `whm root:${apiToken}` };
  console.log(`[WHM] Cliente WHM inicializado para ${host} (stub — pendiente de implementar)`);

  return null;
}
