const spark = require(`ciscospark/env`);
const constants = require(__base + `constants`);
const responseFactory = require(__base + 'src/lib/response-triggers/pm-index');

exports.respond = function(messageEvent) {
	try {
		spark.messages.get(messageEvent.data.id)
		.then(function(message) {
			__logger.debug("processing message: " + JSON.stringify(message));
			let room = message.roomId;

			if(message.personId !== constants.botId){
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
						__logger.error(`Error in sending direct message:\n${e.message}`);
					});
				});
			}
		})
		.catch(function(e) {
			__logger.error(`Error in direct responder:\n${e.message}`);
		});
	} catch (e) {
		__logger.error(`Uncaught error in direct responder:\n${e.message}`);
	}
};
