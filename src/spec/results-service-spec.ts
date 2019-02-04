import { PockyDB } from '../lib/database/db-interfaces';
import { ResultRow } from '../models/database';
import * as fs from 'fs';
const storage = require('@google-cloud/storage');

import sinon = require('sinon');
import MockPockyDb from './mocks/mock-pockydb';
import { ResultsService, IResultsService } from '../lib/services/results-service';
import { Receiver } from '../models/receiver';

function createData(): ResultRow[] {
	return [{
		receiver: 'mock receiver',
		sender: 'mock sender',
		comment: 'test',
		receiverid: 'mockID'
	}];
}

function createReceiver(receiver: string): Receiver[]{
	return [{
		id: receiver,
		person: receiver,
		pegs: [{
			sender: 'mock sender ' + receiver,
			comment: 'test'
		},{
			sender: 'mock sender 2 ' + receiver,
			comment: 'test 2'
		}]
	}];
}

function createDatabase(success: boolean, data): PockyDB {
	let db = new MockPockyDb(true, 0, true, 2, success ? data : undefined);
	return db;
}

describe('results service', () => {
	let today = new Date();
	let todayString = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();
	let data: ResultRow[];
	let database: PockyDB;
	let resultsService: IResultsService;

	beforeEach(() => {
		data = createData();
		database = createDatabase(true, data);
		resultsService = new ResultsService(database);

		var fakeExistsSync = sinon.fake.returns(false);
		var fakeWriteFileSync = sinon.fake();

		sinon.replace(fs, 'existsSync', fakeExistsSync);
		sinon.replace(fs, 'writeFileSync', fakeWriteFileSync);

		var fakeStorage = sinon.fake.returns({
			bucket: (name: string) => {
				return {
					upload: (name: string) => {
						return new Promise((resolve, reject) => {
							resolve([{
								makePublic: () => {
									return new Promise((resolve, reject) => { resolve(); })
								}
							}]);
						});
					}
				}
			}
		});

		sinon.stub(storage, 'Storage').callsFake(fakeStorage);

		process.env.GCLOUD_BUCKET_NAME = 'pocky-bot';
	});

	afterEach(() => {
		sinon.restore();
	});

	it('should parse a proper message', async (done: DoneFn) => {
		let message = await resultsService.returnResultsMarkdown();
		expect(message).toBe(`[Here are all pegs given this cycle](https://storage.googleapis.com/pocky-bot/pegs-${todayString}.html)`);
		done();
	});
});

describe('results service generate html', () => {
	let today = new Date();
	let todayString = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();
	let winners: Receiver[];
	let results: Receiver[];
	let resultsService: IResultsService;

	beforeEach(() => {
		winners = createReceiver('winners');
		results = createReceiver('results');
		resultsService = new ResultsService(null);
	});

	it('should generate the correct html', () => {
		var html = resultsService.generateHtml(winners, results, todayString);
		expect(html).toContain('<tr><th colspan="2">winners &mdash; 2 peg(s) total</th></tr>');
		expect(html).toContain('<tr><td>mock sender winners</td><td>test</td></tr>');
		expect(html).toContain('<tr><td>mock sender 2 winners</td><td>test 2</td></tr>');

		expect(html).toContain('<tr><th colspan="2">results &mdash; 2 peg(s) total</th></tr>');
		expect(html).toContain('<tr><td>mock sender results</td><td>test</td></tr>');
		expect(html).toContain('<tr><td>mock sender 2 results</td><td>test 2</td></tr>');

		expect(html).toContain(`<h1 class="pt-3 pb-3">Pegs and Pocky ${todayString}</h1>`);
	});
});
