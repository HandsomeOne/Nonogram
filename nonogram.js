(function () {
  'use strict';

  function sum(array) {
    return array.reduce(function (a, b) {
      return a + b;
    }, 0);
  }
  function deepCopy(object) {
    return JSON.parse(JSON.stringify(object));
  }
  function typeOf(something) {
    return Object.prototype.toString.call(something);
  }
  function eekwall(object1, object2) {
    return object1.toString() === object2.toString();
  }
  function assign(target, source) {
    for (var attr in source) {
      target[attr] = source[attr];
    }
    return target;
  }

  var FILLED = true;
  var EMPTY = false;
  var UNSET = undefined;
  var TEMPORARILY_FILLED = 1;
  var TEMPORARILY_EMPTY = -1;
  var INCONSTANT = null;
  var VOID = -Infinity;

  function Nonogram() {
    return;
  }
  Nonogram.prototype = {
    filledColor: '#999',
    emptyColor: '#fff',
    unsetColor: '#ccc',
    fontColor: '#999',
    correctColor: '#0cf',
    wrongColor: '#f69',
    meshColor: '#999',

    getSingleLine: function (direction, i) {
      var g = [];
      if (direction === 'row') {
        for (var j = 0; j < this.n; j++) {
          g[j] = this.grid[i][j];
        }
      } else if (direction === 'col') {
        for (var j = 0; j < this.m; j++) {
          g[j] = this.grid[j][i];
        }
      }
      return g;
    },
    getHints: function (direction, i) {
      return deepCopy(this[direction + 'Hints'][i]);
    },
    calculateHints: function (direction, i) {
      var hints = [];
      var line = this.getSingleLine(direction, i);
      line.reduce(function (lastIsFilled, cell) {
        if (cell === FILLED) {
          lastIsFilled ? hints[hints.length - 1] += 1 : hints.push(1);
        }
        return cell === FILLED;
      }, false);
      return hints;
    },
    checkCorrectness: function (direction, i) {
      return this.calculateHints(direction, i).toString() === this[direction + 'Hints'][i].toString();
    },

    getLocation: function (x, y) {
      var w = this.canvas.width;
      var h = this.canvas.height;
      var w23 = w * 2 / 3;
      var h23 = h * 2 / 3;
      var d = w23 / (this.n + 1);

      if (x < 0 || x >= w || y < 0 || y >= h) {
        return 'outside';
      }
      if (0 <= x && x <= w23 && 0 <= y && y < h23) {
        if (d / 2 <= x && x < w23 - d / 2 && d / 2 <= y && y < h23 - d / 2) {
          return 'grid';
        } else {
          return 'limbo';
        }
      }
      if (w23 <= x && x < w && h23 <= y && y < h) {
        return 'controller';
      }
      return 'hints';
    },

    print: function () {
      if (this.canvas) {
        this.printGrid();
        this.printHints();
        this.printController();
      }
    },
    printGrid: function () {
      var ctx = this.canvas.getContext('2d');
      var w = this.canvas.width;
      var h = this.canvas.height;
      var d = w * 2 / 3 / (this.n + 1);

      ctx.fillStyle = this.emptyColor;
      ctx.fillRect(-1, -1, w * 2 / 3 + 1, h * 2 / 3 + 1);
      if (this.meshed) {
        this.printMesh();
      }
      ctx.save();
      ctx.translate(d / 2, d / 2);
      for (var i = 0; i < this.m; i++) {
        for (var j = 0; j < this.n; j++) {
          ctx.save();
          ctx.translate(d * j, d * i);
          switch (this.grid[i][j]) {
            case UNSET:
              ctx.fillStyle = this.unsetColor;
              ctx.fillRect(d * 0.05, d * 0.05, d * 0.9, d * 0.9);
              break;
            case FILLED:
              ctx.fillStyle = this.filledColor;
              ctx.fillRect(-d * 0.05, -d * 0.05, d * 1.1, d * 1.1);
              break;
            case VOID:
              ctx.strokeStyle = this.wrongColor;
              ctx.lineWidth = d / 15;
              ctx.beginPath();
              ctx.moveTo(d * 0.3, d * 0.3);
              ctx.lineTo(d * 0.7, d * 0.7);
              ctx.moveTo(d * 0.3, d * 0.7);
              ctx.lineTo(d * 0.7, d * 0.3);
              ctx.stroke();
              break;
          }
          ctx.restore();
        }
      }
      ctx.restore();
    },
    printMesh: function () {
      var ctx = this.canvas.getContext('2d');
      var d = this.canvas.width * 2 / 3 / (this.n + 1);

      ctx.save();
      ctx.translate(d / 2, d / 2);
      ctx.beginPath();
      for (var i = 1; i < this.m; i++) {
        ctx.moveTo(0, i * d);
        ctx.lineTo(this.n * d, i * d);
        if (i % 5 === 0) {
          ctx.moveTo(0, i * d - 1);
          ctx.lineTo(this.n * d, i * d - 1);
          ctx.moveTo(0, i * d + 1);
          ctx.lineTo(this.n * d, i * d + 1);
        }
      }
      for (var j = 1; j < this.n; j++) {
        ctx.moveTo(j * d, 0);
        ctx.lineTo(j * d, this.m * d);
        if (j % 5 === 0) {
          ctx.moveTo(j * d - 1, 0);
          ctx.lineTo(j * d - 1, this.m * d);
          ctx.moveTo(j * d + 1, 0);
          ctx.lineTo(j * d + 1, this.m * d);
        }
      }
      ctx.lineWidth = 1;
      ctx.strokeStyle = this.meshColor;
      ctx.stroke();
      ctx.closePath();
      ctx.restore();
    },
    printHints: function () {
      var ctx = this.canvas.getContext('2d');
      var w = this.canvas.width;
      var h = this.canvas.height;
      var d = w * 2 / 3 / (this.n + 1);

      ctx.fillStyle = this.emptyColor;
      ctx.fillRect(w * 2 / 3 - 1, -1, w * 3 + 1, h * 2 / 3 + 1);
      ctx.fillRect(-1, h * 2 / 3 - 1, w * 2 / 3 + 1, h / 3 + 1);
      ctx.save();
      ctx.translate(d / 2, d / 2);
      var color;
      for (var i = 0; i < this.m; i++) {
        color = this.fontColor;
        if (this.rowHints[i].isCorrect) {
          color = this.correctColor;
        } else if (this.rowHints[i].isWrong) {
          color = this.wrongColor;
        }
        for (var j = 0; j < this.rowHints[i].length; j++) {
          printSingleHint.call(this, 'row', i, j, color);
        }
        if (this.rowHints[i].length === 0) {
          printSingleHint.call(this, 'row', i, 0, color);
        }
      }
      for (var j = 0; j < this.n; j++) {
        color = this.fontColor;
        if (this.colHints[j].isCorrect) {
          color = this.correctColor;
        } else if (this.colHints[j].isWrong) {
          color = this.wrongColor;
        }
        for (var i = 0; i < this.colHints[j].length; i++) {
          printSingleHint.call(this, 'col', j, i, color);
        }
        if (this.colHints[j].length === 0) {
          printSingleHint.call(this, 'col', j, 0, color);
        }
      }
      ctx.restore();

      function printSingleHint(direction, i, j, color) {
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = d + 'pt monospace';
        ctx.fillStyle = color;
        if (direction === 'row') {
          ctx.fillText(this.rowHints[i][j] || 0,
            w * 2 / 3 + d * j, d * (i + 0.5), d * 0.8);
        } else if (direction === 'col') {
          ctx.fillText(this.colHints[i][j] || 0,
            d * (i + 0.5), h * 2 / 3 + d * j, d * 0.8);
        }
      }
    },
    printController: function () {
      return;
    },
  };

  window.NonogramSolve = NonogramSolve;
  function NonogramSolve(rowHints, colHints, canvasId, width) {
    this.rowHints = deepCopy(rowHints);
    this.colHints = deepCopy(colHints);
    this.m = rowHints.length;
    this.n = colHints.length;
    this.grid = new Array(this.m);
    for (var i = 0; i < this.m; i++) {
      this.grid[i] = new Array(this.n);
    }
    for (var i = 0; i < this.m; i++) {
      this.rowHints[i].isWrong = true;
    }
    for (var j = 0; j < this.n; j++) {
      this.colHints[j].isWrong = true;
    }

    var canvas = document.getElementById(canvasId);
    if (!canvas || canvas.hasAttribute('occupied')) {
      return;
    }

    this.canvas = canvas;
    this.canvas.width = width || this.canvas.clientWidth;
    this.canvas.height = this.canvas.width * (this.m + 1) / (this.n + 1);
    this.canvas.nonogram = this;
    this.canvas.addEventListener('click', this.click);
    this.print();
  }
  NonogramSolve.prototype = assign(new Nonogram(), {
    constructor: NonogramSolve,
    demoMode: true,
    delay: 50,

    click: function (e) {
      if (this.hasAttribute('occupied')) {
        return;
      }

      var self = this.nonogram;
      var d = this.width * 2 / 3 / (self.n + 1);
      var x = e.clientX - this.getBoundingClientRect().left;
      var y = e.clientY - this.getBoundingClientRect().top;
      if (self.getLocation(x, y) === 'grid') {
        var i = Math.floor(y / d - 0.5);
        var j = Math.floor(x / d - 0.5);
        if (self.grid[i][j] === UNSET) {
          self.grid[i][j] = FILLED;
          self.solve();
        }
      } else if (self.getLocation(x, y) === 'controller') {
        self.grid = new Array(self.m);
        for (var i = 0; i < self.m; i++) {
          self.grid[i] = new Array(self.n);
        }
        for (var i = 0; i < self.m; i++) {
          self.rowHints[i].isWrong = true;
        }
        for (var j = 0; j < self.n; j++) {
          self.colHints[j].isWrong = true;
        }

        self.solve();
      }
    },
    solve: function () {
      if (this.canvas) {
        this.canvas.setAttribute('occupied', '');
      } else {
        this.demoMode = false;
      }
      scan.call(this);

      function scan() {
        do {
          updateScanner.call(this);
        }
        while (!this[this.scanner.direction + 'Hints'][this.scanner.i].isWrong && this.linesToChange);

        if (this.demoMode) {
          this.print();
        }

        if (this.linesToChange) {
          this.linePass = undefined;
          this.solveSingleLine();
          if (!this.linePass) {
            this.scanner.error = true;
            if (this.canvas) {
              this.canvas.removeAttribute('occupied');
              this.print();
            }
            return;
          }
          if (this.demoMode) {
            setTimeout(scan.bind(this), this.delay);
          } else {
            return scan.call(this);
          }
        } else {
          this.scanner = undefined;
          if (this.canvas) {
            this.canvas.removeAttribute('occupied');
            this.print();
          }
        }
      }

      function updateScanner() {
        if (this.scanner === undefined) {
          this.scanner = {
            'direction': 'row',
            'i': 0,
          };
          this.linesToChange = this.m + this.n;
        } else {
          this.scanner.error = undefined;
          this.scanner.i += 1;
          if (this[this.scanner.direction + 'Hints'][this.scanner.i] === undefined) {
            this.scanner.direction = (this.scanner.direction === 'row') ? 'col' : 'row';
            this.scanner.i = 0;
          }
          this.linesToChange -= 1;
        }
      }
    },
    solveSingleLine: function (direction, i) {
      direction = direction || this.scanner.direction;
      i = i || this.scanner.i;
      this.line = this.getSingleLine(direction, i);
      var finished = this.line.every(function (cell) {
        return cell !== UNSET;
      });
      if (!finished) {
        this.hints = this.getHints(direction, i);
        this.blanks = [];
        this.getAllSituations(this.line.length - sum(this.hints) - this.hints.length + 1);

        var changed = this.line.some(function (cell) {
          return (cell === TEMPORARILY_FILLED || cell === TEMPORARILY_EMPTY);
        }, this);
        if (changed) {
          this.linesToChange = this.m + this.n;
        }
        this.setBackToGrid(direction, i);
      }
      if (this.checkCorrectness(direction, i)) {
        this[direction + 'Hints'][i].isWrong = undefined;
        if (finished) {
          this.linePass = true;
        }
      }
    },
    getAllSituations: function (max, array, index) {
      array = array || [];
      index = index || 0;
      if (index === this.hints.length) {
        for (var i = 0; i < this.hints.length; i++) {
          this.blanks[i] = array[i] + (i ? 1 : 0);
        }
        return this.mergeSituation();
      }

      for (var i = 0; i <= max; i++) {
        array[index] = i;
        this.getAllSituations(max - array[index], array, index + 1);
      }
    },
    mergeSituation: function () {
      var status = [];
      for (var i = 0; i < this.hints.length; i++) {
        for (var j = 0; j < this.blanks[i]; j++) {
          status.push(EMPTY);
        }
        for (var j = 0; j < this.hints[i]; j++) {
          status.push(FILLED);
        }
      }
      while (status.length < this.line.length) {
        status.push(EMPTY);
      }

      var improper = status.some(function (cell, i) {
        return (cell === EMPTY && this.line[i] === FILLED) || (cell === FILLED && this.line[i] === EMPTY);
      }, this);
      if (improper) {
        return;
      }

      this.linePass = true;
      status.forEach(function (cell, i) {
        if (cell === FILLED) {
          if (this.line[i] === TEMPORARILY_EMPTY) {
            this.line[i] = INCONSTANT;
          } else if (this.line[i] === UNSET) {
            this.line[i] = TEMPORARILY_FILLED;
          }
        } else if (cell === EMPTY) {
          if (this.line[i] === TEMPORARILY_FILLED) {
            this.line[i] = INCONSTANT;
          } else if (this.line[i] === UNSET) {
            this.line[i] = TEMPORARILY_EMPTY;
          }
        }
      }, this);
    },
    setBackToGrid: function (direction, i) {
      if (direction === 'row') {
        this.line.forEach(function (cell, j) {
          this.grid[i][j] = this.convertCellValue(cell);
        }, this);
      } else if (direction === 'col') {
        this.line.forEach(function (cell, j) {
          this.grid[j][i] = this.convertCellValue(cell);
        }, this);
      }
    },
    convertCellValue: function (value) {
      switch (value) {
        case TEMPORARILY_FILLED:
          return FILLED;
        case TEMPORARILY_EMPTY:
          return EMPTY;
        case INCONSTANT:
          return UNSET;
        default:
          return value;
      }
    },

    print: function () {
      if (this.canvas) {
        this.printGrid();
        this.printHints();
        this.printController();
        this.printScanner();
      }
    },
    printController: function () {
      var ctx = this.canvas.getContext('2d');
      var w = this.canvas.width;
      var h = this.canvas.height;
      var controllerSize = Math.min(w, h) / 4;
      var filledColor = this.filledColor;

      ctx.fillStyle = this.emptyColor;
      ctx.fillRect(w * 2 / 3 - 1, h * 2 / 3 - 1, w / 3 + 1, h / 3 + 1);
      if (this.canvas.hasAttribute('occupied')) {
        return;
      }

      ctx.save();
      ctx.translate(w * 0.7, h * 0.7);
      ctx.drawImage(getCycle(), 0, 0);
      ctx.restore();

      function getCycle() {
        var cycle = document.createElement('canvas');
        var borderWidth = controllerSize / 10;
        cycle.width = controllerSize;
        cycle.height = controllerSize;

        var ctx = cycle.getContext('2d');
        ctx.translate(controllerSize / 2, controllerSize / 2);
        ctx.rotate(Math.PI);
        ctx.arc(0, 0, controllerSize / 2 - borderWidth / 2, Math.PI / 2, Math.PI / 3.9);
        ctx.lineWidth = borderWidth;
        ctx.strokeStyle = filledColor;
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo((controllerSize / 2 + borderWidth) * Math.SQRT1_2, (controllerSize / 2 + borderWidth) * Math.SQRT1_2);
        ctx.lineTo((controllerSize / 2 - borderWidth * 2) * Math.SQRT1_2, (controllerSize / 2 - borderWidth * 2) * Math.SQRT1_2);
        ctx.lineTo((controllerSize / 2 - borderWidth * 2) * Math.SQRT1_2, (controllerSize / 2 + borderWidth) * Math.SQRT1_2);
        ctx.closePath();
        ctx.fillStyle = filledColor;
        ctx.fill();

        return cycle;
      }
    },
    printScanner: function () {
      if (this.scanner === undefined) {
        return;
      }

      var ctx = this.canvas.getContext('2d');
      var w = this.canvas.width;
      var h = this.canvas.height;
      var d = w * 2 / 3 / (this.n + 1);

      ctx.save();
      ctx.translate(d / 2, d / 2);
      if (this.scanner.error) {
        ctx.fillStyle = this.wrongColor;
      } else {
        ctx.fillStyle = this.correctColor;
      }
      ctx.globalAlpha = 0.5;
      if (this.scanner.direction === 'row') {
        ctx.fillRect(0, d * this.scanner.i, w, d);
      } else if (this.scanner.direction === 'col') {
        ctx.fillRect(d * this.scanner.i, 0, d, h);
      }
      ctx.restore();
    },
  });

  window.NonogramEdit = NonogramEdit;
  function NonogramEdit(m, n, canvasId, width, thresholdOrGrid) {
    this.m = m;
    this.n = n;
    if (typeOf(thresholdOrGrid) === '[object Array]') {
      this.grid = deepCopy(thresholdOrGrid);
    } else {
      if (typeOf(thresholdOrGrid) === '[object Number]') {
        this.threshold = thresholdOrGrid;
      }
      this.grid = new Array(this.m);
      for (var i = 0; i < this.m; i++) {
        this.grid[i] = new Array(this.n);
        for (var j = 0; j < this.n; j++) {
          this.grid[i][j] = (Math.random() < this.threshold) ? FILLED : EMPTY;
        }
      }
    }
    this.rowHints = new Array(m);
    this.colHints = new Array(n);
    for (var i = 0; i < this.m; i++) {
      this.rowHints[i] = this.calculateHints('row', i);
    }
    for (var j = 0; j < this.n; j++) {
      this.colHints[j] = this.calculateHints('col', j);
    }
    var canvas = document.getElementById(canvasId);
    if (!canvas || canvas.hasAttribute('occupied')) {
      return;
    }

    this.canvas = canvas;
    this.canvas.width = width || this.canvas.clientWidth;
    this.canvas.height = this.canvas.width * (this.m + 1) / (this.n + 1);
    this.canvas.nonogram = this;
    this.canvas.addEventListener('click', this.click);
    this.print();
    this.canvas.dispatchEvent(this.hintChange);
  }
  NonogramEdit.prototype = assign(new Nonogram(), {
    constructor: NonogramEdit,
    fontColor: '#f69',
    filledColor: '#f69',
    hintChange: new Event('hintchange'),
    threshold: 0.5,

    click: function (e) {
      var self = this.nonogram;
      var d = this.width * 2 / 3 / (self.n + 1);
      var x = e.clientX - this.getBoundingClientRect().left;
      var y = e.clientY - this.getBoundingClientRect().top;
      if (self.getLocation(x, y) === 'grid') {
        var i = Math.floor(y / d - 0.5);
        var j = Math.floor(x / d - 0.5);
        self.switchCell(i, j);
      } else if (self.getLocation(x, y) === 'controller') {
        self.refresh();
      }
    },
    switchCell: function (i, j) {
      this.grid[i][j] = (this.grid[i][j] === FILLED) ? EMPTY : FILLED;
      this.rowHints[i] = this.calculateHints('row', i);
      this.colHints[j] = this.calculateHints('col', j);
      this.print();
      this.canvas.dispatchEvent(this.hintChange);
    },
    refresh: function () {
      for (var i = 0; i < this.m; i++) {
        for (var j = 0; j < this.n; j++) {
          this.grid[i][j] = (Math.random() < this.threshold) ? FILLED : EMPTY;
        }
      }
      for (var i = 0; i < this.m; i++) {
        this.rowHints[i] = this.calculateHints('row', i);
      }
      for (var j = 0; j < this.n; j++) {
        this.colHints[j] = this.calculateHints('col', j);
      }
      this.canvas.dispatchEvent(this.hintChange);
      this.print();
    },
    printController: function () {
      var ctx = this.canvas.getContext('2d');
      var w = this.canvas.width;
      var h = this.canvas.height;
      var controllerSize = Math.min(w, h) / 4;
      var filledColor = this.filledColor;

      ctx.fillStyle = this.emptyColor;
      ctx.fillRect(w * 2 / 3 - 1, h * 2 / 3 - 1, w / 3 + 1, h / 3 + 1);
      ctx.save();
      ctx.translate(w * 0.7, h * 0.7);
      ctx.drawImage(getCycle(), 0, 0);
      ctx.restore();

      function getCycle() {
        var cycle = document.createElement('canvas');
        var borderWidth = controllerSize / 10;
        cycle.width = controllerSize;
        cycle.height = controllerSize;

        var ctx = cycle.getContext('2d');
        ctx.translate(controllerSize / 2, controllerSize / 2);
        ctx.arc(0, 0, controllerSize / 2 - borderWidth / 2, Math.PI / 2, Math.PI / 3.9);
        ctx.lineWidth = borderWidth;
        ctx.strokeStyle = filledColor;
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo((controllerSize / 2 + borderWidth) * Math.SQRT1_2, (controllerSize / 2 + borderWidth) * Math.SQRT1_2);
        ctx.lineTo((controllerSize / 2 - borderWidth * 2) * Math.SQRT1_2, (controllerSize / 2 - borderWidth * 2) * Math.SQRT1_2);
        ctx.lineTo((controllerSize / 2 - borderWidth * 2) * Math.SQRT1_2, (controllerSize / 2 + borderWidth) * Math.SQRT1_2);
        ctx.closePath();
        ctx.fillStyle = filledColor;
        ctx.fill();

        return cycle;
      }
    },
  });

  window.NonogramPlay = NonogramPlay;
  function NonogramPlay(rowHints, colHints, canvasId, width) {
    this.rowHints = deepCopy(rowHints);
    this.colHints = deepCopy(colHints);
    this.m = rowHints.length;
    this.n = colHints.length;
    this.grid = new Array(this.m);
    for (var i = 0; i < this.m; i++) {
      this.grid[i] = new Array(this.n);
      for (var j = 0; j < this.n; j++) {
        this.grid[i][j] = EMPTY;
      }
    }
    for (var i = 0; i < this.m; i++) {
      this.rowHints[i].isCorrect = this.checkCorrectness('row', i) ? true : undefined;
    }
    for (var j = 0; j < this.n; j++) {
      this.colHints[j].isCorrect = this.checkCorrectness('col', j) ? true : undefined;
    }
    var canvas = document.getElementById(canvasId);
    if (!canvas || canvas.hasAttribute('occupied')) {
      return;
    }

    this.canvas = canvas;
    this.canvas.width = width || this.canvas.clientWidth;
    this.canvas.height = this.canvas.width * (this.m + 1) / (this.n + 1);
    this.canvas.nonogram = this;
    this.canvas.addEventListener('mousedown', this.mousedown);
    this.canvas.addEventListener('mousemove', this.mousemove);
    this.canvas.addEventListener('mouseup', this.brushUp);
    this.canvas.addEventListener('mouseleave', this.brushUp);

    this.meshed = true;
    this.brushMode = 'color';
    this.draw = {};
    this.print();
  }
  NonogramPlay.prototype = assign(new Nonogram(), {
    constructor: NonogramPlay,
    filledColor: '#0cf',

    mousedown: function (e) {
      var self = this.nonogram;
      var x = e.clientX - this.getBoundingClientRect().left;
      var y = e.clientY - this.getBoundingClientRect().top;
      var d = this.width * 2 / 3 / (self.n + 1);
      if (self.getLocation(x, y) === 'controller') {
        self.switchBrushMode();
      } else if (self.getLocation(x, y) === 'grid') {
        self.draw.firstI = Math.floor(y / d - 0.5);
        self.draw.firstJ = Math.floor(x / d - 0.5);
        var cell = self.grid[self.draw.firstI][self.draw.firstJ];
        if (self.brushMode === 'color' && cell !== VOID) {
          self.draw.mode = (cell === FILLED) ? 'empty' : 'fill';
          self.isPressed = true;
          self.switchCell(self.draw.firstI, self.draw.firstJ);
        } else if (self.brushMode === 'void' && cell !== FILLED) {
          self.draw.mode = (cell === VOID) ? 'empty' : 'fill';
          self.isPressed = true;
          self.switchCell(self.draw.firstI, self.draw.firstJ);
        }
        self.draw.lastI = self.draw.firstI;
        self.draw.lastJ = self.draw.firstJ;
      }
    },
    mousemove: function (e) {
      var self = this.nonogram;
      if (self.isPressed) {
        var x = e.clientX - this.getBoundingClientRect().left;
        var y = e.clientY - this.getBoundingClientRect().top;
        var d = this.width * 2 / 3 / (self.n + 1);
        if (self.getLocation(x, y) === 'grid') {
          var i = Math.floor(y / d - 0.5);
          var j = Math.floor(x / d - 0.5);
          if (i != self.draw.lastI || j != self.draw.lastJ) {
            if (self.draw.direction === undefined) {
              if (i === self.draw.firstI) {
                self.draw.direction = 'row';
              } else if (j === self.draw.firstJ) {
                self.draw.direction = 'col';
              }
            } else if ((self.draw.direction === 'row' && i === self.draw.firstI)
              || (self.draw.direction === 'col' && j === self.draw.firstJ)) {
              self.switchCell(i, j);
              self.draw.lastI = i;
              self.draw.lastJ = j;
            }
          }
        }
      }
    },
    switchBrushMode: function () {
      this.brushMode = (this.brushMode === 'void') ? 'color' : 'void';
      this.printController();
    },
    brushUp: function () {
      var self = this.nonogram;
      self.isPressed = undefined;
      self.draw.direction = undefined;
      self.draw.mode = undefined;
    },
    switchCell: function (i, j) {
      if (this.brushMode === 'color' && this.grid[i][j] !== VOID) {
        this.grid[i][j] = (this.draw.mode === 'fill') ? FILLED : EMPTY;
        this.rowHints[i].isCorrect = eekwall(this.calculateHints('row', i), this.rowHints[i]) ? true : undefined;
        this.colHints[j].isCorrect = eekwall(this.calculateHints('col', j), this.colHints[j]) ? true : undefined;
        this.print();
        var finished = this.rowHints.every(function (singleRow) {
          return singleRow.isCorrect;
        }) && this.colHints.every(function (singleCol) {
          return singleCol.isCorrect;
        })
        if (finished) {
          this.congratulate();
        }
      } else if (this.brushMode === 'void' && this.grid[i][j] !== FILLED) {
        this.grid[i][j] = (this.draw.mode === 'fill') ? VOID : EMPTY;
        this.print();
      }
    },

    printController: function () {
      var ctx = this.canvas.getContext('2d');
      var w = this.canvas.width;
      var h = this.canvas.height;
      var controllerSize = Math.min(w, h) / 4;
      var outerSize = controllerSize * 3 / 4;
      var offset = controllerSize / 4;
      var borderWidth = controllerSize / 20;
      var innerSize = outerSize - 2 * borderWidth;

      ctx.fillStyle = this.emptyColor;
      ctx.fillRect(w * 2 / 3 - 1, h * 2 / 3 - 1, w / 3 + 1, h / 3 + 1);
      ctx.save();
      ctx.translate(w * 0.7, h * 0.7);
      if (this.brushMode === 'color') {
        printVoidBrush.call(this);
        printColorBrush.call(this);
      } else if (this.brushMode === 'void') {
        printColorBrush.call(this);
        printVoidBrush.call(this);
      }
      ctx.restore();

      function printColorBrush() {
        ctx.save();
        ctx.translate(offset, 0);
        ctx.fillStyle = this.meshColor;
        ctx.fillRect(0, 0, outerSize, outerSize);
        ctx.fillStyle = this.filledColor;
        ctx.fillRect(borderWidth, borderWidth, innerSize, innerSize);
        ctx.restore();
      }

      function printVoidBrush() {
        ctx.save();
        ctx.translate(0, offset);
        ctx.fillStyle = this.meshColor;
        ctx.fillRect(0, 0, outerSize, outerSize);
        ctx.fillStyle = this.emptyColor;
        ctx.fillRect(borderWidth, borderWidth, innerSize, innerSize);
        ctx.strokeStyle = this.wrongColor;
        ctx.lineWidth = borderWidth;
        ctx.beginPath();
        ctx.moveTo(outerSize * 0.3, outerSize * 0.3);
        ctx.lineTo(outerSize * 0.7, outerSize * 0.7);
        ctx.moveTo(outerSize * 0.3, outerSize * 0.7);
        ctx.lineTo(outerSize * 0.7, outerSize * 0.3);
        ctx.stroke();
        ctx.restore();
      }
    },

    congratulate: function () {
      if (!this.canvas) {
        return;
      }

      this.canvas.removeEventListener('mousedown', this.mousedown);
      this.canvas.removeEventListener('mousemove', this.mousemove);
      this.canvas.removeEventListener('mouseup', this.brushUp);
      this.canvas.removeEventListener('mouseleave', this.brushUp);

      var ctx = this.canvas.getContext('2d');
      var w = this.canvas.width;
      var h = this.canvas.height;
      var controllerSize = Math.min(w, h) / 4;

      var background = ctx.getImageData(0, 0, w, h);
      var t = 0;
      var tick = getTick();
      fadeTickIn();

      function fadeTickIn() {
        ctx.save();
        ctx.putImageData(background, 0, 0);
        t += 0.03;
        ctx.globalAlpha = f(t);
        ctx.fillStyle = '#fff';
        ctx.fillRect(w * 2 / 3, h * 2 / 3, w / 3, h / 3);
        ctx.drawImage(tick,
          w * 0.7 - (1 - f(t)) * controllerSize / 2,
          h * 0.7 - (1 - f(t)) * controllerSize / 2,
          (2 - f(t)) * controllerSize,
          (2 - f(t)) * controllerSize);
        if (t <= 1) {
          requestAnimationFrame(fadeTickIn);
        }
        ctx.restore();
      }

      function f(t) {
        return 1 + Math.pow(t - 1, 3);
      }

      function getTick() {
        var size = controllerSize * 2;
        var borderWidth = size / 10;
        var tick = document.createElement('canvas');
        tick.width = size;
        tick.height = size;

        var ctx = tick.getContext('2d');
        ctx.translate(size / 3, size * 5 / 6);
        ctx.rotate(-Math.PI / 4);
        ctx.fillStyle = '#0c6';
        ctx.fillRect(0, 0, borderWidth, -size * Math.SQRT2 / 3);
        ctx.fillRect(0, 0, size * Math.SQRT2 * 2 / 3, -borderWidth);

        return tick;
      }
    },
  });
})();
