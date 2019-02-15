import { ResultRow } from '../../models/database';
import { PockyDB } from '../database/db-interfaces';
import TableHelper from '../parsers/tableHelper';
import __logger from '../logger';
import { Receiver } from '../../models/receiver';

export interface WinnersService {
	returnWinnersResponse(): Promise<string>
}

export class DefaultWinnersService implements WinnersService {
	readonly cannotDisplayResults: string = 'Error encountered; cannot display winners.';
	database : PockyDB;

	constructor(database : PockyDB) {
		this.database = database;
	}

	async returnWinnersResponse() : Promise<string> {
		const data : ResultRow[] = await this.database.returnWinners();

		let winners : Receiver[] = TableHelper.mapResults(data);
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
