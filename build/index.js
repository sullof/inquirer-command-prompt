'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

// (c) 2017 Francesco Sullo, francesco@sullo.co

// inspired by Allen Kim (https://github.com/allenhwkim)
// https://github.com/SBoudrias/Inquirer.js/issues/306#issuecomment-252516909

var util = require('util');
var chalk = require('chalk');
var ellipsize = require('ellipsize');

var InputPrompt = require('inquirer/lib/prompts/input');

var histories = {};
var historyIndexes = {};
var autoCompleters = {};

var context = void 0;

function CommandPrompt() {
  return InputPrompt.apply(this, arguments);
}

util.inherits(CommandPrompt, InputPrompt);

function autoCompleter(line, cmds) {
  var max = 0;
  if (typeof cmds === 'function') {
    cmds = cmds(line);
  }

  // first element in cmds can be an object with special instructions
  var options = {};
  if (_typeof(cmds[0]) === 'object') {
    options = cmds[0];
    cmds.slice(1);
  }

  cmds = cmds.reduce(function (sum, el) {
    RegExp('^' + line).test(el) && sum.push(el) && (max = Math.max(max, el.length));
    return sum;
  }, []);

  if (cmds.length > 1) {
    var commonStr = '';
    LOOP: for (var i = line.length; i < max; i++) {
      var c = null;
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = cmds[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var l = _step.value;

          if (!l[i]) {
            break LOOP;
          } else if (!c) {
            c = l[i];
          } else if (c !== l[i]) {
            break LOOP;
          }
        }
      } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion && _iterator.return) {
            _iterator.return();
          }
        } finally {
          if (_didIteratorError) {
            throw _iteratorError;
          }
        }
      }

      commonStr += c;
    }
    if (commonStr) {
      return { match: line + stripCommand(commonStr, options.separator) };
    } else {
      return { matches: cmds };
    }
  } else if (cmds.length === 1) {
    return { match: stripCommand(cmds[0], options.separator) };
  } else {
    return { match: stripCommand(line, options.separator) };
  }
}

function stripCommand(line, separator) {
  return separator ? line.split(separator)[0] : line;
}

CommandPrompt.prototype.onKeypress = function (e) {
  var _this = this;

  var rewrite = function rewrite(line) {
    _this.rl.line = line;
    _this.rl.write(null, { ctrl: true, name: 'e' });
  };

  context = this.opt.context ? this.opt.context : '_default';

  if (!histories[context]) {
    histories[context] = [];
    historyIndexes[context] = 0;
    if (this.opt.autoCompletion) {
      autoCompleters[context] = function (l) {
        return autoCompleter(l, _this.opt.autoCompletion);
      };
    } else {
      autoCompleters[context] = function () {
        return [];
      };
    }
  }

  /** go up commands history */
  if (e.key.name === 'up') {
    if (historyIndexes[context] > 0) {
      historyIndexes[context]--;
      rewrite(histories[context][historyIndexes[context]]);
    }
  }
  /** go down commands history */
  else if (e.key.name === 'down') {
      if (histories[context][historyIndexes[context] + 1]) {
        historyIndexes[context]++;
        rewrite(histories[context][historyIndexes[context]]);
      }
    }
    /** search for command at an autoComplete option
     * which can be an array or a function which returns an array
     * */
    else if (e.key.name === 'tab') {
        var line = this.rl.line.replace(/^ +/, '').replace(/\t/, '').replace(/ +/g, ' ');
        try {
          var ac = autoCompleters[context](line);
          if (ac.match) {
            rewrite(ac.match);
          } else if (ac.matches) {
            console.log();
            process.stdout.cursorTo(0);
            console.log(chalk.red('>> ') + chalk.grey('Available commands:'));
            console.log(CommandPrompt.formatList(ac.matches));
            rewrite(line);
          }
        } catch (e) {
          rewrite(line);
        }
      }
  this.render();
};

CommandPrompt.prototype.run = function () {
  return new Promise(function (resolve) {
    this._run(function (value) {
      histories[context].push(value);
      historyIndexes[context]++;
      resolve(value);
    });
  }.bind(this));
};

function setSpaces(str, length, ellipsized) {
  if (ellipsized && str.length > length - 4) {
    return ellipsize(str, length - 4) + ' '.repeat(4);
  }
  var newStr = str + ' '.repeat(length - str.length);
  return newStr;
}

CommandPrompt.formatList = function (elems) {
  var maxSize = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 40;
  var ellipsized = arguments[2];

  var cols = process.stdout.columns;
  var max = 0;
  var _iteratorNormalCompletion2 = true;
  var _didIteratorError2 = false;
  var _iteratorError2 = undefined;

  try {
    for (var _iterator2 = elems[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
      var elem = _step2.value;

      max = Math.max(max, elem.length + 4);
    }
  } catch (err) {
    _didIteratorError2 = true;
    _iteratorError2 = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion2 && _iterator2.return) {
        _iterator2.return();
      }
    } finally {
      if (_didIteratorError2) {
        throw _iteratorError2;
      }
    }
  }

  if (ellipsized && max > maxSize) {
    max = maxSize;
  }
  var columns = cols / max | 0;
  var str = '';
  var c = 1;
  var _iteratorNormalCompletion3 = true;
  var _didIteratorError3 = false;
  var _iteratorError3 = undefined;

  try {
    for (var _iterator3 = elems[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
      var _elem = _step3.value;

      str += setSpaces(_elem, max, ellipsized);
      if (c === columns) {
        str += ' '.repeat(cols - max * columns);
        c = 1;
      } else {
        c++;
      }
    }
  } catch (err) {
    _didIteratorError3 = true;
    _iteratorError3 = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion3 && _iterator3.return) {
        _iterator3.return();
      }
    } finally {
      if (_didIteratorError3) {
        throw _iteratorError3;
      }
    }
  }

  return str;
};

module.exports = CommandPrompt;
