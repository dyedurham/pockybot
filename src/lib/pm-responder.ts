import { MessageObject, PersonObject } from 'webex/env';
const webex = require('webex/env');
import constants from '../constants';
import responseFactory from './response-triggers/pm-index';
import __logger from './logger';

async function respond(messageEvent : any): Promise<void> {
	try {
		let message : MessageObject = await webex.messages.get(messageEvent.data.id);

		let person : PersonObject = await webex.people.get(message.personId);
		if (person.type === 'bot') {
			__logger.debug('Message was sent by a bot, ignoring this message.');
			return;
		}

		__logger.debug('[PmResponder.respond] processing message: ' + JSON.stringify(message));
		let room = message.roomId;

		if (message.personId !== constants.botId){
			let responseMessage : MessageObject;
			try {
				responseMessage = await responseFactory(message, room);
				__logger.information(responseMessage);
			} catch (e) {
				__logger.error(`[PmResponder.respond] Error in direct responder: ${e.message}`);
			}

			if (responseMessage) {
				try {
					let data = await webex.messages.create({
						roomId: room,
						...responseMessage
					});
					__logger.debug(data);
				} catch (e) {
					__logger.error(`[PmResponder.respond] Error in sending direct message: ${e.message}`);
				}
			}
		}
	} catch (e) {
		__logger.error(`[PmResponder.respond] Uncaught error in direct responder: ${e.message}`);
	}
};

export default {
	respond
}
