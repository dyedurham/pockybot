import { Receiver } from '../../models/receiver';
import constants from '../../constants';
import __logger from '../logger';
import { PegReceivedData } from '../../models/peg-received-data';
import * as fs from 'fs';
import TableHelper from '../parsers/tableHelper';
import { PockyDB } from '../database/db-interfaces';
import { ResultRow } from '../../models/database';
const storage = require('@google-cloud/storage');

export interface ResultsService {
	returnResultsMarkdown(): Promise<string>
	generateHtml(winners: Receiver[], results: Receiver[], todayString: string): string
}

export class DefaultResultsService implements ResultsService {
	database: PockyDB;

	constructor(database: PockyDB){
		this.database = database;
	}

	async returnResultsMarkdown(): Promise<string> {
		const winnersData: ResultRow[] = await this.database.returnWinners();
		let resultsData: ResultRow[] = await this.database.returnResults();

		//Get only people who didn't win in the general results so there are no double ups
		resultsData = resultsData.filter(x => !winnersData.some(y => y.receiverid == x.receiverid));

		const results: Receiver[] = TableHelper.mapResults(resultsData);
		const winners: Receiver[] = TableHelper.mapResults(winnersData);

		let today = new Date();
		let todayString = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();

		let filePath = `${__dirname}/../../../pegs-${todayString}`;
		if (fs.existsSync(filePath + '.txt')) {
			fs.unlinkSync(filePath + '.txt');
		}
		__logger.information("File path: " + filePath);

		let html = this.generateHtml(winners, results, todayString);

		fs.writeFileSync(filePath + '.html', html);

		const client = new storage.Storage();
		let response = await client.bucket(process.env.GCLOUD_BUCKET_NAME).upload(filePath + '.html');
		let file = response[0];
		await file.makePublic();

		let fileUrl = `${constants.googleUrl}${process.env.GCLOUD_BUCKET_NAME}/pegs-${todayString}.html`;
		let markdown = `[Here are all pegs given this cycle](${fileUrl})`;

		return markdown;
	}

	generateHtml(winners: Receiver[], results: Receiver[], todayString: string): string {
		__logger.information('generating html');
		try {

			var winnersTable = this.generateTable(winners);
			var resultsTable = this.generateTable(results);

			let html = `<!doctype html><html>
	<head>
	    <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
		<title>Pegs ${todayString}</title>
		<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/4.1.2/css/bootstrap.min.css" integrity="sha256-zVUlvIh3NEZRYa9X/qpNY8P1aBy0d4FrI7bhfZSZVwc=" crossorigin="anonymous" />
   </head>
	<body>
		<div class="container content">
			<h1 class="pt-3 pb-3">Pegs and Pocky ${todayString}</h1>
			<h2>Winners</h2>
${winnersTable}
			<h2>Other Pegs Received:</h2>
${resultsTable}
		</div>
		<script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.3.1/jquery.slim.min.js" integrity="sha256-3edrmyuQ0w65f8gfBsqowzjJe2iM6n0nKciPUp8y+7E=" crossorigin="anonymous"></script>
		<script src="https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.14.3/umd/popper.min.js" integrity="sha384-ZMP7rVo3mIykV+2+9J3UJ46jBk0WLaUAdn689aCwoqbBJiSnjAK/l8WvCWPIPm49" crossorigin="anonymous"></script>
		<script src="https://cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/4.1.2/js/bootstrap.min.js" integrity="sha256-IeI0loa35pfuDxqZbGhQUiZmD2Cywv1/bdqiypGW46o=" crossorigin="anonymous"></script>

	</body>
</html>`;

			__logger.information("finished generating html");
			return html;
		} catch (e) {
			__logger.error(`Error in generating html:\n${e.message}`);
		}
	}

	generateTable(receivers: Receiver[]) {
		let htmlTable =
'			<table class="table">';

		receivers.forEach((result: Receiver) => {

			htmlTable += `
				<thead class="thead-light">
					<tr><th colspan="2">${result.person.toString()} &mdash; ${result.pegs.length} peg(s) total</th></tr>
				</thead>
				<tbody>`;

			result.pegs.sort((a, b) => a.sender.localeCompare(b.sender));

			result.pegs.forEach((peg: PegReceivedData) => {
				htmlTable += `
					<tr><td>${peg.sender}</td><td>${peg.comment}</td></tr>
`;
			});

			htmlTable +=
`				</tbody>
`;
		});
		htmlTable +=
`			</table>`;

		return htmlTable;
	}

}
