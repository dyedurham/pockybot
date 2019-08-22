# Contributing to PockyBot

Thanks for deciding to contribute to PockyBot. Here are a few things to get you started and for you to keep in mind while contributing to this repository.

## Code of Conduct

While you participate in this project you are bound by our [Code of Conduct](https://github.com/GlobalX/pockybot/blob/master/CODE_OF_CONDUCT.md). Please take the time to read it before you begin contributing. If you notice anyone not adhering to these guidelines or making other contributors uncomfortable, please report it to us at pockybotdeveloper@gmail.com.

## How do I contribute?

If you would like to contribute to PockyBot, feel free to do so! Please note that master is a protected branch so all pull requests need to be approved by at least two contributors with push access to the repository. If you would like to work on new features then head on over to the Projects tab. Here we have a kanban board with upcoming work for the project, and you can see what's currently in progress as well as what needs to be done.

### Commit message guidelines

In order for the automatic publishing of releases to occur when branches are merged to master, commit messages must be formatted in a specific format.

Example:
```
feat(packages): Add commitizen

Add commitizen so that commit messages can be standardised to work with semantic-release
```

Rather than learning this format, it is recommended to use commitizen as your tool for committing, **instead** of using git commit. In order to use commitizen, you can execute the following commands:
1. ```git add -a``` — Add your files to the commit.
2. ```npm run commit``` — Execute the commitizen commit wizard. This step assumes you have already run `npm i`.


### Environment setup

Please install [Editor Config](http://editorconfig.org/) for your editor of choice.

Here's a few links:

* [Atom](https://atom.io/packages/editorconfig)
* [VSCode](https://marketplace.visualstudio.com/items?itemName=EditorConfig.EditorConfig)
* [Sublime](https://packagecontrol.io/packages/EditorConfig)
* [VisualStudio](https://github.com/editorconfig/editorconfig-visualstudio)
* [Notepad++](https://github.com/editorconfig/editorconfig-notepad-plus-plus)
* [Vim](https://www.vim.org/scripts/script.php?script_id=3934)

1. Create a new branch or fork the repository.
1. Commit your new code.
1. Make a PR.

### Building branches

To build and test a branch of PockyBot in order to test functionality before merging it to master,
follow the following steps:

1. Set the `version` in the `package.json` to [the next version number](https://www.npmjs.com/package/pockybot) marked as a preview.
	For example, if the current version is `1.4.0`, set to `1.4.1-preview`. Do not commit this change.
1. Locally, run:
	```bash
	npm i
	npm run build
	```
1. Log your terminal in to npm:
	```bash
	npm login
	```
	And provide your npm login details, ensuring that your account has permission to publish PockyBot.
	(Contact the developers if you believe you should have this permission but do not.)
1. Publish your preview build:
	```bash
	npm publish --tag preview
	```
1. In the `package.json` of the `pockybot-endpoint` repo (in private source repository), set the `version` of the `pockybot` dependency to the one you just published, e.g. `1.4.1-preview`.
1. Run
	```bash
	npm i
	```
1. Commit the result
1. Build the `pockybot-endpoint` using CI tool.

When testing with this preview version is finished, deprecate the preview by running

```bash
npm deprecate pockybot@<version> "This is the reason for deprecating"
```

## I just want to report something

If you would like to report a bug or request a feature you can do this through the Issues tab. We will do our best to reply promptly. If there is something you would rather not ask publicly, you can always contact us at pockybotdeveloper@gmail.com.
