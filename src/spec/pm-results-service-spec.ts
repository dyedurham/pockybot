import { PockyDB } from '../lib/database/db-interfaces';
import { Webex } from 'webex/env';
import { DefaultPmResultsService, PmResultsService } from '../lib/services/pm-results-service';
import { ResultRow } from '../models/database';
import MockPockyDb from './mocks/mock-pockydb';
import MockWebex from './mocks/mock-spark';
import utilities from '../lib/utilities';

function createData(): ResultRow[] {
	return [{
		'receiver': 'mock receiver',
		'receiverid': 'mockID',
		'sender': 'mock sender',
		'senderid': 'mockSenderID',
		'comment': ' test'
	}];
}

function createDatabase(success: boolean, data: ResultRow[]): PockyDB {
	let db = new MockPockyDb(true, 1, true, 1, success ? data : undefined);
	return db;
}

describe('pm results service', () => {
	let data: ResultRow[];
	let database: PockyDB;
	let spark: Webex;
	let pmResultsService: PmResultsService;

	beforeEach(() => {
		data = createData();
		database = createDatabase(true, data);
		spark = new MockWebex();
		pmResultsService = new DefaultPmResultsService(database, spark, null);
	});

	xit('should pm users with their results', async(done: DoneFn) => {
		await pmResultsService.pmResults();
		done();
	});
});
