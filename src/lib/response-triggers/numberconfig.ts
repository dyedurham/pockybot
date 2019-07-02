import Trigger from '../../models/trigger';
import Config from '../config-interface';
import constants from '../../constants';
import TableHelper from '../parsers/tableHelper';
import { MessageObject } from 'webex/env';
import { Role, ConfigRow } from '../../models/database';
import { ConfigAction } from '../../models/config-action';
import tableHelper from '../parsers/tableHelper';
import { Command } from '../../models/command';
import xmlMessageParser from '../parsers/xmlMessageParser';

export default class NumberConfig extends Trigger {
	config : Config;

	constructor(config : Config) {
		super();

		this.config = config;
	}

	isToTriggerOn(message : MessageObject) : boolean {
		if (!(this.config.checkRole(message.personId, Role.Admin) || this.config.checkRole(message.personId, Role.Config))) {
			return false;
		}

		let parsedMessage = xmlMessageParser.parseNonPegMessage(message);
		return parsedMessage.botId === constants.botId && parsedMessage.command.toLowerCase().startsWith(Command.NumberConfig);
	}

	async createMessage(message : MessageObject) : Promise<MessageObject> {
		let parsedMessage = xmlMessageParser.parseNonPegMessage(message);
		let words = parsedMessage.command.trim().split(' ').filter(x => x !== '');

		if (words.length < 2) {
			return { markdown: `Please specify a command. Possible values are ${Object.values(ConfigAction).join(', ')}` };
		}

		let newMessage : string;

		switch (words[1]) {
			case ConfigAction.Get:
				newMessage = this.getConfigMessage();
				break;
			case ConfigAction.Set:
				newMessage = NumberConfig.validateConfigActionSet(words);
				if(newMessage) break;

				const value = Number(words[3]);

				if(words[2] === 'minimum' && value > this.config.getConfig('limit')) {
					newMessage = 'Minimum pegs must be less than or equal to peg limit.';
					break;
				}

				await this.config.setConfig(words[2], value);
				newMessage = 'Config has been set';
				break;
			case ConfigAction.Refresh:
				await this.config.updateConfig();
				newMessage = 'Config has been updated';
				break;
			case ConfigAction.Delete:
				if (words.length < 3) {
					newMessage = 'You must specify a config to be deleted';
					break;
				}

				if (this.config.getConfig(words[2]) == null) {
					newMessage = `Config value "${words[2]}" does not exist`;
					break;
				}

				await this.config.deleteConfig(words[2]);
				newMessage = 'Config has been deleted';
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

		let columnWidths = tableHelper.getColumnWidths(
			numberConfig, [(x : ConfigRow) => x.name, (x : ConfigRow) => x.value.toString()], ['Name', 'Value']);

		let message = 'Here is the current config:\n```\n';

		message += TableHelper.padString('Name', columnWidths[0]) + ' | Value\n';
		message += ''.padEnd(columnWidths[0], '-') + '-+-' + ''.padEnd(columnWidths[1], '-') + '\n';

		numberConfig.forEach((config : ConfigRow) => {
			message += config.name.padEnd(columnWidths[0]) + ' | ' + config.value + '\n';
		});

		message += '```';

		return message;
	}

	private static validateConfigActionSet(words: string[]) : string {
		if (words.length < 4) {
			return 'You must specify a config name and value to set';
		}

		const value = Number(words[3]);

		if (isNaN(value)) {
			return 'Config must be set to a number';
		}

		if(value < 0) {
			return 'Config should be greater than or equal to 0.';
		}
		return null;
	}
}
