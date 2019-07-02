const stringWidth = require('string-width');
import { ResultRow } from '../../models/database';
import { Receiver } from '../../models/receiver';
import { PegReceivedData } from '../../models/peg-received-data';

function mapResults(data : ResultRow[], categories: string[] = null) : Receiver[] {
	let results : Receiver[] = [];
	data.forEach((row) => {
		if (!results.map(person => person.id).includes(row.receiverid)) {
			results.push({
				id: row.receiverid,
				person: row.receiver,
				pegs: []
			});
		}

		results[results.findIndex(winner => winner.id === row.receiverid)].pegs.push({
			sender: row.sender,
			comment: row.comment,
			categories: categories ? parseCategories(row.comment, categories) : null
		});
	});

	return results;
}

function mapPenalties(data: ResultRow[], penaltyKeywords?: string[]) : Receiver[] {
	let results : Receiver[] = [];
	data.forEach((row) => {
		if (!results.map(person => person.id).includes(row.senderid)) {
			results.push({
				id: row.senderid,
				person: row.sender,
				pegs: []
			});
		}

		results[results.findIndex(value => value.id === row.senderid)].pegs.push({
			sender: row.receiver,
			comment: row.comment,
			categories: penaltyKeywords ? parseCategories(row.comment, penaltyKeywords) : null
		});
	})

	return results;
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
