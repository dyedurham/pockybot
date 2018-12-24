/* NOTE: Import all triggers here
		 to be use as factory.
		 This will allow responder to just import one file
		 and manage it all from one file.
*/

import __logger from '../logger';

// Triggers
import Trigger from './trigger';
import Status from './status';
import Welcome from './welcome';
import Help from './help';
import Ping from './ping';
import Keywords from './keywords';
import Default from './default';

// Services
import spark from 'ciscospark/env';
import { Client } from 'pg';
import configService from '../config';

import PockyDB from '../../database/PockyDB';

// Service instantiation
const database = new PockyDB(new Client(), spark);
const config = new configService(database);

database.loadConfig(config);
config.updateAll();

// Trigger instantiation
const status = new Status(spark, database, config);
const welcome = new Welcome(config);
const keywords = new Keywords(config);
const help = new Help(config);
const ping = new Ping();
const defaultTrigger = new Default();

const triggers : Trigger[] = [
	welcome,
	help,
	ping,
	status,
	keywords,
	defaultTrigger
];

/**
 * Returns a response Object that allows to create a message.
 * @param {string} message - message from room or user.
 * @param {string} room - the id of the room in which the message was received.
 * @return {SparkMessage} sparkMessage - use in conjunction with messages.create
 *                                       contains text or markdown field.
 */
export default async (message, room) => {
	try {
		const responder = triggers.find(x => x.isToTriggerOnPM(message));
		__logger.information(`Found a direct trigger: ${responder.constructor.name}`);
		return await responder.createMessage(message, room);
	} catch (e) {
		__logger.error(`Error selecting direct trigger:\n${e.message}`);
		return {
			markdown: 'An error occurred in selecting the trigger.',
		};
	}
};
