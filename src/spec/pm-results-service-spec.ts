import { PockyDB } from '../lib/database/db-interfaces';
import { CiscoSpark } from 'ciscospark/env';
import { DefaultPmResultsService, PmResultsService } from '../lib/services/pm-results-service';
import { ResultRow } from '../models/database';
import MockPockyDb from './mocks/mock-pockydb';
import MockCiscoSpark from './mocks/mock-spark';

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

describe('pm results service', () => {
	let data: ResultRow[];
	let database: PockyDB;
	let spark: CiscoSpark;
	let pmResultsService: PmResultsService;

	beforeEach(() => {
		data = createData();
		database = createDatabase(true, data);
		spark = new MockCiscoSpark();
		pmResultsService = new DefaultPmResultsService(database, spark);
	});

	it('should pm users with their results', async(done: DoneFn) => {
		await pmResultsService.pmResults();
		done();
	});
});
