import Trigger from '../../models/trigger';
import constants from '../../constants';
import Config from '../config';
import __logger from '../logger';
import { MessageObject } from 'ciscospark/env';
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

		let parsedMessage = xmlMessageParser.parseXmlMessage(message);
		return parsedMessage.length === 2 && parsedMessage[0].name() === 'spark-mention' && message.mentionedPeople[0] === constants.botId
			&& parsedMessage[1].text().trim().toLowerCase() === Command.Winners;
	}

	async createMessage() : Promise<MessageObject> {
		let response : string;
		try {
			response = await this.winnersService.returnWinnersResponse();
		} catch (error) {
			__logger.error(`[Winners.createMessage] Error retrieving winners response: ${error.message}`);
			throw new Error(this.cannotDisplayResults);
		}

		return {
			markdown: response
		}
	}
}
