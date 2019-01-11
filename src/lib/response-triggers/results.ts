import Trigger from '../../models/trigger';
import constants from '../../constants';
import TableHelper from '../parsers/tableHelper';
import * as fs from 'fs';
import PockyDB from '../PockyDB';
import Config from '../config';
import __logger from '../logger';
import { MessageObject, CiscoSpark } from 'ciscospark/env';
import { ResultRow, Role } from '../../models/database';
import { Receiver } from '../../models/receiver';
import { PegReceivedData } from '../../models/peg-received-data';
const storage = require('@google-cloud/storage');

const lineEnding = '\r\n';
const resultsCommand = '(?: )*results(?: )*';

export default class Results extends Trigger {
	readonly cannotDisplayResults : string = 'Error encountered; cannot display results.';

	spark : CiscoSpark;
	database : PockyDB;
	config : Config;

	constructor(sparkService : CiscoSpark, databaseService : PockyDB, config : Config) {
		super();

		this.spark = sparkService;
		this.database = databaseService;
		this.cannotDisplayResults = 'Error encountered; cannot display results.';
		this.config = config;
	}

	isToTriggerOn(message : MessageObject) : boolean {
		if (!(this.config.checkRole(message.personId, Role.Admin) || this.config.checkRole(message.personId, Role.Results))) {
			return false;
		}
		let pattern = new RegExp('^' + constants.optionalMarkdownOpening + constants.mentionMe + resultsCommand, 'ui');
		return pattern.test(message.html);
	}

	async createMessage() : Promise<MessageObject> {
		let data : ResultRow[];
		try {
			data = await this.database.returnResults();
		} catch (e) {
			__logger.error(`Error in db.returnResults:\n${e.message}`);
			throw new Error(this.cannotDisplayResults);
		}

		try {
			let response = await this.createResponse(data);

			return {
				markdown: response.markdown,
				files: response.files
			};
		} catch (error) {
			__logger.error(`Error in createResponse from returnResults:\n${error.message}`);
			throw new Error(this.cannotDisplayResults);
		}
	}

	async createResponse(data : ResultRow[]) : Promise<MessageObject> {
		let today = new Date();
		let todayString = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();

		let filePath = `${__dirname}/../../../pegs-${todayString}`;

		if (fs.existsSync(filePath + '.txt')) {
			fs.unlinkSync(filePath + '.txt');
		}

		__logger.information("File path: " + filePath);

		let results : Receiver[] = TableHelper.mapResults(data);
		let columnWidths = TableHelper.getColumnWidths(results);

		// define table heading
		let resultsTable = TableHelper.padString('Receiver', columnWidths.receiver) + ' | ' + TableHelper.padString('Sender', columnWidths.sender) + ' | Comments' + lineEnding;
		resultsTable += 'Total'.padEnd(columnWidths.receiver) + ' | ' + ' '.padEnd(columnWidths.sender) + ' | ' + lineEnding;
		resultsTable += ''.padEnd(columnWidths.receiver, '-') + '-+-' + ''.padEnd(columnWidths.sender, '-') + '-+-' + ''.padEnd(columnWidths.comment, '-') + lineEnding;

		let pegsReceived = {};

		// map table data
		results.forEach((result : Receiver) => {
			pegsReceived[result.id] = ''
			pegsReceived[result.id] += result.person.toString().padEnd(columnWidths.receiver) + ' | ' + ''.padEnd(columnWidths.sender) + ' | ' + lineEnding;
			let firstPeg = true;
			let pegCount = result.pegs.length;
			result.pegs.forEach((peg : PegReceivedData) => {
				if (firstPeg) {
					pegsReceived[result.id] += pegCount.toString().padEnd(columnWidths.receiver) + ' | ' + peg.sender.toString().padEnd(columnWidths.sender) + ' | ' + peg.comment + lineEnding;
					firstPeg = false;
				} else {
					pegsReceived[result.id] += ''.padEnd(columnWidths.receiver) + ' | ' + peg.sender.toString().padEnd(columnWidths.sender) + ' | ' + peg.comment + lineEnding;
				}
			});
			resultsTable += pegsReceived[result.id];
		});
		__logger.information('Results table fully mapped');

		for (let receiver in pegsReceived) {
			this.spark.messages.create(
			{
				markdown:
`Here are the pegs your have received this cycle:
\`\`\`
${pegsReceived[receiver]}
\`\`\``,
				toPersonId: receiver
			});
		}

		let html = this.generateHtml(results, todayString);

		fs.writeFileSync(filePath + '.txt', resultsTable);
		fs.writeFileSync(filePath + '.html', html);

		const client = new storage.Storage();
		let response = await client.bucket(process.env.GCLOUD_BUCKET_NAME).upload(filePath + '.html');
		let file = response[0];
		await file.makePublic();

		let fileUrl = `${constants.googleUrl}${process.env.GCLOUD_BUCKET_NAME}/pegs-${todayString}.html`;
		let markdown = `[Here are all pegs given this cycle](${fileUrl})`;

		return {
			markdown: markdown
		}
	}

	generateHtml(results : Receiver[], todayString : string): string {
		__logger.information('generating html');
		try {
			let htmlTables = '';

			results.forEach((result : Receiver) => {

				htmlTables +=
`				<thead class="thead-light">
					<tr><th colspan="2">${result.person.toString()} &mdash; ${result.pegs.length} peg(s) total</th></tr>
				</thead>
				<tbody>`;

				result.pegs.forEach((peg : PegReceivedData) => {
					htmlTables +=
`
					<tr><td>${peg.sender.toString()}</td><td>${peg.comment}</td></tr>
`;
				});

				htmlTables +=
`				</tbody>
`;
			});

			let html = `<html>
	<head>
		<title>Pegs ${todayString}</title>
		<link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.1.2/css/bootstrap.min.css" integrity="sha384-Smlep5jCw/wG7hdkwQ/Z5nLIefveQRIY9nfy6xoR1uRYBtpZgI6339F5dgvm/e9B" crossorigin="anonymous">
		<script src="https://code.jquery.com/jquery-3.3.1.slim.min.js" integrity="sha384-q8i/X+965DzO0rT7abK41JStQIAqVgRVzpbzo5smXKp4YfRvH+8abtTE1Pi6jizo" crossorigin="anonymous"></script>
		<script src="https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.14.3/umd/popper.min.js" integrity="sha384-ZMP7rVo3mIykV+2+9J3UJ46jBk0WLaUAdn689aCwoqbBJiSnjAK/l8WvCWPIPm49" crossorigin="anonymous"></script>
		<script src="https://stackpath.bootstrapcdn.com/bootstrap/4.1.2/js/bootstrap.min.js" integrity="sha384-o+RDsa0aLu++PJvFqy8fFScvbHFLtbvScb8AjopnFD+iEQ7wo/CG0xlczd+2O/em" crossorigin="anonymous"></script>
	</head>
	<body>
		<div class="container content">
			<h1 class="pt-3 pb-3">Pegs and Pocky ${todayString}</h1>
			<h2>Pegs Received:</h2>
			<table class="table">
${htmlTables}
			</table>
		</div>
	</body>
</html>`;

			__logger.information("finished generating html");
			return html;
		} catch(e) {
			__logger.error(`Error in generating html:\n${e.message}`);
		}
	}
}
