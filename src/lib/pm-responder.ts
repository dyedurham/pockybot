import { MessageObject, PersonObject } from 'webex/env';
const webex = require('webex/env');
import constants from '../constants';
import responseFactory from './response-triggers/pm-index';
import { Logger } from './logger';

export async function pmRespond(messageEvent : any): Promise<void> {
	try {
		let message : MessageObject = await webex.messages.get(messageEvent.data.id);

		let person : PersonObject = await webex.people.get(message.personId);
		if (person.type === 'bot') {
			Logger.debug('Message was sent by a bot, ignoring this message.');
			return;
		}

		Logger.debug('[PmResponder.respond] processing message: ' + JSON.stringify(message));
		let room = message.roomId;

		if (message.personId !== constants.botId){
			let responseMessage : MessageObject;
			try {
				responseMessage = await responseFactory(message, room);
				Logger.information(responseMessage);
			} catch (e) {
				Logger.error(`[PmResponder.respond] Error in direct responder: ${e.message}`);
			}

			if (responseMessage) {
				try {
					let data = await webex.messages.create({
						roomId: room,
						...responseMessage
					});
					Logger.debug(data);
				} catch (e) {
					Logger.error(`[PmResponder.respond] Error in sending direct message: ${e.message}`);
				}
			}
		}
	} catch (e) {
		Logger.error(`[PmResponder.respond] Uncaught error in direct responder: ${e.message}`);
	}
};
