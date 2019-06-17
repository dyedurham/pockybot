import constants from '../constants';
import Ping from '../lib/response-triggers/ping';
import { MessageObject } from 'ciscospark/env';
import * as pjson from 'pjson';

import sinon = require('sinon');

function createMessage(htmlMessage : string) : MessageObject {
	return {
		html: htmlMessage
	}
}

function createPrivateMessage(message : string) : MessageObject {
	return {
		text: message
	}
}

describe('ping trigger', () => {
	const ping = new Ping();

	beforeEach(() => {
		const version: string = '1.0.1';
		sinon.replace(pjson, 'version', version)
		process.env.BUILD_NUMBER = '234';
	});

	afterEach(() => {
		sinon.restore();
	});

	it('should pong', async (done : DoneFn) => {
		let response = await ping.createMessage();
		expect(response.markdown).toBe('pong. I\'m alive! (version 1.0.1) (build 234)');
		done();
	});
});

describe('testing ping triggers', () => {
	const ping = new Ping();

	it('should accept trigger', () => {
		let message = createMessage('<p><spark-mention data-object-type="person" data-object-id="' + constants.botId + '">' + constants.botName + '</spark-mention> ping');
		let results = ping.isToTriggerOn(message)
		expect(results).toBe(true);
	});

	it('should reject wrong command', () => {
		let message = createMessage('<p><spark-mention data-object-type="person" data-object-id="' + constants.botId + '">' + constants.botName + '</spark-mention> yiping');
		let results = ping.isToTriggerOn(message)
		expect(results).toBe(false);
	});

	it('should reject wrong id', () => {
		let message = createMessage('<p><spark-mention data-object-type="person" data-object-id="notabotID">' + constants.botName + '</spark-mention> ping');
		let results = ping.isToTriggerOn(message)
		expect(results).toBe(false);
	});

	it('should accept no space', () => {
		let message = createMessage('<p><spark-mention data-object-type="person" data-object-id="' + constants.botId + '">' + constants.botName + '</spark-mention>ping');
		let results = ping.isToTriggerOn(message)
		expect(results).toBe(true);
	});

	it('should accept trailing space', () => {
		let message = createMessage('<p><spark-mention data-object-type="person" data-object-id="' + constants.botId + '">' + constants.botName + '</spark-mention> ping ');
		let results = ping.isToTriggerOn(message)
		expect(results).toBe(true);
	});

	it('should reject group mention', () => {
		let message = createMessage(`<p><spark-mention data-object-type="groupMention" data-group-type="all">All</spark-mention> ping`);
		let results = ping.isToTriggerOn(message)
		expect(results).toBe(false);
	});
});

describe('testing ping PM triggers', () => {
	const ping = new Ping();

	it('should accept trigger', () => {
		let message = createPrivateMessage('ping');
		let results = ping.isToTriggerOnPM(message)
		expect(results).toBe(true);
	});

	it('should reject wrong command', () => {
		let message = createPrivateMessage('ponggg');
		let results = ping.isToTriggerOnPM(message)
		expect(results).toBe(false);
	});

	it('should accept whitespace around', () => {
		let message = createPrivateMessage(' ping ');
		let results = ping.isToTriggerOnPM(message)
		expect(results).toBe(true);
	});

	it('should accept capitalised command', () => {
		let message = createPrivateMessage('Ping');
		let results = ping.isToTriggerOnPM(message)
		expect(results).toBe(true);
	});
});
