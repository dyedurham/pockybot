import constants from '../../constants';
import __logger from '../logger';
import * as fs from 'fs';
import { FormatResultsService } from './format-results-service';
import { Storage } from '@google-cloud/storage';
import { Peg } from '../../models/peg';
import { Result } from '../../models/result';
import { distinct } from '../helpers/helpers';
import { ResultRow } from '../../models/database/result-row';
import { PockyDB } from '../database/db-interfaces';
import { PegService } from './peg-service';
import { WinnersService } from './winners-service';

export interface ResultsService {
	returnResultsMarkdown() : Promise<string>;
	getResults(pegs : Peg[]) : Result[];
}

export class DefaultResultsService implements ResultsService {
	database: PockyDB;
	formatResultsService: FormatResultsService;
	pegService: PegService;
	winnersService: WinnersService;

	constructor(database: PockyDB, formatResultsService: FormatResultsService, pegService: PegService, winnersService: WinnersService) {
		this.database = database;
		this.formatResultsService = formatResultsService;
		this.pegService = pegService;
		this.winnersService = winnersService;
	}

	async returnResultsMarkdown() : Promise<string> {
		const now = new Date();
		const todayString = now.getFullYear() + '-' + (now.getMonth() + 1) + '-' + now.getDate()
		 + '-' + now.getHours() + '-' + now.getMinutes() + '-' + now.getSeconds();

		const filePath = `${__dirname}/../../../pegs-${todayString}`;
		if (fs.existsSync(filePath + '.txt')) {
			fs.unlinkSync(filePath + '.txt');
		}
		__logger.information("[ResultsService.returnResultsMarkdown] File path: " + filePath);

		const fullData: ResultRow[] = await this.database.returnResults();
		const allPegs: Peg[] = this.pegService.getPegs(fullData);
		const fullResults: Result[] = this.getResults(allPegs);
		const winners = this.winnersService.getWinners(allPegs);

		const html = await this.formatResultsService.returnResultsHtml(fullResults, winners);

		fs.writeFileSync(filePath + '.html', html);

		const client = new Storage();
		let response = await client.bucket(process.env.GCLOUD_BUCKET_NAME).upload(filePath + '.html');
		let file = response[0];
		await file.makePublic();

		const fileUrl = `${constants.googleUrl}${process.env.GCLOUD_BUCKET_NAME}/pegs-${todayString}.html`;
		const markdown = `[Here are all pegs given this cycle](${fileUrl})`;

		return markdown;
	}

	getResults(pegs: Peg[]): Result[] {
		const allPegReceivers = distinct(pegs.map(peg => peg.receiverId));
		const allPegSenders = distinct(pegs.map(peg => peg.senderId));
		const allPeople = distinct(allPegSenders.concat(allPegReceivers));

		let results : Result[] = [];
		allPeople.forEach(personId => {
			const validPegsReceived = pegs.filter(peg => peg.receiverId === personId && peg.isValid);
			const penaltyPegsGiven = pegs.filter(peg => peg.senderId === personId && !peg.isValid);
			const personName = validPegsReceived.length > 0 ? validPegsReceived[0].receiverName : penaltyPegsGiven[0].senderName;

			results.push({
				personId,
				personName,
				weightedPegsReceived: validPegsReceived.length - penaltyPegsGiven.length,
				validPegsReceived,
				penaltyPegsGiven
			});
		});

		return results;
	}
}
