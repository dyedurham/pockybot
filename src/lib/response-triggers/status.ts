import Trigger from '../../models/trigger';
import constants from '../../constants';
import { PockyDB}  from '../database/db-interfaces';
import Config from '../config';
import { MessageObject, CiscoSpark } from 'ciscospark/env';
import { PegGiven, Role } from '../../models/database';
import { PegGivenData } from '../../models/peg-given-data';

const commandText = 'status';
const statusCommand = `(?: )*${commandText}(?: )*`;

export default class Status extends Trigger {
	spark : CiscoSpark;
	database : PockyDB;
	config : Config;

	constructor(sparkService : CiscoSpark, databaseService : PockyDB, config : Config) {
		super();

		this.spark = sparkService;
		this.database = databaseService;
		this.config = config;
	}

	isToTriggerOn(message : MessageObject) : boolean {
		let pattern = new RegExp('^' + constants.optionalMarkdownOpening + constants.mentionMe + statusCommand + constants.optionalMarkdownEnding + '$', 'ui');
		return pattern.test(message.html);
	}

	isToTriggerOnPM(message : MessageObject) : boolean {
		return message.text.toLowerCase().trim() === commandText;
	}

	async createMessage(message : MessageObject) : Promise<MessageObject> {
		let fromPerson = message.personId;

		let pegs : PegGiven[] = await this.database.getPegsGiven(fromPerson);
		let map : PegGivenData[] = await this.mapIdToName(pegs);
		let mapped = await this.mapData(map, fromPerson);

		let response : string = `You have ${mapped.remaining} pegs left to give.`;

		if (mapped.hasPegged) {
			response += `

Here's the pegs you've given so far...
${mapped.list}`;
		} else {
			response += `

You have not given any pegs so far.`;
		}

		return {
			markdown: response,
			toPersonId: fromPerson,
			roomId: null // Do this to over-write default
		};
	}

	mapIdToName(data : PegGiven[]) : Promise<PegGivenData[]> {
		const mapToDisplayNameAsync = data.reduce((promises : Promise<PegGivenData>[], item : PegGiven) => {
			return [...promises,
				Promise.all([
					this.spark.people.get(item.receiver),
					item.comment])
				.then(([receiver, comment]) => ({receiver: receiver.displayName, comment}))];
		}, []);
		return Promise.all(mapToDisplayNameAsync);
	}

	mapData(data : PegGivenData[], fromPerson : string) : {list : string, remaining : string, hasPegged : boolean} {
		let remaining = '';

		if (this.config.checkRole(fromPerson, Role.Unmetered)) {
			remaining ='unlimited';
		} else {
			remaining = (this.config.getConfig('limit') - data.length).toString();
		}

		return {
			list: data.reduce((msg, p) => msg + `* **${p.receiver}** — "_${p.comment}_"\n`, ''),
			remaining: remaining,
			hasPegged: data.length > 0
		};
	}
}
