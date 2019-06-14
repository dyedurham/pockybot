import Keywords from '../lib/response-triggers/keywords';
import constants from '../constants';
import Config from '../lib/config';
import { MessageObject } from 'ciscospark/env';

const config = new Config(null);
beforeAll(() => {
	spyOn(config, 'getStringConfig').and.callFake((config : string) => {
		if (config === 'keyword') {
			return ['customer', 'brave', 'awesome', 'collaborative', 'real'];
		} else if (config === 'penaltyKeyword') {
			return ['shame'];
		}

		throw new Error(`bad config: ${config}`);
	});
});

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

describe('keywords trigger', () => {
	const keywords = new Keywords(config);

	it('should return the message', async (done) => {
		let response = await keywords.createMessage();
		expect(response.markdown).toBeDefined();
		done();
	});
});

describe('testing keywords triggers', () => {
	const keywords = new Keywords(config);

	it('should accept trigger', () => {
		let message = createMessage(`<p><spark-mention data-object-type="person" data-object-id="${constants.botId}">${constants.botName}</spark-mention> keywords`);
		let results = keywords.isToTriggerOn(message)
		expect(results).toBe(true);
	});

	it('should reject wrong command', () => {
		let message = createMessage(`<p><spark-mention data-object-type="person" data-object-id="${constants.botId}">${constants.botName}</spark-mention> asdfkeywords`);
		let results = keywords.isToTriggerOn(message)
		expect(results).toBe(false);
	});

	it('should reject wrong id', () => {
		let message = createMessage(`<p><spark-mention data-object-type="person" data-object-id="notabotID">${constants.botName}</spark-mention> keywords`);
		let results = keywords.isToTriggerOn(message)
		expect(results).toBe(false);
	});

	it('should accept no space', () => {
		let message = createMessage(`<p><spark-mention data-object-type="person" data-object-id="${constants.botId}">${constants.botName}</spark-mention>keywords`);
		let results = keywords.isToTriggerOn(message)
		expect(results).toBe(true);
	});

	it('should accept trailing space', () => {
		let message = createMessage(`<p><spark-mention data-object-type="person" data-object-id="${constants.botId}">${constants.botName}</spark-mention> keywords `);
		let results = keywords.isToTriggerOn(message)
		expect(results).toBe(true);
	});
});

describe('testing keywords PM triggers', () => {
	const keywords = new Keywords(config);

	it('should accept trigger', () => {
		let message = createPrivateMessage('keywords');
		let results = keywords.isToTriggerOnPM(message)
		expect(results).toBe(true);
	});

	it('should reject wrong command', () => {
		let message = createPrivateMessage('keyyywrods');
		let results = keywords.isToTriggerOnPM(message)
		expect(results).toBe(false);
	});

	it('should accept whitespace around', () => {
		let message = createPrivateMessage(' keywords ');
		let results = keywords.isToTriggerOnPM(message)
		expect(results).toBe(true);
	});

	it('should accept capitalised command', () => {
		let message = createPrivateMessage('Keywords');
		let results = keywords.isToTriggerOnPM(message)
		expect(results).toBe(true);
	});
});
