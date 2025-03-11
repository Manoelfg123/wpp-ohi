import { BaseMessageHandler } from './base.handler';
import { GroupMessageHandler } from './group.handler';
import { StatusMessageHandler } from './status.handler';
import { CallMessageHandler } from './call.handler';
import { PresenceMessageHandler } from './presence.handler';

/**
 * Exporta todos os handlers de mensagens
 */
export const messageHandlers = [
  new GroupMessageHandler(),
  new StatusMessageHandler(),
  new CallMessageHandler(),
  new PresenceMessageHandler()
];

export {
  BaseMessageHandler,
  GroupMessageHandler,
  StatusMessageHandler,
  CallMessageHandler,
  PresenceMessageHandler
};
