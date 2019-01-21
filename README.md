# Pockybot 📍👏🏆🤖

> Spark bot that handles team recognition. A chatbot for [pegs & pocky](#what-is-pegs--pocky).

## What is Pegs & Pocky?

Pegs & Pocky was created within GlobalX as a merit-based system to encourage good behaviour and to continuously improve within our complex environment, so people are motivated to reach their full potential. It started out as a physical system of pegs and cups on everyone’s desk, however as our development team expanded interstate we needed an electronic system to include everyone. Here's how it works:

1. Participating members acknowledge good work by giving virtual "pegs" to other members within a specified time period.
    * Each member has a maximum number of pegs they can give out within that time period.
    * If they do not give at least a minimum number of pegs then they are not eligible for winning.
1. At the end of the time period the pegs are counted (an admin calls "finish" on the bot) and the winners are announced in the chat.
1. The top three peg recipients get physical rewards (Pocky and/or other snacks).

## Details

My name is:

* pockybot@sparkbot.io
* @PockyBot

## How it works

* Runs on express.js
* Uses ciscospark client
* Deployed only on PROD to be accessible by Cisco's Server
* Results are stored in a postgres database
* pegs are viewable via text file attached to spark message, txt file hosted localy on the node server, or html uploaded to google cloud

## Setup

1. `npm install`
1. `npm run build`
1. `npm start`

## Usage

All commands related to PockyBot must begin with a mention of the bot, or be sent directly to the bot.
In this readme, mentions will be identified by `@PockyBot`.

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
* `@PockyBot unpeg @OtherPerson <reason>` &mdash; pretend to remove a peg from `@OtherPerson`.

##### Direct message commands

PockyBot can be messaged directly with certain commands.

* `status` &mdash; get a list of pegs you have given this cycle.
* `welcome` &mdash; display a welcome message.
* `ping` &mdash; verify that the bot is alive.
* `help` &mdash; display a list of available commands.
* `keywords` &mdash; display the available keywords

#### Admin-only commands

These commands can only be performed by users with the role of 'ADMIN' or users with a role corresponding to the name of the given command.

* `@PockyBot winners` &mdash; display the current winners
* `@PockyBot results` &mdash; display the current full results
* `@PockyBot reset` &mdash; remove all pegs from the database
* `@PockyBot update` &mdash; update names stored in the database with users' current display names
* `@PockyBot finish` &mdash; complete the cycle by displaying the winners and results before wiping the database

## Contributing

For notes on how to contribute, please see our [Contribution Guidelines](https://github.com/GlobalX/pockybot/blob/master/CONTRIBUTING.md).

## Testing

1. `npm install`
1. `npm test`
