# inquirer-command-prompt
A prompt with history management and autocomplete for [Inquirer](https://github.com/SBoudrias/Inquirer.js)

## Installation

```
npm install inquirer-command-prompt --save
```

## Usage

```javascript
inquirer.registerPrompt('command', require('inquirer-command-prompt'))
```
You can change the type `command` with whatever you like, the prompt is anonymous.

## Example


```javascript
  return inquirer.prompt([
      {
        type: 'command',
        name: 'cmd',
        message: '>',
        validate: val => {
          return val
              ? true
              : 'I you don\'t know the available commands, type help for help'
        },
        // optional
        autoCompletion: ['ls', 'echo', 'find', 'cat', 'help'],
        context: 0,
        short: false
      }
    ]).then(answers => {
      return Promise.resolve(answers.cmd)
    }).catch(err => {
      console.error(err.stack)
    })
```


### Options

##### autoCompletion

It is optional. It can be an array or a function which returns an array accepting as a parameter the part of the command that's been already typed.

The first element of the array can be an `options` object. Right now, the only implemented option is `filter`. Suppose that you want to edit something and the available commands are
```
edit 12: Love is in the air
edit 36: Like a virgin
```
The titles of the songs are actually hints, and are not necessary for the command which is supposed to be only `edit 12`. So, you want that when the user presses TAB only `edit 12` is rendered. To obtain this, you can pass the following command list:
```
[
  { filter: str => str.split(':')[0] },
  'edit 12: Love is in the air',
  'edit 36: Like a virgin'
]
```

##### short

The `short` option is optional and by default it is set to `false`. If set to `true` it cuts the suggestion leaving only the part that has not been already typed. For example, if there are the following command available

```
['foo ba', 'foo bb']
```

and you have already typed `foo` it shows just `ba` and `bb` in the suggestions, instead of `foo ba` and `foo bb`

##### context

The context is important for the history. If you program is handling a specific process you want to have an history of the commands available in that specific context. The `context` has to be an increasing integer starting from 0 (which is the default if no context is passed).

Run the example in `examples/autocompletions.js` to see how the options work.

##### saved history

To save the history and start back from there, you can config a file for history.

You can also limit the number of commands you like to have in history (to avoid huge, unlimited histories).

```javascript
const inquirer = require('inquirer')
const inquirerCommandPrompt = require('inquirer-command-prompt')
const path = require('path')

const historyFolder = path.join(homedir(), '.tgt')
inquirerCommandPrompt.setConfig({
  history: {
    save: true,
    folder: path.join(homedir(), '.tgt'),
    limit: 10,
    blacklist: ['exit']
  }
})

inquirer.registerPrompt('command', inquirerCommandPrompt)

```

Parameters:

`save` explicitly asks to save the history

`folder` is the folder where the history file will be saved

`limit` is the limit of the saved history. This is not applied to the history in memory.

`blacklist` is a list of commands that we don't want to put in the saved history. For example an `exit`.


##### retrieve the history

To navigate the history, as usual, just type `arrowUp` and `arrowDown`.

From version `0.0.15', to see the entire history for the current context, you can type `Shift-arrowRight`.

## Requirements

Starting with version v0.0.7, inquirer-command-prompt requires Node 6+.

## Credits
Francesco Sullo

## License
MIT
