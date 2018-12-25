import Trigger from './trigger';
import Config from '../config';
import constants from '../../constants';

export default class Keywords extends Trigger {
	readonly commandText : string = 'keywords';
	readonly keywordsCommand : string = `(?: )*${this.commandText}(?: )*`;

	config : Config;

	constructor(config) {
		super();

		this.config = config;
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
