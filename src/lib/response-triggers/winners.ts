import Trigger from '../../models/trigger';
import constants from '../../constants';
import Config from '../config';
import __logger from '../logger';
import { MessageObject } from 'ciscospark/env';
import { Role } from '../../models/database';
import { WinnersService } from '../services/winners-service';
import { Command } from '../../models/command';

const winnersCommand = `(?: )*${Command.Winners}(?: )*`;

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
		let pattern = new RegExp('^' + constants.optionalMarkdownOpening + constants.mentionMe + winnersCommand, 'ui');
		return pattern.test(message.html);
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
