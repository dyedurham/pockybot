/* NOTE: Import all triggers here
		 to be use as factory.
		 This will allow responder to just import one file
		 and manage it all from one file.
*/

// Triggers
const resultsService = require(__base + 'lib/response-triggers/results');
const winnersService = require(__base + 'lib/response-triggers/winners');
const resetService = require(__base + 'lib/response-triggers/reset');
const pegService = require(__base + 'lib/response-triggers/peg');
const unpegService = require(__base + 'lib/response-triggers/unpeg');
const statusService = require(__base + 'lib/response-triggers/status');
const updateService = require(__base + 'lib/response-triggers/update');
const finishService = require(__base + 'lib/response-triggers/finish');
const welcomeService = require(__base + 'lib/response-triggers/welcome');
const helpService = require(__base + 'lib/response-triggers/help');
const ping = require(__base + 'lib/response-triggers/ping');
const keywordsService = require(__base + 'lib/response-triggers/keywords');

// Services
const tableSizerService = require(__base + 'lib/TableSizeParser');
const spark = require(`ciscospark/env`);
const { Client } = require('pg');
const utilitiesService = require(__base + 'lib/utilities');
const configService = require(__base + 'lib/config');

const databaseService = require(__base + 'database/PockyDB');

// Service instantiation
const utilities = new utilitiesService();
const tableSizer = new tableSizerService();
const database = new databaseService(new Client(), spark);
const config = new configService(database);

database.loadConfig(config);
config.updateAll();

// Trigger instantiation
const peg = new pegService(spark, database, config);
const unpeg = new unpegService(spark, database, config, utilities);
const reset = new resetService(database, config);
const winners = new winnersService(database, tableSizer, config);
const results = new resultsService(spark, database, tableSizer, config);
const status = new statusService(spark, database, config);
const update = new updateService(spark, database, config);
const finish = new finishService(winners, results, reset, config);
const welcome = new welcomeService(config);
const keywords = new keywordsService(config);
const help = new helpService(config);

const triggers = [
	peg,
	welcome,
	help,
	ping,
	results,
	winners,
	reset,
	status,
	update,
	finish,
	unpeg,
	keywords,
	require(__base + 'lib/response-triggers/default'),
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
		const responder = triggers.find(x => x.isToTriggerOn(message));
		__logger.information(`Found a trigger: ${responder.name}`);
		return await responder.createMessage(message, room);
	} catch (e) {
		__logger.error(`Error selecting trigger:\n${e.message}`);
		return {
				markdown: 'An error occurred in selecting the trigger.',
		};
	}
};
