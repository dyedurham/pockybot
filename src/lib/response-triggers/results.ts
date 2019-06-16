import Trigger from '../../models/trigger';
import constants from '../../constants';
import Config from '../config-interface';
import __logger from '../logger';
import { MessageObject } from 'webex/env';
import { Role } from '../../models/database';
import { ResultsService } from '../services/results-service';
import { Command } from '../../models/command';

const resultsCommand = `(?: )*${Command.Results}(?: )*`;

export default class Results extends Trigger {
	private readonly cannotDisplayResults : string = 'Error encountered; cannot display results.';
	config : Config;
	resultsService: ResultsService;

	constructor(resultsService: ResultsService, config : Config) {
		super();

		this.resultsService = resultsService;
		this.config = config;
	}

	isToTriggerOn(message : MessageObject) : boolean {
		if (!(this.config.checkRole(message.personId, Role.Admin) || this.config.checkRole(message.personId, Role.Results))) {
			return false;
		}
		let pattern = new RegExp('^' + constants.optionalMarkdownOpening + constants.mentionMe + resultsCommand, 'ui');
		return pattern.test(message.html);
	}

	async createMessage() : Promise<MessageObject> {
		try {
			let response = await this.resultsService.returnResultsMarkdown();

			return {
				markdown: response
			};
		} catch (error) {
			__logger.error(`[Results.createMessage] Error obtaining results: ${error.message}`);
			throw new Error(this.cannotDisplayResults);
		}
	}
}
