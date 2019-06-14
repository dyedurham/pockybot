import * as xml from 'libxmljs';
const unescape = require('unescape');
import __logger from '../logger';
import { MessageObject } from 'ciscospark/env';
import { ParsedMessage } from '../../models/parsed-message';
import constants from '../../constants';

function parsePegMessage(message : MessageObject) : ParsedMessage {
	try {
		let xmlMessage : xml.Document = this.getMessageXml(message);
		let children : xml.Element[] = (xmlMessage.root().childNodes() as xml.Element[]);
		let parsedMessage : ParsedMessage = {
			fromPerson: message.personId,
			toPersonId: children.length > 2 && children[2].name() === 'spark-mention' ? getPersonId(children[2].attr('data-object-id').value()) : null,
			botId: children.length > 0 && children[0].name() === 'spark-mention' ? getPersonId(children[0].attr('data-object-id').value()) : null,
			children,
			comment: children.reduce((a, child, index) => {
				// first three children should be mentions or command words
				if (index > 2) {
					return a + child.text();
				}
				return a;
			}, '').trim()
		}

		return parsedMessage;
	} catch (e) {
		__logger.error(`[xmlMessageParser.parsePegMessage] Error parsing message as XML: ${e.message}`);
		throw new Error('Error in parseMessage');
	}
}

function getPersonId(id: string) : string {
	if (id.indexOf('-') >= 0) {
		return Buffer.from(constants.sparkTokenPrefix + id).toString('base64').replace(new RegExp('=', 'g'), '');
	}

	return id;
}

function parseXmlMessage(message : MessageObject) : xml.Element[] {
	const xmlMessage : xml.Document = this.getMessageXml(message);
	const children : xml.Element[] = (xmlMessage.root().childNodes() as xml.Element[]);

	return children;
}

function getMessageXml(message : MessageObject) : xml.Document {
	// Sometimes html is sent as html entities e.g. '&lt;' instead of '<'.
	// Ensure it is encoded correctly
	unescape.chars['&amp;'] = '&amp;';
	let unencoded = unescape(message.html);

	if (!unencoded.toLowerCase().trim().startsWith('<p>') && !unencoded.toLowerCase().trim().startsWith('<div>')) {
		unencoded = '<p>' + unencoded.trim();
	}
	if (!unencoded.toLowerCase().trim().endsWith('</p>') && !unencoded.toLowerCase().trim().endsWith('</div>')) {
		unencoded = unencoded.trim() + '</p>';
	}
	return xml.parseXml(unencoded);
}

export default {
	parsePegMessage,
	getMessageXml,
	parseXmlMessage
}

export {
	ParsedMessage
}
