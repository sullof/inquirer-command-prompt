'use strict'

var inquirer = require('inquirer')
inquirer.registerPrompt('command', require('..'))


function runPrompt() {

  const availableCommands = [
    {
      filter: function (str) {
        return str.replace(/ \[.*$/, '')
      }
    },
    'foo a', 'foo b', 'foo ba mike', 'foo bb buck', 'foo bb jick', 'boo', 'fuu', 'quit', 'show john [first option]', 'show mike [second option]', "isb -b --aab-long -a optA", "isb -b --aab-long -a optB", "isb -b --aab-long -a optC"
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
      },
      short: true
    }
  ]).then(answers => {
    if (!~'foo,boo,doo,quit,show'.split(',').indexOf(answers.cmd)) {
      console.log('Okedoke.')
    }
    if (answers.cmd !== 'quit') {
      return runPrompt()
    }
  }).catch(err => {
    console.error(err.stack)
  })

}

runPrompt()