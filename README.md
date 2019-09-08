# inquirer-command-prompt

A simple, but powerful prompt with history management and autocomplete for [Inquirer](https://github.com/SBoudrias/Inquirer.js)

## Installation

```
npm install inquirer-command-prompt --save
```

## Usage

```javascript
inquirer.registerPrompt(
   'command',
   require('inquirer-command-prompt')
)
```
You can change the name `command` with whatever you like, the actual prompt is anonymous.

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

For dynamic managements, the completion array can be returned by a function, for example:
```javascript
  return inquirer.prompt([
      {
        type: 'command',
        name: 'cmd',
        message: '>',
        validate: val => true,
        // optional
        autoCompletion: line => {
          if (/(\.|\/|~)/.test(line)) return someFileAutoCompletion(line)
          else return ['ls', 'echo', 'find', 'cat', 'help']
        },
        context: 0,
        short: false
      }
    ]).then(answers => {
      return Promise.resolve(answers.cmd)
    }).catch(err => {
      console.error(err.stack)
    })
```

##### short

The `short` option is optional and by default it is set to `false`. If set to `true` it cuts the suggestion leaving only the part that has not been already typed. For example, if there are the following command available

```
['foo ba', 'foo bb']
```

and you have already typed `foo` it shows just `ba` and `bb` in the suggestions, instead of `foo ba` and `foo bb`

`short` separates by space. If you need to perform more complex operations, you can customize the short function. For example, if you are building a file completion, you may want to show only the basename, instead than the full path. In this case you could set:
```
  short: (line, matches) {
    return str.replace(/^.*\/([^/]+)$/, '$1')
  },
```
There is an example in `examples/filecompletion.js`.

##### context

The context is important for the history. If you program is handling a specific process you want to have an history of the commands available in that specific context. The `context`s have to be increasing integers starting from 0.

Run the example in `examples/autocompletion.js` to see how the options work.

##### saved history

To save the history and start back from there, you can config a file for history.

You can also limit the number of commands you like to have in history (to avoid huge, unlimited histories).

```javascript
const inquirer = require('inquirer')
const inquirerCommandPrompt = require('inquirer-command-prompt')
const path = require('path')

const historyFolder = path.join(homedir(), '.myApp')

inquirerCommandPrompt.setConfig({
  history: {
    save: true,
    folder: historyFolder,
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

From version `0.0.15`, to see the entire history for the current context, you can type `Shift-arrowRight`.

## Credits
[Francesco Sullo](https://francesco.sullo.co)

## License
MIT
