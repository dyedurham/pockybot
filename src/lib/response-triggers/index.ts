/* NOTE: Import all triggers here
		 to be use as factory.
		 This will allow responder to just import one file
		 and manage it all from one file.
*/

import __logger from '../logger';

// Triggers
import Trigger from '../../models/trigger';
import Results from './results';
import Winners from './winners';
import Reset from './reset';
import Peg from './peg';
import Unpeg from './unpeg';
import Status from './status';
import Update from './update';
import Finish from './finish';
import Welcome from './welcome';
import Help from './help';
import Ping from './ping';
import Keywords from './keywords';
import Configuration from './configuration';
import Default from './default';

// Services
import { MessageObject } from 'ciscospark/env';
const spark = require("ciscospark/env");
import { Client } from 'pg';
import Utilities from '../utilities';
import Config from '../config';

import PockyDB from '../PockyDB';

// Service instantiation
const utilities = new Utilities();
const database = new PockyDB(new Client(), spark);
const config = new Config(database);

database.loadConfig(config);
config.updateAll();

// Trigger instantiation
const peg = new Peg(spark, database, config);
const unpeg = new Unpeg(spark, database, utilities);
const reset = new Reset(database, config);
const winners = new Winners(database, config);
const results = new Results(spark, database, config);
const status = new Status(spark, database, config);
const update = new Update(spark, database, config);
const finish = new Finish(winners, results, reset, config);
const welcome = new Welcome(config);
const keywords = new Keywords(config);
const configuration = new Keywords(config);
const help = new Help(config);
const ping = new Ping();
const defaultTrigger = new Default();

const triggers : Trigger[] = [
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
	configuration,
	defaultTrigger,
];

/**
 * Returns a response Object that allows to create a message.
 * @param {string} message - message from room or user.
 * @param {string} room - the id of the room in which the message was received.
 * @return {SparkMessage} sparkMessage - use in conjunction with messages.create
 *                                       contains text or markdown field.
 */
export default async (message : MessageObject, room : string) => {
	try {
		const responder : Trigger = triggers.find(x => x.isToTriggerOn(message));
		__logger.information(`Found a trigger: ${responder.constructor.name}`);
		return await responder.createMessage(message, room);
	} catch (e) {
		__logger.error(`Error selecting trigger:\n${e.message}`);
		return {
				markdown: 'An error occurred in selecting the trigger.',
		};
	}
};
