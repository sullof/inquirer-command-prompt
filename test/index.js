
/* globals Promise */

/* eslint-disable no-unused-vars */

var assert = require('assert')
var sinon = require('sinon')
var ReadlineStub = require('./helpers/readline')
var Prompt = require('../src/index')

describe('inquirer-command-prompt', function() {

  var source
  var prompt
  // var resolve
  // var reject
  var promise
  var rl
  var availableCommands
  var promiseForAnswer

  describe('autocomplete', function() {

    beforeEach(function() {
      availableCommands = ['foo', 'bar', 'bum']
      // promise = new Promise(function(res, rej) {
      //   resolve = res
      //   reject = rej
      // })
      source = sinon.stub().returns(promise)
      rl = new ReadlineStub()
    })

    it('returns expected word if partially typed', function() {
      prompt = new Prompt({
        message: 'test',
        name: 'name',
        autoCompletion: availableCommands,
        context: 0,
        source: source
      }, rl)

      promiseForAnswer = prompt.run()

      type('f')
      tab()
      enter()

      return promiseForAnswer.then(function(answer) {
        console.log(typeof answer, '>>',answer,'<<')
        assert(answer === 'foo')
      })
    })

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
    word.split('').forEach(function(char) {
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
