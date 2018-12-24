import Trigger from './trigger';
import constants from '../../../constants';
import PockyDB from '../../database/PockyDB';
import Config from '../config';

const commandText = 'status';
const statusCommand = `(?: )*${commandText}(?: )*`;

export default class Status extends Trigger {
	spark : any;
	database : PockyDB;
	config : Config;

	constructor(sparkService, databaseService, config) {
		super();

		this.spark = sparkService;
		this.database = databaseService;
		this.config = config;
	}

	isToTriggerOn(message) {
		var pattern = new RegExp('^' + constants.optionalMarkdownOpening + constants.mentionMe + statusCommand + constants.optionalMarkdownEnding + '$', 'ui');
		return pattern.test(message.html);
	}

	isToTriggerOnPM(message) {
		return message.text.toLowerCase().trim() === commandText;
	}

	async createMessage(message) {
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

	mapData(data, fromPerson) {
		var remaining = '';

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
