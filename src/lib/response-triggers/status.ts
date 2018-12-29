import Trigger from '../types/trigger';
import constants from '../../constants';
import PockyDB from '../PockyDB';
import Config from '../config';
import { MessageObject, CiscoSpark } from 'ciscospark/env';

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

		let pegs = await this.database.getPegsGiven(fromPerson);
		let map = await this.mapIdToName(pegs);
		let mapped = await this.mapData(map, fromPerson);

		return {
			markdown: `
You have ${mapped.remaining} pegs left to give.

Here's the pegs you've given so far...
${mapped.list}`,
			toPersonId: fromPerson,
			roomId: null // Do this to over-write default
		};
	}

	mapIdToName(data) {
		const mapToDisplayNameAsync = data.reduce((promises, item) => {
			return [...promises,
				Promise.all([
					this.spark.people.get(item.receiver),
					item.comment])
				.then(([receiver, comment]) => ({receiver: receiver.displayName, comment}))];
		}, []);
		return Promise.all(mapToDisplayNameAsync);
	}

	mapData(data, fromPerson : string) {
		let remaining = '';

		if (this.config.checkRole(fromPerson,'unmetered')) {
			remaining ='unlimited';
		} else {
			remaining = (this.config.getConfig('limit') - data.length).toString();
		}

		return {
			list: data.reduce((msg, p) => msg + `* **${p.receiver}** — "_${p.comment}_"\n`, ''),
			remaining: remaining
		};
	}
}
