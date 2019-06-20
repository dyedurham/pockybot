import * as xml from 'libxmljs';
const unescape = require('unescape');
import { Logger } from '../logger';
import { MessageObject } from 'webex/env';
import { ParsedMessage } from '../../models/parsed-message';
import constants from '../../constants';
import { Argument } from '../../models/argument';

function parsePegMessage(message : MessageObject) : ParsedMessage {
	try {
		let children : xml.Element[] = parseXmlMessage(message);
		let parsedMessage : ParsedMessage = {
			fromPerson: message.personId,
			toPersonId: children.length > 2 && isMentionOfPerson(children[2])
				? getPersonId(children[2].attr('data-object-id').value()) : null,
			botId: children.length > 0 && isMentionOfPerson(children[0])
				? getPersonId(children[0].attr('data-object-id').value()) : null,
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
		Logger.error(`[xmlMessageParser.parsePegMessage] Error parsing message as XML: ${e.message}`);
		throw new Error('Error in parseMessage');
	}
}

function parseNonPegMessage(message : MessageObject) : ParsedMessage {
	let children : xml.Element[] = parseXmlMessage(message);
	let parsedMessage : ParsedMessage = {
		fromPerson: message.personId,
		botId: children.length > 0 && isMentionOfPerson(children[0])
			? getPersonId(children[0].attr('data-object-id').value()) : null,
		children,
		command: children.reduce((a, child, index) => {
			// first child should be mention
			if (index > 0) {
				return a + child.text();
			}
			return a;
		}, '').trim()
	}

	return parsedMessage;
}

function parseOutArgs(message: MessageObject) : Argument[] {
	const parsedMessage = parseXmlMessage(message);
	const output : Argument[] = [];

	parsedMessage.forEach(element => {
		if (element.name() === 'spark-mention') {
			if (element.attr('data-object-type').value() === 'groupMention') {
				throw new Error('Group mentions are not allowed');
			}

			output.push({
				text: element.text(),
				isMention: true,
				userId: getPersonId(element.attr('data-object-id').value())
			});
		} else {
			const text = element.text();
			let words = text.trim().split(' ').filter(x => x !== '');
			words.forEach(word => {
				output.push({
					text: word,
					isMention: false
				});
			})
		}
	});

	return output;
}

function isMentionOfPerson(element: xml.Element) {
	return element.name() === 'spark-mention' && element.attr('data-object-type').value() === 'person';
}

function getPersonId(id: string) : string {
	if (id.indexOf('-') >= 0) {
		return Buffer.from(constants.sparkTokenPrefix + id).toString('base64').replace(new RegExp('=', 'g'), '');
	}

	return id;
}

function parseXmlMessage(message : MessageObject) : xml.Element[] {
	const xmlMessage : xml.Document = getMessageXml(message);
	const children : xml.Element[] = (xmlMessage.root().childNodes() as xml.Element[]);

	return children;
}

function getMessageXml(message : MessageObject) : xml.Document {
	// Sometimes html is sent as html entities e.g. '&lt;' instead of '<'.
	// Ensure it is encoded correctly
	unescape.chars['&amp;'] = '&amp;';
	let unencoded = unescape(message.html);

	// XML parsing requires root node. If it doesn't exist, add one.
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
	parseNonPegMessage,
	parseOutArgs,
	getMessageXml,
	parseXmlMessage,
	getPersonId,
	isMentionOfPerson
}

export {
	ParsedMessage
}
