import { PockyDB } from '../lib/database/db-interfaces';
import { ResultRow } from '../models/database';

import MockPockyDb from './mocks/mock-pockydb';
import { DefaultFormatResultsService, FormatResultsService } from '../lib/services/format-results-service';

function createData(): ResultRow[] {
	return [{
		receiver: 'receiver 1',
		sender: 'mock sender receiver 1',
		comment: 'test',
		receiverid: 'r1ID'
	},
	{
		receiver: 'receiver 1',
		sender: 'mock sender 2 receiver 1',
		comment: 'test 2',
		receiverid: 'r1ID'
	},
	{
		receiver: 'receiver 2',
		sender: 'mock sender receiver 2',
		comment: 'test',
		receiverid: 'r2ID'
	},
	{
		receiver: 'receiver 2',
		sender: 'mock sender 2 receiver 2',
		comment: 'test 2',
		receiverid: 'r2ID'
	}];
}

function createDatabase(success: boolean, data): PockyDB {
	let db = new MockPockyDb(true, 0, true, 2, success ? data : undefined);
	return db;
}

describe('format results service generate html', () => {
	let today = new Date();
	let todayString = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();
	let data: ResultRow[];
	let database: PockyDB;
	let formatResultsService: FormatResultsService;
	jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000;

	beforeEach(() => {
		data = createData();
		database = createDatabase(true, data);
		formatResultsService = new DefaultFormatResultsService(database);
	});

	it('should generate the correct html', async (done: DoneFn) => {
		var html = await formatResultsService.returnResultsHtml();
		expect(html).toContain('<tr><th colspan="2">receiver 1 &mdash; 2 peg(s) total</th></tr>');
		expect(html).toContain('<tr><td>mock sender receiver 1</td><td>test</td></tr>');
		expect(html).toContain('<tr><td>mock sender 2 receiver 1</td><td>test 2</td></tr>');

		expect(html).toContain('<tr><th colspan="2">receiver 2 &mdash; 2 peg(s) total</th></tr>');
		expect(html).toContain('<tr><td>mock sender receiver 2</td><td>test</td></tr>');
		expect(html).toContain('<tr><td>mock sender 2 receiver 2</td><td>test 2</td></tr>');

		expect(html).toContain(`<h1 class="pt-3 pb-3">Pegs and Pocky ${todayString}</h1>`);
		done();
	});
});
