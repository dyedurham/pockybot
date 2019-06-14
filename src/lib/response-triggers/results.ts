import Trigger from '../../models/trigger';
import constants from '../../constants';
import Config from '../config-interface';
import __logger from '../logger';
import { MessageObject } from 'ciscospark/env';
import { Role } from '../../models/database';
import { ResultsService } from '../services/results-service';
import { Command } from '../../models/command';
import xmlMessageParser from '../parsers/xmlMessageParser';

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

		let parsedMessage = xmlMessageParser.parseXmlMessage(message);
		return parsedMessage.length === 2 && parsedMessage[0].name() === 'spark-mention'
		&& xmlMessageParser.getPersonId(parsedMessage[0].attr('data-object-id').value()) === constants.botId
			&& parsedMessage[1].text().trim().toLowerCase() === Command.Results;
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
