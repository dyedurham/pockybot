import Trigger from './trigger';
import constants from '../../../constants';
import TableHelper from '../parsers/tableHelper';
import * as fs from 'fs';
import PockyDB from '../../database/PockyDB';
import TableSizeParser from '../TableSizeParser';
import Config from '../config';
import __logger from '../logger';

const lineEnding = '\r\n';
const resultsCommand = '(?: )*results(?: )*';

export default class Results extends Trigger {
	readonly cannotDisplayResults : string = "Error encountered; cannot display results.";

	spark : any;
	database : PockyDB;
	tableSizer : TableSizeParser;
	config : Config;

	constructor(sparkService, databaseService, tableSizer, config) {
		super();

		this.spark = sparkService;
		this.database = databaseService;
		this.tableSizer = tableSizer;
		this.cannotDisplayResults = "Error encountered; cannot display results.";
		this.config = config;
	}

	isToTriggerOn(message) {
		if (!(this.config.checkRole(message.personId,'admin') || this.config.checkRole(message.personId,'results'))) {
			return false;
		}
		var pattern = new RegExp('^' + constants.optionalMarkdownOpening + constants.mentionMe + resultsCommand, 'ui');
		return pattern.test(message.html);
	}

	async createMessage() {
		let data;
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

	async createResponse(data) {
		var today = new Date();
		var todayString = today.getFullYear() + "-" + (today.getMonth() + 1) + "-" + today.getDate();

		if (fs.existsSync(__dirname + "/pegs-" + todayString + ".txt")) {
			fs.unlinkSync(__dirname + "/pegs-" + todayString + ".txt");
		}

		var results = TableHelper.mapResults(data);
		var columnWidths = TableHelper.getColumnWidths(results);

		// define table heading
		var resultsTable = TableHelper.padString("Receiver", columnWidths.receiver) + " | " + TableHelper.padString("Sender", columnWidths.sender) + " | Comments" + lineEnding;
		resultsTable += "Total".padEnd(columnWidths.receiver) + " | " + " ".padEnd(columnWidths.sender) + " | " + lineEnding;
		resultsTable += "".padEnd(columnWidths.receiver, "-") + "-+-" + "".padEnd(columnWidths.sender, "-") + "-+-" + "".padEnd(columnWidths.comment, "-") + lineEnding;

		var pegsReceived = {};

		// map table data
		results.forEach((result) => {
			pegsReceived[result.id] = ""
			pegsReceived[result.id] += result.person.toString().padEnd(columnWidths.receiver) + " | " + "".padEnd(columnWidths.sender) + " | " + lineEnding;
			var firstPeg = true;
			var pegCount = result.pegs.length;
			result.pegs.forEach((peg) => {
				if (firstPeg) {
					pegsReceived[result.id] += pegCount.toString().padEnd(columnWidths.receiver) + " | " + peg.sender.toString().padEnd(columnWidths.sender) + " | " + peg.comment + lineEnding;
					firstPeg = false;
				} else {
					pegsReceived[result.id] += "".padEnd(columnWidths.receiver) + " | " + peg.sender.toString().padEnd(columnWidths.sender) + " | " + peg.comment + lineEnding;
				}
			});
			resultsTable += pegsReceived[result.id];
		});
		__logger.information("Results table fully mapped");

		var markdown = `Here are all pegs given this fortnight ([beta html view](http://pocky-bot.storage.googleapis.com/pegs-${todayString}.html))`;

		for (var receiver in pegsReceived) {
			this.spark.messages.create(
			{
				markdown:
`Here are the pegs your have received this fortnight:
\`\`\`
${pegsReceived[receiver]}
\`\`\``,
				toPersonId: receiver
			});
		}

		var html = this.generateHtml(results, todayString);

		fs.writeFileSync(__dirname + "/pegs-" + todayString + ".txt", resultsTable);
		fs.writeFileSync(__dirname + "/pegs-" + todayString + ".html", html);

		return {
			markdown: markdown,
			files: [constants.fileURL + '?filename=' +  "pegs-" + todayString + ".txt"]
		}
	}

	generateHtml(results, todayString) {
		__logger.information("generating html");
		try {
			var tableify = require('tableify');

			var htmlTables = [];

			results.forEach((result) => {

				var table = {};

				result.pegs.forEach((peg) => {
					table[peg.sender.toString()] = peg.comment;
				});

				htmlTables.push([result.person.toString(),result.pegs.length, tableify(table)]);
			});

			__logger.information("finsihed generating html");

			var html =
`<html>
	<head>
		<style>
			table {
			    font-family: arial, sans-serif;
			    border-collapse: collapse;
			    width: 100%;
			}

			td, th {
			    border: 1px solid #dddddd;
			    text-align: left;
			    padding: 8px;
			}

			tr:nth-child(even) {
			    background-color: #dddddd;
			}
		</style>
	</head>
	<body>
		<title>pegs ` + todayString + `</title>
		<h1>Pegs and Pocky</h1>
		<h2>Pegs Received:</h2>`;

			htmlTables.forEach((table) => {
				html +=
`		<h3>` + table[0] + ` - ` + table[1] + `</h3>
			` + table[2];
			});

			html +=
`	</body>
</html>`

			return html;
		} catch(e) {
			__logger.error(`Error in generating html:\n${e.message}`);
		}
	}
}
