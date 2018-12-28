import stringWidth = require('string-width');
import __logger from '../logger';

function mapResults(data : any) : any {
	var results = [];
	__logger.debug('Mapping winners response');
	data.forEach((row) => {
		if (!results.map(person => person.id).includes(row.receiverid)) {
			results.push({
				id: row.receiverid,
				person: row.receiver,
				pegs: []
			});
		}

		results[results.findIndex(winner => winner.id === row.receiverid)]["pegs"].push({
			sender: row.sender,
			comment: row.comment
		});
	});
	__logger.debug("Winners response mapped");
	return results;
}

function getColumnWidths(results : any) : { receiver : number, sender : number, comment : number } {
	var longestReceiver = this.stringLength("receiver");
	var longestSender = this.stringLength("sender");
	var longestComment = this.stringLength("comments");
	results.forEach((winner : any) => {
		if (this.stringLength(winner.person) > longestReceiver) {
			longestReceiver = this.stringLength(winner.person);
		}

		winner.pegs.forEach((pegger : any) => {
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

function padString(str : string, length : number) : string {
	var a : number = (length / 2) - (this.stringLength(str) / 2);
	return str.padStart(a + this.stringLength(str)).padEnd(length);
}

function stringLength(str : string) : number {
	// todo: get correct width of emojis
	return stringWidth(str);
}

export default {
	mapResults,
	getColumnWidths,
	padString,
	stringLength
}
