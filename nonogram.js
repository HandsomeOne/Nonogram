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
  function eekwall(object1, object2) {
    return object1.toString() === object2.toString();
  }
  function assign(target, source) {
    if (!source) {
      return;
    }
    var keys = Object.keys(source);
    for (var i = 0, l = keys.length; i < l; i++) {
      target[keys[i]] = source[keys[i]];
    }
    return target;
  }

  var FILLED = true;
  var EMPTY = false;
  var UNSET = undefined;
  var TEMPORARILY_FILLED = 1;
  var TEMPORARILY_EMPTY = -1;
  var INCONSTANT = 0;

  function Nonogram() {
    return;
  }
  Nonogram.prototype = {
    backgroundColor: '#fff',
    filledColor: '#999',
    unsetColor: '#ccc',
    correctColor: '#0cf',
    wrongColor: '#f69',
    meshColor: '#999',
    isMeshed: false,
    isBoldMeshOnly: false,
    boldMeshGap: 5,

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
    removeNonPositiveHints: function () {
      this.rowHints.forEach(removeNonPositiveElement);
      this.colHints.forEach(removeNonPositiveElement);

      function removeNonPositiveElement(array, j, self) {
        self[j] = array.filter(Math.sign);
      }
    },
    getHints: function (direction, i) {
      return deepCopy(this[direction + 'Hints'][i]);
    },
    calculateHints: function (direction, i) {
      var hints = [];
      var line = this.getSingleLine(direction, i);
      line.reduce(function (lastIsFilled, cell) {
        if (cell === FILLED) {
          lastIsFilled ? hints.push(hints.pop() + 1) : hints.push(1);
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

      ctx.fillStyle = this.backgroundColor;
      ctx.fillRect(-1, -1, w * 2 / 3 + 1, h * 2 / 3 + 1);
      if (this.isMeshed) {
        this.printMesh();
      }
      ctx.save();
      ctx.translate(d / 2, d / 2);
      for (var i = 0; i < this.m; i++) {
        for (var j = 0; j < this.n; j++) {
          ctx.save();
          ctx.translate(d * j, d * i);
          this.printCell(this.grid[i][j]);
          ctx.restore();
        }
      }
      ctx.restore();
    },
    printCell: function (status) {
      var ctx = this.canvas.getContext('2d');
      var d = this.canvas.width * 2 / 3 / (this.n + 1);
      switch (status) {
        case UNSET:
          ctx.fillStyle = this.unsetColor;
          ctx.fillRect(d * 0.05, d * 0.05, d * 0.9, d * 0.9);
          break;
        case FILLED:
          ctx.fillStyle = this.filledColor;
          ctx.fillRect(-d * 0.05, -d * 0.05, d * 1.1, d * 1.1);
          break;
      }
    },
    printMesh: function () {
      var ctx = this.canvas.getContext('2d');
      var d = this.canvas.width * 2 / 3 / (this.n + 1);

      ctx.save();
      ctx.translate(d / 2, d / 2);
      ctx.beginPath();
      for (var i = 1; i < this.m; i++) {
        if (!this.isBoldMeshOnly) {
          ctx.moveTo(0, i * d);
          ctx.lineTo(this.n * d, i * d);
        }
        if (i % this.boldMeshGap === 0) {
          ctx.moveTo(0, i * d - 1);
          ctx.lineTo(this.n * d, i * d - 1);
          ctx.moveTo(0, i * d);
          ctx.lineTo(this.n * d, i * d);
          ctx.moveTo(0, i * d + 1);
          ctx.lineTo(this.n * d, i * d + 1);
        }
      }
      for (var j = 1; j < this.n; j++) {
        if (!this.isBoldMeshOnly) {
          ctx.moveTo(j * d, 0);
          ctx.lineTo(j * d, this.m * d);
        }
        if (j % this.boldMeshGap === 0) {
          ctx.moveTo(j * d - 1, 0);
          ctx.lineTo(j * d - 1, this.m * d);
          ctx.moveTo(j * d, 0);
          ctx.lineTo(j * d, this.m * d);
          ctx.moveTo(j * d + 1, 0);
          ctx.lineTo(j * d + 1, this.m * d);
        }
      }
      ctx.lineWidth = 1;
      ctx.strokeStyle = this.meshColor;
      ctx.stroke();
      ctx.restore();
    },
    printHints: function () {
      var ctx = this.canvas.getContext('2d');
      var w = this.canvas.width;
      var h = this.canvas.height;
      var d = w * 2 / 3 / (this.n + 1);

      ctx.fillStyle = this.backgroundColor;
      ctx.fillRect(w * 2 / 3 - 1, -1, w * 3 + 1, h * 2 / 3 + 1);
      ctx.fillRect(-1, h * 2 / 3 - 1, w * 2 / 3 + 1, h / 3 + 1);
      ctx.save();
      ctx.translate(d / 2, d / 2);
      for (var i = 0; i < this.m; i++) {
        for (var j = 0; j < this.rowHints[i].length; j++) {
          printSingleHint.call(this, 'row', i, j);
        }
        if (this.rowHints[i].length === 0) {
          printSingleHint.call(this, 'row', i, 0);
        }
      }
      for (var j = 0; j < this.n; j++) {
        for (var i = 0; i < this.colHints[j].length; i++) {
          printSingleHint.call(this, 'col', j, i);
        }
        if (this.colHints[j].length === 0) {
          printSingleHint.call(this, 'col', j, 0);
        }
      }
      ctx.restore();

      function printSingleHint(direction, i, j) {
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = d + 'pt "Courier New", Inconsolata, Consolas, monospace';
        var line = this[direction + 'Hints'][i];
        ctx.fillStyle = line.isCorrect ? this.correctColor : this.wrongColor;
        ctx.globalAlpha = (!line.isCorrect && line.unchangedSinceLastScanned) ? 0.5 : 1;
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
  function NonogramSolve(rowHints, colHints, canvas, config) {
    assign(this, config);
    this.rowHints = deepCopy(rowHints);
    this.colHints = deepCopy(colHints);
    this.removeNonPositiveHints();
    this.m = rowHints.length;
    this.n = colHints.length;
    this.grid = new Array(this.m);
    for (var i = 0; i < this.m; i++) {
      this.grid[i] = new Array(this.n);
    }
    this.rowHints.forEach(function (row) {
      row.isCorrect = false;
      row.unchangedSinceLastScanned = false;
    });
    this.colHints.forEach(function (col) {
      col.isCorrect = false;
      col.unchangedSinceLastScanned = false;
    });

    this.canvas = canvas instanceof HTMLCanvasElement ? canvas : document.getElementById(canvas);
    if (!this.canvas || this.canvas.hasAttribute('occupied')) {
      return;
    }

    this.canvas.width = this.width || this.canvas.clientWidth;
    this.canvas.height = this.canvas.width * (this.m + 1) / (this.n + 1);
    this.canvas.nonogram = this;
    this.canvas.addEventListener('click', this.click);
    this.print();
  }
  NonogramSolve.prototype = assign(Object.create(Nonogram.prototype), {
    constructor: NonogramSolve,
    correctColor: '#999',
    success: new Event('success'),
    error: new Event('error'),
    demoMode: true,
    delay: 50,
    cellValueMap: (function () {
      var t = {};
      t[TEMPORARILY_FILLED] = FILLED;
      t[TEMPORARILY_EMPTY] = EMPTY;
      t[INCONSTANT] = UNSET;
      return t;
    })(),

    click: function (e) {
      if (this.hasAttribute('occupied')) {
        return;
      }

      var self = this.nonogram;
      var d = this.clientWidth * 2 / 3 / (self.n + 1);
      var x = e.clientX - this.getBoundingClientRect().left;
      var y = e.clientY - this.getBoundingClientRect().top;
      var location = self.getLocation(x, y);
      if (location === 'grid') {
        if (self.scanner && self.scanner.error) {
          return;
        }
        var i = Math.floor(y / d - 0.5);
        var j = Math.floor(x / d - 0.5);
        if (self.grid[i][j] === UNSET) {
          self.grid[i][j] = FILLED;
          self.rowHints[i].unchangedSinceLastScanned = false;
          self.colHints[j].unchangedSinceLastScanned = false;
          self.solve();
        }
      } else if (location === 'controller') {
        self.refresh();
      }
    },
    refresh: function () {
      if (this.canvas.hasAttribute('occupied')) {
        return;
      }

      this.grid = new Array(this.m);
      for (var i = 0; i < this.m; i++) {
        this.grid[i] = new Array(this.n);
      }
      this.rowHints.forEach(function (row) {
        row.isCorrect = false;
        row.unchangedSinceLastScanned = false;
      });
      this.colHints.forEach(function (col) {
        col.isCorrect = false;
        col.unchangedSinceLastScanned = false;
      });
      delete this.scanner;

      this.solve();
    },
    solve: function () {
      if (this.canvas) {
        if (this.canvas.hasAttribute('occupied')) {
          return;
        }
        this.canvas.setAttribute('occupied', '');
      } else {
        this.demoMode = false;
      }
      var description = 'Solves a(n) ' + this.m + '×' + this.n + ' nonogram' + (this.demoMode ? ' in demo mode' : '');
      console.time(description);
      scan.call(this);

      function scan() {
        var line;
        do {
          updateScanner.call(this);
          line = this[this.scanner.direction + 'Hints'][this.scanner.i];

          if (this.rowHints.every(function (row) {
            return row.unchangedSinceLastScanned;
          }) && this.colHints.every(function (col) {
            return col.unchangedSinceLastScanned;
          })) {
            delete this.scanner;
            if (this.canvas) {
              console.timeEnd(description);
              this.canvas.removeAttribute('occupied');
              this.print();
              this.canvas.dispatchEvent(this.success);
            }
            return;
          }
        }
        while (line.isCorrect || line.unchangedSinceLastScanned);

        if (this.demoMode) {
          this.print();
        }

        this.scanner.error = true;
        this.solveSingleLine();
        if (this.scanner.error) {
          if (this.canvas) {
            console.timeEnd(description);
            this.canvas.removeAttribute('occupied');
            this.print();
            this.canvas.dispatchEvent(this.error);
          }
          return;
        }
        if (this.demoMode) {
          setTimeout(scan.bind(this), this.delay);
        } else {
          return scan.call(this);
        }
      }

      function updateScanner() {
        if (this.scanner === undefined) {
          this.scanner = {
            'direction': 'row',
            'i': 0,
          };
        } else {
          this.scanner.error = false;
          this.scanner.i += 1;
          if (this[this.scanner.direction + 'Hints'][this.scanner.i] === undefined) {
            this.scanner.direction = (this.scanner.direction === 'row') ? 'col' : 'row';
            this.scanner.i = 0;
          }
        }
      }
    },
    solveSingleLine: function (direction, i) {
      direction = direction || this.scanner.direction;
      i = i || this.scanner.i;
      this[direction + 'Hints'][i].unchangedSinceLastScanned = true;
      
      this.line = this.getSingleLine(direction, i);
      var finished = this.line.every(function (cell) {
        return cell !== UNSET;
      });
      if (!finished) {
        this.hints = this.getHints(direction, i);
        this.blanks = [];
        this.getAllSituations(this.line.length - sum(this.hints) + 1);
        this.setBackToGrid(direction, i);
      }
      if (this.checkCorrectness(direction, i)) {
        this[direction + 'Hints'][i].isCorrect = true;
        if (finished) {
          this.scanner.error = false;
        }
      }
    },
    getAllSituations: function (max, array, index) {
      array = array || [];
      index = index || 0;
      if (index === this.hints.length) {
        this.blanks = array.slice(0, this.hints.length);
        this.blanks[0] -= 1;
        return this.mergeSituation();
      }

      for (var i = 1; i <= max; i++) {
        array[index] = i;
        this.getAllSituations(max - array[index], array, index + 1);
      }
    },
    mergeSituation: function () {
      var status = [];
      for (var i = 0; i < this.hints.length; i++) {
        for (var j = 0; j < this.blanks[i]; j++) {
          status.push(TEMPORARILY_EMPTY);
        }
        for (var j = 0; j < this.hints[i]; j++) {
          status.push(TEMPORARILY_FILLED);
        }
      }
      while (status.length < this.line.length) {
        status.push(TEMPORARILY_EMPTY);
      }

      var improper = status.some(function (cell, i) {
        return (cell === TEMPORARILY_EMPTY && this.line[i] === FILLED) || (cell === TEMPORARILY_FILLED && this.line[i] === EMPTY);
      }, this);
      if (improper) {
        return;
      }

      this.scanner.error = false;
      status.forEach(function (cell, i) {
        if (cell === TEMPORARILY_FILLED) {
          if (this.line[i] === TEMPORARILY_EMPTY) {
            this.line[i] = INCONSTANT;
          } else if (this.line[i] === UNSET) {
            this.line[i] = TEMPORARILY_FILLED;
          }
        } else if (cell === TEMPORARILY_EMPTY) {
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
          if (cell in this.cellValueMap) {
            if (this.grid[i][j] !== this.cellValueMap[cell]) {
              this.grid[i][j] = this.cellValueMap[cell];
              this.colHints[j].unchangedSinceLastScanned = false;
            }
          }
        }, this);
      } else if (direction === 'col') {
        this.line.forEach(function (cell, j) {
          if (cell in this.cellValueMap) {
            if (this.grid[j][i] !== this.cellValueMap[cell]) {
              this.grid[j][i] = this.cellValueMap[cell];
              this.rowHints[j].unchangedSinceLastScanned = false;
            }
          }
        }, this);
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

      ctx.fillStyle = this.backgroundColor;
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
      ctx.fillStyle = this.scanner.error ? this.wrongColor : this.correctColor;
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
  function NonogramEdit(m, n, canvas, config) {
    assign(this, config);
    this.m = m;
    this.n = n;
    if (!this.grid) {
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
      this.rowHints[i].isCorrect = true;
    }
    for (var j = 0; j < this.n; j++) {
      this.colHints[j] = this.calculateHints('col', j);
      this.colHints[j].isCorrect = true;
    }
    this.canvas = canvas instanceof HTMLCanvasElement ? canvas : document.getElementById(canvas);
    if (!this.canvas || this.canvas.hasAttribute('occupied')) {
      return;
    }

    this.canvas.width = this.width || this.canvas.clientWidth;
    this.canvas.height = this.canvas.width * (this.m + 1) / (this.n + 1);
    this.canvas.nonogram = this;
    this.canvas.addEventListener('click', this.click);
    this.print();
    this.canvas.dispatchEvent(this.hintChange);
  }
  NonogramEdit.prototype = assign(Object.create(Nonogram.prototype), {
    constructor: NonogramEdit,
    filledColor: '#f69',
    correctColor: '#f69',
    hintChange: new Event('hintchange'),
    threshold: 0.5,

    click: function (e) {
      var self = this.nonogram;
      var d = this.clientWidth * 2 / 3 / (self.n + 1);
      var x = e.clientX - this.getBoundingClientRect().left;
      var y = e.clientY - this.getBoundingClientRect().top;
      var location = self.getLocation(x, y);
      if (location === 'grid') {
        var i = Math.floor(y / d - 0.5);
        var j = Math.floor(x / d - 0.5);
        self.switchCell(i, j);
      } else if (location === 'controller') {
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
      this.print();
      this.canvas.dispatchEvent(this.hintChange);
    },
    printController: function () {
      var ctx = this.canvas.getContext('2d');
      var w = this.canvas.width;
      var h = this.canvas.height;
      var controllerSize = Math.min(w, h) / 4;
      var filledColor = this.filledColor;

      ctx.fillStyle = this.backgroundColor;
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
  function NonogramPlay(rowHints, colHints, canvas, config) {
    assign(this, config);
    this.rowHints = deepCopy(rowHints);
    this.colHints = deepCopy(colHints);
    this.removeNonPositiveHints();
    this.m = rowHints.length;
    this.n = colHints.length;
    this.grid = new Array(this.m);
    for (var i = 0; i < this.m; i++) {
      this.grid[i] = new Array(this.n);
      for (var j = 0; j < this.n; j++) {
        this.grid[i][j] = UNSET;
      }
    }
    for (var i = 0; i < this.m; i++) {
      this.rowHints[i].isCorrect = this.checkCorrectness('row', i);
    }
    for (var j = 0; j < this.n; j++) {
      this.colHints[j].isCorrect = this.checkCorrectness('col', j);
    }
    this.canvas = canvas instanceof HTMLCanvasElement ? canvas : document.getElementById(canvas);
    if (!this.canvas || this.canvas.hasAttribute('occupied')) {
      return;
    }

    this.canvas.width = this.width || this.canvas.clientWidth;
    this.canvas.height = this.canvas.width * (this.m + 1) / (this.n + 1);
    this.canvas.nonogram = this;
    this.canvas.addEventListener('mousedown', this.mousedown);
    this.canvas.addEventListener('mousemove', this.mousemove);
    this.canvas.addEventListener('mouseup', this.brushUp);
    this.canvas.addEventListener('mouseleave', this.brushUp);

    this.brush = FILLED;
    this.draw = {};
    this.print();
  }
  NonogramPlay.prototype = assign(Object.create(Nonogram.prototype), {
    constructor: NonogramPlay,
    filledColor: '#0cf',
    emptyColor: '#f69',
    wrongColor: '#999',
    isMeshed: true,
    success: new Event('success'),
    animationFinish: new Event('animationfinish'),

    mousedown: function (e) {
      var self = this.nonogram;
      var x = e.clientX - this.getBoundingClientRect().left;
      var y = e.clientY - this.getBoundingClientRect().top;
      var d = this.clientWidth * 2 / 3 / (self.n + 1);
      var location = self.getLocation(x, y);
      if (location === 'controller') {
        self.switchBrush();
      } else if (location === 'grid') {
        self.draw.firstI = Math.floor(y / d - 0.5);
        self.draw.firstJ = Math.floor(x / d - 0.5);
        var cell = self.grid[self.draw.firstI][self.draw.firstJ];
        if (cell === UNSET || self.brush === cell) {
          self.draw.mode = (self.brush === cell) ? 'empty' : 'filling';
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
        var d = this.clientWidth * 2 / 3 / (self.n + 1);
        if (self.getLocation(x, y) === 'grid') {
          var i = Math.floor(y / d - 0.5);
          var j = Math.floor(x / d - 0.5);
          if (i !== self.draw.lastI || j !== self.draw.lastJ) {
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
    switchBrush: function () {
      this.brush = (this.brush === EMPTY) ? FILLED : EMPTY;
      this.printController();
    },
    brushUp: function () {
      var self = this.nonogram;
      delete self.isPressed;
      self.draw = {};
    },
    switchCell: function (i, j) {
      if (this.brush === FILLED && this.grid[i][j] !== EMPTY) {
        this.grid[i][j] = (this.draw.mode === 'filling') ? FILLED : UNSET;
        this.rowHints[i].isCorrect = eekwall(this.calculateHints('row', i), this.rowHints[i]);
        this.colHints[j].isCorrect = eekwall(this.calculateHints('col', j), this.colHints[j]);
        this.print();
        var correct = this.rowHints.every(function (singleRow) {
          return singleRow.isCorrect;
        }) && this.colHints.every(function (singleCol) {
          return singleCol.isCorrect;
        });
        if (correct) {
          this.succeed();
        }
      } else if (this.brush === EMPTY && this.grid[i][j] !== FILLED) {
        this.grid[i][j] = (this.draw.mode === 'filling') ? EMPTY : UNSET;
        this.print();
      }
    },

    printCell: function (status) {
      var ctx = this.canvas.getContext('2d');
      var d = this.canvas.width * 2 / 3 / (this.n + 1);
      switch (status) {
        case FILLED:
          ctx.fillStyle = this.filledColor;
          ctx.fillRect(-d * 0.05, -d * 0.05, d * 1.1, d * 1.1);
          break;
        case EMPTY:
          ctx.strokeStyle = this.emptyColor;
          ctx.lineWidth = d / 15;
          ctx.beginPath();
          ctx.moveTo(d * 0.3, d * 0.3);
          ctx.lineTo(d * 0.7, d * 0.7);
          ctx.moveTo(d * 0.3, d * 0.7);
          ctx.lineTo(d * 0.7, d * 0.3);
          ctx.stroke();
          break;
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

      ctx.fillStyle = this.backgroundColor;
      ctx.fillRect(w * 2 / 3 - 1, h * 2 / 3 - 1, w / 3 + 1, h / 3 + 1);
      ctx.save();
      ctx.translate(w * 0.7, h * 0.7);
      if (this.brush === FILLED) {
        printEmptyBrush.call(this);
        printFillingBrush.call(this);
      } else if (this.brush === EMPTY) {
        printFillingBrush.call(this);
        printEmptyBrush.call(this);
      }
      ctx.restore();

      function printFillingBrush() {
        ctx.save();
        ctx.translate(offset, 0);
        ctx.fillStyle = this.meshColor;
        ctx.fillRect(0, 0, outerSize, outerSize);
        ctx.fillStyle = this.filledColor;
        ctx.fillRect(borderWidth, borderWidth, innerSize, innerSize);
        ctx.restore();
      }

      function printEmptyBrush() {
        ctx.save();
        ctx.translate(0, offset);
        ctx.fillStyle = this.meshColor;
        ctx.fillRect(0, 0, outerSize, outerSize);
        ctx.fillStyle = this.backgroundColor;
        ctx.fillRect(borderWidth, borderWidth, innerSize, innerSize);
        ctx.strokeStyle = '#f69';
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

    succeed: function () {
      if (!this.canvas) {
        return;
      }

      this.canvas.dispatchEvent(this.success);
      this.canvas.removeEventListener('mousedown', this.mousedown);
      this.canvas.removeEventListener('mousemove', this.mousemove);
      this.canvas.removeEventListener('mouseup', this.brushUp);
      this.canvas.removeEventListener('mouseleave', this.brushUp);

      var ctx = this.canvas.getContext('2d');
      var w = this.canvas.width;
      var h = this.canvas.height;
      var controllerSize = Math.min(w, h) / 4;

      var background = ctx.getImageData(0, 0, w, h);
      var tick = getTick();
      var t = 0;
      fadeTickIn.call(this);

      function fadeTickIn() {
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
          return requestAnimationFrame(fadeTickIn.bind(this));
        } else {
          this.canvas.dispatchEvent(this.animationFinish);
        }
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
