import Trigger from '../../models/trigger';
import constants from '../../constants';
import { PockyDB } from '../database/db-interfaces';
import Config from '../config-interface';
import { Logger } from '../logger';
import { MessageObject } from 'webex/env';
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

		let parsedMessage = xmlMessageParser.parseNonPegMessage(message);
		return parsedMessage.botId === constants.botId && parsedMessage.command.toLowerCase() === Command.Reset;
	}

	async createMessage() : Promise<MessageObject> {
		try {
			await this.database.reset();
			return {
				markdown: `Pegs cleared`
			};
		} catch (e) {
			Logger.error(`[Reset.createMessage] Error clearing pegs: ${e.message}`);
			return {
				markdown: `Error clearing pegs`
			};
		}
	}
}
