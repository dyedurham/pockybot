import Trigger from '../../models/trigger';
import Config from '../config-interface';
import { MessageObject } from 'webex/env';
import { Role } from '../../models/database';
import { Command } from '../../models/command';
import constants from '../../constants';
import xmlMessageParser from '../parsers/xmlMessageParser';
import { LocationAction } from '../../models/location-action';
import { Argument } from '../../models/argument';
import { Logger } from '../logger';
import { GetUserLocationService } from '../services/get-user-location-service';
import { SetUserLocationService } from '../services/set-user-location-service';
import { DeleteUserLocationService } from '../services/delete-user-location-service';

export default class UserLocation extends Trigger {
	unknownCommandMessage = `Unknown command. Possible values are ${Object.values(LocationAction).join(', ')}`;

	config : Config;
	getUserLocationService : GetUserLocationService;
	setUserLocationService : SetUserLocationService;
	deleteUserLocationService : DeleteUserLocationService;

	constructor(config : Config, getUserLocationService : GetUserLocationService,
			setUserLocationService : SetUserLocationService, deleteUserLocationService : DeleteUserLocationService) {
		super();

		this.config = config;
		this.getUserLocationService = getUserLocationService;
		this.setUserLocationService = setUserLocationService;
		this.deleteUserLocationService = deleteUserLocationService;
	}

	isToTriggerOn(message : MessageObject) : boolean {
		let parsedMessage = xmlMessageParser.parseNonPegMessage(message);
		return parsedMessage.botId === constants.botId && parsedMessage.command.toLowerCase().startsWith(Command.UserLocation);
	}

	async createMessage(message : MessageObject) : Promise<MessageObject> {
		let args : Argument[];
		try {
			args = xmlMessageParser.parseOutArgs(message);
		} catch(error) {
			Logger.error(`[UserLocation.createMessage] Error parsing args: ${error.message}`);
			return { markdown: `Error parsing request: ${error.message}` };
		}

		if (args.length < 3 || args[2].isMention) {
			return { markdown: `Please specify a command. Possible values are ${Object.values(LocationAction).join(', ')}` };
		}

		let response : string;

		if (this.config.checkRole(message.personId, Role.Admin) || this.config.checkRole(message.personId, Role.UserLocation)) {
			response = await this.getAdminMessage(args, message);
		} else {
			response = await this.getNonAdminMessage(args, message);
		}

		return {
			markdown: response
		};
	}

	private async getAdminMessage(args : Argument[], message : MessageObject) : Promise<string> {
		switch(args[2].text.toLowerCase()) {
			case LocationAction.Get:
				return await this.getUserLocationService.getUserLocation(args, message.personId);
			case LocationAction.Set:
				return await this.setUserLocationService.setUserLocationAdmin(args, message.personId);
			case LocationAction.Delete:
				return await this.deleteUserLocationService.deleteUserLocationAdmin(args, message.personId);
			default:
				return this.unknownCommandMessage;
		}
	}

	private async getNonAdminMessage(args : Argument[], message : MessageObject) : Promise<string> {
		switch(args[2].text.toLowerCase()) {
			case LocationAction.Get:
				return await this.getUserLocationService.getUserLocation(args, message.personId);
			case LocationAction.Set:
				return await this.setUserLocationService.setUserLocationNonAdmin(args, message.personId);
			case LocationAction.Delete:
				return await this.deleteUserLocationService.deleteUserLocationNonAdmin(args, message.personId);
			default:
				return this.unknownCommandMessage;
		}
	}
}
