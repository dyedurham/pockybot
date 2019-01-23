import Trigger from '../../models/trigger';
import Config from '../config';
import constants from '../../constants';
import TableHelper from '../parsers/tableHelper';
import { MessageObject } from 'ciscospark/env';
import { Role, RolesRow } from '../../models/database';
import { ConfigAction } from '../../models/config-action';

export default class RoleConfig extends Trigger {
	readonly commandText : string = 'roleconfig';
	readonly roleConfigCommand : string = `(?: )*${this.commandText}(?: )*`;

	config : Config;

	constructor(config : Config) {
		super();

		this.config = config;
	}

	isToTriggerOn(message : MessageObject) : boolean {
		if (!(this.config.checkRole(message.personId, Role.Admin) || this.config.checkRole(message.personId, Role.Config))) {
			return false;
		}
		let pattern = new RegExp('^' + constants.optionalMarkdownOpening + constants.mentionMe + this.roleConfigCommand, 'ui');
		return pattern.test(message.html);
	}

	isToTriggerOnPM(message : MessageObject) : boolean {
		if (!(this.config.checkRole(message.personId, Role.Admin) || this.config.checkRole(message.personId, Role.Config))) {
			return false;
		}
		return message.text.toLowerCase().trim().startsWith(this.commandText);
	}

	async createMessage(message : MessageObject) : Promise<MessageObject> {
		message.text = message.text.toLowerCase();
		message.text = message.text.trim();

		let words = message.text.split(' ');

		let newMessage : string;

		if (words.length < 2) {
			return { markdown: `Please specify a command. Possible values are ${Object.values(ConfigAction).join(', ')}` };
		}

		switch (words[1]) {
			case ConfigAction.Get:
				newMessage = this.getConfigMessage();
				break;
			case ConfigAction.Set:
				if (words.length < 4) {
					newMessage = 'You must specify a user and a role to set.';
					break;
				}

				words[3] = words[3].toUpperCase();
				if (!Object.values(Role).includes(words[3])) {
					newMessage = `Invalid role. Valid values are: ${Object.values(Role).join(', ')}`;
					break;
				}

				this.config.setRole(words[2], words[3] as Role);
				newMessage = 'Role has been set';
				break;
			case ConfigAction.Refresh:
				this.config.updateRoles();
				newMessage = 'Roles has been updated';
				break;
			case ConfigAction.Delete:
				if (words.length < 4) {
					newMessage = 'You must specify a user and a role to be deleted';
					break;
				}

				words[3] = words[3].toUpperCase();
				if (!Object.values(Role).includes(words[3])) {
					newMessage = `Invalid role. Valid values are: ${Object.values(Role).join(', ')}`;
					break;
				}

				// TODO check config exists first
				this.config.deleteRole(words[2], words[3] as Role);
				newMessage = 'Role has been deleted';
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
		const roles = this.config.getAllRoles();

		let columnWidths = this.getColumnWidths(roles);

		let message = 'Here is the current config:\n';

		message += TableHelper.padString('Name', columnWidths.name) + ' | Value\n';

		roles.forEach((config : RolesRow) => {
			message += config.role.padEnd(columnWidths.name) + ' | ' + config.userid + '\n';
		});

		return message;
	}

	private getColumnWidths(configValues : RolesRow[]) : { name : number, value : number } {
		const stringWidth = require('string-width');

		let longestname = stringWidth('name');
		let longestvalue = stringWidth('value');

		configValues.forEach((value : RolesRow) => {
			if (stringWidth(value.role) > longestname) {
				longestname = stringWidth(value.role);
			}

			if (stringWidth(value.userid) > longestvalue) {
				longestvalue = stringWidth(value.userid);
			}
		});

		return {
			name: longestname,
			value: longestvalue
		}
	}
}
