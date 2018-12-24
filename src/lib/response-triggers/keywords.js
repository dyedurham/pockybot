const constants = require(__base + `constants`);

module.exports = class keywords {
	constructor(config) {
		this.config = config;

		this.commandText = 'keywords';
		this.keywordsCommand = `(?: )*${this.commandText}(?: )*`;
	}

	isToTriggerOn(message) {
		var pattern = new RegExp('^' + constants.optionalMarkdownOpening + constants.mentionMe + this.keywordsCommand, 'ui');
		return pattern.test(message.html);
	}

	isToTriggerOnPM(message) {
		return message.text.toLowerCase().trim() === this.commandText;
	}

	async createMessage() {
		let message = '## Here is the list of possible keywords to include in your message\n\n';

		this.config.getStringConfig('keyword').forEach(item => {
			message += `* ${item}\n`;
		});

		return {
				markdown: message
		};
	}
}
