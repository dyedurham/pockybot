import Rotation from '../lib/response-triggers/rotation';
import constants from '../constants';
import Config from '../lib/config';
import { MessageObject } from 'ciscospark/env';

const config = new Config(null);
beforeAll(() => {
	spyOn(config, 'getStringConfig').and.callFake((config : string) => {
		if (config == 'rotation') {
			return ['Team1,Team2'];
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

describe('rotation trigger', () => {
	const rotation = new Rotation(config);

	it('should return the message', async (done) => {
		let response = await rotation.createMessage();
		expect(response.markdown).toBeDefined();
		done();
	});
});

describe('testing rotation triggers', () => {
	const rotation = new Rotation(config);

	it('should accept trigger', () => {
		let message = createMessage(`<p><spark-mention data-object-type="person" data-object-id="${constants.botId}">${constants.botName}</spark-mention> rotation`);
		let results = rotation.isToTriggerOn(message)
		expect(results).toBe(true);
	});

	it('should reject wrong command', () => {
		let message = createMessage(`<p><spark-mention data-object-type="person" data-object-id="${constants.botId}">${constants.botName}</spark-mention> asdfrotation`);
		let results = rotation.isToTriggerOn(message)
		expect(results).toBe(false);
	});

	it('should reject wrong id', () => {
		let message = createMessage(`<p><spark-mention data-object-type="person" data-object-id="notabotID">${constants.botName}</spark-mention> rotation`);
		let results = rotation.isToTriggerOn(message)
		expect(results).toBe(false);
	});

	it('should accept no space', () => {
		let message = createMessage(`<p><spark-mention data-object-type="person" data-object-id="${constants.botId}">${constants.botName}</spark-mention>rotation`);
		let results = rotation.isToTriggerOn(message)
		expect(results).toBe(true);
	});

	it('should accept trailing space', () => {
		let message = createMessage(`<p><spark-mention data-object-type="person" data-object-id="${constants.botId}">${constants.botName}</spark-mention> rotation `);
		let results = rotation.isToTriggerOn(message)
		expect(results).toBe(true);
	});
});

describe('testing rotation PM triggers', () => {
	const rotation = new Rotation(config);

	it('should accept trigger', () => {
		let message = createPrivateMessage('rotation');
		let results = rotation.isToTriggerOnPM(message)
		expect(results).toBe(true);
	});

	it('should reject wrong command', () => {
		let message = createPrivateMessage('keyyywrods');
		let results = rotation.isToTriggerOnPM(message)
		expect(results).toBe(false);
	});

	it('should accept whitespace around', () => {
		let message = createPrivateMessage(' rotation ');
		let results = rotation.isToTriggerOnPM(message)
		expect(results).toBe(true);
	});

	it('should accept capitalised command', () => {
		let message = createPrivateMessage('Rotation');
		let results = rotation.isToTriggerOnPM(message)
		expect(results).toBe(true);
	});
});
