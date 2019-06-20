import { ResultRow } from '../models/database';
import { PockyDB } from '../lib/database/db-interfaces';
import MockPockyDb from './mocks/mock-pockydb';
import { DefaultWinnersService, WinnersService } from '../lib/services/winners-service';
import Config from '../lib/config';
import Utilities from '../lib/utilities';

const config = new Config(null);

beforeAll(() => {
	spyOn(config, 'getStringConfig').and.callFake((config : string) => {
		if (config == 'keyword') {
			return ['customer', 'brave', 'awesome', 'collaborative', 'real'];
		} else if (config == 'penaltyKeyword') {
			return ['shame'];
		}

		throw new Error('bad config');
	});

	spyOn(config, 'getConfig').and.callFake((config : string) => {
		if (config === 'limit') {
			return 5;
		} else if (config === 'minimum') {
			return 5;
		} else if (config === 'winners') {
			return 3;
		} else if (config === 'requireValues') {
			return 1;
		}

		throw new Error('bad config');
	});
});

function createData(): ResultRow[] {
	return [{
		receiver: 'mock receiver',
		sender: 'mock sender',
		comment: 'test awesome',
		receiverid: 'r1ID',
		senderid: 's1ID'
	},
	{
		receiver: 'mock receiver',
		sender: 'mock sender',
		comment: 'test brave',
		receiverid: 'r1ID',
		senderid: 's1ID'
	},
	{
		receiver: 'receiver 2',
		sender: 'mock sender 2',
		comment: 'test brave',
		receiverid: 'r2ID',
		senderid: 's2ID'
	},
	{
		receiver: 'mock sender',
		sender: 'mock receiver',
		comment: 'test customer',
		receiverid: 's1ID',
		senderid: 'r1ID'
	},
	{
		receiver: 'mock sender',
		sender: 'mock receiver',
		comment: 'test customer',
		receiverid: 's1ID',
		senderid: 'r1ID'
	},
	{
		receiver: 'mock sender',
		sender: 'mock receiver',
		comment: 'test customer',
		receiverid: 's1ID',
		senderid: 'r1ID'
	},
	{
		receiver: 'mock sender',
		sender: 'mock receiver',
		comment: 'test customer',
		receiverid: 's1ID',
		senderid: 'r1ID'
	},
	{
		receiver: 'mock sender',
		sender: 'mock receiver',
		comment: 'test customer',
		receiverid: 's1ID',
		senderid: 'r1ID'
	}];
}

function createDatabase(success: boolean, data: ResultRow[]): PockyDB {
	return new MockPockyDb(true, 1, true, 1, success ? data : undefined);
}

describe('winners service', () => {
	let winnersService: WinnersService;
	let database: PockyDB;
	let data: ResultRow[];

	beforeEach(() => {
		const utilities = new Utilities(config);
		data = createData();
		database = createDatabase(true, data);
		winnersService = new DefaultWinnersService(database, config, utilities, null);
	});

	xit('should parse a proper message', async (done : DoneFn) => {
		let message = await winnersService.returnWinnersResponse();
		expect(message).toBe('```\n' +
'  Receiver    |   Sender    | Comments\n' +
'Total         |             | \n' +
'--------------+-------------+-------------\n' +
'mock receiver |             | \n' +
'2             | mock sender | test awesome\n' +
'              | mock sender | test brave\n' +
'```');
		done();
	});
});
