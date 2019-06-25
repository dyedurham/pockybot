import Trigger from '../../models/trigger';
import Config from '../config-interface';
import constants from '../../constants';
import { MessageObject } from 'webex/env';
import { Role } from '../../models/database';
import { ConfigAction } from '../../models/config-action';
import { Command } from '../../models/command';
import xmlMessageParser from '../parsers/xmlMessageParser';
import { LocationAction } from '../../models/location-action';

export default class Help extends Trigger {
	readonly helpCommand : string = `(?: )*${Command.Help}(?: )*`;

	config : Config;

	constructor(config : Config) {
		super();

		this.config = config;
	}

	isToTriggerOn(message : MessageObject) : boolean {
		let parsedMessage = xmlMessageParser.parseNonPegMessage(message);
		return parsedMessage.botId === constants.botId && parsedMessage.command.toLowerCase().startsWith(Command.Help);
	}

	isToTriggerOnPM(message : MessageObject) : boolean {
		return message.text.toLowerCase().trim().startsWith(Command.Help);
	}

	async createMessage(message : MessageObject) : Promise<MessageObject> {
		const pattern = new RegExp('^@?' + constants.botName, 'ui');
		const helpPattern = new RegExp('^' + this.helpCommand, 'ui');
		const command = message.text.trim().replace(pattern, '').trim().replace(helpPattern, '').trim();
		const newMessage = this.createHelpResponseMessage(message, command);

		return {
				markdown: newMessage
		};
	}

	createHelpResponseMessage(message: MessageObject, command: string) : string {
		if (!command) {
			return this.createCommandListMessage(message);
		}

		switch (command.toLowerCase()) {
			case Command.Peg:
				return this.createPegHelpMessage();
			case Command.Status:
				return this.createStatusHelpMessage();
			case Command.Keywords:
				return this.createKeywordsHelpMessage();
			case Command.Ping:
				return this.createPingHelpMessage();
			case Command.Welcome:
				return this.createWelcomeHelpMessage();
			case Command.Rotation:
				return this.createRotationHelpMessage();
			case Command.Winners:
				return this.createWinnersHelpMessage(message);
			case Command.Results:
				return this.createResultsHelpMessage(message);
			case Command.Reset:
				return this.createResetHelpMessage(message);
			case Command.Update:
				return this.createUpdateHelpMessage(message);
			case Command.Finish:
				return this.createFinishHelpMessage(message);
			case Command.NumberConfig:
				return this.createNumberConfigHelpMessage(message);
			case Command.StringConfig:
				return this.createStringConfigHelpMessage(message);
			case Command.RoleConfig:
				return this.createRoleConfigHelpMessage(message);
			case Command.LocationConfig:
				return this.createLocationConfigHelpMessage(message);
			case Command.UserLocation:
				return this.createUserLocationHelpMessage(message);
			case Command.RemoveUser:
				return this.createRemoveUserHelpMessage(message);
			default:
				return this.createDefaultHelpMessage();
		}
	}

	createCommandListMessage(message: MessageObject) : string {
		let newMessage = `## What I can do (List of Commands)

* ${Command.Peg}
* ${Command.Status}
* ${Command.Keywords}
* ${Command.Ping}
* ${Command.Welcome}
* ${Command.Rotation}
* ${Command.LocationConfig}
* ${Command.UserLocation}\n`;

		if (this.config.checkRole(message.personId, Role.Admin) || this.config.checkRole(message.personId, Role.Winners)) {
			newMessage += `* ${Command.Winners}\n`;
		}

		if (this.config.checkRole(message.personId, Role.Admin) || this.config.checkRole(message.personId, Role.Results)) {
			newMessage += `* ${Command.Results}\n`;
		}

		if (this.config.checkRole(message.personId, Role.Admin) || this.config.checkRole(message.personId, Role.Reset)) {
			newMessage += `* ${Command.Reset}\n`;
		}

		if (this.config.checkRole(message.personId, Role.Admin) || this.config.checkRole(message.personId, Role.Update)) {
			newMessage += `* ${Command.Update}\n`;
		}

		if (this.config.checkRole(message.personId, Role.Admin) || this.config.checkRole(message.personId, Role.Finish)) {
			newMessage += `* ${Command.Finish}\n`;
		}

		if (this.config.checkRole(message.personId, Role.Admin) || this.config.checkRole(message.personId, Role.Config)) {
			newMessage += `* ${Command.NumberConfig}
* ${Command.StringConfig}
* ${Command.RoleConfig}\n`;
		}

		if (this.config.checkRole(message.personId, Role.Admin) || this.config.checkRole(message.personId, Role.RemoveUser)) {
			newMessage += `* ${Command.RemoveUser}\n`;
		}

		newMessage += `\nFor more information on a command type \`@${constants.botName} help command-name\` or direct message me with \`help command-name\`\n`;
		newMessage += `\nI am still being worked on, so [more features to come : )] (${constants.todoUrl})`;

		return newMessage;
	}

	createDefaultHelpMessage() : string {
		return `Command not found. To see a full list of commands type \`@${constants.botName} help\` or direct message me with \`help\`.`;
	}

	createPegHelpMessage() : string {
		let keywordsRequired = this.config.getConfig('requireValues');
		let newMessage = `### How to give a peg 🎁!
1. To give someone a peg type: \`@${constants.botName} ${Command.Peg} @bob {comment}\`.\n`;

		if (keywordsRequired) {
			newMessage += '1. Note that your comment MUST include a keyword.';
		}
		return newMessage;
	}

	createStatusHelpMessage() : string {
		return `### How to check your status 📈!
1. To get a PM type: \`@${constants.botName} ${Command.Status}\` OR direct message me with \`${Command.Status}\`.
1. I will PM you number of pegs you have left and who you gave it to.`;
	}

	createKeywordsHelpMessage() : string {
		return `### How to check the available keywords 🔑!
1. To get a list of the available keywords, type: \`@${constants.botName} ${Command.Keywords}\` OR direct message me with \`${Command.Keywords}\`.
1. I will respond in the room you messaged me in with a list of keywords.`;
	}

	createPingHelpMessage() : string {
		return `### How to ping me 🏓!
1. To check whether I'm alive, type: \`@${constants.botName} ${Command.Ping}\` OR direct message me with \`${Command.Ping}\`.
1. I will respond in the room you messaged me in if I am alive.`;
	}

	createWelcomeHelpMessage() : string {
		return `### How to welcome someone 👐!
1. To get a welcome message from me, type \`@${constants.botName} ${Command.Welcome}\` OR direct message me with \`${Command.Welcome}\`.
1. I will respond in the room you messaged me in.`;
	}

	createRotationHelpMessage() : string {
		return `### How to check the rotation!
1. To check the rotation of teams responsible for buying snacks, type \`@${constants.botName} ${Command.Rotation}\` OR direct message me with \`${Command.Rotation}\`.
1. I will respond in the room you messaged me in.\n`;
	}

	createWinnersHelpMessage(message: MessageObject) : string {
		if (this.config.checkRole(message.personId, Role.Admin) || this.config.checkRole(message.personId, Role.Winners)){
			return `### How to display the winners 🏆!
1. To display winners, type \`@${constants.botName} ${Command.Winners}\`.
1. I will respond in the room you messaged me in.`;
		} else {
			return this.createDefaultHelpMessage();
		}
	}

	createResultsHelpMessage(message: MessageObject) : string {
		if (this.config.checkRole(message.personId, Role.Admin) || this.config.checkRole(message.personId, Role.Results)) {
			return `### How to display the results 📃!
1. To display results, type \`@${constants.botName} ${Command.Results}\`.
1. I will respond in the room you messaged me in.`;
		} else {
			return this.createDefaultHelpMessage();
		}
	}

	createResetHelpMessage(message: MessageObject) : string {
		if (this.config.checkRole(message.personId, Role.Admin) || this.config.checkRole(message.personId, Role.Reset)) {
			return `### How to reset all pegs 🙅!
1. To clear all pegs, type \`@${constants.botName} ${Command.Reset}\`.
1. I will respond in the room you messaged me in.`;
		} else {
			return this.createDefaultHelpMessage();
		}
	}

	createUpdateHelpMessage(message: MessageObject) : string {
		if (this.config.checkRole(message.personId, Role.Admin) || this.config.checkRole(message.personId, Role.Update)) {
			return `### How to update names 📛!
1. To update user names with users' current display names, type \`@${constants.botName} ${Command.Update}\`.
1. I will respond in the room you messaged me in.`;
		} else {
			return this.createDefaultHelpMessage();
		}
	}

	createFinishHelpMessage(message: MessageObject) : string {
		if (this.config.checkRole(message.personId, Role.Admin) || this.config.checkRole(message.personId, Role.Finish)) {
			return `### How to complete the cycle 🚲!
1. To display winners and results and clear the database, type \`@${constants.botName} ${Command.Finish}\`.
1. I will respond in the room you messaged me in.`;
		} else {
			return this.createDefaultHelpMessage();
		}
	}

	createNumberConfigHelpMessage(message: MessageObject) : string {
		if (this.config.checkRole(message.personId, Role.Admin) || this.config.checkRole(message.personId, Role.Config)) {
			return `### How to configure number config values 🔢!
1. To get/edit/refresh/delete number config values, type \`@${constants.botName} ${Command.NumberConfig} ${Object.values(ConfigAction).join('|')} {name} {number}\`
1. I will respond in the room you messaged me in.`;
		} else {
			return this.createDefaultHelpMessage();
		}
	}

	createStringConfigHelpMessage(message: MessageObject) : string {
		if (this.config.checkRole(message.personId, Role.Admin) || this.config.checkRole(message.personId, Role.Config)) {
			return `### How to configure string config values 🎻!
1. To get/edit/refresh/delete string config values, type \`@${constants.botName} ${Command.StringConfig} ${Object.values(ConfigAction).join('|')} {name} {value}\`
1. I will respond in the room you messaged me in.`;
		} else {
			return this.createDefaultHelpMessage();
		}
	}

	createRoleConfigHelpMessage(message: MessageObject) : string {
		if (this.config.checkRole(message.personId, Role.Admin) || this.config.checkRole(message.personId, Role.Config)) {
			return `### How to configure role config values 🗞️!
1. To get/edit/refresh/delete user roles, type \`@${constants.botName} ${Command.RoleConfig} ${Object.values(ConfigAction).join('|')} {@User} {role}\`
1. I will respond in the room you messaged me in.`;
		} else {
			return this.createDefaultHelpMessage();
		}
	}

	createLocationConfigHelpMessage(message: MessageObject) : string {
		if (this.config.checkRole(message.personId, Role.Admin) || this.config.checkRole(message.personId, Role.Config)) {
			return `### How to configure location config values!
1. To get/edit/delete locations, type \`@${constants.botName} ${Command.LocationConfig} ${Object.values(LocationAction).join('|')} {location}\`
1. I will respond in the room you messaged me in.`;
		} else {
			return `### How to get location values!
1. To get a list of locations, type \'@${constants.botName} ${Command.LocationConfig} ${LocationAction.Get}\`
    * To configure locations, please ask an admin.
1. I will respond in the room you messaged me in.`
		}
	}

	createUserLocationHelpMessage(message: MessageObject) : string {
		if (this.config.checkRole(message.personId, Role.Admin) || this.config.checkRole(message.personId, Role.UserLocation)) {
			return `### How to configure user location values!
1. To get user locations for yourself or others, type \'@${constants.botName} ${Command.UserLocation} ${LocationAction.Get} me|all|unset|@User\`
1. To set user locations, type \'@${constants.botName} ${Command.UserLocation} ${LocationAction.Set} {location} me|@User1 @User2\`
1. To delete user locations, type \'@${constants.botName} ${Command.UserLocation} ${LocationAction.Delete} me|@User1 @User2\`
1. I will respond in the room you messaged me in.`
		} else {
			return `### How to config your user location value!
1. To get user locations for yourself or others, type \'@${constants.botName} ${Command.UserLocation} ${LocationAction.Get} me|all|unset|@User\`
1. To set your user location, type \'@${constants.botName} ${Command.UserLocation} ${LocationAction.Set} {location} me\`
	* To bulk configure user locations, please ask an admin.
1. To delete your user location, type \'@${constants.botName} ${Command.UserLocation} ${LocationAction.Delete} me\`
1. I will respond in the room you messaged me in.`
		}
	}

	createRemoveUserHelpMessage(message: MessageObject) : string {
		if (this.config.checkRole(message.personId, Role.Admin) || this.config.checkRole(message.personId, Role.RemoveUser)) {
			return `### How to remove users!
1. To remove a user, type \`@${constants.botName} ${Command.RemoveUser} {@User}|'{username}'\`
1. I will respond in the room you messaged me in.`;
		} else {
			return this.createDefaultHelpMessage();
		}
	}
}
