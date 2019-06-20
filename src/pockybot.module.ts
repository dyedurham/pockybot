import { respond } from './lib/responder';
import { pmRespond } from './lib/pm-responder';
import { registerHooks } from './lib/registerhooks';

export module PockyBot {
	export async function Respond(messageEvent : { data: { id: string } }): Promise<void> {
		return respond(messageEvent);
	}

	export async function PmRespond(messageEvent : any): Promise<void> {
		return pmRespond(messageEvent);
	}

	export function RegisterHooks() {
		registerHooks();
	}
}
