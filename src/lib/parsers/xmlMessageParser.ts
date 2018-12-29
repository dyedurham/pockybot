import * as xml from 'libxmljs';
import unescape = require('unescape');
import __logger from '../logger';
import { MessageObject } from 'ciscospark/env';

interface ParsedMessage {
	fromPerson : string;
	toPersonId : string;
	botId : string;
	children : xml.Element[];
	comment : string;
}

function parseMessage(message : MessageObject) : ParsedMessage {
	try {
		let xmlMessage : xml.Document = this.getMessageXml(message);
		let children : xml.Element[] = (xmlMessage.root().childNodes() as xml.Element[]);
		let parsedMessage : ParsedMessage = {
			fromPerson: message.personId,
			toPersonId: message.mentionedPeople[1],
			botId: message.mentionedPeople[0],
			children: children,
			comment: children.reduce((a, child, index) => {
				// first three children should be mentions or command words
				if (child.name() !== 'spark-mention' && index > 2) {
					return a + child.text();
				}
				return a;
			}, '').trim()
		}

		return parsedMessage;
	} catch (e) {
		__logger.error(`Error in parseMessage:\n${e.message}`);
		throw new Error('Error in parseMessage');
	}
}

function getMessageXml(message : MessageObject) : xml.Document {
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

export default {
	parseMessage,
	getMessageXml,
}

export {
	ParsedMessage
}
