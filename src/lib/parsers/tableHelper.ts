const stringWidth = require('string-width');
import __logger from '../logger';
import { ResultRow, RolesRow, StringConfigRow, ConfigRow } from '../../models/database';
import { Receiver } from '../../models/receiver';
import { PegReceivedData } from '../../models/peg-received-data';

function mapResults(data : ResultRow[]) : Receiver[] {
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
			comment: row.comment
		});
	});

	return results;
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
	const stringWidth = require('string-width');

	let longestname = stringWidth('name');
	let longestvalue = stringWidth('value');

	configValues.forEach((value : RolesRow) => {
		if (stringWidth(value.role) > longestname) {
			longestname = stringWidth(value.role);
		}

		if (stringWidth(value.userid) > longestvalue) {
			longestvalue = stringWidth(value.userid);
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

		if (stringWidth(value.value) > longestvalue) {
			longestvalue = stringWidth(value.value);
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
	getReceiverColumnWidths,
	getRolesColumnWidths,
	getStringConfigColumnWidths,
	getConfigColumnWidths,
	padString,
	stringLength
}
