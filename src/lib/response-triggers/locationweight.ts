import Trigger from '../../models/trigger';
import { DbLocation } from '../database/db-interfaces';
import Config from '../config-interface';
import { MessageObject } from 'webex/env';
import { Role, ConfigRow } from '../../models/database';
import { Command } from '../../models/command';
import constants from '../../constants';
import xmlMessageParser from '../parsers/xmlMessageParser';
import { LocationAction } from '../../models/location-action';
import { Logger } from '../logger';
import TableHelper from '../parsers/tableHelper';
import { LocationWeightConfig } from '../../models/location-weight-config';

export default class LocationWeight extends Trigger {
	dbLocation : DbLocation;
	config : Config;

	constructor(dbLocation : DbLocation, config : Config) {
		super();

		this.dbLocation = dbLocation;
		this.config = config;
	}

	isToTriggerOn(message : MessageObject) : boolean {
		if (!(this.config.checkRole(message.personId, Role.Admin) || this.config.checkRole(message.personId, Role.Config))) {
			return false;
		}

		let parsedMessage = xmlMessageParser.parseNonPegMessage(message);
		return parsedMessage.botId === constants.botId && parsedMessage.command.toLowerCase().startsWith(Command.LocationWeight);
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
				response = await this.getLocationWeightMessage(locations);
				break;
			case LocationAction.Set:
				response = await this.setLocationWeight(words, locations);
				break;
			case LocationAction.Delete:
				response = await this.deleteLocationWeight(words, locations);
				break;
			default:
				response = `Unknown command. Possible values are ${Object.values(LocationAction).join(', ')}`;
				break;
		}

		return {
			markdown: response
		};
	}

	private async getLocationWeightMessage(locations : string[]) : Promise<string> {
		const allConfig = this.config.getAllConfig();
		const locationWeights : LocationWeightConfig[] = [];
		for (let i = 0; i < locations.length; i++) {
			for (let j = i + 1; j < locations.length; j++) {
				const config = this.getLocationWeightConfig(locations[i], locations[j], allConfig);
				if (config) {
					locationWeights.push({
						location1: locations[i],
						location2: locations[j],
						weight: config.value
					});
				}
			}
		}

		if (locationWeights.length === 0) {
			return 'No location weights set';
		}

		let columnWidths = TableHelper.getColumnWidths(
			locationWeights, [
				(x : LocationWeightConfig) => x.location1,
				(x: LocationWeightConfig) => x.location2,
				(x : LocationWeightConfig) => x.weight.toString()
			],
			['Location 1', 'Location 2', 'Weight']);

		let message = 'Here are the current location weights:\n';

		message += TableHelper.padString('Location 1', columnWidths[0]) + ' | ' + TableHelper.padString('Value', columnWidths[1]) + ' | Weight\n';
		message += ''.padEnd(columnWidths[0], '-') + '-+-' + ''.padEnd(columnWidths[1], '-') + '-+-' + ''.padEnd(columnWidths[2], '-') + '\n';

		locationWeights.forEach((config : LocationWeightConfig) => {
			message += config.location1.padEnd(columnWidths[0]) + ' | ' + config.location2.padEnd(columnWidths[1]) + ' | ' + config.weight + '\n';
		});

		message += '```';

		return message;
	}

	private getLocationWeightConfig(location1 : string, location2 : string, allConfig : ConfigRow[]) : ConfigRow | null {
		const location1To2 = `locationWeight${location1}to${location2}`.toLowerCase();
		const location2To1 = `locationWeight${location2}to${location1}`.toLowerCase();
		const configIndex = allConfig.findIndex(item =>
			item.name.toLowerCase() === location1To2 || item.name.toLowerCase() === location2To1);

		if (configIndex === -1) {
			return null;
		}

		return allConfig[configIndex];
	}

	private async setLocationWeight(words : string[], locations : string[]) : Promise<string> {
		if (words.length !== 5) {
			return 'Please specify two locations and a weight';
		}

		if (!locations.map(x => x.toLowerCase()).includes(words[2].toLowerCase())) {
			return `Location value "${words[2]}" is invalid`;
		}

		if (!locations.map(x => x.toLowerCase()).includes(words[3].toLowerCase())) {
			return `Location value "${words[3]}" is invalid`;
		}

		const value = Number(words[4]);
		if (isNaN(value)) {
			return 'Weight must be set to a number';
		}

		if (value < 0) {
			return 'Weight should be greater than or equal to 0.';
		}

		let configName = `locationWeight${words[2]}to${words[3]}`;
		const existingConfig = this.getLocationWeightConfig(words[2], words[3], this.config.getAllConfig());
		if (existingConfig) {
			configName = existingConfig.name;
		}

		await this.config.setConfig(configName, value);
		return 'Location weight has been set';
	}

	private async deleteLocationWeight(words : string[], locations : string[]) : Promise<string> {
		if (words.length !== 4) {
			return 'You must specify a two location names to delete the weighting for';
		}

		if (!locations.map(x => x.toLowerCase()).includes(words[2].toLowerCase())) {
			return `Location value "${words[2]}" is invalid`;
		}

		if (!locations.map(x => x.toLowerCase()).includes(words[3].toLowerCase())) {
			return `Location value "${words[3]}" is invalid`;
		}

		const existingConfig = this.getLocationWeightConfig(words[2], words[3], this.config.getAllConfig());
		if (!existingConfig) {
			return `No weighting found for locations ${words[2]} and ${words[3]}`;
		}

		await this.config.deleteConfig(existingConfig.name);
		return 'Location has been deleted';
	}
}
