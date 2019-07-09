import { CategoryResultsService, DefaultCategoryResultsService } from '../lib/services/category-results-service';
import { Result } from '../models/result';

function createData(): Result[] {
	return [{
		personId: 'testReceiver',
		personName: 'receiver 1',
		validPegsReceived: [
			{
				receiverName: 'receiver 1',
				receiverId: 'testReceiver',
				senderId: 'sender1',
				senderName: 'sender 1',
				comment: 'test awesome',
				categories: ['awesome'],
				isValid: true
			},
			{
				senderName: 'sender 2',
				senderId: 'sender2',
				receiverName: 'receiver 1',
				receiverId: 'testReceiver',
				comment: 'test awesome brave',
				categories: ['awesome', 'brave'],
				isValid: true
			}
		],
		penaltyPegsGiven: [],
		weightedPegsReceived: 2
	},
	{
		personId: 'testReceiver2',
		personName: 'receiver 2',
		validPegsReceived: [
			{
				receiverId: 'testReceiver2',
				receiverName: 'receiver 2',
				senderId: 'sender1',
				senderName: 'sender 1',
				comment: 'test brave',
				categories: ['brave'],
				isValid: true
			},
			{
				receiverId: 'testReceiver2',
				receiverName: 'receiver 2',
				senderId: 'sender2',
				senderName: 'sender 2',
				comment: 'test shame brave',
				categories: ['shame', 'brave'],
				isValid: true
			}
		],
		penaltyPegsGiven: [],
		weightedPegsReceived: 2
	}];
}

function createCategoriesData(): string[] {
	return ['brave', 'awesome', 'shame', 'customer'];
}

describe('category results service', () => {
	let categoryResultsService: CategoryResultsService;
	let results: Result[];
	let categories: string[];

	beforeEach(() => {
		categoryResultsService = new DefaultCategoryResultsService();
		results = createData();
		categories = createCategoriesData();
	});

	it('should generate the correct html', async (done: DoneFn) => {
		let html = await categoryResultsService.returnCategoryResultsTable(results, categories);
		html = html.replace(/>\s+</g, '><'); // remove whitespace to make testing easier

		expect(html).toContain('<h2 class="clickable collapsed" data-toggle="collapse" ' +
			'data-target="#section-categoryresults-0" aria-expanded="false" aria-controls="section-categoryresults-0">' +
			'<i class="fas fa-plus"></i><i class="fas fa-minus"></i> Category: Brave</h2>' +
			'<table id="section-categoryresults-0" class="table pb-3 collapse">' +
			'<thead class="thead-light clickable" data-toggle="collapse" ' +
			'data-target="#section-categoryresults-0-0" aria-expanded="true" aria-controls="section-categoryresults-0-0">' +
			'<tr><th colspan="3"><i class="fas fa-plus"></i><i class="fas fa-minus"></i> receiver 2 &mdash; 2 pegs total</th></tr>' +
			'</thead><tbody id="section-categoryresults-0-0" class="collapse show">' +
			'<tr><td>sender 1</td><td>test brave</td><td>brave</td></tr>' +
			'<tr><td>sender 2</td><td>test shame brave</td><td>shame, brave</td></tr>' +
			'</tbody>' +
			'<thead class="thead-light clickable" data-toggle="collapse" ' +
			'data-target="#section-categoryresults-0-1" aria-expanded="true" aria-controls="section-categoryresults-0-1">' +
			'<tr><th colspan="3"><i class="fas fa-plus"></i><i class="fas fa-minus"></i> receiver 1 &mdash; 1 peg total</th></tr>' +
			'</thead><tbody id="section-categoryresults-0-1" class="collapse show">' +
			'<tr><td>sender 2</td><td>test awesome brave</td><td>awesome, brave</td></tr>' +
			'</tbody></table>');

		expect(html).toContain('<h2 class="clickable collapsed" data-toggle="collapse" ' +
			'data-target="#section-categoryresults-1" aria-expanded="false" aria-controls="section-categoryresults-1">' +
			'<i class="fas fa-plus"></i><i class="fas fa-minus"></i> Category: Awesome</h2>' +
			'<table id="section-categoryresults-1" class="table pb-3 collapse">' +
			'<thead class="thead-light clickable" data-toggle="collapse" ' +
			'data-target="#section-categoryresults-1-0" aria-expanded="true" aria-controls="section-categoryresults-1-0">' +
			'<tr><th colspan="3"><i class="fas fa-plus"></i><i class="fas fa-minus"></i> receiver 1 &mdash; 2 pegs total</th></tr>' +
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
			'<tr><th colspan="3"><i class="fas fa-plus"></i><i class="fas fa-minus"></i> receiver 2 &mdash; 1 peg total</th></tr>' +
			'</thead><tbody id="section-categoryresults-2-0" class="collapse show">' +
			'<tr><td>sender 2</td><td>test shame brave</td><td>shame, brave</td></tr>' +
			'</tbody></table>');

		expect(html).toContain('<h2>Category: Customer</h2>' +
			'<p class="pb-3">There were no pegs given for this keyword</p>');

		done();
	});
});
