import { ResultRow } from '../models/database';
import { PockyDB } from '../lib/database/db-interfaces';
import MockPockyDb from './mocks/mock-pockydb';
import { DefaultWinnersService, WinnersService } from '../lib/services/winners-service';
import Config from '../lib/config';
import Utilities from '../lib/utilities';
import { PegService } from '../lib/services/peg-service';
import { Peg } from '../models/peg';

const config = new Config(null);

beforeAll(() => {
	spyOn(config, 'getStringConfig').and.callFake((config : string) => {
		if (config == 'keyword') {
			return ['customer', 'brave', 'awesome', 'collaborative', 'real', 'test'];
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

	it('should return correct winners', (done: DoneFn) => {
		let results: Peg[] = [
			{
				senderId: '100',
				senderName: 'Jim',
				receiverId: '101',
				receiverName: 'GifBot',
				comment: 'shame',
				categories: [],
				isValid: false
			},
			{
				senderId: '100',
				senderName: 'Jim',
				receiverId: '102',
				receiverName: 'Laura',
				comment: 'shame',
				categories: [],
				isValid: false
			},
			{
				senderId: '100',
				senderName: 'Jim',
				receiverId: '103',
				receiverName: 'Gillian',
				comment: 'shame',
				categories: [],
				isValid: false
			},
			{
				senderId: '100',
				senderName: 'Jim',
				receiverId: '104',
				receiverName: 'Blake',
				comment: 'shame',
				categories: [],
				isValid: false
			},
			{
				senderId: '100',
				senderName: 'Jim',
				receiverId: '105',
				receiverName: 'OtherBot',
				comment: 'shame',
				categories: [],
				isValid: false
			},
			{
				senderId: '100',
				senderName: 'Jim',
				receiverId: '106',
				receiverName: 'Evelyne',
				comment: 'shame more',
				categories: [],
				isValid: false
			},
			{
				senderId: '100',
				senderName: 'Jim',
				receiverId: '102',
				receiverName: 'Laura',
				comment: 'brave shame iOS',
				categories: ['brave'],
				isValid: true
			},
			{
				senderId: '100',
				senderName: 'Jim',
				receiverId: '102',
				receiverName: 'Laura',
				comment: 'shame iOS',
				categories: [],
				isValid: false
			},
			{
				senderId: '100',
				senderName: 'Jim',
				receiverId: '102',
				receiverName: 'Laura',
				comment: 'awesome iOS',
				categories: ['awesome'],
				isValid: true
			},
			{
				senderId: '100',
				senderName: 'Jim',
				receiverId: '103',
				receiverName: 'Gillian',
				comment: 'amusijg mistake with test pegs',
				categories: ['test'],
				isValid: true
			},
			{
				senderId: '100',
				senderName: 'Jim',
				receiverId: '102',
				receiverName: 'Laura',
				comment: 'test iOS peg',
				categories: ['test'],
				isValid: true
			},
			{
				senderId: '100',
				senderName: 'Jim',
				receiverId: '102',
				receiverName: 'Laura',
				comment: 'for fixing your tests',
				categories: ['test'],
				isValid: true
			},
			{
				senderId: '100',
				senderName: 'Jim',
				receiverId: '102',
				receiverName: 'Laura',
				comment: 'awesome making PockyBot work',
				categories: ['awesome'],
				isValid: true
			},
			{
				senderId: '100',
				senderName: 'Jim',
				receiverId: '106',
				receiverName: 'Evelyne',
				comment: 'awesome making PockyBot work',
				categories: ['awesome'],
				isValid: true
			},
			{
				senderId: '100',
				senderName: 'Jim',
				receiverId: '102',
				receiverName: 'Laura',
				comment: 'test from web',
				categories: ['test'],
				isValid: true
			},
			{
				senderId: '100',
				senderName: 'Jim',
				receiverId: '102',
				receiverName: 'Laura',
				comment: 'test from iOS',
				categories: ['test'],
				isValid: true
			},
			{
				senderId: '100',
				senderName: 'Jim',
				receiverId: '106',
				receiverName: 'Evelyne',
				comment: 'test web',
				categories: ['test'],
				isValid: true
			},
			{
				senderId: '100',
				senderName: 'Jim',
				receiverId: '106',
				receiverName: 'Evelyne',
				comment: 'test iOS',
				categories: ['test'],
				isValid: true
			},
			{
				senderId: '100',
				senderName: 'Jim',
				receiverId: '107',
				receiverName: 'Nicole',
				comment: 'test radicalisation',
				categories: ['test'],
				isValid: true
			},
			{
				senderId: '106',
				senderName: 'Evelyne',
				receiverId: '100',
				receiverName: 'Jim',
				comment: 'real',
				categories: ['real'],
				isValid: true
			},
			{
				senderId: '106',
				senderName: 'Evelyne',
				receiverId: '103',
				receiverName: 'Gillian',
				comment: 'real',
				categories: ['real'],
				isValid: true
			},
			{
				senderId: '106',
				senderName: 'Evelyne',
				receiverId: '103',
				receiverName: 'Gillian',
				comment: 'test awesome',
				categories: ['test', 'awesome'],
				isValid: true
			},
			{
				senderId: '106',
				senderName: 'Evelyne',
				receiverId: '102',
				receiverName: 'Laura',
				comment: 'awesome',
				categories: ['awesome'],
				isValid: true
			},
			{
				senderId: '106',
				senderName: 'Evelyne',
				receiverId: '102',
				receiverName: 'Laura',
				comment: 'brave',
				categories: ['brave'],
				isValid: true
			},
			{
				senderId: '106',
				senderName: 'Evelyne',
				receiverId: '102',
				receiverName: 'Laura',
				comment: 'brave',
				categories: ['brave'],
				isValid: true
			},
			{
				senderId: '106',
				senderName: 'Evelyne',
				receiverId: '102',
				receiverName: 'Laura',
				comment: 'shame',
				categories: ['shame'],
				isValid: false
			},
			{
				senderId: '102',
				senderName: 'Laura',
				receiverId: '103',
				receiverName: 'Gillian',
				comment: 'customer',
				categories: ['customer'],
				isValid: true
			},
			{
				senderId: '102',
				senderName: 'Laura',
				receiverId: '100',
				receiverName: 'Jim',
				comment: 'test awesome',
				categories: ['test', 'awesome'],
				isValid: true
			},
			{
				senderId: '102',
				senderName: 'Laura',
				receiverId: '100',
				receiverName: 'Jim',
				comment: 'test awesome',
				categories: ['test', 'awesome'],
				isValid: true
			},
			{
				senderId: '102',
				senderName: 'Laura',
				receiverId: '105',
				receiverName: 'OtherBot',
				comment: 'test awesome',
				categories: ['test', 'awesome'],
				isValid: true
			},
			{
				senderId: '102',
				senderName: 'Laura',
				receiverId: '106',
				receiverName: 'Evelyne',
				comment: 'awesome',
				categories: ['awesome'],
				isValid: true
			},
			{
				senderId: '103',
				senderName: 'Gillian',
				receiverId: '100',
				receiverName: 'Jim',
				comment: 'customer',
				categories: ['customer'],
				isValid: true
			},
			{
				senderId: '103',
				senderName: 'Gillian',
				receiverId: '100',
				receiverName: 'Jim',
				comment: 'customer',
				categories: ['customer'],
				isValid: true
			},
			{
				senderId: '103',
				senderName: 'Gillian',
				receiverId: '102',
				receiverName: 'Laura',
				comment: 'real',
				categories: ['real'],
				isValid: true
			},
			{
				senderId: '103',
				senderName: 'Gillian',
				receiverId: '106',
				receiverName: 'Evelyne',
				comment: 'real',
				categories: ['real'],
				isValid: true
			},
			{
				senderId: '103',
				senderName: 'Gillian',
				receiverId: '108',
				receiverName: 'Nathanael',
				comment: 'really didnt know you were in here',
				categories: ['real'],
				isValid: true
			},
			{
				senderId: '109',
				senderName: 'Blake',
				receiverId: '103',
				receiverName: 'Gillian',
				comment: 'testing awesome code',
				categories: ['test', 'awesome'],
				isValid: true
			}
		];
		let response = winnersService.getWinners(results);
		expect(response.length).toBeGreaterThanOrEqual(3);
		done();
	})
});
