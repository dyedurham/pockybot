import { ResultRow } from '../../models/database';
import { PockyDB } from '../database/db-interfaces';
import { Receiver } from '../../models/receiver';
import TableHelper from '../parsers/tableHelper';
import HtmlHelper from '../parsers/htmlHelper';
import __logger from '../logger';
import Config from '../config-interface';
import { CategoryResultsService } from './category-results-service';
import { WinnersService } from './winners-service';
import Utilities from '../utilities';

export interface FormatResultsService {
	returnResultsHtml() : Promise<string>
}

export class DefaultFormatResultsService implements FormatResultsService {
	database: PockyDB;
	config: Config;
	categoryResultsService: CategoryResultsService;
	winnersService: WinnersService;
	utilities: Utilities;

	constructor(database: PockyDB, config: Config, categoryResultsService: CategoryResultsService, winnersService: WinnersService, utilities: Utilities) {
		this.database = database;
		this.config = config;
		this.categoryResultsService = categoryResultsService;
		this.winnersService = winnersService;
		this.utilities = utilities;
	}

	async returnResultsHtml() : Promise<string> {
		const today = new Date();
		const todayString = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();
		const categories = this.config.getStringConfig('keyword');
		const penaltyKeywords = this.config.getStringConfig('penaltyKeyword');
		const requireValues = this.config.getConfig('requireValues');

		const fullData: ResultRow[] = await this.database.returnResults();

		const validPegs = fullData.filter(x => this.utilities.pegValid(x.comment, requireValues, categories, penaltyKeywords));
		const penaltyPegs = fullData.filter(x => !this.utilities.pegValid(x.comment, requireValues, categories, penaltyKeywords));
		const winnersData = this.winnersService.getWinners(fullData);

		// Get only people who didn't win in the general results so there are no double ups
		const loserPegs = validPegs.filter(result => !winnersData.some(winner => winner.id == result.receiverid));
		const resultsData = this.utilities.getResults(validPegs);
		const losersData = this.utilities.getResults(loserPegs);
		const penaltyData = this.utilities.getResults(penaltyPegs);

		const results: Receiver[] = TableHelper.mapResults(resultsData, categories);
		const winners: Receiver[] = TableHelper.mapResults(winnersData, categories);
		const losers: Receiver[] = TableHelper.mapResults(losersData, categories);
		const penalties: Receiver[] = TableHelper.mapPenalties(penaltyData, penaltyKeywords).sort((a, b) => b.pegs.length - a.pegs.length);

		const winnersTable = HtmlHelper.generateTable(winners, 'winners');
		const losersTable = HtmlHelper.generateTable(losers, 'losers');
		const categoryResultsTable = this.categoryResultsService.returnCategoryResultsTable(results, categories);
		const penaltyTable = HtmlHelper.generateTable(penalties, 'penalties');

		const html = this.generateHtml(winnersTable, losersTable, categoryResultsTable, penaltyTable, todayString);
		return html;
	}

	generateHtml(winnersTable: string, resultsTable: string, categoryResultsTable: string, penaltyTable: string, todayString: string) : string {
		try {
			const html =
`<!doctype html><html>
	<head>
	    <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
		<title>Pegs ${todayString}</title>
		<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/4.1.2/css/bootstrap.min.css" integrity="sha256-zVUlvIh3NEZRYa9X/qpNY8P1aBy0d4FrI7bhfZSZVwc=" crossorigin="anonymous" />
		<link rel="stylesheet" href="https://use.fontawesome.com/releases/v5.6.3/css/all.css" integrity="sha384-UHRtZLI+pbxtHCWp1t77Bi1L4ZtiqrqD80Kn4Z8NTSRyMA2Fd33n5dQ8lWUE00s/" crossorigin="anonymous">
		<style type="text/css">
			h2 {
				font-size: 170%;
			}

			.clickable {
				cursor: pointer;
				padding: 6px;
			}
			.clickable:hover {
				background-color: #e9ecef;
			}

			.clickable > i.fa-plus, .clickable > tr > th > i.fa-plus {
				display: none;
			}
			.clickable > i.fa-minus, .clickable > tr > th > i.fa-minus {
				display: inline-block;
			}
			.clickable.collapsed > i.fa-plus, .clickable.collapsed > tr > th > i.fa-plus {
				display: inline-block;
			}
			.clickable.collapsed > i.fa-minus, .clickable.collapsed > tr > th > i.fa-minus {
				display: none;
			}
		</style>
   </head>
	<body>
		<div class="container content">
			<h1 class="pt-3 pb-3">Pegs and Pocky ${todayString}</h1>
			<div class="nav nav-tabs nav-fill" id="nav-tab" role="tablist">
				<a class="nav-item nav-link active" id="generalResults-tab" data-toggle="tab" href="#generalResults" aria-controls="generalResults" aria-selected="true">General Results</a>
				<a class="nav-item nav-link" id="categoryResults-tab" data-toggle="tab" href="#categoryResults" role="tab" aria-controls="categoryResults" aria-selected="false">Category Results</a>
				<a class="nav-item nav-link" id="penaltyResults-tab" data-toggle="tab" href="#penaltyResults" role="tab" aria-controls="penaltyResults" aria-selected="false">Penalty Results</a>
			</div>

			<div class="tab-content py-3 px-3 px-sm-0" id="nav-tabContent">
				<div class="tab-pane fade show active" id="generalResults" role="tabpanel" aria-labelledby="generalResults-tab">
					<h2 class="clickable collapsed" data-toggle="collapse" data-target="#section-winners" aria-expanded="false" aria-controls="section-winners"><i class="fas fa-plus"></i><i class="fas fa-minus"></i> Winners</h2>
${winnersTable}
					<h2 class="clickable collapsed" data-toggle="collapse" data-target="#section-losers" aria-expanded="false" aria-controls="section-losers"><i class="fas fa-plus"></i><i class="fas fa-minus"></i> Other Pegs Received</h2>
${resultsTable}
				</div>
				<div class="tab-pane fade show" id="categoryResults" role="tabpanel" aria-labelledby="categoryResults-tab">
${categoryResultsTable}
				</div>
				<div class="tab-pane fade show" id="penaltyResults" role="tabpanel" aria-labelledby="penaltyResults-tab">
				<h2 class="clickable collapsed" data-toggle="collapse" data-target="#section-penalties" aria-expanded="false" aria-controls="section-penalties"><i class="fas fa-plus"></i><i class="fas fa-minus"></i> Penalties</h2>
${penaltyTable}
				</div>
			</div>
		</div>
		<script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.3.1/jquery.slim.min.js" integrity="sha256-3edrmyuQ0w65f8gfBsqowzjJe2iM6n0nKciPUp8y+7E=" crossorigin="anonymous"></script>
		<script src="https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.14.3/umd/popper.min.js" integrity="sha384-ZMP7rVo3mIykV+2+9J3UJ46jBk0WLaUAdn689aCwoqbBJiSnjAK/l8WvCWPIPm49" crossorigin="anonymous"></script>
		<script src="https://cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/4.1.2/js/bootstrap.min.js" integrity="sha256-IeI0loa35pfuDxqZbGhQUiZmD2Cywv1/bdqiypGW46o=" crossorigin="anonymous"></script>

	</body>
</html>`;
			return html;
		} catch (e) {
			__logger.error(`[ResultsService.generateHtml] Error in generating html: ${e.message}`);
		}
	}
}
