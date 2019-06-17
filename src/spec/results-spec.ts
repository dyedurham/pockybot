import Results from '../lib/response-triggers/results';
import constants from '../constants';
import { MessageObject } from 'ciscospark/env';
import { Role } from '../models/database';
import MockConfig from './mocks/mock-config';

const config = new MockConfig(10, 5, 3, 1, 0, 1, ['one', 'two', 'three'], ['shame']);
import MockResultsService from './mocks/mock-results-service';
import { ResultsService } from '../lib/services/results-service';

beforeAll(() => {
	spyOn(config, 'checkRole').and.callFake((userid : string, value : Role) => {
		if (userid === 'mockAdminID' && value === Role.Admin) {
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
	});
});

function createMessage(htmlMessage : string, person : string) : MessageObject {
	return {
		html: htmlMessage,
		personId: person
	}
}

describe('creating a results message', () => {
	const markdownResponse : string = 'Test Markdown Response';
	let resultsService: ResultsService;
	let results : Results;

	beforeEach(() => {
		resultsService = new MockResultsService(true, markdownResponse)
		results = new Results(resultsService, config);
	});

	it('should create a proper message', async (done : DoneFn) => {
		let message = await results.createMessage();
		expect(message.markdown).toBe(markdownResponse);
		done();
	});
});

describe('failing at creating a results message', () => {
	const markdownResponse: string = 'Test Markdown Response';
	let resultsService: ResultsService;
	let results: Results;

	beforeEach(() => {
		resultsService = new MockResultsService(false, markdownResponse)
		results = new Results(resultsService, config);
	});

	it('should create a proper message on fail', async (done : DoneFn) => {
		try {
			await results.createMessage();
			fail('should have thrown an error');
		} catch (error) {
			expect(error.message).toBe('Error encountered; cannot display results.')
		}
		done();
	});
});

describe('testing results triggers', () => {
	let results : Results;

	beforeEach(() => {
		results = new Results(null, config);
	});

	it('should accept trigger', () => {
		let message = createMessage('<p><spark-mention data-object-type="person" data-object-id="' + constants.botId + '">' + constants.botName + '</spark-mention> results',
			'mockAdminID');
		let triggered = results.isToTriggerOn(message)
		expect(triggered).toBe(true);
	});

	it('should reject wrong command', () => {
		let message = createMessage('<p><spark-mention data-object-type="person" data-object-id="' + constants.botId + '">' + constants.botName + '</spark-mention> asdfresults',
			'mockAdminID');
		let triggered = results.isToTriggerOn(message)
		expect(triggered).toBe(false);
	});

	it('should reject wrong id', () => {
		let message = createMessage('<p><spark-mention data-object-type="person" data-object-id="badID">' + constants.botName + '</spark-mention> results',
			'mockAdminID');
		let triggered = results.isToTriggerOn(message)
		expect(triggered).toBe(false);
	});

	it('should accept no space', () => {
		let message = createMessage('<p><spark-mention data-object-type="person" data-object-id="' + constants.botId + '">' + constants.botName + '</spark-mention>results',
			'mockAdminID');
		let triggered = results.isToTriggerOn(message)
		expect(triggered).toBe(true);
	});

	it('should accept trailing space', () => {
		let message = createMessage('<p><spark-mention data-object-type="person" data-object-id="' + constants.botId + '">' + constants.botName + '</spark-mention> results ',
			'mockAdminID');
		let triggered = results.isToTriggerOn(message)
		expect(triggered).toBe(true);
	});

	it('should fail with non admin', () => {
		let message = createMessage('<p><spark-mention data-object-type="person" data-object-id="' + constants.botId + '">' + constants.botName + '</spark-mention> results',
			'mockID');
		let triggered = results.isToTriggerOn(message)
		expect(triggered).toBe(false);
	});

	it('should reject group mention', () => {
		let message = createMessage(`<p><spark-mention data-object-type="groupMention" data-group-type="all">All</spark-mention> results`, 'mockAdminID');
		let triggered = results.isToTriggerOn(message)
		expect(triggered).toBe(false);
	});
});
