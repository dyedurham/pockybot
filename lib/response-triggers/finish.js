const constants = require(__base + `constants`);

const finishCommand = '(?: )*finish(?: )*';

module.exports = class finish {
	constructor(winnersService, resultsService, resetService, config) {
		this.winners = winnersService;
		this.results = resultsService;
		this.reset = resetService;
		this.config = config;
	}

	isToTriggerOn(message) {
		if (!(this.config.checkRole(message.personId,'admin') || this.config.checkRole(message.personId,'finish'))) {
			return false;
		}

		var pattern = new RegExp('^' + constants.optionalMarkdownOpening + constants.mentionMe + finishCommand, 'ui');
		return pattern.test(message.html);
	}

	async createMessage() {
		var winnersPromise = this.winners.createMessage();
		var resultsPromise = this.results.createMessage();
		__logger.debug("Finish promises created");

		return Promise.all([winnersPromise, resultsPromise])
		.then((values) => {
			__logger.information("Winners and Results promises executed");
			return this.reset.createMessage()
			.then((data) => {
				__logger.information("Reset promise executed");
				var message = `## Winners\n\n` + values[0].markdown + '\n\n';
				message += 'All pegs given out this fortnight can be found in the attached file.';
				message += '\n\n' + data.markdown;
				return {
					markdown: message,
					files: values[1].files
				};
			}).catch((error) => {
				__logger.error(`Error clearing pegs:\n${error.message}`);
				return {
					markdown: `error clearing pegs`
				};
			});
		}).catch((error) => {
			__logger.error(`Error returning winners or results:\n${error.message}`);
			return {
				markdown: `error returning winners or results`
			};
		});
	}
}
