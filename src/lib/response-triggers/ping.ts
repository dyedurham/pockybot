import constants from '../../../constants';
import Trigger from './trigger';

const commandText = 'ping';
const pingCommand = `(?: )*${commandText}(?: )*`;

export default class Ping extends Trigger {
	isToTriggerOn(message : any) {
		var pattern = new RegExp('^' + constants.optionalMarkdownOpening + constants.mentionMe + pingCommand, 'ui');
		return pattern.test(message.html);
	}

	isToTriggerOnPM(message : any) {
		return message.text.toLowerCase().trim() === commandText;
	}

	async createMessage() {
		return {
			markdown: `pong. I'm alive!`
		};
	}
}
