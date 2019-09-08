const chalk = require('chalk')
const ellipsize = require('ellipsize')
const fs = require('fs-extra')
const path = require('path')
const _ = require('lodash')

const InputPrompt = require('inquirer/lib/prompts/input')

let histories = {}
let historyIndexes = {}
const autoCompleters = {}

let historyFile
let context

let globalConfig

class CommandPrompt extends InputPrompt {

  static initHistory(context) {
    if (!historyFile && globalConfig && globalConfig.history && globalConfig.history.save) {
      const historyFolder = globalConfig.history.folder
      fs.ensureDirSync(historyFolder)
      historyFile = path.join(historyFolder, 'inquirer-command-prompt-history.json')
      if (fs.existsSync(historyFile)) {
        try {
          const previousHistory = JSON.parse(fs.readFileSync(historyFile))
          histories = previousHistory.histories
          for (let c in histories) {
            historyIndexes[c] = histories[c].length
          }
        } catch (e) {
          console.error('inquirer-command-promt ERROR: Invalid history file.')
        }
      }
    }
    if (!histories[context]) {
      histories[context] = []
      historyIndexes[context] = 0
    }
  }

  async initAutoCompletion(context, autoCompletion) {
    if (!autoCompleters[context]) {
      if (thiz.isAsyncFunc(autoCompletion)) {
        autoCompleters[context] = async l => this.asyncAutoCompleter(l, autoCompletion)
      } else if (autoCompletion) {
        autoCompleters[context] = l => this.autoCompleter(l, autoCompletion)
      } else {
        autoCompleters[context] = () => []
      }
    }
  }

  static addToHistory(context, value) {
    thiz.initHistory(context)
    if (histories[context][histories[context].length - 1] !== value) {
      histories[context].push(value)
      historyIndexes[context]++
      if (historyFile) {
        const savedHistory = _.clone(histories)
        const limit = globalConfig.history.limit
        if (limit) {
          for (let c in savedHistory) {
            if ((globalConfig.history.blacklist || []).includes(value)) {
              savedHistory[c].pop()
            }
            const len = savedHistory[c].length
            if (len > limit) {
              savedHistory[c] = savedHistory[c].slice(len - limit)
            }
          }
        }
        fs.writeFileSync(historyFile,
            JSON.stringify({
              histories: savedHistory
            }, null, 2)
        )
      }
    }
  }

  static formatIndex(i) {
    let len = globalConfig.history.limit.toString().length
    return ' '.repeat(len - `${i}`.length) + i
  }

  async onKeypress(e) {

    const rewrite = line => {
      this.rl.line = line
      this.rl.write(null, {ctrl: true, name: 'e'})
    }

    context = this.opt.context ? this.opt.context : '_default'

    thiz.initHistory(context)
    await this.initAutoCompletion(context, this.opt.autoCompletion)

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
      } else {
        rewrite('')
      }
    }
    /** search for command at an autoComplete option
     * which can be an array or a function which returns an array
     * */
    else if (e.key.name === 'tab') {
      let line = this.rl.line.replace(/^ +/, '').replace(/\t/, '').replace(/ +/g, ' ')
      try {
        var ac
        if (thiz.isAsyncFunc(this.opt.autoCompletion)) {
          ac = await autoCompleters[context](line)
        } else {
          ac = autoCompleters[context](line)
        }
        if (ac.match) {
          rewrite(ac.match)
        } else if (ac.matches) {
          console.log()
          process.stdout.cursorTo(0)
          console.log(chalk.red('>> ') + chalk.grey('Available commands:'))
          console.log(thiz.formatList(
              this.opt.short
                  ? (
                      typeof this.opt.short === 'function'
                          ? this.opt.short(line, ac.matches)
                          : thiz.short(line, ac.matches)
                  )
                  : ac.matches
          ))
          rewrite(line)
        }
      } catch (err) {
        console.error(err)

        rewrite(line)
      }
    } else if (e.key.name === 'right' && e.key.shift) {
      let history = histories[context]
      console.log(chalk.bold('History'))
      for (let i = 0; i < history.length; i++) {
        console.log(`${chalk.grey(thiz.formatIndex(i))}  ${history[i]}`)
      }
      rewrite('')
    }
    this.render()
  }

  static short(l, m) {
    if (l) {
      l = l.replace(/ $/, '')
      for (let i = 0; i < m.length; i++) {
        if (m[i] === l) {
          m.splice(i, 1)
          i--
        } else {
          if (m[i][l.length] === ' ') {
            m[i] = m[i].replace(RegExp(l + ' '), '')
          } else {
            m[i] = m[i].replace(RegExp(l.replace(/ [^ ]+$/, '') + ' '), '')
          }
        }
      }
    }
    return m
  }

  static isFunc(func) {
    return typeof func === 'function'
  }

  static isAsyncFunc(func) {
    return thiz.isFunc(func) && func.constructor.name === 'AsyncFunction'
  }

  async asyncAutoCompleter(line, cmds) {
    cmds = await cmds(line)
    return this.autoCompleterFormatter(line, cmds)
  }

  autoCompleter(line, cmds) {
    if (typeof cmds === 'function') {
      cmds = cmds(line)
    }
    return this.autoCompleterFormatter(line, cmds)
  }

  autoCompleterFormatter(line, cmds) {
    let max = 0

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

  run() {
    return new Promise(function (resolve) {
      this._run(function (value) {
        thiz.addToHistory(context, value)
        historyIndexes[context] = histories[context].length
        resolve(value)
      })
    }.bind(this))
  }

  static formatList(elems, maxSize = 40, ellipsized) {
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
      str += thiz.setSpaces(elem, max, ellipsized)
      if (c === columns) {
        str += ' '.repeat(cols - max * columns)
        c = 1
      } else {
        c++
      }
    }
    return str
  }

  static setSpaces(str, len, ellipsized) {
    if (ellipsized && str.length > len - 4) {
      return ellipsize(str, len - 4) + ' '.repeat(4)
    }
    const newStr = str + ' '.repeat(len - str.length)
    return newStr
  }

  static setConfig(config) {
    if (typeof config === 'object') {
      globalConfig = config
    }
  }

  static getHistory(context) {
    if (!context) {
      context = '_default'
    }
    return histories[`${context}`]
  }

}

let thiz = CommandPrompt

module.exports = CommandPrompt

