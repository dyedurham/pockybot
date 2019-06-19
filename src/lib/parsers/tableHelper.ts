import { PegRecipient } from '../../models/peg-recipient';
const stringWidth = require('string-width');
import { RolesRow, StringConfigRow, ConfigRow } from '../../models/database';
import { Receiver } from '../../models/receiver';
import { PegReceivedData } from '../../models/peg-received-data';

function mapResults(pegRecipients : PegRecipient[], categories: string[] = null) : Receiver[] {
	return pegRecipients.map(user => {
		// TODO: This is where person is getting set to null and needs to not be
		const person : string = user.validPegsReceived[0] ? user.validPegsReceived[0].receiver : null;

		return {
			id: user.id,
			person,
			pegs: user.validPegsReceived.map(peg => {
				return {
					sender: peg.sender,
					comment: peg.comment,
					categories: categories ? parseCategories(peg.comment, categories) : null
				};
			}),
			weightedPegsReceived: user.weightedPegResult,
			validPegsReceived: user.numberOfValidPegsReceived
		};
	});
}

function mapPenalties(pegRecipients: PegRecipient[], penaltyKeywords?: string[]) : Receiver[] {
	return pegRecipients.map(user => {
		const person : string = user.validPegsReceived[0] ? user.validPegsReceived[0].receiver : null;

		return {
			id: user.id,
			person,
			pegs: user.penaltyPegsSent.map(peg => {
				return {
					sender: peg.sender,
					comment: peg.comment,
					categories: penaltyKeywords ? parseCategories(peg.comment, penaltyKeywords) : null
				};
			}),
			weightedPegsReceived: user.weightedPegResult,
			validPegsReceived: user.numberOfValidPegsReceived
		};
	});
}

function parseCategories(comment: string, categories: string[]) : string[] {
	return categories.filter(category => comment.includes(category));
}

function getReceiverColumnWidths(results : Receiver[]) : { receiver : number, sender : number, comment : number } {
	let longestReceiver = this.stringLength('receiver');
	let longestSender = this.stringLength('sender');
	let longestComment = this.stringLength('comments');

	results.forEach((winner : Receiver) => {
		if (this.stringLength(winner.person) > longestReceiver) {
			longestReceiver = this.stringLength(winner.person);
		}

		winner.pegs.forEach((pegger : PegReceivedData) => {
			if (this.stringLength(pegger.sender) > longestSender) {
				longestSender = this.stringLength(pegger.sender);
			}
			if (this.stringLength(pegger.comment) > longestComment) {
				longestComment = this.stringLength(pegger.comment);
			}
		});
	});

	return {
		receiver: longestReceiver,
		sender: longestSender,
		comment: longestComment
	}
}

function getRolesColumnWidths(configValues : RolesRow[]) : { name : number, value : number } {
	let longestname = stringWidth('name');
	let longestvalue = stringWidth('value');

	configValues.forEach((value : RolesRow) => {
		if (stringWidth(value.role) > longestname) {
			longestname = stringWidth(value.role);
		}

		if (stringWidth(value.userid.toString()) > longestvalue) {
			longestvalue = stringWidth(value.userid.toString());
		}
	});

	return {
		name: longestname,
		value: longestvalue
	}
}

function getStringConfigColumnWidths(configValues : StringConfigRow[]) : { name : number, value : number } {
	const stringWidth = require('string-width');

	let longestname = stringWidth('name');
	let longestvalue = stringWidth('value');

	configValues.forEach((value : StringConfigRow) => {
		if (stringWidth(value.name) > longestname) {
			longestname = stringWidth(value.name);
		}

		if (stringWidth(value.value) > longestvalue) {
			longestvalue = stringWidth(value.value);
		}
	});

	return {
		name: longestname,
		value: longestvalue
	}
}

function getConfigColumnWidths(configValues : ConfigRow[]) : { name : number, value : number } {
	const stringWidth = require('string-width');

	let longestname = stringWidth('name');
	let longestvalue = stringWidth('value');

	configValues.forEach((value : ConfigRow) => {
		if (stringWidth(value.name) > longestname) {
			longestname = stringWidth(value.name);
		}

		if (stringWidth(value.value.toString()) > longestvalue) {
			longestvalue = stringWidth(value.value.toString());
		}
	});

	return {
		name: longestname,
		value: longestvalue
	}
}

function padString(str : string, length : number) : string {
	let a : number = (length / 2) - (this.stringLength(str) / 2);
	return str.padStart(a + this.stringLength(str)).padEnd(length);
}

function stringLength(str : string) : number {
	// todo: get correct width of emojis
	return stringWidth(str);
}

export default {
	mapResults,
	mapPenalties,
	getReceiverColumnWidths,
	getRolesColumnWidths,
	getStringConfigColumnWidths,
	getConfigColumnWidths,
	padString,
	stringLength
}
