import constants from '../constants';
import Ping from '../lib/response-triggers/ping';
import { MessageObject } from 'ciscospark/env';

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

describe('testing response', function() {
	const ping = new Ping();

	it('should pong', function (done) {
		ping.createMessage()
		.then((response) => {
			expect(response.markdown).toBe('pong. I\'m alive!');
			done();
		});
	});
});

describe('testing triggers', function() {
	const ping = new Ping();

	it('should accept trigger', function () {
		let message = createMessage('<p><spark-mention data-object-type="person" data-object-id="' + constants.botId + '">' + constants.botName + '</spark-mention> ping');
		let results = ping.isToTriggerOn(message)
		expect(results).toBe(true);
	});

	it('should reject wrong command', function () {
		let message = createMessage('<p><spark-mention data-object-type="person" data-object-id="' + constants.botId + '">' + constants.botName + '</spark-mention> yiping');
		let results = ping.isToTriggerOn(message)
		expect(results).toBe(false);
	});

	it('should reject wrong id', function () {
		let message = createMessage('<p><spark-mention data-object-type="person" data-object-id="notabotID">' + constants.botName + '</spark-mention> ping');
		let results = ping.isToTriggerOn(message)
		expect(results).toBe(false);
	});

	it('should accept no space', function () {
		let message = createMessage('<p><spark-mention data-object-type="person" data-object-id="' + constants.botId + '">' + constants.botName + '</spark-mention>ping');
		let results = ping.isToTriggerOn(message)
		expect(results).toBe(true);
	});

	it('should accept trailing space', function () {
		let message = createMessage('<p><spark-mention data-object-type="person" data-object-id="' + constants.botId + '">' + constants.botName + '</spark-mention> ping ');
		let results = ping.isToTriggerOn(message)
		expect(results).toBe(true);
	});
});

describe('testing PM triggers', function() {
	const ping = new Ping();

	it('should accept trigger', function () {
		let message = createPrivateMessage('ping');
		let results = ping.isToTriggerOnPM(message)
		expect(results).toBe(true);
	});

	it('should reject wrong command', function () {
		let message = createPrivateMessage('ponggg');
		let results = ping.isToTriggerOnPM(message)
		expect(results).toBe(false);
	});

	it('should accept whitespace around', function () {
		let message = createPrivateMessage(' ping ');
		let results = ping.isToTriggerOnPM(message)
		expect(results).toBe(true);
	});

	it('should accept capitalised command', function () {
		let message = createPrivateMessage('Ping');
		let results = ping.isToTriggerOnPM(message)
		expect(results).toBe(true);
	});
});
