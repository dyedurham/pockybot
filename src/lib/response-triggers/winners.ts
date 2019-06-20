import Trigger from '../../models/trigger';
import constants from '../../constants';
import Config from '../config';
import { Logger } from '../logger';
import { MessageObject } from 'webex/env';
import { Role } from '../../models/database';
import { WinnersService } from '../services/winners-service';
import { Command } from '../../models/command';
import xmlMessageParser from '../parsers/xmlMessageParser';

export default class Results extends Trigger {
	readonly cannotDisplayResults : string = 'Error encountered; cannot display winners.';
	winnersService : WinnersService;
	config : Config;

	constructor(winnersService : WinnersService, config : Config) {
		super();

		this.winnersService = winnersService;
		this.config = config;
	}

	isToTriggerOn(message : MessageObject) : boolean {
		if (!(this.config.checkRole(message.personId, Role.Admin) || this.config.checkRole(message.personId, Role.Winners))) {
			return false;
		}

		let parsedMessage = xmlMessageParser.parseNonPegMessage(message);
		return parsedMessage.botId === constants.botId && parsedMessage.command.toLowerCase() === Command.Winners;
	}

	async createMessage() : Promise<MessageObject> {
		let response : string;
		try {
			response = await this.winnersService.returnWinnersResponse();
		} catch (error) {
			Logger.error(`[Winners.createMessage] Error retrieving winners response: ${error.message}`);
			throw new Error(this.cannotDisplayResults);
		}

		return {
			markdown: response
		}
	}
}
