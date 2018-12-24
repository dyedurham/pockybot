const constants = require(__base + `constants`);

const resetCommand = '(?: )*reset(?: )*';

module.exports = class reset {
	constructor(databaseService, config) {
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
