import { PockyDB } from '../database/db-interfaces';
import { ResultRow } from '../../models/database';
import { Receiver } from '../../models/receiver';
import TableHelper from '../parsers/tableHelper';
import __logger from '../logger';
import { PegReceivedData } from '../../models/peg-received-data';
import { Webex } from 'webex/env';

const lineEnding = '\r\n';

export interface PmResultsService {
	pmResults() : Promise<void>
}

export class DefaultPmResultsService implements PmResultsService {
	database : PockyDB;
	webex : Webex;

	constructor(database : PockyDB, webex : Webex) {
		this.database = database;
		this.webex = webex;
	}

	async pmResults() : Promise<void> {
		const data : ResultRow[] = await this.database.returnResults();
		const results : Receiver[] = TableHelper.mapResults(data);

		let columnWidths = TableHelper.getReceiverColumnWidths(results);

		let pegsReceived = {};

		// map table data
		results.forEach((result: Receiver) => {
			result.pegs.sort((a, b) => a.sender.localeCompare(b.sender));

			pegsReceived[result.id] = ''
			pegsReceived[result.id] += result.person.toString().padEnd(columnWidths.receiver) + ' | ' + ''.padEnd(columnWidths.sender) + ' | ' + lineEnding;
			let firstPeg = true;
			let pegCount = result.pegs.length;
			result.pegs.forEach((peg: PegReceivedData) => {
				if (firstPeg) {
					pegsReceived[result.id] += pegCount.toString().padEnd(columnWidths.receiver) + ' | ' + peg.sender.toString().padEnd(columnWidths.sender) + ' | ' + peg.comment + lineEnding;
					firstPeg = false;
				} else {
					pegsReceived[result.id] += ''.padEnd(columnWidths.receiver) + ' | ' + peg.sender.toString().padEnd(columnWidths.sender) + ' | ' + peg.comment + lineEnding;
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
				__logger.error(`[PmResultsService.pmResults] Error sending PM to user ${receiver}: ${error.message}`);
				fullSuccess = false;
			}
		}

		if (!fullSuccess) {
			throw new Error('Some users were unable to be PMed their results.');
		}
	}
}
