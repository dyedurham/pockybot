import spark, { WebhookObject, Page } from 'ciscospark/env';
import constants from '../constants';
import __logger from './logger';

function filterHooks(webhooks : Page<WebhookObject>) : WebhookObject[] {
	return webhooks.items.filter((w : WebhookObject) => {
		return w.name === constants.botName + ' webhook' || w.name === constants.botName + ' direct webhook';
	});
}

try {
	spark.webhooks.list()
		.then(async (webhooks : Page<WebhookObject>) => {
			let myHooks : WebhookObject[] = [];
			let first = true;
			do {
				if (first) {
					first = false;
				} else {
					webhooks = await webhooks.next();
				}

				myHooks = myHooks.concat(filterHooks(webhooks));
			} while (webhooks.hasNext())

			myHooks.forEach((hook : WebhookObject) => {
				spark.webhooks.remove(hook);
			});

			__logger.debug('successfully cleaned up old hooks');
		}).then(() => {
			spark.webhooks.create({
				resource: 'messages',
				event: 'created',
				filter: 'mentionedPeople=me',
				targetUrl: constants.postUrl,
				name: constants.botName + ' webhook'
			});

			spark.webhooks.create({
				resource: 'messages',
				event: 'created',
				filter: 'roomType=direct',
				targetUrl: constants.pmUrl,
				name: constants.botName + ' direct webhook'
			})
		})
		.catch(function(e) {
			__logger.error(`Error registering hooks:\n${e.message}`);
		});
} catch (e) {
	__logger.error(`Uncaught error registerhooks:\n${e.message}`);
}
