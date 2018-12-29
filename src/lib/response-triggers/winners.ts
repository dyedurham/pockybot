import Trigger from '../../models/trigger';
import constants from '../../constants';
import TableHelper from '../parsers/tableHelper';
import TableSizeParser from '../TableSizeParser';
import PockyDB from '../PockyDB';
import Config from '../config';
import __logger from '../logger';
import { MessageObject } from 'ciscospark/env';
import { ResultRow, Role } from '../../models/database';
import { Receiver } from '../../models/receiver';

const resultsCommand = '(?: )*winners(?: )*';

export default class Results extends Trigger {
	readonly cannotDisplayResults : string = 'Error encountered; cannot display winners.';
	tableSizer : TableSizeParser;
	database : PockyDB;
	config : Config;

	constructor(database : PockyDB, tableSizer : TableSizeParser, config : Config) {
		super();

		this.tableSizer = tableSizer;
		this.database = database;
		this.config = config;
	}

	isToTriggerOn(message : MessageObject) : boolean {
		if (!(this.config.checkRole(message.personId, Role.Admin) || this.config.checkRole(message.personId, Role.Winners))) {
			return false;
		}
		let pattern = new RegExp('^' + constants.optionalMarkdownOpening + constants.mentionMe + resultsCommand, 'ui');
		return pattern.test(message.html);
	}

	async createMessage() : Promise<MessageObject> {
		let winners : ResultRow[];
		try {
			winners = await this.database.returnWinners();
		} catch (e) {
			__logger.error(`Error in db.returnWinners:\n${e.message}`);
			throw new Error(this.cannotDisplayResults);
		}

		let response : string;
		try {
			response = await this.createResponse(winners);
		} catch (error) {
			__logger.error(`Error in createResponse from returnWinners:\n${error.message}`);
			throw new Error(this.cannotDisplayResults);
		}

		return {
			markdown: response
		}
	}

	async createResponse(data : ResultRow[]) : Promise<string> {
		let winners : Receiver[] = TableHelper.mapResults(data);
		let columnWidths = TableHelper.getColumnWidths(winners);

		// define table heading
		let winnersTable = TableHelper.padString('Receiver', columnWidths.receiver) + ' | ' + TableHelper.padString('Sender', columnWidths.sender) + ' | Comments\n';
		winnersTable += 'Total'.padEnd(columnWidths.receiver) + ' | ' + ' '.padEnd(columnWidths.sender) + ' | \n';
		winnersTable += ''.padEnd(columnWidths.receiver, '-') + '-+-' + ''.padEnd(columnWidths.sender, '-') + '-+-' + ''.padEnd(columnWidths.comment, '-') + '\n';

		__logger.debug('Building winners table');

		// put in table data
		winners.forEach((winner : Receiver) => {
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

		__logger.information(`########### Winners table:\n\n${winnersTable}`);
		return '```\n' + winnersTable + '```';
	}
}
