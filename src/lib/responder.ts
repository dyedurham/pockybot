import { MessageObject } from 'ciscospark/env';
const spark = require('ciscospark/env');
import responseFactory from './response-triggers/index';
import __logger from './logger';

async function respond(messageEvent : {data : {id : string}}) {
	try {
		let message : MessageObject = await spark.messages.get(messageEvent.data.id);
		__logger.debug('processing message: ' + JSON.stringify(message));
		let room = message.roomId;

		let responseMessage : MessageObject;
		try {
			responseMessage = await responseFactory(message, room);
		} catch (e) {
			__logger.error(`Error in responder:\n${e.message}`);
		}

		if (responseMessage) {
			try {
				let data = await spark.messages.create({
					roomId: room,
					...responseMessage
				});
				__logger.debug(data);
			} catch (e) {
				__logger.error(`Error in sending message:\n${e.message}`);
			}
		}
	} catch (e) {
		__logger.error(`Uncaught error in responder:\n${e.message}`);
	}
};

export default {
	respond
}
