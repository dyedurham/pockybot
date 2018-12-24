import Trigger from './trigger';
import constants from '../../../constants';
import PockyDB from '../../database/PockyDB';
import Config from '../config';
import __logger from '../logger';

const resetCommand = '(?: )*reset(?: )*';

export default class Reset extends Trigger {
	database : PockyDB;
	config : Config;

	constructor(databaseService, config) {
		super();

		this.database = databaseService
		this.config = config;
	}

	isToTriggerOn(message) {
		if (!(this.config.checkRole(message.personId,'admin') || this.config.checkRole(message.personId,'reset'))) {
			return false;
		}

		var pattern = new RegExp('^' + constants.optionalMarkdownOpening + constants.mentionMe + resetCommand, 'ui');
		return pattern.test(message.html);
	}

	async createMessage() {
		let data;
		try {
			data = await this.database.returnResults();
		} catch (error) {
			__logger.error(`Error getting results:\n${error.message}`);
			return {
				markdown: `Error clearing pegs`
			};
		}

		__logger.debug("About to reset pegs, current state: " + JSON.stringify(data));
		try {
			await this.database.reset();
			return {
				markdown: `Pegs cleared`
			};
		} catch (e) {
			__logger.error(`Error clearing pegs:\n${e.message}`);
			return {
				markdown: `Error clearing pegs`
			};
		}
	}
}
