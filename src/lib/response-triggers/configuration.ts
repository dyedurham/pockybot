import Trigger from '../../models/trigger';
import Config from '../config';
import constants from '../../constants';
import TableHelper from '../parsers/tableHelper';
import { MessageObject } from 'ciscospark/env';
import { Role, StringConfigRow, ConfigRow } from '../../models/database';
import { ConfigAction } from '../../models/config-action';

export default class Keywords extends Trigger {
	readonly commandText : string = 'config';
	readonly keywordsCommand : string = `(?: )*${this.commandText}(?: )*`;

	config : Config;

	constructor(config : Config) {
		super();

		this.config = config;
	}

	isToTriggerOn(message : MessageObject) : boolean {
		if (!(this.config.checkRole(message.personId, Role.Admin) || this.config.checkRole(message.personId, Role.Config))) {
			return false;
		}
		let pattern = new RegExp('^' + constants.optionalMarkdownOpening + constants.mentionMe + this.keywordsCommand, 'ui');
		return pattern.test(message.html);
	}

	isToTriggerOnPM(message : MessageObject) : boolean {
		if (!(this.config.checkRole(message.personId, Role.Admin) || this.config.checkRole(message.personId, Role.Config))) {
			return false;
		}
		return message.text.toLowerCase().trim().startsWith(this.commandText);
	}

	async createMessage(message) : Promise<MessageObject> {

		message.text = message.text.toLowerCase();
		message.text = message.text.trim(message.text.indexOf(this.commandText.toLowerCase()))

		let words = message.text.split(' ');

		let newMessage;

		switch (words[1]) {
			case ConfigAction.Get:
				newMessage = this.getConfigMessage();
				break;
			case ConfigAction.Set:
				if (isNaN(words[3])) {
					this.config.setStringConfig(words[2], words[3]);
					newMessage = 'String config has been set';
				} else {
					this.config.setConfig(words[2], words[3]);
					newMessage = 'Config has been set';
				}
				break;
			case ConfigAction.Refresh:
				this.config.updateConfig();
				newMessage = 'Config has been updated';
				break;
			case ConfigAction.Delete:
				//TODO: this needs to be added to config and DB
				break;

			default:
				newMessage = 'Unknown config command';
				break;
		}

		return {
				markdown: newMessage
		};
	}

	private getConfigMessage() : string {
		const numberConfig = this.config.getAllConfig();
		const stringConfig = this.config.getAllStringConfig();

		let mappedConfig : StringConfigRow[] = numberConfig.map((value : ConfigRow) => {
			return {
				name: value.name,
				value: value.value.toString()
			}
		});

		mappedConfig = mappedConfig.concat(stringConfig);

		let columnWidths = this.getColumnWidths(mappedConfig);

		let message = 'Here is the current config:\n';

		message += TableHelper.padString('Name', columnWidths.name) + ' | Value\n';

		mappedConfig.forEach((config : StringConfigRow) => {
			message += config.name.padEnd(columnWidths.name) + ' | ' + config.value.padEnd(columnWidths.value) + '\n';
		});

		return message;
	} 

	private getColumnWidths(configValues : StringConfigRow[]) : { name : number, value : number } {
		const stringWidth = require('string-width');

		let longestname = stringWidth('name');
		let longestvalue = stringWidth('value');

		configValues.forEach((value : StringConfigRow) => {
			if (stringWidth(value.name) > longestname) {
				longestname = stringWidth(value.name);
			}
			
			if (stringWidth(value.value) > longestvalue) {
				longestvalue = stringWidth(value.value);
			}
		});

		return {
			name: longestname,
			value: longestvalue
		}
	}
}
