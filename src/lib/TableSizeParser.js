module.exports = class TableSizeParser {
	constructor() {
	}

	padString(str, length) {
		var a = (length / 2) - (str.length / 2);
		return str.padStart(a + str.length).padEnd(length);
	}

	stringLength(str) {
		// todo: get correct width of emojis
		return stringWidth(str);
	}

	tableHeading(people) {
		var longestReceiver = this.stringLength("receiver");
		var longestSender = this.stringLength("sender");
		var longestComment = this.stringLength("comments");
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
		var tableHeading = this.padString("Receiver", longestReceiver) + " | " + this.padString("Sender", longestSender) + " | Comments\n";
		tableHeading += "Total".padEnd(longestReceiver) + " | " + " ".padEnd(longestSender) + " | \n";
		tableHeading += "".padEnd(longestReceiver, "-") + "-+-" + "".padEnd(longestSender, "-") + "-+-" + "".padEnd(longestComment, "-") + "\n";
		return {
			heading: tableHeading,
			longestReceiver,
			longestSender,
			longestComment
		};
	}
}
exports.padString = function(str, length) {
	var a = (length / 2) - (str.length / 2);
	return str.padStart(a + str.length).padEnd(length);
}

exports.stringLength = function(str) {
	// todo: get correct width of emojis
	return stringWidth(str);
}

exports.tableHeading = function(people) {
	// define table column widths
	var longestReceiver = this.stringLength("receiver");
	var longestSender = this.stringLength("sender");
	var longestComment = this.stringLength("comments");
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
	var tableHeading = this.padString("Receiver", longestReceiver) + " | " + this.padString("Sender", longestSender) + " | Comments\n";
	tableHeading += "Total".padEnd(longestReceiver) + " | " + " ".padEnd(longestSender) + " | \n";
	tableHeading += "".padEnd(longestReceiver, "-") + "-+-" + "".padEnd(longestSender, "-") + "-+-" + "".padEnd(longestComment, "-") + "\n";
}
