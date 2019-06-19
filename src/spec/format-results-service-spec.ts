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
import { PegRecipient } from '../models/peg-recipient';

function createData(): PegRecipient[] {
	const resultRows = createResultRows();
	return [
		{
			id: resultRows[0].receiver,
			weightedPegResult: 2,
			numberOfValidPegsReceived: 2,
			numberOfPenaltiesReceived: 0,
			validPegsReceived: resultRows.slice(0, 2),
			penaltyPegsSent: []
		},
		{
			id: resultRows[1].receiver,
			weightedPegResult: 2,
			numberOfValidPegsReceived: 2,
			numberOfPenaltiesReceived: 0,
			validPegsReceived: resultRows.slice(2, 4),
			penaltyPegsSent: []
		}
	]
}

function createResultRows(): ResultRow[] {
	return [
		{
			receiver: 'Person One',
			receiverid: 'p1',
			sender: 'Person Two',
			senderid: 'p2',
			comment: 'test awesome'
		},
		{
			receiver: 'Person One',
			receiverid: 'p1',
			sender: 'Person Three',
			senderid: 'p3',
			comment: 'test brave'
		},
		{
			receiver: 'Person Two',
			receiverid: 'p2',
			sender: 'Person Three',
			senderid: 'p3',
			comment: 'test brave'
		},
		{
			receiver: 'Person Three',
			receiverid: 'p3',
			sender: 'Person One',
			senderid: 'p1',
			comment: 'test customer'
		},
		{
			receiver: 'Person One',
			receiverid: 'p1',
			sender: 'Person Two',
			senderid: 'p2',
			comment: 'test brave'
		},
		{
			receiver: 'Person Two',
			receiverid: 'p2',
			sender: 'Person One',
			senderid: 'p1',
			comment: 'awesome brave'
		},
		{
			receiver: 'GifBot',
			receiverid: 'b1',
			sender: 'Person Three',
			senderid: 'p3',
			comment: 'shame shame shame'
		}
	];
}

function createDatabase(success: boolean, data): PockyDB {
	return new MockPockyDb(true, 0, true, 2, success ? data : undefined);
}

function createConfig(): Config{
	return new MockConfig(5, 1, 3, 1, 1, 1, ['brave', 'awesome', 'customer'], ['shame']);
}

describe('format results service', () => {
	let today = new Date();
	let todayString = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();
	let data: ResultRow[];
	let database: PockyDB;
	let winners: PegRecipient[];
	let formatResultsService: FormatResultsService;
	let categoryResultsService: CategoryResultsService;
	let winnersService: WinnersService;
	let config: Config;
	jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000;

	beforeEach(() => {
		data = createResultRows();
		database = createDatabase(true, data);
		winners = createData();
		config = createConfig();
		const utilities = new Utilities(config);
		categoryResultsService = new MockCategoryResultsService();
		winnersService = new MockWinnersService(true, '');
		formatResultsService = new DefaultFormatResultsService(database, config, categoryResultsService, winnersService, utilities);
	});

	xit('should generate the correct html', async (done: DoneFn) => {
		spyOn(winnersService, 'getWinners').and.returnValue(winners);

		let html = await formatResultsService.returnResultsHtml();

		// TODO: remove this
		// console.log(html)

		expect(html).toContain('<tr><th colspan="3"><i class="fas fa-plus"></i><i class="fas fa-minus"></i> Person One &mdash; 3 pegs total</th></tr>');
		expect(html).toContain('<tr><td>Person Two</td><td>test awesome</td><td>awesome</td></tr>');
		expect(html).toContain('<tr><td>Person Three</td><td>test brave</td><td>brave</td></tr>');
		expect(html).toContain('<tr><td>Person Two</td><td>test brave</td><td>brave</td></tr>');

		expect(html).toContain('<tr><th colspan="3"><i class="fas fa-plus"></i><i class="fas fa-minus"></i> Person Two &mdash; 2 pegs total</th></tr>');
		expect(html).toContain('<tr><td>Person Three</td><td>test brave</td><td>brave</td></tr>');
		expect(html).toContain('<tr><td>Person One</td><td>awesome brave</td>');

		expect(html).toContain('<tr><th colspan="3"><i class="fas fa-plus"></i><i class="fas fa-minus"></i> Person Three &mdash; 0 (1) peg(s) total</th></tr>');
		expect(html).toContain('<tr><td>Person One</td><td>test customer</td><td>customer</td></tr>');

		expect(html).toContain(`<h1 class="pt-3 pb-3">Pegs and Pocky ${todayString}</h1>`);
		done();
	});
});
