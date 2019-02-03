import { ResultRow } from "../models/database";
import { PockyDB } from "../lib/database/db-interfaces";
import MockPockyDb from "./mocks/mock-pockydb";
import WinnersService, { IWinnersService } from '../lib/services/winners-service';

function createData(): ResultRow[] {
	return [{
		'receiver': 'mock receiver',
		'receiverid': 'mockID',
		'sender': 'mock sender',
		'comment': ' test'
	}];
}

function createDatabase(success: boolean, data: ResultRow[]): PockyDB {
	let db = new MockPockyDb(true, 1, true, 1, success ? data : undefined);
	return db;
}

describe('winners service', () => {
	let winnersService: IWinnersService;
	let database: PockyDB;
	let data: ResultRow[];

	beforeEach(() => {
		data = createData();
		database = createDatabase(true, data);
		winnersService = new WinnersService(database);
	});

	it('should parse a proper message', async (done : DoneFn) => {
		let message = await winnersService.returnWinnersResponse();
		expect(message).toBe('```\n' +
'  Receiver    |   Sender    | Comments\n' +
'Total         |             | \n' +
'--------------+-------------+---------\n' +
'mock receiver |             | \n' +
'1             | mock sender |  test\n' +
'```');
		done();
	});
});
