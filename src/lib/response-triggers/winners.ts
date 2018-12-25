import Trigger from './trigger';
import constants from '../../constants';
import TableHelper from '../parsers/tableHelper';
import TableSizeParser from '../TableSizeParser';
import PockyDB from '../PockyDB';
import Config from '../config';
import __logger from '../logger';

const resultsCommand = '(?: )*winners(?: )*';

export default class Results extends Trigger {
	readonly cannotDisplayResults : string = "Error encountered; cannot display winners.";
	tableSizer : TableSizeParser;
	database : PockyDB;
	config : Config;

	constructor(databaseService, tableSizer, config) {
		super();

		this.tableSizer = tableSizer;
		this.database = databaseService;
		this.config = config;
	}

	isToTriggerOn(message) {
		if (!(this.config.checkRole(message.personId,'admin') || this.config.checkRole(message.personId,'winners'))) {
			return false;
		}
		var pattern = new RegExp('^' + constants.optionalMarkdownOpening + constants.mentionMe + resultsCommand, 'ui');
		return pattern.test(message.html);
	}

	async createMessage() {
		let winners;
		try {
			winners = await this.database.returnWinners();
		} catch (e) {
			__logger.error(`Error in db.returnWinners:\n${e.message}`);
			throw new Error(this.cannotDisplayResults);
		}

		let response;
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

	async createResponse(data) {
		let winners = TableHelper.mapResults(data);
		let columnWidths = TableHelper.getColumnWidths(winners);

		// define table heading
		var winnersTable = TableHelper.padString("Receiver", columnWidths.receiver) + " | " + TableHelper.padString("Sender", columnWidths.sender) + " | Comments\n";
		winnersTable += "Total".padEnd(columnWidths.receiver) + " | " + " ".padEnd(columnWidths.sender) + " | \n";
		winnersTable += "".padEnd(columnWidths.receiver, "-") + "-+-" + "".padEnd(columnWidths.sender, "-") + "-+-" + "".padEnd(columnWidths.comment, "-") + "\n";

		__logger.debug("Building winners table");

		// put in table data
		winners.forEach((winner) => {
			winnersTable += winner.person.toString().padEnd(columnWidths.receiver) + " | " + "".padEnd(columnWidths.sender) + " | \n";
			var firstPeg = true;
			var pegCount = winner.pegs.length;
			winner.pegs.forEach((peg) => {
				if (firstPeg) {
					winnersTable += pegCount.toString().padEnd(columnWidths.receiver) + " | " + peg.sender.toString().padEnd(columnWidths.sender) + " | " + peg.comment + "\n";
					firstPeg = false;
				} else {
					winnersTable += "".padEnd(columnWidths.receiver) + " | " + peg.sender.toString().padEnd(columnWidths.sender) + " | " + peg.comment + "\n";
				}
			});
		});

		__logger.information(`########### Winners table:\n\n${winnersTable}`);
		return "```\n" + winnersTable + "```";
	}
}
