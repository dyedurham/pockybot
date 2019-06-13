import { ResultRow } from '../../models/database';
import { PockyDB } from '../database/db-interfaces';
import TableHelper from '../parsers/tableHelper';
import __logger from '../logger';
import { Receiver } from '../../models/receiver';
import Config from '../config';

export interface WinnersService {
	getWinners(results: ResultRow[]): ResultRow[]
	returnWinnersResponse(): Promise<string>
}

export class DefaultWinnersService implements WinnersService {
	readonly cannotDisplayResults: string = 'Error encountered; cannot display winners.';
	database : PockyDB;
	config : Config;

	constructor(database : PockyDB, config: Config) {
		this.database = database;
		this.config = config;
	}

	getWinners(results: ResultRow[]): ResultRow[] {
		let goodSenders : { senderid : string, amtReceived : number, received: ResultRow[] }[] = []
		const keywords = this.config.getStringConfig('keyword');
		const minimum = this.config.getConfig('minimum');

		const allSenders = results.map(x => x.senderid).sort()
			.filter((value, index, array) => index === 0 || value !== array[index - 1]);

		// lambda to check if the message contains one of the words in the list on which it is run
		const keywordIncluded = (keyword: string, message: string) => message.toLowerCase().includes(keyword.toLowerCase());

		allSenders.forEach(sender => {
			const goodPegs = results.filter(x => x.senderid === sender && keywords.some(y => keywordIncluded(y, x.comment)));

			if (goodPegs.length >= minimum) {
				const received = results.filter(x => x.receiverid === sender && keywords.some(y => keywordIncluded(y, x.comment)));
				goodSenders.push({
					senderid : sender,
					amtReceived : received.length,
					received
				});
			}
		});

		let topReceived = goodSenders.map(x => x.amtReceived).sort()
			.filter((value, index, array) => index === 0 || value !== array[index - 1])
			.slice(0, this.config.getConfig('winners'));

		return goodSenders.sort((a, b) => a.amtReceived - b.amtReceived)
			.filter(x => topReceived.some(y => y === x.amtReceived))
			.map(x => x.received)
			.reduce((prev, cur) => prev.concat(cur));
	}

	async returnWinnersResponse() : Promise<string> {
		const data : ResultRow[] = await this.database.returnResults();
		const winnersData = this.getWinners(data);

		let winners : Receiver[] = TableHelper.mapResults(winnersData);
		let columnWidths = TableHelper.getReceiverColumnWidths(winners);

		// define table heading
		let winnersTable = TableHelper.padString('Receiver', columnWidths.receiver) + ' | ' + TableHelper.padString('Sender', columnWidths.sender) + ' | Comments\n';
		winnersTable += 'Total'.padEnd(columnWidths.receiver) + ' | ' + ' '.padEnd(columnWidths.sender) + ' | \n';
		winnersTable += ''.padEnd(columnWidths.receiver, '-') + '-+-' + ''.padEnd(columnWidths.sender, '-') + '-+-' + ''.padEnd(columnWidths.comment, '-') + '\n';

		// put in table data
		winners.forEach((winner: Receiver) => {
			winnersTable += winner.person.toString().padEnd(columnWidths.receiver) + ' | ' + ''.padEnd(columnWidths.sender) + ' | \n';
			let firstPeg = true;
			let pegCount = winner.pegs.length;
			winner.pegs.forEach((peg) => {
				if (firstPeg) {
					winnersTable += pegCount.toString().padEnd(columnWidths.receiver) + ' | ' + peg.sender.toString().padEnd(columnWidths.sender) + ' | ' + peg.comment + '\n';
					firstPeg = false;
				} else {
					winnersTable += ''.padEnd(columnWidths.receiver) + ' | ' + peg.sender.toString().padEnd(columnWidths.sender) + ' | ' + peg.comment + '\n';
				}
			});
		});

		return '```\n' + winnersTable + '```';
	}
}
