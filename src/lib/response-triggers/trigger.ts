export default class Trigger {
	isToTriggerOn(message) : boolean {
		return false;
	}

	isToTriggerOnPM(message) : boolean {
		return false;
	}

	async createMessage(message : any, room? : any) : Promise<{markdown : string}> {
		return {
			markdown: ""
		}
	}
}
