const chalk = require('chalk')
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
const ELLIPSIS = '…'
let rl

class CommandPrompt extends InputPrompt {

  static initHistory(context) {
    if (!historyFile && globalConfig && globalConfig.history && globalConfig.history.save) {
      const historyFolder = globalConfig.history.folder
      fs.ensureDirSync(historyFolder)
      historyFile = path.join(historyFolder, 'inquirer-command-prompt-history.json')
      if (fs.existsSync(historyFile)) {
        const previousHistories = JSON.parse(fs.readFileSync(historyFile))
        CommandPrompt.setHistoryFromPreviousSavedHistories(previousHistories)
      }
    }
    if (!histories[context]) {
      histories[context] = []
      historyIndexes[context] = 0
    }
  }

  static setHistoryFromPreviousSavedHistories(previousHistory) {
    try {
      histories = previousHistory.histories
      for (let c in histories) {
        historyIndexes[c] = histories[c].length
      }
    } catch (e) {
      console.error('inquirer-command-promt ERROR: Invalid history file.')
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
      if (globalConfig && globalConfig.history && (globalConfig.history.blacklist || []).includes(value)) {
        return
      }
      histories[context].push(value)
      historyIndexes[context]++
      if (historyFile) {
        const savedHistory = CommandPrompt.getLimitedHistories(histories)
        fs.writeFileSync(historyFile,
            JSON.stringify({
              histories: savedHistory
            }, null, 2)
        )
      }
    }
  }

  static getLimitedHistories() {
    const limitedHistories = _.clone(histories)
    const limit = globalConfig.history.limit
    if (limit) {
      for (let c in limitedHistories) {
        const len = limitedHistories[c].length
        if (len > limit) {
          limitedHistories[c] = limitedHistories[c].slice(len - limit)
        }
      }
    }
    return limitedHistories
  }

  static formatIndex(i) {
    let len = globalConfig.history.limit.toString().length
    return ' '.repeat(len - `${i}`.length) + i
  }

  async onKeypress(e) {

    if (this.opt.onBeforeKeyPress) {
      this.opt.onBeforeKeyPress(e)
    }

    const rewrite = line => {
      if (this.opt.onBeforeRewrite) {
        line = this.opt.onBeforeRewrite(line)
      }
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
    if (e.key.name === 'tab') {
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
          console.log(this.opt.autocompletePrompt || chalk.red('>> ') + chalk.grey('Available commands:'))
          console.log(thiz.formatList(
              this.opt.short
                  ? (
                      typeof this.opt.short === 'function'
                          ? this.opt.short(line, ac.matches)
                          : thiz.short(line, ac.matches)
                  )
                  : ac.matches,
              this.opt.maxSize,
              this.opt.ellipsize,
              this.opt.ellipsis
          ))
          rewrite(line)
        }
      } catch (err) {
        console.error(err)

        rewrite(line)
      }
    } else if (e.key.name === 'right' && e.key.shift) {
      if (e.key.ctrl) {
        let i = parseInt(this.rl.line)
        if (!isNaN(i)) {
          let history = histories[context]
          rewrite(history[i])
        } else {
          rewrite('')
        }
      } else {
        // shows the history
        let history = histories[context]
        console.log(chalk.bold('History'))
        for (let i = 0; i < history.length; i++) {
          console.log(`${chalk.grey(thiz.formatIndex(i))}  ${history[i]}`)
        }
        rewrite('')
      }
    } else if (e.key.name === 'end' && e.key.ctrl) {
      // execute onCtrlEnd if defined
      if (globalConfig && typeof globalConfig.onCtrlEnd === 'function') {
        rewrite(globalConfig.onCtrlEnd(this.rl.line))
      } else {
        rewrite('')
      }
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
      let sanitizedLine = line.replace(/[\\\.\+\*\?\^\$\[\]\(\)\{\}\/\'\#\:\!\=\|]/ig, "\\$&")
      RegExp(`^${sanitizedLine}`).test(el) && sum.push(el) && (max = Math.max(max, el.length))
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

  static formatList(elems, maxSize = 32, ellipsized, ellipsis) {
    const cols = process.stdout.columns
    let ratio = Math.floor((cols - 1) / maxSize)
    let remainder = (cols - 1) % maxSize
    maxSize += Math.floor(remainder / ratio)
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
      str += thiz.setSpaces(elem, max, ellipsized, ellipsis)
      if (c === columns) {
        str += ' '.repeat(cols - max * columns)
        c = 1
      } else {
        c++
      }
    }
    return str
  }

  static setSpaces(str, len, ellipsized, ellipsis) {
    if (ellipsized && str.length > len - 1) {
      str = thiz.ellipsize(str, len - 1, ellipsis)
    }
    return str + ' '.repeat(len - thiz.decolorize(str).length)
  }

  static ellipsize(str, len, ellipsis = ELLIPSIS) {
    if (str.length > len) {
      let l = thiz.decolorize(ellipsis).length + 1
      return str.substring(0, len - l) + ellipsis
    }
  }

  static decolorize(str) {
    return str.replace(/\x1b\[[0-9;]*m/g, '')
  }

  static setConfig(config) {
    if (typeof config === 'object') {
      globalConfig = config
    }
  }

  static getRl() {
    return rl
  }

  static getHistory(context) {
    if (!context) {
      context = '_default'
    }
    return histories[`${context}`]
  }

  static getHistories(useLimit) {
    return {
      histories: useLimit ? CommandPrompt.getLimitedHistories() : histories
    }
  }

  render(error) {
    rl = this.rl
    let bottomContent = ''
    let appendContent = ''
    let message = this.getQuestion()
    let transformer = this.opt.transformer
    let isFinal = this.status === 'answered'
    if (isFinal) {
      appendContent = this.answer
    } else {
      appendContent = this.rl.line
    }
    if (transformer) {
      message += transformer(appendContent, this.answers, {isFinal})
    } else {
      message += isFinal && !this.opt.noColorOnAnswered ? chalk[this.opt.colorOnAnswered || 'cyan'](appendContent) : appendContent
    }
    if (error) {
      bottomContent = chalk.red('>> ') + error
    }
    this.screen.render(message, bottomContent)
  }

  close() {
    if (typeof this.opt.onClose === 'function') {
      this.opt.onClose()
    }
  }

}

let thiz = CommandPrompt

module.exports = CommandPrompt

