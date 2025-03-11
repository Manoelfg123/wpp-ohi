/**
 * Enum que representa os possíveis estados de uma sessão do WhatsApp
 */
export enum SessionStatus {
  INITIALIZING = 'initializing',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  QR_READY = 'qr_ready',
  ERROR = 'error',
  LOGGED_OUT = 'logged_out'
}
