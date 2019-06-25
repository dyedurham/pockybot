# Pockybot 📍👏🏆🤖

> Webex bot that handles team recognition. A chatbot for [pegs & pocky](#what-is-pegs--pocky).

## What is Pegs & Pocky?

Pegs & Pocky was created within GlobalX as a merit-based system to encourage good behaviour and to continuously improve within our complex environment, so people are motivated to reach their full potential. It started out as a physical system of pegs and cups on everyone’s desk, however as our development team expanded interstate we needed an electronic system to include everyone. Here's how it works:

1. Participating members acknowledge good work by giving virtual "pegs" to other members within a specified time period.
    * Each member has a maximum number of pegs they can give out within that time period.
    * If they do not give at least a minimum number of pegs then they are not eligible for winning.
1. At the end of the time period the pegs are counted (an admin calls "finish" on the bot) and the winners are announced in the chat.
1. The top three peg recipients get physical rewards (Pocky and/or other snacks).

## How it works

* Library used to set up a Webex Teams Bot
* Results are stored in a postgres database
* Pegs are viewable via html uploaded to google cloud

## Setup

Using npm:
```
npm i pockybot
```

Using yarn:
```
yarn add pockybot
```

## Usage

### Environment Variables

The following environment variables must be set so that PockyBot can run properly:

Variable Name | Purpose | Example Value
:-- | :-- | :--
BUILD_NUMBER | Allows PockyBot to display the build number that is running when you ping it | 102
VERSION_BRANCH | Allows PockyBot to display the version of the app that is running when you ping it | 1.0.0
WEBEX_ACCESS_TOKEN | Used so that the app can connect and post to Webex Teams as the Bot | DFsSdfsdFhgiFg
BOT_ID | Used to filter the webhooks so that the Bot only responds to messages where it has been mentioned |Y2lzY29zcGFyadsdfEREr
BOT_NAME | Used to provide a human-readable name for the Bot and to name the webhooks | PockyBot
POST_URL | The url that the webhook will hit when a message that mentions the bot is created | https://example.com/pocky/respond
PM_URL | The url that the webhook will hit when a private message is sent to the bot | https://example.com/pocky/pm
PGUSER | The username of the database user set up for the bot | pockybotuser
PGPASSWORD | The password used to connect to the database | password
PGHOST | The url of the [database](#database) for the bot information | postgres.example.com
PGDATABASE | The name of the database | pockydatabase
PGPORT | The port of the database | 5432
GCLOUD_PROJECT_ID | The ID of the gcloud project where the bucket used to store results information is found | project-123
GCLOUD_PRIVATE_KEY_ID | The ID of the gcloud private key | a23c87b7127ab7d2
GCLOUD_PRIVATE_KEY | The private key required to connect to the gcloud bucket | -----BEGIN PRIVATE KEY-----\nMItestingtestingtesting23423\n-----END PRIVATE KEY-----\n
GCLOUD_CLIENT_EMAIL | Required to connect to the gcloud bucket | pockybot@project-123.iam.gserviceaccount.com
GCLOUD_CLIENT_ID | Required to connect to the gcloud bucket | 382348239123
GCLOUD_CLIENT_CERT_URL | Required to connect to the gcloud bucket | https://www.googleapis.com/robot-/v1/metadata/x509/pockybot%40project-123.iam.gserviceaccount.com
GCLOUD_BUCKET_NAME | The name of the gcloud bucket being used to store the pockybot results | pockybucket

### Code
The following is example code showing usage of the bot with express in a typescript project:

```typescript
import * as express from 'express';
import * as bodyParser from 'body-parser';
import { PockyBot } from 'pockybot';

// Constants
const PORT = 80;
const HOST = '0.0.0.0';

//Startup - note environment variables should already be set up when this is run
PockyBot.RegisterHooks();

// App
const app = express();
app.use(bodyParser.json()); // for parsing application/json

app.post('/respond', async (req, res) => {
    try {
        await PockyBot.Respond(req.body);
        res.status(200).end();
    } catch (e) {
        res.status(400).end();
    }
});

app.post('/pm', async (req, res) => {
    try {
        await PockyBot.PmRespond(req.body);
        res.status(200).end();
    } catch (e) {
        res.status(400).end();
    }
});

app.listen(PORT, HOST);
```

### Database

`database/initial-setup` includes a number of `.sql` files to build the database as required by PockyBot.

Table `generalconfig` is initialised with default values as follows:

Value | Default | Explanation
:-- | :-- | :--
limit | 10 | The number of pegs each user is allowed to give out each cycle
minimum | 5 | The minimum number of pegs each user is *required* to give out to be eligible to win
winners | 3 | The number of winners displayed (using a dense ranking)
commentsRequired | 1 | Boolean value of whether a reason is required to give a peg
pegWithoutKeyword | 0 | Boolean value of whether the "peg" keyword is required to give a peg (if true, pegs can be given with `@PockyBot @Person <reason>`)
requireValues | 1 | Boolean value of whether a keyword is required in the reason for a peg to be given

Table `stringconfig` is used to define keywords.
Name field is 'keyword' and 'value' is the value of the keyword desired.
Default keywords are 'customer', 'brave', 'awesome', 'collaborative', and 'real', shorthands for the GlobalX company values.

Existing roles are 'ADMIN', 'UNMETERED', 'RESULTS', 'FINISH', 'RESET', 'UPDATE', and 'WINNERS'.
Users can have more than one role. Any users with the 'ADMIN' role are considered to have all other roles except for 'UNMETERED'.
'UNMETERED' users are not restricted by the usual 'limit' value from `generalconfig`.
All other roles relate to the commands of the same name displayed below.

### Commands

All commands related to PockyBot must begin with a mention of the bot, or be sent directly to the bot.
In this readme, mentions will be identified by `@PockyBot`.

#### General commands

Use any of these commands in a room PockyBot is participating in to perform commands.

* `@PockyBot status` &mdash; get a list of pegs you have given this cycle.
* `@PockyBot welcome` &mdash; display a welcome message.
* `@PockyBot ping` &mdash; verify that the bot is alive.
* `@PockyBot help` &mdash; display a list of available commands.
* `@PockyBot peg|to|at|for @OtherPerson <reason>` &mdash; give a peg to `@OtherPerson` for `<reason>`.
  * If comments are required, a reason **must** be given. Otherwise, reasons are optional.
  * `<reason>` must include a keyword anywhere within it if keywords are required.
* `@PockyBot keywords` &mdash; display the available keywords.
* `@PockyBot rotation` &mdash; display the rotation of the order in which teams are responsible for buying snacks.
  This can be configured by adding a stringconfig with the name "rotation" and the value corresponding to a list of
  comma separated team names.
* `@PockyBot unpeg @OtherPerson <reason>` &mdash; pretend to remove a peg from `@OtherPerson`.
  * Use `@PockyBot unpeg <concept> for <reason>` to unpeg abstract concepts that can't be tagged.
* `@PockyBot locationconfig get` &mdash; get the list of available locations.
* `@PockyBot userlocation get|set|delete {location} me|all|unset|@User` &mdash; configure user locations. Note that normal users may not
configure locations for people other than themselves, but admins can access the full functionality of this command.

##### Direct message commands

PockyBot can be messaged directly with certain commands.

* `status` &mdash; get a list of pegs you have given this cycle.
* `welcome` &mdash; display a welcome message.
* `ping` &mdash; verify that the bot is alive.
* `help` &mdash; display a list of available commands.
* `keywords` &mdash; display the available keywords.
* `rotation` &mdash; display the rotation (see above).

#### Admin-only commands

These commands can only be performed by users with the role of 'ADMIN' or users with a role corresponding to the name of the given command.

* `@PockyBot winners` &mdash; display the current winners
* `@PockyBot results` &mdash; display the current full results
* `@PockyBot reset` &mdash; remove all pegs from the database
* `@PockyBot update` &mdash; update names stored in the database with users' current display names
* `@PockyBot finish` &mdash; complete the cycle by displaying the winners and results before wiping the database
* `@PockyBot numberconfig get|set|refresh|delete {name} {number}` &mdash; get or change config values
* `@PockyBot stringconfig get|set|refresh|delete {name} {value}` &mdash; get or change string config values
* `@PockyBot roleconfig get|set|refresh|delete {@User} {role}` &mdash; get or change user roles
* `@PockyBot locationconfig get|set|delete {location}` &mdash; get or change locations
* `@PockyBot remove @User|username` &mdash; remove a user

## Contributing

For notes on how to contribute, please see our [Contribution Guidelines](https://github.com/GlobalX/pockybot/blob/master/CONTRIBUTING.md).

## Testing

1. `npm install`
1. `npm test`
