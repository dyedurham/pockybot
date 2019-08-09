import Trigger from '../../models/trigger';
import { DbLocation } from '../database/db-interfaces';
import Config from '../config-interface';
import { MessageObject } from 'webex/env';
import { Role } from '../../models/database';
import { Command } from '../../models/command';
import constants from '../../constants';
import xmlMessageParser from '../parsers/xmlMessageParser';
import { LocationAction } from '../../models/location-action';
import { Logger } from '../logger';

export default class LocationConfig extends Trigger {
	dbLocation : DbLocation;
	config : Config;

	constructor(dbLocation : DbLocation, config : Config) {
		super();

		this.dbLocation = dbLocation;
		this.config = config;
	}

	isToTriggerOn(message : MessageObject) : boolean {
		let parsedMessage = xmlMessageParser.parseNonPegMessage(message);
		return parsedMessage.botId === constants.botId && parsedMessage.command.toLowerCase().startsWith(Command.LocationConfig);
	}

	async createMessage(message : MessageObject) : Promise<MessageObject> {
		let parsedMessage = xmlMessageParser.parseNonPegMessage(message);
		let words = parsedMessage.command.trim().split(' ').filter(x => x !== '');

		let response : string;

		if (words.length < 2) {
			return { markdown: `Please specify a command. Possible values are ${Object.values(LocationAction).join(', ')}` };
		}

		let locations: string[];
		try {
			locations = await this.dbLocation.getLocations();
		} catch (error) {
			Logger.error(`[Location.createMessage] Error getting locations ${error.message}`);
			return { markdown: 'Error getting locations' };
		}

		switch (words[1].toLowerCase()) {
			case LocationAction.Get:
				response = await this.getLocationMessage(locations);
				break;
			case LocationAction.Set:
				response = await this.setLocation(message, words, locations);
				break;
			case LocationAction.Delete:
				response = await this.deleteLocation(message, words, locations);
				break;
			default:
				response = `Unknown command. Possible values are ${Object.values(LocationAction).join(', ')}`;
				break;
		}

		return {
			markdown: response
		};
	}

	private async getLocationMessage(locations : string[]) : Promise<string> {
		if (locations.length === 0) {
			return 'No locations set';
		}

		let message = 'Here are the current locations:\n';

		locations.forEach(item => {
			message += `* ${item}\n`;
		});

		return message;
	}

	private async setLocation(message : MessageObject, words : string[], locations : string[]) : Promise<string> {
		if (!(this.config.checkRole(message.personId, Role.Admin) || this.config.checkRole(message.personId, Role.Config))) {
			return 'Permission denied. You may only use the \'get\' command';
		}

		if (words.length !== 3) {
			return 'You must specify a location name to set';
		}

		if (locations.map(x => x.toLowerCase()).includes(words[2].toLowerCase())) {
			return `Location value "${words[2]}" has already been set`;
		}

		await this.dbLocation.setLocation(words[2]);
		return 'Location has been set';
	}

	private async deleteLocation(message : MessageObject, words : string[], locations : string[]) : Promise<string> {
		if (!(this.config.checkRole(message.personId, Role.Admin) || this.config.checkRole(message.personId, Role.Config))) {
			return 'Permission denied. You may only use the \'get\' command';
		}

		if (words.length !== 3) {
			return 'You must specify a location name to delete';
		}

		if (!locations.map(x => x.toLowerCase()).includes(words[2].toLowerCase())) {
			return `Location value "${words[2]}" does not exist`;
		}

		await this.dbLocation.deleteLocation(words[2]);
		return 'Location has been deleted';
	}
}
