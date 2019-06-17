import { MessageObject, PersonObject } from 'ciscospark/env';
const spark = require('ciscospark/env');
import responseFactory from './response-triggers/index';
import { Logger } from './logger';

export async function respond(messageEvent : {data : {id : string}}) {
	try {
		let message : MessageObject = await spark.messages.get(messageEvent.data.id);
		Logger.debug('processing message: ' + JSON.stringify(message));
		let room = message.roomId;

		let person : PersonObject = await spark.people.get(message.personId);
		if (person.type === 'bot') {
			Logger.debug('Message was sent by a bot, ignoring this message.');
			return;
		}

		let responseMessage : MessageObject;
		try {
			responseMessage = await responseFactory(message, room);
		} catch (e) {
			Logger.error(`[Responder.respond] Error in responder: ${e.message}`);
		}

		if (responseMessage) {
			try {
				let data = await spark.messages.create({
					roomId: room,
					...responseMessage
				});
				Logger.debug(data);
			} catch (e) {
				Logger.error(`[Responder.respond] Error in sending message: ${e.message}`);
			}
		}
	} catch (e) {
		Logger.error(`[Responder.respond] Uncaught error in responder: ${e.message}`);
	}
};
