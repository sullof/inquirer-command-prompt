const util = require('util')
const chalk = require('chalk')
const ellipsize = require('ellipsize')

const InputPrompt = require('inquirer/lib/prompts/input')

const histories = {}
const historyIndexes = {}
const autoCompleters = {}

let context

function CommandPrompt() {
  return InputPrompt.apply(this, arguments)
}

util.inherits(CommandPrompt, InputPrompt)

function autoCompleter(line, cmds) {

  let max = 0
  if (typeof cmds === 'function') {
    cmds = cmds(line)
  }

  // first element in cmds can be an object with special instructions
  let options = {
    filter: str => str
  }
  if (typeof cmds[0] === 'object') {
    const f = cmds[0].filter
    if (typeof f === 'function') {
      options.filter = f
    }
    cmds = cmds.slice(1)
  }

  cmds = cmds.reduce((sum, el) => {
    RegExp(`^${line}`).test(el) && sum.push(el) && (max = Math.max(max, el.length))
    return sum
  }, [])

  if (cmds.length > 1) {
    let commonStr = ''
    LOOP: for (let i = line.length; i < max; i++) {
      let c = null
      for (let l of cmds) {
        if (!l[i]) {
          break LOOP
        } else if (!c) {
          c = l[i]
        } else if (c !== l[i]) {
          break LOOP
        }
      }
      commonStr += c
    }
    if (commonStr) {
      return {match: options.filter(line + commonStr)}
    } else {
      return {matches: cmds}
    }
  } else if (cmds.length === 1) {
    return {match: options.filter(cmds[0])}
  } else {
    return {match: options.filter(line)}
  }
}


CommandPrompt.prototype.onKeypress = function (e) {

  const rewrite = line => {
    this.rl.line = line
    this.rl.write(null, {ctrl: true, name: 'e'})
  }

  context = this.opt.context ? this.opt.context : '_default'

  if (!histories[context]) {
    histories[context] = []
    historyIndexes[context] = 0
    if (this.opt.autoCompletion) {
      autoCompleters[context] = (l) => autoCompleter(l, this.opt.autoCompletion)
    } else {
      autoCompleters[context] = () => []
    }
  }

  /** go up commands history */
  if (e.key.name === 'up') {

    if (historyIndexes[context] > 0) {
      historyIndexes[context]--
      rewrite(histories[context][historyIndexes[context]])
    }
  }
  /** go down commands history */
  else if (e.key.name === 'down') {
    if (histories[context][historyIndexes[context] + 1]) {
      historyIndexes[context]++
      rewrite(histories[context][historyIndexes[context]])
    }
  }
  /** search for command at an autoComplete option
   * which can be an array or a function which returns an array
   * */
  else if (e.key.name === 'tab') {
    let line = this.rl.line.replace(/^ +/, '').replace(/\t/, '').replace(/ +/g, ' ')
    try {
      var ac = autoCompleters[context](line)
      if (ac.match) {
        rewrite(ac.match)
      } else if (ac.matches) {
        console.log()
        process.stdout.cursorTo(0)
        console.log(chalk.red('>> ') + chalk.grey('Available commands:'))
        console.log(CommandPrompt.formatList(ac.matches))
        rewrite(line)
      }
    } catch (err) {
      rewrite(line)
    }
  }
  this.render()
}

CommandPrompt.prototype.run = function () {
  return new Promise(function (resolve) {
    this._run(function (value) {
      if (typeof histories[context] === 'undefined') histories[context] = []
      if (typeof historyIndexes[context] === 'undefined') historyIndexes[context] = 0
      histories[context].push(value)
      historyIndexes[context]++
      resolve(value)
    })
  }.bind(this))
}

function setSpaces(str, length, ellipsized) {
  if (ellipsized && str.length > length - 4) {
    return ellipsize(str, length - 4) + ' '.repeat(4)
  }
  const newStr = str + ' '.repeat(length - str.length)
  return newStr
}

CommandPrompt.formatList = (elems, maxSize = 40, ellipsized) => {
  const cols = process.stdout.columns
  let max = 0
  for (let elem of elems) {
    max = Math.max(max, elem.length + 4)
  }
  if (ellipsized && max > maxSize) {
    max = maxSize
  }
  let columns = (cols / max) | 0
  let str = ''
  let c = 1
  for (let elem of elems) {
    str += setSpaces(elem, max, ellipsized)
    if (c === columns) {
      str += ' '.repeat(cols - max * columns)
      c = 1
    } else {
      c++
    }
  }
  return str
}

module.exports = CommandPrompt

