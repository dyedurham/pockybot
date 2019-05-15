import Trigger from '../../models/trigger';
import constants from '../../constants';
import { MessageObject } from 'ciscospark/env';

export default class Default extends Trigger {
	isToTriggerOn(message : MessageObject) : boolean {
		let pattern = new RegExp('^' + constants.optionalMarkdownOpening + constants.mentionMe + 'ui');
		return pattern.test(message.html);
	}

	isToTriggerOnPM() : boolean {
		return true;
	}

	async createMessage() : Promise<MessageObject> {
		return {
				markdown:
`## I'm sorry, I didn't understand that, here's what I can do:
1. To give someone a peg type: \`@${constants.botName} peg @bob {comment}\`.
1. For a full list of commands type \`@${constants.botName} help\`.

I am still being worked on, so [more features to come : )] (${constants.todoUrl})` };
	}
};
