/**
 * Enum que representa os tipos de mensagens suportados pelo WhatsApp
 */
export enum MessageType {
  // Mensagens básicas
  TEXT = 'text',
  IMAGE = 'image',
  VIDEO = 'video',
  AUDIO = 'audio',
  DOCUMENT = 'document',
  LOCATION = 'location',
  CONTACT = 'contact',
  BUTTONS = 'buttons',
  LIST = 'list',
  TEMPLATE = 'template',
  REACTION = 'reaction',
  STICKER = 'sticker',

  // Mensagens de grupo
  GROUP_CREATE = 'group_create',
  GROUP_UPDATE = 'group_update',
  GROUP_PARTICIPANT_ADD = 'group_participant_add',
  GROUP_PARTICIPANT_REMOVE = 'group_participant_remove',
  GROUP_PARTICIPANT_PROMOTE = 'group_participant_promote',
  GROUP_PARTICIPANT_DEMOTE = 'group_participant_demote',
  GROUP_ANNOUNCE = 'group_announce',
  GROUP_DESCRIPTION = 'group_description',
  GROUP_SETTINGS = 'group_settings',

  // Status (Stories)
  STORY = 'story',
  STORY_TEXT = 'story_text',
  STORY_IMAGE = 'story_image',
  STORY_VIDEO = 'story_video',
  STORY_REACTION = 'story_reaction',
  STORY_VIEW = 'story_view',

  // Chamadas
  CALL_OFFER = 'call_offer',
  CALL_ACCEPT = 'call_accept',
  CALL_REJECT = 'call_reject',
  CALL_MISSED = 'call_missed',
  CALL_END = 'call_end',

  // Presença
  PRESENCE_UPDATE = 'presence_update',
  PRESENCE_AVAILABLE = 'presence_available',
  PRESENCE_UNAVAILABLE = 'presence_unavailable',
  PRESENCE_COMPOSING = 'presence_composing',
  PRESENCE_RECORDING = 'presence_recording',
  PRESENCE_PAUSED = 'presence_paused'
}
