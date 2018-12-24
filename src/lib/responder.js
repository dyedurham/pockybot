const spark = require(`ciscospark/env`);
const responseFactory = require(__base + 'src/lib/response-triggers/index');

exports.respond = function(messageEvent) {
	try {
		spark.messages.get(messageEvent.data.id)
		.then(function(message) {
			__logger.debug("processing message: " + JSON.stringify(message));
			let room = message.roomId;
			return responseFactory(message, room)
			.then((responseMessage) => {
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
