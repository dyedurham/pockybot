import Keywords from '../lib/response-triggers/keywords';
import constants from '../constants';
import Config from '../lib/config';
import { MessageObject } from 'ciscospark/env';

const config = new Config(null);
beforeAll(() => {
	spyOn(config, 'getStringConfig').and.callFake((config : string) => {
		if (config == 'keyword') {
			return ['customer', 'brave', 'awesome', 'collaborative', 'real'];
		}

		throw new Error('bad config');
	});
})

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

describe('ponging the ping', function() {
	const keywords = new Keywords(config);

	it('should pong', function (done) {
		keywords.createMessage()
		.then((response) => {
			expect(response.markdown).toBeDefined();
			done();
		});
	});
});

describe('testing triggers', function() {
	const keywords = new Keywords(config);

	it('should accept trigger', function () {
		let message = createMessage(`<p><spark-mention data-object-type="person" data-object-id="${constants.botId}">${constants.botName}</spark-mention> keywords`);
		let results = keywords.isToTriggerOn(message)
		expect(results).toBe(true);
	});

	it('should reject wrong command', function () {
		let message = createMessage(`<p><spark-mention data-object-type="person" data-object-id="${constants.botId}">${constants.botName}</spark-mention> asdfkeywords`);
		let results = keywords.isToTriggerOn(message)
		expect(results).toBe(false);
	});

	it('should reject wrong id', function () {
		let message = createMessage(`<p><spark-mention data-object-type="person" data-object-id="notabotID">${constants.botName}</spark-mention> keywords`);
		let results = keywords.isToTriggerOn(message)
		expect(results).toBe(false);
	});

	it('should accept no space', function () {
		let message = createMessage(`<p><spark-mention data-object-type="person" data-object-id="${constants.botId}">${constants.botName}</spark-mention>keywords`);
		let results = keywords.isToTriggerOn(message)
		expect(results).toBe(true);
	});

	it('should accept trailing space', function () {
		let message = createMessage(`<p><spark-mention data-object-type="person" data-object-id="${constants.botId}">${constants.botName}</spark-mention> keywords `);
		let results = keywords.isToTriggerOn(message)
		expect(results).toBe(true);
	});
});

describe('testing PM triggers', function() {
	const keywords = new Keywords(config);

	it('should accept trigger', function () {
		let message = createPrivateMessage('keywords');
		let results = keywords.isToTriggerOnPM(message)
		expect(results).toBe(true);
	});

	it('should reject wrong command', function () {
		let message = createPrivateMessage('keyyywrods');
		let results = keywords.isToTriggerOnPM(message)
		expect(results).toBe(false);
	});

	it('should accept whitespace around', function () {
		let message = createPrivateMessage(' keywords ');
		let results = keywords.isToTriggerOnPM(message)
		expect(results).toBe(true);
	});

	it('should accept capitalised command', function () {
		let message = createPrivateMessage('Keywords');
		let results = keywords.isToTriggerOnPM(message)
		expect(results).toBe(true);
	});
});
