/* NOTE: Import all triggers here
		 to be use as factory.
		 This will allow responder to just import one file
		 and manage it all from one file.
*/

import __logger from '../logger';

// Triggers
import Trigger from '../../models/trigger';
import Status from './status';
import Welcome from './welcome';
import Help from './help';
import Ping from './ping';
import Keywords from './keywords';
import Rotation from './rotation';
import Default from './default';

// Services
import { MessageObject } from 'ciscospark/env';
const spark = require("ciscospark/env");
import { Client } from 'pg';
import configService from '../config';

import QueryHandler from '../database/query-handler';

import PockyDB from '../database/pocky-db';
import DbUsers from '../database/db-users';
import DbConfig from '../database/db-config';


// Service instantiation
const queryHandler = new QueryHandler(new Client());
const dbConfig = new DbConfig(queryHandler);
const dbUsers = new DbUsers(spark, queryHandler);
const database = new PockyDB(queryHandler, dbUsers);
const config = new configService(dbConfig);

database.loadConfig(config);
config.updateAll();

// Trigger instantiation
const status = new Status(spark, database, config);
const welcome = new Welcome(config);
const keywords = new Keywords(config);
const help = new Help(config);
const ping = new Ping();
const rotation = new Rotation(config);
const defaultTrigger = new Default();

const triggers : Trigger[] = [
	welcome,
	help,
	ping,
	status,
	keywords,
	rotation,
	defaultTrigger
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
		const responder : Trigger = triggers.find(x => x.isToTriggerOnPM(message));
		__logger.information(`Found a direct trigger: ${responder.constructor.name}`);
		return await responder.createMessage(message, room);
	} catch (e) {
		__logger.error(`Error selecting direct trigger:\n${e.message}`);
		return {
			markdown: 'An error occurred in selecting the trigger.',
		};
	}
};
