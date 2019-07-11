import { PockyDB } from '../lib/database/db-interfaces';
import { Webex } from 'webex/env';
import { DefaultPmResultsService, PmResultsService } from '../lib/services/pm-results-service';
import { ResultRow } from '../models/database';
import MockPockyDb from './mocks/mock-pockydb';
import MockWebex from './mocks/mock-spark';
import utilities from '../lib/utilities';
import { ResultsService } from '../lib/services/results-service';
import { Arg, Substitute } from '@fluffy-spoon/substitute';
import { PegService } from '../lib/services/peg-service';
import MockDataService from './services/mock-data-service';
import { Peg } from '../models/peg';

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
		spyOn(spark.messages, 'create').and.callThrough();
		let pegService = Substitute.for<PegService>();
		pegService.getPegs(null).returns([]);
		let resultsService = Substitute.for<ResultsService>();
		let results = [
			{
				personId: 'p1',
				personName: 'Luke',
				weightedPegsReceived: 3,
				validPegsReceived: [
					MockDataService.createPeg('p1', 'Luke', 'p2', 'Gillian', '', [], true),
					MockDataService.createPeg('p1', 'Luke', 'p3', 'Dula', '', [], true),
					MockDataService.createPeg('p1', 'Luke', 'p3', 'Dula', '', [], true),
					MockDataService.createPeg('p1', 'Luke', 'p2', 'Gillian', '', [], true),
				],
				penaltyPegsGiven: [
					MockDataService.createPeg('b1', 'Gif', 'p1', 'Luke', '', [], false)
				]
			},
			{
				personId: 'p2',
				personName: 'Gillian',
				weightedPegsReceived: 2,
				validPegsReceived: [
					MockDataService.createPeg('p2', 'Gillian', 'p3', 'Dula', '', [], true),
					MockDataService.createPeg('p2', 'Gillian', 'p1', 'Luke', '', [], true),
				],
				penaltyPegsGiven: []
			},
			{
				personId: 'p3',
				personName: 'Dula',
				weightedPegsReceived: 1,
				validPegsReceived: [
					MockDataService.createPeg('p3', 'Dula', 'p2', 'Gillian', '', [], true),
				],
				penaltyPegsGiven: []
			},
			{
				personId: 'p4',
				personName: 'Jim',
				weightedPegsReceived: -1,
				validPegsReceived: [],
				penaltyPegsGiven: [
					MockDataService.createPeg('b2', 'Gif', 'p1', 'Luke', '', [], false),
				]
			}
		];
		resultsService.getResults(Arg.any()).returns(results);
		pmResultsService = new DefaultPmResultsService(database, spark, null, pegService, resultsService);
	});

	it('should pm users with their results', async(done: DoneFn) => {
		await pmResultsService.pmResults();
		expect(spark.messages.create).toHaveBeenCalledTimes(4);
		done();
	});
});
