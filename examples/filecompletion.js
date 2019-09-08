'use strict'

var inquirer = require('inquirer')
inquirer.registerPrompt('command', require('..'))


async function runPrompt() {

  async function fileCompletion() {
    return [
      '../dir/',
      '../dir/file',
      '../dir/file2',
      '../dir/file3',
      '../dir/folder/',
      '../bit/due',
      '../folder/',
      './',
      '../'
    ]
  }

  const short = (l, m) => {
    let res = []
    if (l) {
      l = l.replace(/ $/, '')
      let r = l.split('/')
      if (r.length !== 1) {
        r.pop()
        r = r.join('/') + '/'
      } else {
        r = l
      }
      for (let i = 0; i < m.length; i++) {
        try {
          if (m[i] !== l) {
            m[i] = m[i].split(r)[1]
            if (m[i]) {
              res.push(m[i])
            }
          }
        } catch (e) {
        }
      }
    }
    return res
  }

  let answers = await inquirer.prompt([
    {
      type: 'command',
      name: 'cmd',
      autoCompletion: fileCompletion,
      message: '>',
      context: 0,
      validate: val => {
        return val
            ? true
            : 'Press TAB for suggestions'
      },
      short
    }
  ])
  if (answers.cmd !== 'quit') {
    console.log(`You run ${answers.cmd}`)
    return runPrompt()
  }

}

runPrompt()
