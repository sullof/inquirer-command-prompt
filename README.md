# inquirer-command-prompt
A prompt with history management and autocomplete

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

## Requirements

Starting with version v0.0.7, inquirer-command-prompt requires Node 6+.

## Credits
Francesco Sullo

## License
MIT