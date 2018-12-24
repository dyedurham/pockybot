const xml = require('libxmljs');
const unescape = require('unescape');

module.exports = {
	parseMessage(message) {
		try {
			let parsedMessage = {};
			let xmlMessage = this.getMessageXml(message);
			parsedMessage.fromPerson = message.personId;
			parsedMessage.toPersonId = message.mentionedPeople[1];
			parsedMessage.botId = message.mentionedPeople[0];
			parsedMessage.children = xmlMessage.root().childNodes();
			parsedMessage.comment = parsedMessage.children.reduce((a, child, index) => {
				// first three children should be mentions or command words
				if (child.name() !== 'spark-mention' && index > 2) {
					return a + child.text();
				}
				return a;
			}, '').trim();

			return parsedMessage;
		} catch (e) {
			__logger.error(`Error in parseMessage:\n${e.message}`);
			throw new Error("Error in parseMessage");
		}
	},

	getMessageXml(message) {
		// Sometimes html is sent as html entities e.g. '&lt;' instead of '<'.
		// Ensure it is encoded correctly
		unescape.chars['&amp;'] = '&amp;';
		let unencoded = unescape(message.html);
		// XML parsing requires root node. If it doesn't exist, add one.
		if (!unencoded.toLowerCase().startsWith('<p>')) {
			unencoded = '<p>' + unencoded.trim();
		}
		if (!unencoded.toLowerCase().trim().endsWith('</p>')) {
			unencoded = unencoded.trim() + '</p>';
		}
		return xml.parseXml(unencoded);
	}
}
