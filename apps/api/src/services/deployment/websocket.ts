import type { FastifyRequest } from 'fastify';
import { verifyJWT } from '../../config/supabase';
import { supabaseAdmin } from '../../config/supabase';
import { applyGranularEdit } from '../ai/granular';

// ─── Tipos ─────────────────────────────────────────────────

/**
 * Eventos que fluyen por el WebSocket del editor colaborativo.
 */
export type EditorEventType =
  | 'editor:join'
  | 'editor:leave'
  | 'editor:element-select'
  | 'editor:cursor-move'
  | 'editor:text-edit'
  | 'ai:granular-edit'
  | 'ai:edit-progress'
  | 'ai:edit-complete'
  | 'ai:edit-error'
  | 'preview:update'
  | 'preview:refresh';

export interface EditorMessage {
  type: EditorEventType | string;
  payload: Record<string, unknown>;
  timestamp?: string;
  clientId?: string;
}

/**
 * Cliente conectado al editor colaborativo.
 * `socket` es la conexión WebSocket cruda (tipo `ws` de @fastify/websocket).
 */
export interface ClientInfo {
  id: string;
  userId: string;
  userPlan: string;
  socket: {
    readyState: number;
    OPEN: number;
    send(data: string): void;
    close(code?: number, reason?: string): void;
    on(event: string, listener: (...args: never[]) => void): void;
  };
  connectedAt: string;
}

interface ProjectRoom {
  projectId: string;
  clients: Map<string, ClientInfo>;
}

// ─── Constantes de WebSocket readyState ────────────────────
const WS_OPEN = 1;

// ─── Estado global de rooms ────────────────────────────────

/** Mapa de projectId → ProjectRoom para manejar todas las conexiones activas */
const rooms = new Map<string, ProjectRoom>();

// ─── Helpers de logging ────────────────────────────────────

function log(projectId: string, msg: string): void {
  console.log(`[WS:${projectId.slice(0, 8)}] ${msg}`);
}

function warn(projectId: string, msg: string): void {
  console.warn(`[WS:${projectId.slice(0, 8)}] ${msg}`);
}

// ─── Gestión de rooms ──────────────────────────────────────

function getOrCreateRoom(projectId: string): ProjectRoom {
  let room = rooms.get(projectId);
  if (!room) {
    room = { projectId, clients: new Map() };
    rooms.set(projectId, room);
    log(projectId, 'Sala creada');
  }
  return room;
}

function removeRoomIfEmpty(projectId: string): void {
  const room = rooms.get(projectId);
  if (room && room.clients.size === 0) {
    rooms.delete(projectId);
    log(projectId, 'Sala eliminada (sin clientes)');
  }
}

// ─── Broadcast ─────────────────────────────────────────────

function broadcastToRoom(
  room: ProjectRoom,
  message: EditorMessage,
  excludeClientId?: string,
): void {
  const payload = JSON.stringify(message);
  room.clients.forEach((client, clientId) => {
    if (clientId === excludeClientId) return;
    if (client.socket.readyState === WS_OPEN) {
      client.socket.send(payload);
    }
  });
}

function sendToClient(socket: ClientInfo['socket'], message: EditorMessage): void {
  if (socket.readyState === WS_OPEN) {
    socket.send(JSON.stringify(message));
  }
}

// ─── handleEditorWS ────────────────────────────────────────

/**
 * Maneja una conexión WebSocket entrante para el editor colaborativo.
 *
 * Flujo:
 * 1. Extrae y verifica el JWT del query string del handshake
 * 2. Valida que el proyecto exista y que el usuario tenga acceso
 * 3. Registra al cliente en la sala del proyecto
 * 4. Configura handlers para mensajes entrantes y desconexión
 * 5. Notifica a los demás clientes sobre el join
 *
 * @param socket - Conexión WebSocket cruda (de @fastify/websocket / ws)
 * @param request - Fastify request object (contiene query params)
 * @param projectId - ID del proyecto al que se conecta
 */
export async function handleEditorWS(
  socket: ClientInfo['socket'],
  request: FastifyRequest,
  projectId: string,
): Promise<void> {
  // ── 1. Autenticar vía JWT en query string ────────────────
  const token = extractToken(request);

  if (!token) {
    sendToClient(socket, {
      type: 'ai:edit-error',
      payload: {
        code: 'UNAUTHORIZED',
        message: 'Token JWT requerido en query string (?token=...)',
      },
      timestamp: new Date().toISOString(),
    });
    socket.close(4001, 'Token requerido');
    return;
  }

  let userId: string;
  try {
    userId = await verifyJWT(token);
  } catch {
    sendToClient(socket, {
      type: 'ai:edit-error',
      payload: { code: 'UNAUTHORIZED', message: 'Token JWT inválido o expirado' },
      timestamp: new Date().toISOString(),
    });
    socket.close(4001, 'Token inválido');
    return;
  }

  // ── 2. Validar proyecto y acceso ─────────────────────────
  const { data: project, error: projectErr } = await supabaseAdmin
    .from('user_projects')
    .select('id, owner_id, status, html_content')
    .eq('id', projectId)
    .single();

  if (projectErr || !project) {
    sendToClient(socket, {
      type: 'ai:edit-error',
      payload: { code: 'PROJECT_NOT_FOUND', message: 'Proyecto no encontrado' },
      timestamp: new Date().toISOString(),
    });
    socket.close(4004, 'Proyecto no encontrado');
    return;
  }

  const projectRecord = project as {
    id: string;
    owner_id: string;
    status: string;
    html_content: string | null;
  };

  // ── 3. Obtener plan del usuario ──────────────────────────
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('plan')
    .eq('id', userId)
    .single();

  const userPlan = (profile as { plan: string } | null)?.plan || 'free';

  // ── 4. Registrar cliente en la sala ──────────────────────
  const clientId = `${userId}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const clientInfo: ClientInfo = {
    id: clientId,
    userId,
    userPlan,
    socket,
    connectedAt: new Date().toISOString(),
  };

  const room = getOrCreateRoom(projectId);
  room.clients.set(clientId, clientInfo);

  log(projectId, `Cliente conectado: ${userId} (total: ${room.clients.size})`);

  // ── 5. Notificar join a la sala ──────────────────────────
  sendToClient(socket, {
    type: 'editor:join',
    payload: {
      clientId,
      userId,
      projectId,
      activeClients: room.clients.size,
      projectStatus: projectRecord.status,
    },
    timestamp: new Date().toISOString(),
    clientId,
  });

  broadcastToRoom(
    room,
    {
      type: 'editor:join',
      payload: {
        clientId,
        userId,
        activeClients: room.clients.size,
      },
      timestamp: new Date().toISOString(),
    },
    clientId,
  );

  // ── 6. Enviar estado actual del proyecto ─────────────────
  sendToClient(socket, {
    type: 'preview:update',
    payload: {
      html: projectRecord.html_content || '',
      status: projectRecord.status,
      lastModified: new Date().toISOString(),
    },
    timestamp: new Date().toISOString(),
    clientId,
  });

  // ── 7. Configurar handlers de mensajes ───────────────────
  socket.on('message', (rawData: unknown) => {
    let dataStr: string;
    try {
      if (Buffer.isBuffer(rawData)) {
        dataStr = rawData.toString();
      } else if (Array.isArray(rawData)) {
        dataStr = Buffer.concat(rawData as Buffer[]).toString();
      } else if (rawData instanceof ArrayBuffer) {
        dataStr = new TextDecoder().decode(rawData);
      } else if (typeof rawData === 'string') {
        dataStr = rawData;
      } else {
        return;
      }
    } catch {
      sendToClient(socket, {
        type: 'ai:edit-error',
        payload: { code: 'INVALID_JSON', message: 'Mensaje JSON inválido' },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    let message: EditorMessage;
    try {
      message = JSON.parse(dataStr) as EditorMessage;
    } catch {
      sendToClient(socket, {
        type: 'ai:edit-error',
        payload: { code: 'INVALID_JSON', message: 'Mensaje JSON inválido' },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Adjuntar metadata
    message.timestamp = message.timestamp || new Date().toISOString();
    message.clientId = clientId;

    handleIncomingMessage(room, clientInfo, message).catch((err: Error) => {
      warn(projectId, `Error procesando mensaje: ${err.message}`);
    });
  });

  // ── 8. Configurar handler de desconexión ─────────────────
  socket.on('close', () => {
    room.clients.delete(clientId);
    log(projectId, `Cliente desconectado: ${userId} (quedan: ${room.clients.size})`);

    broadcastToRoom(room, {
      type: 'editor:leave',
      payload: {
        clientId,
        userId,
        activeClients: room.clients.size,
      },
      timestamp: new Date().toISOString(),
    });

    removeRoomIfEmpty(projectId);
  });

  // ── 9. Handler de errores ────────────────────────────────
  socket.on('error', (err: unknown) => {
    const errorMsg = err instanceof Error ? err.message : 'Error desconocido';
    warn(projectId, `Error de conexión para ${userId}: ${errorMsg}`);
    room.clients.delete(clientId);
    removeRoomIfEmpty(projectId);
  });
}

// ─── Procesamiento de mensajes entrantes ───────────────────

async function handleIncomingMessage(
  room: ProjectRoom,
  client: ClientInfo,
  message: EditorMessage,
): Promise<void> {
  const { type, payload } = message;

  switch (type) {
    // ── Selección de elemento en el editor ─────────────────
    case 'editor:element-select':
      broadcastToRoom(room, message, client.id);
      break;

    // ── Movimiento del cursor ──────────────────────────────
    case 'editor:cursor-move':
      broadcastToRoom(room, message, client.id);
      break;

    // ── Edición de texto manual ────────────────────────────
    case 'editor:text-edit':
      broadcastToRoom(room, message, client.id);
      break;

    // ── Edición granular con IA ────────────────────────────
    case 'ai:granular-edit':
      await handleGranularEdit(room, client, payload);
      break;

    // ── Actualización de preview ───────────────────────────
    case 'preview:update':
      broadcastToRoom(room, message, client.id);
      break;

    // ── Solicitud de refresh del preview ───────────────────
    case 'preview:refresh':
      broadcastToRoom(room, message);
      break;

    default:
      // Forward de eventos desconocidos a otros clientes
      broadcastToRoom(room, message, client.id);
      break;
  }
}

// ─── Procesamiento de edición granular vía IA ──────────────

async function handleGranularEdit(
  room: ProjectRoom,
  client: ClientInfo,
  payload: Record<string, unknown>,
): Promise<void> {
  const selector = typeof payload.selector === 'string' ? payload.selector : null;
  const prompt = typeof payload.prompt === 'string' ? payload.prompt : null;
  const html = typeof payload.html === 'string' ? payload.html : null;

  if (!selector || !prompt || !html) {
    sendToClient(client.socket, {
      type: 'ai:edit-error',
      payload: {
        code: 'INVALID_PAYLOAD',
        message: 'Payload debe incluir: selector (string), prompt (string), html (string)',
      },
      timestamp: new Date().toISOString(),
    });
    return;
  }

  // ── Notificar progreso a todos ───────────────────────────
  broadcastToRoom(room, {
    type: 'ai:edit-progress',
    payload: {
      status: 'processing',
      selector,
      userId: client.userId,
      message: 'La IA está analizando el elemento y aplicando la edición...',
    },
    timestamp: new Date().toISOString(),
  });

  try {
    // ── Ejecutar edición granular ──────────────────────────
    const model = typeof payload.model === 'string' ? payload.model : undefined;

    const result = await applyGranularEdit({
      html,
      selector,
      prompt,
      ...(model ? { model } : {}),
    });

    // ── Guardar en la base de datos ────────────────────────
    const { error: updateError } = await supabaseAdmin
      .from('user_projects')
      .update({
        html_content: result.modified,
        updated_at: new Date().toISOString(),
      })
      .eq('id', room.projectId)
      .eq('owner_id', client.userId);

    if (updateError) {
      warn(room.projectId, `Error al guardar edición: ${updateError.message}`);
    }

    // ── Notificar éxito a todos los clientes ───────────────
    const completeMessage: EditorMessage = {
      type: 'ai:edit-complete',
      payload: {
        selector,
        modified: result.modified,
        diff: result.diff,
        explanation: result.explanation,
        path: result.path,
        model_used: result.model_used,
        tokens_in: result.tokens_in,
        tokens_out: result.tokens_out,
        appliedBy: client.userId,
      },
      timestamp: new Date().toISOString(),
    };

    broadcastToRoom(room, completeMessage);

    // ── Guardar log de generación ──────────────────────────
    const { error: logError } = await supabaseAdmin.from('generation_logs').insert({
      project_id: room.projectId,
      user_id: client.userId,
      prompt: `Granular edit: ${selector} — ${prompt.substring(0, 200)}`,
      model_used: result.model_used,
      tokens_in: result.tokens_in,
      tokens_out: result.tokens_out,
      credits_cost: 3, // GRANULAR_EDIT_CLAUDE default
      duration_ms: null,
      success: true,
      error_message: null,
      created_at: new Date().toISOString(),
    });

    if (logError) {
      warn(room.projectId, `Error al guardar generation_log: ${logError.message}`);
    }

    // ── Disparar preview:refresh ───────────────────────────
    broadcastToRoom(room, {
      type: 'preview:refresh',
      payload: { triggeredBy: 'ai:granular-edit' },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';

    warn(room.projectId, `Error en edición granular: ${errorMessage}`);

    // ── Notificar error ────────────────────────────────────
    broadcastToRoom(room, {
      type: 'ai:edit-error',
      payload: {
        code: 'GRANULAR_EDIT_FAILED',
        message: errorMessage,
        selector,
        userId: client.userId,
      },
      timestamp: new Date().toISOString(),
    });

    // ── Guardar log de fallo ───────────────────────────────
    const { error: logError } = await supabaseAdmin.from('generation_logs').insert({
      project_id: room.projectId,
      user_id: client.userId,
      prompt: `Granular edit (FAILED): ${selector} — ${prompt.substring(0, 200)}`,
      model_used: 'unknown',
      tokens_in: 0,
      tokens_out: 0,
      credits_cost: 0,
      duration_ms: null,
      success: false,
      error_message: errorMessage,
      created_at: new Date().toISOString(),
    });

    if (logError) {
      warn(room.projectId, `Error al guardar generation_log de fallo: ${logError.message}`);
    }
  }
}

// ─── Helpers ───────────────────────────────────────────────

/**
 * Extrae el token JWT del query string del handshake WebSocket.
 * Soporta `?token=...` como parámetro.
 */
function extractToken(request: FastifyRequest): string | null {
  // En Fastify + @fastify/websocket, los query params están en request.query
  const query = request.query as Record<string, string> | undefined;
  if (query && typeof query.token === 'string' && query.token.length > 0) {
    return query.token;
  }

  // Fallback: intentar extraer de la URL cruda
  const url = request.url;
  const urlMatch = url.match(/[?&]token=([^&]+)/);
  if (urlMatch?.[1]) {
    return decodeURIComponent(urlMatch[1]);
  }

  return null;
}

// ─── Utilidades para monitoreo ─────────────────────────────

/**
 * Obtiene estadísticas de todas las salas activas.
 * Útil para monitoreo y health checks.
 */
export function getRoomsStats(): {
  totalRooms: number;
  totalClients: number;
  rooms: Array<{ projectId: string; clientCount: number }>;
} {
  let totalClients = 0;
  const roomsList: Array<{ projectId: string; clientCount: number }> = [];

  rooms.forEach((room, projectId) => {
    const count = room.clients.size;
    totalClients += count;
    roomsList.push({ projectId, clientCount: count });
  });

  return {
    totalRooms: rooms.size,
    totalClients,
    rooms: roomsList.sort((a, b) => b.clientCount - a.clientCount),
  };
}

/**
 * Desconecta forzosamente a todos los clientes de un proyecto.
 * Útil cuando un proyecto se archiva o elimina.
 */
export function kickProjectClients(projectId: string, reason = 'Proyecto cerrado'): void {
  const room = rooms.get(projectId);
  if (!room) return;

  const disconnectMsg = JSON.stringify({
    type: 'editor:leave',
    payload: { reason, projectId },
    timestamp: new Date().toISOString(),
  });

  room.clients.forEach((client) => {
    if (client.socket.readyState === WS_OPEN) {
      client.socket.send(disconnectMsg);
      client.socket.close(4000, reason);
    }
  });

  room.clients.clear();
  rooms.delete(projectId);
  log(projectId, `Todos los clientes desconectados: ${reason}`);
}

/**
 * Verifica si un proyecto tiene clientes conectados.
 */
export function hasActiveClients(projectId: string): boolean {
  const room = rooms.get(projectId);
  return room ? room.clients.size > 0 : false;
}
