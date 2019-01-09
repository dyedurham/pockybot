import Trigger from '../../models/trigger';
import Config from '../config';
import constants from '../../constants';
import { MessageObject } from 'ciscospark/env';
import { Role } from '../../models/database';

export default class Keywords extends Trigger {
	readonly commandText : string = 'Config';
	readonly keywordsCommand : string = `(?: )*${this.commandText}(?: )*`;

	config : Config;

	constructor(config : Config) {
		super();

		this.config = config;
	}

	isToTriggerOn(message : MessageObject) : boolean {
		if (!(this.config.checkRole(message.personId, Role.Admin) || this.config.checkRole(message.personId, Role.Winners))) {
			return false;
		}
		let pattern = new RegExp('^' + constants.optionalMarkdownOpening + constants.mentionMe + this.keywordsCommand, 'ui');
		return pattern.test(message.html);
	}

	isToTriggerOnPM(message : MessageObject) : boolean {
		if (!(this.config.checkRole(message.personId, Role.Admin) || this.config.checkRole(message.personId, Role.Winners))) {
			return false;
		}
		//TODO: this will need a better trigger
		return message.text.toLowerCase().trim() === this.commandText;
	}

	async createMessage(message) : Promise<MessageObject> {

		message.text = message.text.toLowerCase();
		message.text = message.text.trim(message.text.indexOf(this.commandText.toLowerCase()))

		let words = message.text.split(" ");

		let newMessage;

		switch (words[1]) {
			case "get":
				newMessage = this.config.getAllConfig();
				break;
			case "set":
				//TODO: check the syntrax
				this.config.setConfig(words[2], words[3]);
				newMessage = "Config has been set";
				break;
			case "update":
				this.config.updateConfig();
				newMessage = "Config has been updated";
				break;

			default:
				newMessage = "Unknown config command";
				break;
		}

		return {
				markdown: newMessage
		};
	}
}
