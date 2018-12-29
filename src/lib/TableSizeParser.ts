import stringWidth = require('string-width');

export default class TableSizeParser {
	padString(str : string, length : number) {
		let a = (length / 2) - (str.length / 2);
		return str.padStart(a + str.length).padEnd(length);
	}

	stringLength(str : string) {
		// todo: get correct width of emojis
		return stringWidth(str);
	}

	tableHeading(people) {
		let longestReceiver = this.stringLength('receiver');
		let longestSender = this.stringLength('sender');
		let longestComment = this.stringLength('comments');
		people.forEach((person) => {
			if (this.stringLength(person.person) > longestReceiver) {
				longestReceiver = this.stringLength(person.person);
			}
			person.pegs.forEach((pegger) => {
				if (this.stringLength(pegger.sender) > longestSender) {
					longestSender = this.stringLength(pegger.sender);
				}
				if (this.stringLength(pegger.comment) > longestComment) {
					longestComment = this.stringLength(pegger.comment);
				}
			});
		});

		// define table heading
		let tableHeading = this.padString('Receiver', longestReceiver) + ' | ' + this.padString('Sender', longestSender) + ' | Comments\n';
		tableHeading += 'Total'.padEnd(longestReceiver) + ' | ' + ' '.padEnd(longestSender) + ' | \n';
		tableHeading += ''.padEnd(longestReceiver, '-') + '-+-' + ''.padEnd(longestSender, '-') + '-+-' + ''.padEnd(longestComment, '-') + '\n';
		return {
			heading: tableHeading,
			longestReceiver,
			longestSender,
			longestComment
		};
	}
}

exports.padString = function(str : string, length : number) {
	let a = (length / 2) - (str.length / 2);
	return str.padStart(a + str.length).padEnd(length);
}

exports.stringLength = function(str : string) {
	// todo: get correct width of emojis
	return stringWidth(str);
}

exports.tableHeading = function(people) {
	// define table column widths
	let longestReceiver = this.stringLength('receiver');
	let longestSender = this.stringLength('sender');
	let longestComment = this.stringLength('comments');
	people.forEach((person) => {
		if (this.stringLength(person.person) > longestReceiver) {
			longestReceiver = this.stringLength(person.person);
		}
		person.pegs.forEach((pegger) => {
			if (this.stringLength(pegger.sender) > longestSender) {
				longestSender = this.stringLength(pegger.sender);
			}
			if (this.stringLength(pegger.comment) > longestComment) {
				longestComment = this.stringLength(pegger.comment);
			}
		});
	});

	// define table heading
	let tableHeading = this.padString('Receiver', longestReceiver) + ' | ' + this.padString('Sender', longestSender) + ' | Comments\n';
	tableHeading += 'Total'.padEnd(longestReceiver) + ' | ' + ' '.padEnd(longestSender) + ' | \n';
	tableHeading += ''.padEnd(longestReceiver, '-') + '-+-' + ''.padEnd(longestSender, '-') + '-+-' + ''.padEnd(longestComment, '-') + '\n';
}
