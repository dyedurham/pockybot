export default class Utilities {
	sleep(seconds : number) : Promise<void> {
		return new Promise(resolve => setTimeout(resolve, seconds * 1000));
	}

	getRandomInt(num : number) : number {
		return Math.floor(Math.random() * num);
	}
};
