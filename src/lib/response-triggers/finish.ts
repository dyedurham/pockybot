import Trigger from '../../models/trigger';
import Reset from './reset';
import Config from '../config';
import constants from '../../constants';
import __logger from '../logger';
import { MessageObject } from 'ciscospark/env';
import { Role } from '../../models/database';
import { PmResultsService } from '../services/pm-results-service';
import { ResultsService } from '../services/results-service';
import { WinnersService } from '../services/winners-service';

const finishCommand = '(?: )*finish(?: )*';

export default class Finish extends Trigger {
	winnersService: WinnersService;
	resultsService: ResultsService;
	pmResultsService: PmResultsService;
	reset : Reset;
	config : Config;

	constructor(winnersService : WinnersService, resultsService : ResultsService, pmResultsService: PmResultsService,
		resetService : Reset, config : Config) {
		super();

		this.winnersService = winnersService;
		this.resultsService = resultsService;
		this.pmResultsService = pmResultsService;
		this.reset = resetService;
		this.config = config;
	}

	isToTriggerOn(message : MessageObject) : boolean {
		if (!(this.config.checkRole(message.personId, Role.Admin) || this.config.checkRole(message.personId, Role.Finish))) {
			return false;
		}

		let pattern = new RegExp('^' + constants.optionalMarkdownOpening + constants.mentionMe + finishCommand, 'ui');
		return pattern.test(message.html);
	}

	async createMessage() : Promise<MessageObject> {
		let winnersMarkdown: string;
		let resultsMarkdown: string;

		const winnersPromise = this.winnersService.returnWinnersResponse();
		const resultsPromise = this.resultsService.returnResultsMarkdown();
		await Promise.all([winnersPromise, resultsPromise])
			.then(function(values) {
				winnersMarkdown = values[0];
				resultsMarkdown = values[1];
			}).catch(function(error){
				__logger.error(`Error returning winners or results:\n${error.message}`);
				return { markdown: `error returning winners or results` };
			});
		__logger.debug('Got winners and responses');

		try {
			await this.pmResultsService.pmResults();
		} catch(error) {
			__logger.error(`Error PMing results:\n${error.message}`);
			return { markdown: `error while trying to PM results` };
		}

		var reset = await this.reset.createMessage();

		let message = `## Winners\n\n` + winnersMarkdown + '\n\n';
		message += resultsMarkdown;
		message += '\n\n' + reset.markdown;
		return {
			markdown: message
		};
	}
}
