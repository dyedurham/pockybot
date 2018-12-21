# Pockybot 📍👏🏆🤖

> Spark bot that handles team recognition. A chatbot for [pegs & pocky](#what-is-pegs--pocky).

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
1. `npm start`

## Contributing

Please install [Editor Config](http://editorconfig.org/) for your editor of choice.

Here's a few links:

* [Atom](https://atom.io/packages/editorconfig)
* [VSCode](https://marketplace.visualstudio.com/items?itemName=EditorConfig.EditorConfig)
* [Sublime](https://packagecontrol.io/packages/EditorConfig)
* [VisualStudio](https://github.com/editorconfig/editorconfig-visualstudio)
* [Notepad++](https://github.com/editorconfig/editorconfig-notepad-plus-plus)
* [Vim](https://www.vim.org/scripts/script.php?script_id=3934)

1. Create a new branch
1. Commit your branch
1. And PR it

## Testing

1. `node_modules/.bin/jasmine-node .`

## What is Pegs & Pocky?

Pegs & Pocky was created within GlobalX as a merit-based system to encourage good behaviour and to continuously improve within our complex environment, so people are motivated to reach their full potential. It started out as a physical system of pegs and cups on everyone’s desk, however as our development team expanded interstate we needed an electronic system to include everyone. Here's how it works:

1. Participating members acknowledge good work by giving virtual "pegs" to other members within a specified time period.
    * Each member has a maximum number of pegs they can give out within that time period.
    * If they do not give at least a minimum number of pegs then they are not eligible for winning.
1. At the end of the time period the pegs are counted (an admin calls "finish" on the bot) and the winners are announced in the chat.
1. The top three peg recipients get physical rewards (Pocky and/or other snacks).
