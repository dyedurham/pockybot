import { ResultRow } from '../../models/database';
import { PockyDB } from '../database/db-interfaces';
import TableHelper from '../parsers/tableHelper';
import { Receiver } from '../../models/receiver';
import Config from '../config';
import { distinct } from '../helpers/helpers';
import Utilities from '../utilities';
import { Result } from '../../models/result';
import { Peg } from '../../models/peg';
import { PegService } from './peg-service';

export interface WinnersService {
	getWinners(results: Peg[]): Result[]
	returnWinnersResponse(): Promise<string>
}

export class DefaultWinnersService implements WinnersService {
	readonly cannotDisplayResults: string = 'Error encountered; cannot display winners.';
	database: PockyDB;
	config: Config;
	utilities: Utilities;
	pegService: PegService;

	constructor(database : PockyDB, config: Config, utilities: Utilities, pegService: PegService) {
		this.database = database;
		this.config = config;
		this.utilities = utilities;
		this.pegService = pegService;
	}

	getWinners(results: Peg[]): Result[] {
		let allReceivers = results.map(x => x.receiverId);
		allReceivers = distinct(allReceivers);

		let resultsForEligibleWinners = this.getEligibleWinnerResults(allReceivers, results);

		// This two-step process used to prevent array out of bounds exceptions if there are too few winners
		let topNumberOfPegsReceived = resultsForEligibleWinners.map(x => x.weightedPegsReceived).sort().reverse()
			.slice(0, this.config.getConfig('winners'));
		let topCutoff = topNumberOfPegsReceived[topNumberOfPegsReceived.length - 1];

		return resultsForEligibleWinners.sort((a, b) => b.weightedPegsReceived - a.weightedPegsReceived)
			.filter(x => x.weightedPegsReceived >= topCutoff);
	}

	async returnWinnersResponse() : Promise<string> {
		const data : ResultRow[] = await this.database.returnResults();
		const pegs = this.pegService.getPegs(data);
		const winners = this.getWinners(pegs);

		let columnWidths = TableHelper.getReceiverColumnWidths(winners);

		// define table heading
		let winnersTable = TableHelper.padString('Receiver', columnWidths.receiver) + ' | ' + TableHelper.padString('Sender', columnWidths.sender) + ' | Comments\n';
		winnersTable += 'Total'.padEnd(columnWidths.receiver) + ' | ' + ' '.padEnd(columnWidths.sender) + ' | \n';
		winnersTable += ''.padEnd(columnWidths.receiver, '-') + '-+-' + ''.padEnd(columnWidths.sender, '-') + '-+-' + ''.padEnd(columnWidths.comment, '-') + '\n';

		// put in table data
		winners.forEach((winner: Result) => {
			winnersTable += winner.personName.padEnd(columnWidths.receiver) + ' | ' + ''.padEnd(columnWidths.sender) + ' | \n';
			let firstPeg = true;
			let pegCount = winner.weightedPegsReceived;
			winner.validPegsReceived.forEach((peg) => {
				if (firstPeg) {
					winnersTable += pegCount.toString().padEnd(columnWidths.receiver) + ' | ' + peg.senderName.padEnd(columnWidths.sender) + ' | ' + peg.comment + '\n';
					firstPeg = false;
				} else {
					winnersTable += ''.padEnd(columnWidths.receiver) + ' | ' + peg.senderName.padEnd(columnWidths.sender) + ' | ' + peg.comment + '\n';
				}
			});
		});

		return '```\n' + winnersTable + '```';
	}

	/**
	 *
	 * @param allCandidates a string array of the userIds of every person who has sent any pegs
	 * @param results an array of every single peg given
	 * @returns an array of results for all the users who have given above the minimum required to be eligible to win
	 */
	private getEligibleWinnerResults(allCandidates: string[], results: Peg[]): Result[] {
		const minimum = this.config.getConfig('minimum');
		const requireKeywords = this.config.getConfig('requireValues');
		const keywords = this.config.getStringConfig('keyword');
		const penaltyKeywords = this.config.getStringConfig('penaltyKeyword');

		let resultsForEligibleWinners: Result[] = [];

		allCandidates.forEach(person => {
			const validPegsSent = results.filter(x =>
				x.senderId === person && this.utilities.pegValid(x.comment, requireKeywords, keywords, penaltyKeywords));

			if (validPegsSent.length >= minimum) {
				const validPegsReceived = results.filter(x =>
					x.receiverId === person && this.utilities.pegValid(x.comment, requireKeywords, keywords, penaltyKeywords));
				const penaltyPegsGiven = results.filter(x =>
					x.senderId === person && !this.utilities.pegValid(x.comment, requireKeywords, keywords, penaltyKeywords));
				const personName = validPegsReceived.length > 0 ? validPegsReceived[0].receiverName : penaltyPegsGiven[0].senderName;
				resultsForEligibleWinners.push({
					personId: person,
					personName,
					weightedPegsReceived: validPegsReceived.length - penaltyPegsGiven.length,
					validPegsReceived,
					penaltyPegsGiven
				});
			}
		});

		return resultsForEligibleWinners;
	}
}
