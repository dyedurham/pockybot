import { DefaultFormatResultsService, FormatResultsService } from '../lib/services/format-results-service';
import Config from '../lib/config-interface';
import { CategoryResultsService } from '../lib/services/category-results-service';
import { Arg, Substitute } from '@fluffy-spoon/substitute';
import { Result } from '../models/result';
import MockDataService from './services/mock-data-service';

class FormatResultsServiceSpec {
	private readonly config;
	private readonly categoryResultsService;
	private formatResultsService: FormatResultsService;

	private fullResults: Result[];
	private winners: Result[];
	private htmlResultsOutput: string;

	public constructor() {
		this.config = Substitute.for<Config>();
		this.categoryResultsService = Substitute.for<CategoryResultsService>();
		this.formatResultsService = new DefaultFormatResultsService(this.config, this.categoryResultsService);
	}

	public runTests() {
		describe('format results service', () => {
			it('should generate the correct html', async (done: DoneFn) => {
				this.givenResultsAndWinners();
				this.givenWorkingConfig();
				this.givenCategoryResultsServiceReturnsCategoryResults();
				await this.whenReturnResultsHtmlIsCalled();
				this.thenTheOutputShouldBeReturned();
				done();
			});
		});
	}

	private givenResultsAndWinners() {
		this.fullResults = [
			{
				personId: 'p1',
				personName: 'Luke',
				personLocation: 'Location 1',
				weightedPegsReceived: 5,
				validPegsReceived: [
					MockDataService.createPeg('p1', 'Luke', 'p2', 'Gillian', 'a', ['cat1'], true, 2, 'Location 2'),
					MockDataService.createPeg('p1', 'Luke', 'p3', 'Dula', 'b', ['cat1', 'cat2'], true),
					MockDataService.createPeg('p1', 'Luke', 'p3', 'Dula', 'c', ['cat2'], true),
					MockDataService.createPeg('p1', 'Luke', 'p2', 'Gillian', 'd', ['cat3'], true, 2, 'Location 2'),
				],
				penaltyPegsGiven: [
					MockDataService.createPeg('b1', 'Gif', 'p1', 'Luke', 'e', ['shame'], false)
				]
			},
			{
				personId: 'p2',
				personName: 'Gillian',
				personLocation: 'Location 2',
				weightedPegsReceived: 3,
				validPegsReceived: [
					MockDataService.createPeg('p2', 'Gillian', 'p3', 'Dula', 'f', ['cat1'], true),
					MockDataService.createPeg('p2', 'Gillian', 'p1', 'Luke', 'g', ['cat2', 'cat3'], true, 2, 'Location 1'),
				],
				penaltyPegsGiven: []
			},
			{
				personId: 'p3',
				personName: 'Dula',
				weightedPegsReceived: 2,
				validPegsReceived: [
					MockDataService.createPeg('p3', 'Dula', 'p2', 'Gillian', 'h', [], true, 2, 'Location 2'),
				],
				penaltyPegsGiven: []
			},
			{
				personId: 'p4',
				personName: 'Jim',
				weightedPegsReceived: -1,
				validPegsReceived: [],
				penaltyPegsGiven: [
					MockDataService.createPeg('b1', 'Gif', 'p1', 'Luke', 'i', [], false),
				]
			}
		];

		this.winners = [
			{
				personId: 'p1',
				personName: 'Luke',
				personLocation: 'Location 1',
				weightedPegsReceived: 5,
				validPegsReceived: [
					MockDataService.createPeg('p1', 'Luke', 'p2', 'Gillian', 'a', ['cat1'], true, 2, 'Location 2'),
					MockDataService.createPeg('p1', 'Luke', 'p3', 'Dula', 'b', ['cat1', 'cat2'], true),
					MockDataService.createPeg('p1', 'Luke', 'p3', 'Dula', 'c', ['cat2'], true),
					MockDataService.createPeg('p1', 'Luke', 'p2', 'Gillian', 'd', ['cat3'], true, 2, 'Location 2'),
				],
				penaltyPegsGiven: [
					MockDataService.createPeg('b1', 'Gif', 'p1', 'Luke', 'e', ['shame'], false)
				]
			},
			{
				personId: 'p2',
				personName: 'Gillian',
				personLocation: 'Location 2',
				weightedPegsReceived: 3,
				validPegsReceived: [
					MockDataService.createPeg('p2', 'Gillian', 'p3', 'Dula', 'f', ['cat1'], true),
					MockDataService.createPeg('p2', 'Gillian', 'p1', 'Luke', 'g', ['cat2', 'cat3'], true, 2, 'Location 1'),
				],
				penaltyPegsGiven: []
			}
		];
	}

	private givenWorkingConfig() {
		this.config.getStringConfig('keyword').returns(['keyword1']);
	}

	private givenCategoryResultsServiceReturnsCategoryResults() {
		this.categoryResultsService.returnCategoryResultsTable(Arg.any(), Arg.any()).returns('<categoryResults>');
	}

	private async whenReturnResultsHtmlIsCalled() {
		this.htmlResultsOutput = await this.formatResultsService.returnResultsHtml(this.fullResults, this.winners);
	}

	private thenTheOutputShouldBeReturned() {
		const today = new Date();
		const todayString = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();
		// remove whitespace to make testing easier
		const html = this.htmlResultsOutput.replace(/>\s+</g, '><');
		expect(this.htmlResultsOutput).toContain(`<title>Pegs ${todayString}</title>`);
		expect(this.htmlResultsOutput).toContain(`<h1 class="pt-3 pb-3">Pegs and Pocky ${todayString}</h1>`);

		let testString = `<tr><th colspan="5"><i class="fas fa-plus"></i><i class="fas fa-minus"></i> Luke (Location 1) &mdash; 5 (6) pegs total</th></tr>
			</thead><tbody id="section-winners-0" class="collapse show">
			<tr><td>Dula</td><td>1</td><td>b</td><td>cat1, cat2</td><td></td></tr>
			<tr><td>Dula</td><td>1</td><td>c</td><td>cat2</td><td></td></tr>
			<tr><td>Gillian</td><td>2</td><td>a</td><td>cat1</td><td>Location 2</td></tr>
			<tr><td>Gillian</td><td>2</td><td>d</td><td>cat3</td><td>Location 2</td></tr>
			</tbody>`
			.replace(/>\s+</g, '><');
		expect(html).toContain(testString);

		testString = `<thead class="thead-light clickable" data-toggle="collapse" data-target="#section-winners-1" aria-expanded="true" aria-controls="section-winners-1">
			<tr><th colspan="5"><i class="fas fa-plus"></i><i class="fas fa-minus"></i> Gillian (Location 2) &mdash; 3 pegs total</th></tr>
			</thead><tbody id="section-winners-1" class="collapse show">
			<tr><td>Dula</td><td>1</td><td>f</td><td>cat1</td><td></td></tr>
			<tr><td>Luke</td><td>2</td><td>g</td><td>cat2, cat3</td><td>Location 1</td></tr></tbody>`
			.replace(/>\s+</g, '><');
		expect(html).toContain(testString);

		testString = `<thead class="thead-light clickable" data-toggle="collapse" data-target="#section-losers-0" aria-expanded="true" aria-controls="section-losers-0">
			<tr><th colspan="5"><i class="fas fa-plus"></i><i class="fas fa-minus"></i> Dula &mdash; 2 pegs total</th></tr>
			</thead><tbody id="section-losers-0" class="collapse show">
			<tr><td>Gillian</td><td>2</td><td>h</td><td></td><td>Location 2</td></tr></tbody>
			<thead class="thead-light clickable" data-toggle="collapse" data-target="#section-losers-1" aria-expanded="true" aria-controls="section-losers-1">
			<tr><th colspan="5"><i class="fas fa-plus"></i><i class="fas fa-minus"></i> Jim &mdash; -1 (0) peg(s) total</th></tr>
			</thead><tbody id="section-losers-1" class="collapse show"></tbody>`
			.replace(/>\s+</g, '><');
		expect(html).toContain(testString);

		testString = `<div class="tab-pane fade show" id="categoryResults" role="tabpanel" aria-labelledby="categoryResults-tab">
			<categoryResults></div>`
			.replace(/>\s+</g, '><');
		expect(html).toContain(testString);

		testString = `<thead class="thead-light clickable" data-toggle="collapse" data-target="#section-penalties-0" aria-expanded="true" aria-controls="section-penalties-0">
			<tr><th colspan="3"><i class="fas fa-plus"></i><i class="fas fa-minus"></i> Luke &mdash; 1</th></tr>
			</thead><tbody id="section-penalties-0" class="collapse show">
			<tr><td>Gif</td><td>e</td><td></td></tr></tbody>
			<thead class="thead-light clickable" data-toggle="collapse" data-target="#section-penalties-3" aria-expanded="true" aria-controls="section-penalties-3">
			<tr><th colspan="3"><i class="fas fa-plus"></i><i class="fas fa-minus"></i> Jim &mdash; 1</th></tr>
			</thead><tbody id="section-penalties-3" class="collapse show">
			<tr><td>Gif</td><td>i</td><td></td></tr></tbody>`
			.replace(/>\s+</g, '><');
		expect(html).toContain(testString);
	}
}

let spec = new FormatResultsServiceSpec();
spec.runTests();
