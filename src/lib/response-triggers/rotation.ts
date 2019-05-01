import Trigger from '../../models/trigger';
import constants from '../../constants';
import { MessageObject } from 'ciscospark/env';

export default class Rotation extends Trigger {
	readonly commandText : string = 'rotation';
	readonly rotationCommand : string = `(?: )*${this.commandText}(?: )*`;

	isToTriggerOn(message : MessageObject) : boolean {
		let pattern = new RegExp('^' + constants.optionalMarkdownOpening + constants.mentionMe + this.rotationCommand, 'ui');
		return pattern.test(message.html);
	}

	isToTriggerOnPM(message : MessageObject) : boolean {
		return message.text.toLowerCase().trim() === this.commandText;
	}

	async createMessage() : Promise<MessageObject> {
		return {
				markdown:
`## Here's the snack buying rotation:

* Valkyries
* Velociraptors
* Titans
* Thundercats
* Vikings
* Infrastructure
` };
	}
};
