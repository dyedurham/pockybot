import { ResultRow } from '../../models/database';
import { PockyDB } from '../database/db-interfaces';
import { Receiver } from '../../models/receiver';
import TableHelper from '../parsers/tableHelper';
import HtmlHelper from '../parsers/htmlHelper';
import __logger from '../logger';
import Config from '../config-interface';
import { CategoryResultsService } from './category-results-service';

export interface FormatResultsService {
	returnResultsHtml() : Promise<string>
}

export class DefaultFormatResultsService implements FormatResultsService {

	database: PockyDB;
	config: Config;
	categoryResultsService: CategoryResultsService;

	constructor(database: PockyDB, config: Config, categoryResultsService: CategoryResultsService) {
		this.database = database;
		this.config = config;
		this.categoryResultsService = categoryResultsService;
	}

	async returnResultsHtml() : Promise<string> {
		const today = new Date();
		const todayString = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();

		const winnersData: ResultRow[] = await this.database.returnWinners();
		let resultsData: ResultRow[] = await this.database.returnResults();

		//Get only people who didn't win in the general results so there are no double ups
		resultsData = resultsData.filter(x => !winnersData.some(y => y.receiverid == x.receiverid));

		const categories = this.config.getStringConfig('keyword');

		const results: Receiver[] = TableHelper.mapResults(resultsData, categories);
		const winners: Receiver[] = TableHelper.mapResults(winnersData, categories);
		const winnersTable = HtmlHelper.generateTable(winners);
		const resultsTable = HtmlHelper.generateTable(results);
		const categoryResultsTable = this.categoryResultsService.returnCategoryResultsTable(results, categories);

		const html = this.generateHtml(winnersTable, resultsTable, categoryResultsTable, todayString);
		return html;
	}

	generateHtml(winnersTable: string, resultsTable: string, categoryResultsTable: string, todayString: string) : string {
		try {
			const html =
`<!doctype html><html>
	<head>
	    <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
		<title>Pegs ${todayString}</title>
		<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/4.1.2/css/bootstrap.min.css" integrity="sha256-zVUlvIh3NEZRYa9X/qpNY8P1aBy0d4FrI7bhfZSZVwc=" crossorigin="anonymous" />
   </head>
	<body>
		<div class="container content">
			<h1 class="pt-3 pb-3">Pegs and Pocky ${todayString}</h1>
			<div class="nav nav-tabs nav-fill" id="nav-tab" role="tablist">
				<a class="nav-item nav-link active" id="generalResults-tab" data-toggle="tab" href="#generalResults" aria-controls="generalResults" aria-selected="true">General Results</a>
				<a class="nav-item nav-link" id="categoryResults-tab" data-toggle="tab" href="#categoryResults" role="tab" aria-controls="categoryResults" aria-selected="false">Category Results</a>
			</div>

			<div class="tab-content py-3 px-3 px-sm-0" id="nav-tabContent">
				<div class="tab-pane fade show active" id="generalResults" role="tabpanel" aria-labelledby="generalResults-tab">
					<h2>Winners:</h2>
${winnersTable}
					<h2>Other Pegs Received:</h2>
${resultsTable}
				</div>
				<div class="tab-pane fade show" id="categoryResults" role="tabpanel" aria-labelledby="categoryResults-tab">
${categoryResultsTable}
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
