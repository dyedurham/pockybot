import Trigger from '../../models/trigger';
import constants from '../../constants';
import { PockyDB } from '../database/db-interfaces';
import Config from '../config';
import __logger from '../logger';
import { MessageObject } from 'ciscospark/env';
import { Role } from '../../models/database';
import { Command } from '../../models/command';
import xmlMessageParser from '../parsers/xmlMessageParser';

export default class Reset extends Trigger {
	database : PockyDB;
	config : Config;

	constructor(databaseService : PockyDB, config : Config) {
		super();

		this.database = databaseService
		this.config = config;
	}

	isToTriggerOn(message : MessageObject) : boolean {
		if (!(this.config.checkRole(message.personId, Role.Admin) || this.config.checkRole(message.personId, Role.Reset))) {
			return false;
		}

		let parsedMessage = xmlMessageParser.parseXmlMessage(message);
		return parsedMessage.length === 2 && parsedMessage[0].name() === 'spark-mention'
		&& xmlMessageParser.getPersonId(parsedMessage[0].attr('data-object-id').value()) === constants.botId
			&& parsedMessage[1].text().trim().toLowerCase() === Command.Reset;
	}

	async createMessage() : Promise<MessageObject> {
		try {
			await this.database.reset();
			return {
				markdown: `Pegs cleared`
			};
		} catch (e) {
			__logger.error(`[Reset.createMessage] Error clearing pegs: ${e.message}`);
			return {
				markdown: `Error clearing pegs`
			};
		}
	}
}
