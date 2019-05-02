import Trigger from '../../models/trigger';
import Config from '../config';
import constants from '../../constants';
import { MessageObject } from 'ciscospark/env';
import { Role } from '../../models/database';
import { ConfigAction } from '../../models/config-action';

export default class Help extends Trigger {
	readonly commandText : string = 'help';
	readonly helpCommand : string = `(?: )*${this.commandText}(?: )*`;

	config : Config;

	constructor(config : Config) {
		super();

		this.config = config;
	}

	isToTriggerOn(message : MessageObject) : boolean {
		let pattern = new RegExp('^' + constants.optionalMarkdownOpening + constants.mentionMe + this.helpCommand, 'ui');
		return pattern.test(message.html);
	}

	isToTriggerOnPM(message : MessageObject) : boolean {
		return message.text.toLowerCase().trim() === this.commandText;
	}

	async createMessage(message : MessageObject) : Promise<MessageObject> {
		let pattern = new RegExp('^' + constants.optionalMarkdownOpening + constants.mentionMe + this.helpCommand, 'ui');
		let patternEnd = new RegExp(constants.optionalMarkdownEnding + '$', 'ui');

		const command = message.text.trim().replace(pattern, '').replace(patternEnd, '').trim();
		let newMessage: string;

		if(!command) {
			newMessage = this.createCommandListMessage(message);
		} else {
			switch(command.toLowerCase()){
				case 'peg':
					newMessage = this.createPegHelpMessage();
					break;
				case 'status':
					newMessage = this.createStatusHelpMessage();
					break;
				case 'keywords':
					newMessage = this.createKeywordsHelpMessage();
					break;
				case 'ping':
					newMessage = this.createPingHelpMessage();
					break;
				case 'welcome':
					newMessage = this.createWelcomeHelpMessage();
					break;
				case 'winners':
					newMessage = this.createWinnersHelpMessage(message);
					break;
				case 'results':
					newMessage = this.createResultsHelpMessage(message);
					break;
				case 'reset':
					newMessage = this.createResetHelpMessage(message);
					break;
				case 'update':
					newMessage = this.createUpdateHelpMessage(message);
					break;
				case 'finish':
					newMessage = this.createFinishHelpMessage(message);
					break;
				case 'numberconfig':
					newMessage = this.createNumberConfigHelpMessage(message);
					break;
				case 'stringconfig':
					newMessage = this.createStringConfigHelpMessage(message);
					break;
				case 'roleconfig':
					newMessage = this.createRoleConfigHelpMessage(message);
					break;
				default:
					newMessage = this.createDefaultHelpMessage();
					break;
			}
		}

		return {
				markdown: newMessage
		}
	}

	createCommandListMessage(message: MessageObject) : string {
		let newMessage = `## What I can do (List of Commands)

* peg
* status
* keywords
* ping
* welcome\n`;

		if (this.config.checkRole(message.personId, Role.Admin) || this.config.checkRole(message.personId, Role.Winners)) {
			newMessage += `* winners\n`;
		}

		if (this.config.checkRole(message.personId, Role.Admin) || this.config.checkRole(message.personId, Role.Results)) {
			newMessage += `* results\n`;
		}

		if (this.config.checkRole(message.personId, Role.Admin) || this.config.checkRole(message.personId, Role.Reset)) {
			newMessage += `* reset\n`;
		}

		if (this.config.checkRole(message.personId, Role.Admin) || this.config.checkRole(message.personId, Role.Update)) {
			newMessage += `* update\n`;
		}

		if (this.config.checkRole(message.personId, Role.Admin) || this.config.checkRole(message.personId, Role.Finish)) {
			newMessage += `* finish\n`;
		}

		if (this.config.checkRole(message.personId, Role.Admin) || this.config.checkRole(message.personId, Role.Config)) {
			newMessage += `*numberconfig
* stringconfig
* roleconfig\n`;
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
1. To give someone a peg type: \`@${constants.botName} peg @bob {comment}\`.\n`;

		if (keywordsRequired) {
			newMessage += '1. Note that your comment MUST include a keyword.';
		}
		return newMessage;
	}

	createStatusHelpMessage() : string {
		return `### How to check your status 📈!
1. To get a PM type: \`@${constants.botName} status\` OR direct message me with \`status\`.
1. I will PM you number of pegs you have left and who you gave it to.`;
	}

	createKeywordsHelpMessage() : string {
		return `### How to check the available keywords 🔑!
1. To get a list of the available keywords, type: \`@${constants.botName} keywords\` OR direct message me with \`keywords\`.
1. I will respond in the room you messaged me in with a list of keywords.`;
	}

	createPingHelpMessage() : string {
		return `### How to ping me 🏓!
1. To check whether I'm alive, type: \`@${constants.botName} ping\` OR direct message me with \`ping\`.
1. I will respond in the room you messaged me in if I am alive.`;
	}

	createWelcomeHelpMessage() : string {
		return `### How to welcome someone 👐!
1. To get a welcome message from me, type \`@${constants.botName} welcome\` OR direct message me with \`welcome\`.
1. I will respond in the room you messaged me in.`;
	}

	createWinnersHelpMessage(message: MessageObject) : string {
		if (this.config.checkRole(message.personId, Role.Admin) || this.config.checkRole(message.personId, Role.Winners)){
			return `### How to display the winners 🏆!
1. To display winners, type \`@${constants.botName} winners\`.
1. I will respond in the room you messaged me in.`;
		} else {
			return this.createDefaultHelpMessage();
		}
	}

	createResultsHelpMessage(message: MessageObject) : string {
		if (this.config.checkRole(message.personId, Role.Admin) || this.config.checkRole(message.personId, Role.Results)) {
			return `### How to display the results 📃!
1. To display results, type \`@${constants.botName} results\`.
1. I will respond in the room you messaged me in.`;
		} else {
			return this.createDefaultHelpMessage();
		}
	}

	createResetHelpMessage(message: MessageObject) : string {
		if (this.config.checkRole(message.personId, Role.Admin) || this.config.checkRole(message.personId, Role.Reset)) {
			return `### How to reset all pegs 🙅!
1. To clear all pegs, type \`@${constants.botName} reset\`.
1. I will respond in the room you messaged me in.`;
		} else {
			return this.createDefaultHelpMessage();
		}
	}

	createUpdateHelpMessage(message: MessageObject) : string {
		if (this.config.checkRole(message.personId, Role.Admin) || this.config.checkRole(message.personId, Role.Update)) {
			return `### How to update names 📛!
1. To update user names with users' current display names, type \`@${constants.botName} update\`.
1. I will respond in the room you messaged me in.`;
		} else {
			return this.createDefaultHelpMessage();
		}
	}

	createFinishHelpMessage(message: MessageObject) : string {
		if (this.config.checkRole(message.personId, Role.Admin) || this.config.checkRole(message.personId, Role.Finish)) {
			return `### How to complete the cycle 🚲!
1. To display winners and results and clear the database, type \`@${constants.botName} finish\`.
1. I will respond in the room you messaged me in.`;
		} else {
			return this.createDefaultHelpMessage();
		}
	}

	createNumberConfigHelpMessage(message: MessageObject) : string {
		if (this.config.checkRole(message.personId, Role.Admin) || this.config.checkRole(message.personId, Role.Config)) {
			return `### How to configure number config values 🔢!
1. To get/edit/refresh/delete number config values, type \`@${constants.botName} numberconfig ${Object.values(ConfigAction).join('|')} {name} {number}\`
1. I will respond in the room you messaged me in.`;
		} else {
			return this.createDefaultHelpMessage();
		}
	}

	createStringConfigHelpMessage(message: MessageObject) : string {
		if (this.config.checkRole(message.personId, Role.Admin) || this.config.checkRole(message.personId, Role.Config)) {
			return `### How to configure string config values 🎻!
1. To get/edit/refresh/delete string config values, type \`@${constants.botName} stringconfig ${Object.values(ConfigAction).join('|')} {name} {value}\`
1. I will respond in the room you messaged me in.`;
		} else {
			return this.createDefaultHelpMessage();
		}
	}

	createRoleConfigHelpMessage(message: MessageObject) : string {
		if (this.config.checkRole(message.personId, Role.Admin) || this.config.checkRole(message.personId, Role.Config)) {
			return `### How to configure role config values 🗞️!
	1. To get/edit/refresh/delete user roles, type \`@${constants.botName} roleconfig ${Object.values(ConfigAction).join('|')} {@User} {role}\`
	1. I will respond in the room you messaged me in.`;
		} else {
			return this.createDefaultHelpMessage();
		}
	}
}
