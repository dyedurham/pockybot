import spark, { MessageObject } from 'ciscospark/env';
import constants from '../constants';
import responseFactory from './response-triggers/pm-index';
import __logger from './logger';

async function respond(messageEvent : any) {
	try {
		let message : MessageObject = await spark.messages.get(messageEvent.data.id);

		__logger.debug('processing message: ' + JSON.stringify(message));
		let room = message.roomId;

		if (message.personId !== constants.botId){
			let responseMessage : MessageObject;
			try {
				responseMessage = await responseFactory(message, room);
				__logger.information(responseMessage);
			} catch (e) {
				__logger.error(`Error in direct responder:\n${e.message}`);
			}

			if (responseMessage) {
				try {
					let data = await spark.messages.create({
						roomId: room,
						...responseMessage
					});
					__logger.debug(data);
				} catch (e) {
					__logger.error(`Error in sending direct message:\n${e.message}`);
				}
			}
		}
	} catch (e) {
		__logger.error(`Uncaught error in direct responder:\n${e.message}`);
	}
};

export default {
	respond
}
