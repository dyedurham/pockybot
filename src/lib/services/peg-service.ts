import { ResultRow } from '../../models/database/result-row';
import { Peg } from '../../models/peg';
import Config from '../config-interface';
import Utilities from '../utilities';
import { DbLocation } from '../database/db-interfaces';

export interface PegService {
	getPegs(results : ResultRow[]) : Promise<Peg[]>;
}

export class DefaultPegService implements PegService {
	private config : Config;
	private utilities : Utilities;
	private dbLocation : DbLocation;

	public constructor(config : Config, utilities : Utilities, dbLocation : DbLocation) {
		this.config = config;
		this.utilities = utilities;
		this.dbLocation = dbLocation;
	}

	public async getPegs(results: ResultRow[]) : Promise<Peg[]> {
		const requireKeywords = this.config.getConfig('requireValues');
		const keywords = this.config.getStringConfig('keyword');
		const penaltyKeywords = this.config.getStringConfig('penaltyKeyword');
		const locations = await this.dbLocation.getAllUserLocations();

		return results.map(peg => {
			const categories = this.getKeywords(peg.comment, keywords);
			const isValid = this.utilities.pegValid(peg.comment, requireKeywords, keywords, penaltyKeywords);
			const receiverlocationIndex = locations.findIndex(item => item.userid === peg.receiverid);
			const receiverLocation = receiverlocationIndex === -1 ? null : locations[receiverlocationIndex].location;
			const senderLocationIndex = locations.findIndex(item => item.userid === peg.senderid);
			const senderLocation = senderLocationIndex === -1 ? null : locations[senderLocationIndex].location;
			const pegWeighting = !isValid ? 0 : this.getPegWeighting(senderLocation, receiverLocation);

			return {
				receiverId: peg.receiverid,
				receiverName: peg.receiver,
				receiverLocation,
				senderId: peg.senderid,
				senderName: peg.sender,
				senderLocation,
				comment: peg.comment,
				categories,
				isValid,
				pegWeighting
			};
		});
	}

	private getKeywords(comment : string, keywords : string[]) : string[] {
		return keywords.filter(keyword => comment.toLowerCase().includes(keyword.toLowerCase()));
	}

	private getPegWeighting(senderLocation : string | null, receiverLocation : string | null) : number {
		if (senderLocation == null || receiverLocation == null || senderLocation === receiverLocation) {
			return 1;
		} else {
			const senderToReceiver = `locationWeight${senderLocation}to${receiverLocation}`.toLowerCase();
			const receiverToSender = `locationWeight${receiverLocation}to${senderLocation}`.toLowerCase();
			const allConfig = this.config.getAllConfig();
			const configIndex = allConfig.findIndex(item =>
				item.name.toLowerCase() === senderToReceiver || item.name.toLowerCase() === receiverToSender);

			if (configIndex === -1) {
				const defaultConfig = this.config.getConfig('remoteLocationWeightingDefault');
				return defaultConfig ? defaultConfig : 2;
			}

			return allConfig[configIndex].value;
		}
	}
}
