import { CategoryResultsService, DefaultCategoryResultsService } from '../lib/services/category-results-service';
import { Receiver } from '../models/receiver';
import __logger from '../lib/logger';

function createData(): Receiver[] {
	return [{
		id: 'testReceiver',
		person: 'receiver 1',
		pegs: [{
			sender: 'sender 1',
			comment: 'test awesome',
			categories: ['awesome']
		},
		{
			sender: 'sender 2',
			comment: 'test awesome brave',
			categories: ['awesome', 'brave']
		}]
	},
	{
		id: 'testReceiver2',
		person: 'receiver 2',
		pegs: [{
			sender: 'sender 1',
			comment: 'test brave',
			categories: ['brave']
		},
		{
			sender: 'sender 2',
			comment: 'test shame brave',
			categories: ['shame', 'brave']
		}]
	}];
}

function createCategoriesData(): string[]{
	return ['brave', 'awesome', 'shame'];
}

describe('category service', () => {
	let categoryResultsService: CategoryResultsService;
	let results: Receiver[];
	let categories: string[];

	beforeEach(() => {
		categoryResultsService = new DefaultCategoryResultsService();
		results = createData();
		categories = createCategoriesData();
	});

	it('should generate the correct html', async (done: DoneFn) => {
		var html = await categoryResultsService.returnCategoryResultsTable(results, categories);
		html = html.replace(/>\s+</g, '><'); //remove whitespace to make testing easier
		__logger.debug(html);
		expect(html).toContain('<h2>Category: Brave</h2>' +
			'<table class="table">' +
			'<thead class="thead-light">' +
			'<tr><th colspan="3">receiver 2 &mdash; 2 peg(s) total</th></tr>' +
			'</thead><tbody>' +
			'<tr><td>sender 1</td><td>test brave</td><td>brave</td></tr>' +
			'<tr><td>sender 2</td><td>test shame brave</td><td>shame, brave</td></tr>' +
			'</tbody>' +
			'<thead class="thead-light">' +
			'<tr><th colspan="3">receiver 1 &mdash; 1 peg(s) total</th></tr>' +
			'</thead><tbody>' +
			'<tr><td>sender 2</td><td>test awesome brave</td><td>awesome, brave</td></tr>' +
			'</tbody></table>');

		expect(html).toContain('<h2>Category: Awesome</h2>' +
			'<table class="table">' +
			'<thead class="thead-light">' +
			'<tr><th colspan="3">receiver 1 &mdash; 2 peg(s) total</th></tr>' +
			'</thead><tbody>' +
			'<tr><td>sender 1</td><td>test awesome</td><td>awesome</td></tr>' +
			'<tr><td>sender 2</td><td>test awesome brave</td><td>awesome, brave</td></tr>' +
			'</tbody></table>');

		expect(html).toContain('<h2>Category: Shame</h2>' +
			'<table class="table">' +
			'<thead class="thead-light">' +
			'<tr><th colspan="3">receiver 2 &mdash; 1 peg(s) total</th></tr>' +
			'</thead><tbody>' +
			'<tr><td>sender 2</td><td>test shame brave</td><td>shame, brave</td></tr>' +
			'</tbody></table>');

		done();
	});
});
