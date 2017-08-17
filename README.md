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
You can change the command with whatever you like, the prompt is anonymous.


```javascript
  return inquirer.prompt([
      {
        type: 'command',
        name: 'cmd',
        message: '>',
        autoCompletion: ['ls', 'echo', 'find', 'cat', 'help'],
        context: 0,
        validate: val => {
          return val
              ? true
              : 'I you don\'t know the available commands, type help for help'
        }
      }
    ]).then(answers => {
      return Promise.resolve(answers.cmd)
    }).catch(err => {
      console.error(err.stack)
    })
```


### Options

##### autocompletion

It can be an array or a function which returns an array allowing to generate the list of the commands dynamically. The function will accept a `line` parameter, which is the part of the command that's been already typed. That can be useful to determinate what to return. 

The first element of the list, in any case, can be an `options` object. Right now, the only implemented option is `separator` which allows to show in the list of the available commands a string, taking only the part of the string before the separator. For example, suppose that you want to edit something and the available commands are 
```
edit 12: Love is in the air
edit 36: Like a virgin
```
The title of the songs are actually hints, and are not necessary for the command which is only `edit 12`. To obtain this, you can pass the following command list:
```
[
  { separator: ':' }, 
  'edit 12: Love is in the air',
  'edit 36: Like a virgin'
]
```

##### context

The context is important for the history. If you program is handling a specific process you want to have an history of the commands available in that specific context. The `context` has to be an increasing integer starting from 0 (which is the default if no context is passed).

## Credits
Francesco Sullo

## License
MIT