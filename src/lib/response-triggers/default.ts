import Trigger from '../types/trigger';
import constants from '../../constants';
import { MessageObject } from 'ciscospark/env';

export default class Default extends Trigger {
	isToTriggerOn() : boolean {
		return true;
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
