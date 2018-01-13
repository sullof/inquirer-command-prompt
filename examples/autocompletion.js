'use strict'

var inquirer = require('inquirer')
inquirer.registerPrompt('command', require('../index'))


function runPrompt() {

  const availableCommands = [
    {
      filter: function (str) {
        return str.replace(/ .*$/, '')
      }
    },
    'foo', 'boo', 'doo', 'quit', 'show [friend id]'
  ]

  return inquirer.prompt([
    {
      type: 'command',
      name: 'cmd',
      autoCompletion: availableCommands,
      message: '>',
      context: 0,
      validate: val => {
        return val
            ? true
            : 'Press TAB for suggestions'
      }
    }
  ]).then(answers => {
    if (!~'foo,boo,doo,quit,show'.split(',').indexOf(answers.cmd)) {
      console.log('Command not supported.')
    }
    if (answers.cmd !== 'quit') {
      return runPrompt()
    }
  }).catch(err => {
    console.error(err.stack)
  })

}

runPrompt()