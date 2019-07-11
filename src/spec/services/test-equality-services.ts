import { Result } from '../../models/result';
import { Peg } from '../../models/peg';

export default class TestEqualityService {
	public static resultArrayIsEqual(a: Result[], b: Result[]): boolean {
		if (a.length !== b.length) {
			return false;
		}

		const sortResults = (x: Result, y: Result) => x.personId > y.personId ? 1 : -1;
		a.sort(sortResults);
		b.sort(sortResults);
		a.forEach((result, index) => {
			if (result.personId !== b[index].personId
				|| result.personName !== b[index].personName
				|| result.weightedPegsReceived !== b[index].weightedPegsReceived
				|| !this.pegArrayIsEqual(result.validPegsReceived, b[index].penaltyPegsGiven)
				|| !this.pegArrayIsEqual(result.penaltyPegsGiven, b[index].penaltyPegsGiven)) {
				return false;
			}
		});

		return true;
	}

	public static pegArrayIsEqual(a: Peg[], b: Peg[]): boolean {
		if (a.length !== b.length) {
			return false;
		}

		const sortPegs = (x: Peg, y: Peg) => {
			if (x.receiverId > y.receiverId) {
				return 1;
			} else if (x.receiverId < y.receiverId) {
				return -1;
			}

			if (x.senderId > y.senderId) {
				return 1;
			} else if (x.senderId < y.senderId) {
				return -1;
			}

			if (x.comment > y.comment) {
				return 1;
			} else if (x.comment < y.comment) {
				return -1
			}

			return 0;
		};

		a.sort(sortPegs);
		b.sort(sortPegs);
		a.forEach((peg, index) => {
			if (peg.receiverId !== b[index].receiverId
				|| peg.receiverName !== b[index].receiverName
				|| peg.senderId !== b[index].receiverId
				|| peg.senderName !== b[index].senderName
				|| peg.comment !== b[index].comment
				|| peg.isValid !== b[index].isValid
				|| !this.stringArrayEqual(peg.categories, b[index].categories)) {
				return false;
			}
		});

		return true;
	}

	public static stringArrayEqual(a: string[], b: string[]): boolean {
		if (a.length !== b.length) {
			return false;
		}

		a.sort();
		b.sort();
		a.forEach((string, index) => {
			if (string !== b[index]) {
				return false;
			}
		});

		return true;
	}
}
