/* globals Promise */

/* eslint-disable no-unused-vars */

var assert = require('assert')
var ReadlineStub = require('./helpers/readline')
var Prompt = require('..')

describe('inquirer-command-prompt', function () {

  var prompt
  var rl
  var availableCommands
  var promiseForAnswer

  describe('auto-complete', function () {

    beforeEach(function () {
      availableCommands = ['foo', 'bar', 'bum']
      rl = new ReadlineStub()
    })

    it('should returns the expected word if that is partially typed', function () {
      prompt = new Prompt({
        message: '>',
        name: 'name',
        autoCompletion: availableCommands,
        context: 0
      }, rl)

      promiseForAnswer = getPromiseForAnswer()

      type('f')
      tab()
      enter()

      return promiseForAnswer.then(function () {
        assert(rl.line === 'foo')
      })
    })

    it('should returns the type word if tab not pressed', function () {
      prompt = new Prompt({
        message: '>',
        name: 'name',
        // autoCompletion: availableCommands,
        context: 0
      }, rl)

      promiseForAnswer = getPromiseForAnswer()

      type('hello')
      enter()

      return promiseForAnswer.then(function (answer) {
        assert(rl.line === 'hello')
      })
    })

    it('should returns the type word if tab pressed but no matches', function () {
      prompt = new Prompt({
        message: '>',
        name: 'name',
        // autoCompletion: availableCommands,
        context: 0
      }, rl)

      promiseForAnswer = getPromiseForAnswer()

      type('zu')
      tab()
      enter()

      return promiseForAnswer.then(function (answer) {
        assert(rl.line === 'zu')
      })
    })

  })


  describe('history', function () {

    // to be done

  })

  function getPromiseForAnswer() {
    return prompt.run()
  }

  function typeNonChar() {
    rl.input.emit('keypress', '', {
      name: 'shift'
    })
  }

  function type(word) {
    word.split('').forEach(function (char) {
      rl.line = rl.line + char
      rl.input.emit('keypress', char)
    })
  }

  function moveDown() {
    rl.input.emit('keypress', '', {
      name: 'down'
    })
  }

  function moveUp() {
    rl.input.emit('keypress', '', {
      name: 'up'
    })
  }

  function enter() {
    rl.emit('line')
  }

  function tab() {
    rl.input.emit('keypress', '', {
      name: 'tab'
    })
  }

})
