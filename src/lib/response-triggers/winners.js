const constants = require(__base + `constants`);
const tableHelper = require('../parsers/tableHelper');

const resultsCommand = '(?: )*winners(?: )*';

module.exports = class results {
	constructor(databaseService, tableSizer, config) {
		this.tableSizer = tableSizer;
		this.database = databaseService;
		this.cannotDisplayResults = "Error encountered; cannot display winners.";
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
		let winners = tableHelper.mapResults(data);
		let columnWidths = tableHelper.getColumnWidths(winners);

		// define table heading
		var winnersTable = tableHelper.padString("Receiver", columnWidths.receiver) + " | " + tableHelper.padString("Sender", columnWidths.sender) + " | Comments\n";
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
