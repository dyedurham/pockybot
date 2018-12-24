import Trigger from './trigger';
import constants from '../../../constants';

export default class Default extends Trigger {
	isToTriggerOn(message) {
		return true;
	}

	isToTriggerOnPM(message) {
		return true;
	}

	async createMessage() {
		return {
				markdown:
`## I'm sorry, I didn't understand that, here's what I can do:
1. To give someone a peg type: \`@${constants.botName} peg @bob {comment}\`.
1. For a full list of commands type \`@${constants.botName} help\`.

I am still being worked on, so [more features to come : )] (${constants.todoUrl})` };
	}
};
