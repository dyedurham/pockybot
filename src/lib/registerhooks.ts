import spark from 'ciscospark/env';
import constants from '../../constants';
import __logger from './logger';

try {
	spark.webhooks.list()
		.then(function(webhooks) {
			let myhooks = webhooks.items.filter(function(w) {
				return w.name === constants.botName + ' webhook' || w.name === constants.botName + ' direct webhook';
			});
			myhooks.forEach((hook) => {
				spark.webhooks.remove(hook);
			});
			__logger.debug('successfully cleaned up old hooks');
		}).then(function() {
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
