import { PockyDB } from '../database/db-interfaces';
import { ResultRow } from '../../models/database';
import { Receiver } from '../../models/receiver';
import TableHelper from '../parsers/tableHelper';
import { Logger } from '../logger';
import { PegReceivedData } from '../../models/peg-received-data';
import { Webex } from 'webex/env';
import Utilities from '../utilities';
import { Peg } from '../../models/peg';
import { Result } from '../../models/result';
import { PegService } from './peg-service';
import { ResultsService } from './results-service';

const lineEnding = '\r\n';

export interface PmResultsService {
	pmResults() : Promise<void>
}

export class DefaultPmResultsService implements PmResultsService {
	database : PockyDB;
	webex : Webex;
	utilities: Utilities;
	pegService: PegService;
	resultsService: ResultsService;

	constructor(database : PockyDB, webex : Webex, utilities: Utilities, pegService: PegService, resultsService: ResultsService) {
		this.database = database;
		this.webex = webex;
		this.utilities = utilities;
		this.pegService = pegService;
		this.resultsService = resultsService;
	}

	async pmResults() : Promise<void> {
		const fullData: ResultRow[] = await this.database.returnResults();
		const allPegs: Peg[] = this.pegService.getPegs(fullData);
		const fullResults: Result[] = this.resultsService.getResults(allPegs);

		let columnWidths = TableHelper.getReceiverColumnWidths(fullResults);

		let pegsReceived = {};

		// map table data
		fullResults.forEach((result: Result) => {
			result.validPegsReceived.sort((a, b) => a.senderName.localeCompare(b.senderName));

			pegsReceived[result.personId] = '';
			pegsReceived[result.personId] += result.personName.toString().padEnd(columnWidths.receiver) + ' | ' + ''.padEnd(columnWidths.sender) + ' | ' + lineEnding;
			let firstPeg = true;
			let pegCount = result.validPegsReceived.length;
			result.validPegsReceived.forEach((peg: Peg) => {
				if (firstPeg) {
					pegsReceived[result.personId] += pegCount.toString().padEnd(columnWidths.receiver) + ' | ' + peg.senderName.padEnd(columnWidths.sender) + ' | ' + peg.comment + lineEnding;
					firstPeg = false;
				} else {
					pegsReceived[result.personId] += ''.padEnd(columnWidths.receiver) + ' | ' + peg.senderName.padEnd(columnWidths.sender) + ' | ' + peg.comment + lineEnding;
				}
			});
		});

		let fullSuccess : boolean = true;

		for (let receiver in pegsReceived) {
			try {
				this.webex.messages.create({
					markdown:
						`Here are the pegs your have received this cycle:
\`\`\`
${pegsReceived[receiver]}
\`\`\``,
					toPersonId: receiver
				});
			} catch(error) {
				Logger.error(`[PmResultsService.pmResults] Error sending PM to user ${receiver}: ${error.message}`);
				fullSuccess = false;
			}
		}

		if (!fullSuccess) {
			throw new Error('Some users were unable to be PMed their results.');
		}
	}
}
