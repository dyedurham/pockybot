import { MessageObject } from 'ciscospark/env';
const spark = require('ciscospark/env');
import responseFactory from './response-triggers/index';
import __logger from './logger';

async function respond(messageEvent : {data : {id : string}}) {
	try {		
		let message : MessageObject = await spark.messages.get(messageEvent.data.id);
		__logger.debug('processing message: ' + JSON.stringify(message));
		let room = message.roomId;

		if (message.personEmail.includes('@sparkbot.io') || message.personEmail.includes('@webex.bot')) {
			__logger.debug('Message was sent by a bot, ignoring this message.');
		}


		let responseMessage : MessageObject;
		try {
			responseMessage = await responseFactory(message, room);
		} catch (e) {
			__logger.error(`[Responder.respond] Error in responder: ${e.message}`);
		}

		if (responseMessage) {
			try {
				let data = await spark.messages.create({
					roomId: room,
					...responseMessage
				});
				__logger.debug(data);
			} catch (e) {
				__logger.error(`[Responder.respond] Error in sending message: ${e.message}`);
			}
		}
	} catch (e) {
		__logger.error(`[Responder.respond] Uncaught error in responder: ${e.message}`);
	}
};

export default {
	respond
}
