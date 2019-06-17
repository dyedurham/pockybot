import Winners from '../lib/response-triggers/winners';
import constants from '../constants';
import Config from '../lib/config';
import { MessageObject } from 'webex/env';
import { Role } from '../models/database';
import { WinnersService } from '../lib/services/winners-service';
import MockWinnersService from './mocks/mock-winners-service';

const config = new Config(null);

beforeAll(() => {
	spyOn(config, 'checkRole').and.callFake((userid : string, value : Role) => {
		if (userid === 'goodID' && value === Role.Admin) {
			return true;
		}
		else {
			return false;
		}
	});

	spyOn(config, 'getConfig').and.callFake((config : string) => {
		if (config === 'limit') {
			return 10;
		} else if (config === 'minimum') {
			return 5;
		} else if (config === 'winners') {
			return 3;
		} else if (config === 'commentsRequired') {
			return 1;
		} else if (config === 'pegWithoutKeyword') {
			return 0;
		}

		throw new Error('bad config');
	})
});

function createMessage(htmlMessage : string, person : string) : MessageObject {
	return {
		html: htmlMessage,
		personId: person
	}
}

function createWinnersService(success : boolean, message: string) : WinnersService {
	let winnersService = new MockWinnersService(success, message);
	return winnersService;
}

describe('creating a winners message', () => {
	let winnersService : WinnersService;
	let winners : Winners;
	const expectedMarkdown: string = 'test message for success';

	beforeEach(() => {
		winnersService = createWinnersService(true, expectedMarkdown);
		winners = new Winners(winnersService, config);
	});

	it('should create a proper message', async (done : DoneFn) => {
		let message = await winners.createMessage();
		expect(message.markdown).toBe(expectedMarkdown);
		done();
	});
});

describe('failing at creating a winners message', () => {
	let winnersService: WinnersService;
	let winners: Winners;

	beforeEach(() => {
		winnersService = createWinnersService(false, '');
		winners = new Winners(winnersService, config);
	});

	it('should create a proper message on fail', async (done : DoneFn) => {
		try {
			await winners.createMessage();
			fail('should have thrown an error');
		} catch (error) {
			expect(error.message).toBe('Error encountered; cannot display winners.');
		}

		done();
	});
});

describe('testing winners triggers', () => {
	let winners : Winners;

	beforeEach(() => {
		winners = new Winners(null, config);
	});

	it('should accept trigger', () => {
		let message = createMessage('<p><spark-mention data-object-type="person" data-object-id="' + constants.botId + '">' + constants.botName + '</spark-mention> winners',
			'goodID');
		let triggered = winners.isToTriggerOn(message)
		expect(triggered).toBe(true);
	});

	it('should reject wrong command', () => {
		let message = createMessage('<p><spark-mention data-object-type="person" data-object-id="' + constants.botId + '">' + constants.botName + '</spark-mention> asdfwinners',
			'goodID');
		let triggered = winners.isToTriggerOn(message)
		expect(triggered).toBe(false);
	});

	it('should reject wrong id', () => {
		let message = createMessage('<p><spark-mention data-object-type="person" data-object-id="notabotid">' + constants.botName + '</spark-mention> winners',
			'goodID');
		let triggered = winners.isToTriggerOn(message)
		expect(triggered).toBe(false);
	});

	it('should accept no space', () => {
		let message = createMessage('<p><spark-mention data-object-type="person" data-object-id="' + constants.botId + '">' + constants.botName + '</spark-mention>winners',
			'goodID');
		let triggered = winners.isToTriggerOn(message)
		expect(triggered).toBe(true);
	});

	it('should accept trailing space', () => {
		let message = createMessage('<p><spark-mention data-object-type="person" data-object-id="' + constants.botId + '">' + constants.botName + '</spark-mention> winners ',
			'goodID');
		let triggered = winners.isToTriggerOn(message)
		expect(triggered).toBe(true);
	});

	it('should fail with non admin', () => {
		let message = createMessage('<p><spark-mention data-object-type="person" data-object-id="' + constants.botId + '">' + constants.botName + '</spark-mention> winners',
			'badID');
		let triggered = winners.isToTriggerOn(message)
		expect(triggered).toBe(false);
	});

	it('should reject group mention', () => {
		let message = createMessage(`<p><spark-mention data-object-type="groupMention" data-group-type="all">All</spark-mention> winners`, 'goodID');
		let results = winners.isToTriggerOn(message)
		expect(results).toBe(false);
	});
});
