import { Peg } from '../../models/peg';

export default class MockDataService {
	public static promiseResolvingTo(response: any) {
		return new Promise((resolve) => {
			resolve(response);
		});
	}

	public static createPeg(receiverId: string, receiverName: string, senderId: string, senderName: string, comment: string, categories: string[], isValid: boolean, pegWeighting?: number): Peg {
		return {
			receiverId, receiverName, senderId, senderName, comment, categories, isValid,
			pegWeighting: pegWeighting ? pegWeighting : isValid ? 1 : 0
		};
	}
}
