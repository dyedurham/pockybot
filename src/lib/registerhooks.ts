import { WebhookObject, Page } from 'webex/env';
const webex = require('webex/env');
import constants from '../constants';
import { Logger } from './logger';
import * as fs from "fs";

function filterHooks(webhooks : Page<WebhookObject>) : WebhookObject[] {
	return webhooks.items.filter((w : WebhookObject) => {
		return w.name === constants.botName + ' webhook' || w.name === constants.botName + ' direct webhook';
	});
}

function setGcloudCredentials(){
	const filePath = `${__dirname}/../../gcloud-credentials.json`;

	const credentials = `
{
  "type": "service_account",
  "project_id": "${process.env.GCLOUD_PROJECT_ID}",
  "private_key_id": "${process.env.GCLOUD_PRIVATE_KEY_ID}",
  "private_key": "${process.env.GCLOUD_PRIVATE_KEY}",
  "client_email": "${process.env.GCLOUD_CLIENT_EMAIL}",
  "client_id": "${process.env.GCLOUD_CLIENT_ID}",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "${process.env.GCLOUD_CLIENT_CERT_URL}"
}`;

	fs.writeFileSync(filePath, credentials);
	process.env.GOOGLE_APPLICATION_CREDENTIALS = filePath;
}

export function registerHooks(){
	try {
		setGcloudCredentials();
	} catch(e){
		Logger.error(`[RegisterHooks.base] Unable to create google cloud credentials: ${e.message}`);
	}

	try {
		webex.webhooks.list()
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
					webex.webhooks.remove(hook);
				});

				Logger.debug('[RegisterHooks.base] successfully cleaned up old hooks');
			}).then(() => {
				webex.webhooks.create({
					resource: 'messages',
					event: 'created',
					filter: 'mentionedPeople=me',
					targetUrl: constants.postUrl,
					name: constants.botName + ' webhook'
				});

				webex.webhooks.create({
					resource: 'messages',
					event: 'created',
					filter: 'roomType=direct',
					targetUrl: constants.pmUrl,
					name: constants.botName + ' direct webhook'
				})
			})
			.catch(function(e) {
				Logger.error(`[RegisterHooks.base] Error registering hooks: ${e.message}`);
			});
	} catch (e) {
		Logger.error(`[RegisterHooks.base] Uncaught error registerhooks: ${e.message}`);
	}
}
