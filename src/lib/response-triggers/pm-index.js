/* NOTE: Import all triggers here
		 to be use as factory.
		 This will allow responder to just import one file
		 and manage it all from one file.
*/

// Triggers
const statusService = require(__base + 'src/lib/response-triggers/status');
const welcomeService = require(__base + 'src/lib/response-triggers/welcome');
const helpService = require(__base + 'src/lib/response-triggers/help');
const ping = require(__base + 'src/lib/response-triggers/ping');
const keywordsService = require(__base + 'src/lib/response-triggers/keywords');

// Services
const spark = require(`ciscospark/env`);
const { Client } = require('pg');
const configService = require(__base + 'src/lib/config');

const databaseService = require(__base + 'src/database/PockyDB');

// Service instantiation
const database = new databaseService(new Client(), spark);
const config = new configService(database);

database.loadConfig(config);
config.updateAll();

// Trigger instantiation
const status = new statusService(spark, database, config);
const welcome = new welcomeService(config);
const keywords = new keywordsService(config);
const help = new helpService(config);

const triggers = [
	welcome,
	help,
	ping,
	status,
	keywords,
	require(__base + 'src/lib/response-triggers/default'),
];

/**
 * Returns a response Object that allows to create a message.
 * @param {string} message - message from room or user.
 * @param {string} room - the id of the room in which the message was received.
 * @return {SparkMessage} sparkMessage - use in conjunction with messages.create
 *                                       contains text or markdown field.
 */
module.exports = async (message, room) => {
	try {
		const responder = triggers.find(x => x.isToTriggerOnPM(message));
		__logger.information(`Found a direct trigger: ${responder.name}`);
		return await responder.createMessage(message, room);
	} catch (e) {
		__logger.error(`Error selecting direct trigger:\n${e.message}`);
		return {
			markdown: 'An error occurred in selecting the trigger.',
		};
	}
};
