import { PegRecipient } from '../../models/peg-recipient';
const stringWidth = require('string-width');
import { ResultRow } from '../../models/database';
import { Receiver } from '../../models/receiver';
import { Result } from '../../models/result';
import { Peg } from '../../models/peg';

function mapResults(pegRecipients : PegRecipient[], categories: string[] = null) : Receiver[] {
	return pegRecipients.map(user => {
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

function getReceiverColumnWidths(results: Result[]) : { receiver : number, sender : number, comment : number } {
	let longestReceiver = this.stringLength('receiver');
	let longestSender = this.stringLength('sender');
	let longestComment = this.stringLength('comments');

	results.forEach((winner: Result) => {
		if (this.stringLength(winner.personName) > longestReceiver) {
			longestReceiver = this.stringLength(winner.personName);
		}

		winner.validPegsReceived.forEach((peg: Peg) => {
			if (this.stringLength(peg.senderName) > longestSender) {
				longestSender = this.stringLength(peg.senderName);
			}
			if (this.stringLength(peg.comment) > longestComment) {
				longestComment = this.stringLength(peg.comment);
			}
		});
	});

	return {
		receiver: longestReceiver,
		sender: longestSender,
		comment: longestComment
	}
}

function getColumnWidths(arr : any[], accessors : ((value : any) => string)[], columnNames ?: string[]) : number[] {
	const stringWidth = require('string-width');
	const longestValues = [];

	for (let i = 0; i < accessors.length; i++) {
		if (columnNames.length > i) {
			longestValues.push(stringWidth(columnNames[i]));
		} else {
			longestValues.push(0);
		}
	}

	arr.forEach((value: any) => {
		for (let i = 0; i< accessors.length; i++) {
			const width = stringWidth(accessors[i](value));
			if (width > longestValues[i]) {
				longestValues[i] = width;
			}
		}
	});

	return longestValues;
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
	getColumnWidths,
	padString,
	stringLength
}
