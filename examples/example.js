'use strict'

var inquirer = require('inquirer')
let commandPrompt = require('..')
inquirer.registerPrompt('command', commandPrompt)

async function sleep(millis) {
  return new Promise(resolve => setTimeout(resolve, millis))
}

async function runPrompt() {

  let {cmd} = await inquirer.prompt([
    {
      type: 'command',
      name: 'cmd',
      message: '>',
      context: 0,
      validate: val => {
        return true
      }
    }
  ])
  if (cmd === 'edit') {
    let rl = commandPrompt.getRl()

    rl.pause()

    rl.line = ''
    rl.write(null, {ctrl: true, name: 'e'})
    await sleep(3000)

    rl.resume

    return runPrompt()

  } else {
    return runPrompt()
  }

}

runPrompt()
