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

	pegValid(comment: string, requireKeywords: number, keywords: string[], penaltyKeywords: string[]): boolean {
		if (requireKeywords) {
			return keywords.some(x => comment.toLowerCase().includes(x.toLowerCase()));
		} else {
			return !penaltyKeywords.some(x => comment.toLowerCase().includes(x.toLowerCase()));
		}
	}

	getWinners(results: ResultRow[]): ResultRow[] {
		let eligibleToWinSenders : {
			senderid : string,
			numberOfValidPegsReceived : number,
			validPegsReceived: ResultRow[]
		}[] = []

		const minimum = this.config.getConfig('minimum');
		const requireKeywords = this.config.getConfig('requireValues');
		const keywords = this.config.getStringConfig('keyword');
		const penaltyKeywords = this.config.getStringConfig('penaltyKeyword');

		const allSenders = results.map(x => x.senderid).sort()
			.filter((value, index, array) => index === 0 || value !== array[index - 1]);

		allSenders.forEach(sender => {
			const validPegsSent = results.filter(x => x.senderid === sender && this.pegValid(x.comment, requireKeywords, keywords, penaltyKeywords));

			if (validPegsSent.length >= minimum) {
				const validPegsReceived = results.filter(x => x.receiverid === sender && this.pegValid(x.comment, requireKeywords, keywords, penaltyKeywords));
				eligibleToWinSenders.push({
					senderid : sender,
					numberOfValidPegsReceived : validPegsReceived.length,
					validPegsReceived
				});
			}
		});

		let topNumberOfPegsReceived = eligibleToWinSenders.map(x => x.numberOfValidPegsReceived).sort().reverse()
			.filter((value, index, array) => index === 0 || value !== array[index - 1])
			.slice(0, this.config.getConfig('winners'));

		return eligibleToWinSenders.sort((a, b) => b.numberOfValidPegsReceived - a.numberOfValidPegsReceived)
			.filter(x => topNumberOfPegsReceived.some(y => y === x.numberOfValidPegsReceived))
			.map(x => x.validPegsReceived)
			.reduce((prev, cur) => prev.concat(cur), []);
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
