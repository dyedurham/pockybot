import { CategoryResultsService, DefaultCategoryResultsService } from '../lib/services/category-results-service';
import { Receiver } from '../models/receiver';

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
	return ['brave', 'awesome', 'shame', 'customer'];
}

describe('category results service', () => {
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

		expect(html).toContain('<h2 class="clickable collapsed" data-toggle="collapse" ' +
			'data-target="#section-categoryresults-0" aria-expanded="false" aria-controls="section-categoryresults-0">' +
			'<i class="fas fa-plus"></i><i class="fas fa-minus"></i> Category: Brave</h2>' +
			'<table id="section-categoryresults-0" class="table pb-3 collapse">' +
			'<thead class="thead-light clickable" data-toggle="collapse" ' +
			'data-target="#section-categoryresults-0-0" aria-expanded="true" aria-controls="section-categoryresults-0-0">' +
			'<tr><th colspan="3"><i class="fas fa-plus"></i><i class="fas fa-minus"></i> receiver 2 &mdash; 2 peg(s) total</th></tr>' +
			'</thead><tbody id="section-categoryresults-0-0" class="collapse show">' +
			'<tr><td>sender 1</td><td>test brave</td><td>brave</td></tr>' +
			'<tr><td>sender 2</td><td>test shame brave</td><td>shame, brave</td></tr>' +
			'</tbody>' +
			'<thead class="thead-light clickable" data-toggle="collapse" ' +
			'data-target="#section-categoryresults-0-1" aria-expanded="true" aria-controls="section-categoryresults-0-1">' +
			'<tr><th colspan="3"><i class="fas fa-plus"></i><i class="fas fa-minus"></i> receiver 1 &mdash; 1 peg(s) total</th></tr>' +
			'</thead><tbody id="section-categoryresults-0-1" class="collapse show">' +
			'<tr><td>sender 2</td><td>test awesome brave</td><td>awesome, brave</td></tr>' +
			'</tbody></table>');

		expect(html).toContain('<h2 class="clickable collapsed" data-toggle="collapse" ' +
			'data-target="#section-categoryresults-1" aria-expanded="false" aria-controls="section-categoryresults-1">' +
			'<i class="fas fa-plus"></i><i class="fas fa-minus"></i> Category: Awesome</h2>' +
			'<table id="section-categoryresults-1" class="table pb-3 collapse">' +
			'<thead class="thead-light clickable" data-toggle="collapse" ' +
			'data-target="#section-categoryresults-1-0" aria-expanded="true" aria-controls="section-categoryresults-1-0">' +
			'<tr><th colspan="3"><i class="fas fa-plus"></i><i class="fas fa-minus"></i> receiver 1 &mdash; 2 peg(s) total</th></tr>' +
			'</thead><tbody id="section-categoryresults-1-0" class="collapse show">' +
			'<tr><td>sender 1</td><td>test awesome</td><td>awesome</td></tr>' +
			'<tr><td>sender 2</td><td>test awesome brave</td><td>awesome, brave</td></tr>' +
			'</tbody></table>');

		expect(html).toContain('<h2 class="clickable collapsed" data-toggle="collapse" ' +
			'data-target="#section-categoryresults-2" aria-expanded="false" aria-controls="section-categoryresults-2">' +
			'<i class="fas fa-plus"></i><i class="fas fa-minus"></i> Category: Shame</h2>' +
			'<table id="section-categoryresults-2" class="table pb-3 collapse">' +
			'<thead class="thead-light clickable" data-toggle="collapse" ' +
			'data-target="#section-categoryresults-2-0" aria-expanded="true" aria-controls="section-categoryresults-2-0">' +
			'<tr><th colspan="3"><i class="fas fa-plus"></i><i class="fas fa-minus"></i> receiver 2 &mdash; 1 peg(s) total</th></tr>' +
			'</thead><tbody id="section-categoryresults-2-0" class="collapse show">' +
			'<tr><td>sender 2</td><td>test shame brave</td><td>shame, brave</td></tr>' +
			'</tbody></table>');

		expect(html).toContain('<h2>Category: Customer</h2>' +
			'<p class="pb-3">There were no pegs given for this keyword</p>');

		done();
	});
});
