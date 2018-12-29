import spark, { MessageObject } from 'ciscospark/env';
import responseFactory from './response-triggers/index';
import __logger from './logger';

function respond(messageEvent) {
	try {
		spark.messages.get(messageEvent.data.id)
		.then((message : MessageObject) => {
			__logger.debug('processing message: ' + JSON.stringify(message));
			let room = message.roomId;
			return responseFactory(message, room)
			.then((responseMessage : MessageObject) => {
				__logger.information(responseMessage);
				return spark.messages.create(
					{
						roomId: room,
						...responseMessage
					})
				.then((data) => {
					__logger.debug(data);
				})
				.catch(function(e) {
					__logger.error(`Error in sending message:\n${e.message}`);
				});
			});
		})
		.catch(function(e) {
			__logger.error(`Error in responder:\n${e.message}`);
		});
	} catch (e) {
		__logger.error(`Uncaught error in responder:\n${e.message}`);
	}
};

export default {
	respond
}
