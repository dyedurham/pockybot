import { PockyDB } from '../lib/database/db-interfaces';
import { ResultRow } from '../models/database';

import MockPockyDb from './mocks/mock-pockydb';
import { DefaultFormatResultsService, FormatResultsService } from '../lib/services/format-results-service';
import MockConfig from './mocks/mock-config';
import Config from '../lib/config-interface';
import { CategoryResultsService } from '../lib/services/category-results-service';
import MockCategoryResultsService from './mocks/mock-category-results-service';
import { WinnersService } from '../lib/services/winners-service';
import MockWinnersService from './mocks/mock-winners-service';
import Utilities from '../lib/utilities';

function createData(): ResultRow[] {
	return [{
		receiver: 'receiver 1',
		sender: 'mock sender receiver 1',
		comment: 'test awesome',
		receiverid: 'r1ID',
		senderid: 's1ID'
	},
	{
		receiver: 'receiver 1',
		sender: 'mock sender 2 receiver 1',
		comment: 'test brave',
		receiverid: 'r1ID',
		senderid: 's2ID'
	},
	{
		receiver: 'receiver 2',
		sender: 'mock sender receiver 2',
		comment: 'test brave',
		receiverid: 'r2ID',
		senderid: 's1ID'
	},
	{
		receiver: 'receiver 2',
		sender: 'mock sender 2 receiver 2',
		comment: 'test customer',
		receiverid: 'r2ID',
		senderid: 's2ID'
	}];
}

function createDatabase(success: boolean, data): PockyDB {
	let db = new MockPockyDb(true, 0, true, 2, success ? data : undefined);
	return db;
}

function createConfig(): Config{
	let config = new MockConfig(5, 1, 3, 1, 1, 1, ['brave', 'awesome', 'customer'], ['shame']);
	return config;
}

describe('format results service', () => {
	let today = new Date();
	let todayString = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();
	let data: ResultRow[];
	let database: PockyDB;
	let formatResultsService: FormatResultsService;
	let categoryResultsService: CategoryResultsService;
	let winnersService: WinnersService;
	let config: Config;
	jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000;

	beforeEach(() => {
		const utilities = new Utilities();
		data = createData();
		database = createDatabase(true, data);
		config = createConfig();
		categoryResultsService = new MockCategoryResultsService();
		winnersService = new MockWinnersService(true, '');
		formatResultsService = new DefaultFormatResultsService(database, config, categoryResultsService, winnersService, utilities);
	});

	it('should generate the correct html', async (done: DoneFn) => {
		spyOn(winnersService, 'getWinners').and.returnValue(data);

		var html = await formatResultsService.returnResultsHtml();
		expect(html).toContain('<tr><th colspan="3">receiver 1 &mdash; 2 peg(s) total</th></tr>');
		expect(html).toContain('<tr><td>mock sender receiver 1</td><td>test awesome</td><td>awesome</td></tr>');
		expect(html).toContain('<tr><td>mock sender 2 receiver 1</td><td>test brave</td><td>brave</td></tr>');

		expect(html).toContain('<tr><th colspan="3">receiver 2 &mdash; 2 peg(s) total</th></tr>');
		expect(html).toContain('<tr><td>mock sender receiver 2</td><td>test brave</td><td>brave</td></tr>');
		expect(html).toContain('<tr><td>mock sender 2 receiver 2</td><td>test customer</td><td>customer</td></tr>');

		expect(html).toContain(`<h1 class="pt-3 pb-3">Pegs and Pocky ${todayString}</h1>`);
		done();
	});
});
