'use strict';

const sum = array => array.reduce((a, b) => a + b, 0);
const deepCopy = object => JSON.parse(JSON.stringify(object));
const eekwall = (object1, object2) => object1.toString() === object2.toString();

const FILLED = true;
const EMPTY = false;
const UNSET = undefined;
const TEMPORARILY_FILLED = 1;
const TEMPORARILY_EMPTY = -1;
const INCONSTANT = 0;

class Nonogram {
  constructor() {
    this.backgroundColor = '#fff';
    this.filledColor = '#999';
    this.unsetColor = '#ccc';
    this.correctColor = '#0cf';
    this.wrongColor = '#f69';
    this.meshColor = '#999';
    this.meshed = false;
    this.boldMeshGap = 5;
  }

  getSingleLine(direction, i) {
    const g = [];
    if (direction === 'row') {
      for (let j = 0; j < this.n; j++) {
        g[j] = this.grid[i][j];
      }
    } else if (direction === 'col') {
      for (let j = 0; j < this.m; j++) {
        g[j] = this.grid[j][i];
      }
    }
    return g;
  }
  removeNonPositiveHints() {
    this.rowHints.forEach(removeNonPositiveElement);
    this.colHints.forEach(removeNonPositiveElement);

    function removeNonPositiveElement(array, j, self) {
      self[j] = array.filter(Math.sign);
    }
  }
  getHints(direction, i) {
    return deepCopy(this[`${direction}Hints`][i]);
  }
  calculateHints(direction, i) {
    const hints = [];
    const line = this.getSingleLine(direction, i);
    line.reduce((lastIsFilled, cell) => {
      if (cell === FILLED) {
        lastIsFilled ? hints.push(hints.pop() + 1) : hints.push(1);
      }
      return cell === FILLED;
    }, false);
    return hints;
  }
  checkCorrectness(direction, i) {
    return this.calculateHints(direction, i).toString() === this[`${direction}Hints`][i].toString();
  }

  getLocation(x, y) {
    const w = this.canvas.width;
    const h = this.canvas.height;
    const w23 = w * 2 / 3;
    const h23 = h * 2 / 3;
    const d = w23 / (this.n + 1);

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
  }

  print() {
    if (this.canvas) {
      this.printGrid();
      this.printHints();
      this.printController();
    }
  }
  printGrid() {
    const ctx = this.canvas.getContext('2d');
    const w = this.canvas.width;
    const h = this.canvas.height;
    const d = w * 2 / 3 / (this.n + 1);

    ctx.fillStyle = this.backgroundColor;
    ctx.fillRect(-1, -1, w * 2 / 3 + 1, h * 2 / 3 + 1);
    if (this.meshed) {
      this.printMesh();
    }
    ctx.save();
    ctx.translate(d / 2, d / 2);
    for (let i = 0; i < this.m; i++) {
      for (let j = 0; j < this.n; j++) {
        ctx.save();
        ctx.translate(d * j, d * i);
        this.printCell(this.grid[i][j]);
        ctx.restore();
      }
    }
    ctx.restore();
  }
  printCell(status) {
    const ctx = this.canvas.getContext('2d');
    const d = this.canvas.width * 2 / 3 / (this.n + 1);
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
  }
  printMesh() {
    const ctx = this.canvas.getContext('2d');
    const d = this.canvas.width * 2 / 3 / (this.n + 1);

    ctx.save();
    ctx.translate(d / 2, d / 2);
    ctx.beginPath();
    for (let i = 1; i < this.m; i++) {
      ctx.moveTo(0, i * d);
      ctx.lineTo(this.n * d, i * d);
      if (i % this.boldMeshGap === 0) {
        ctx.moveTo(0, i * d - 1);
        ctx.lineTo(this.n * d, i * d - 1);
        ctx.moveTo(0, i * d + 1);
        ctx.lineTo(this.n * d, i * d + 1);
      }
    }
    for (let j = 1; j < this.n; j++) {
      ctx.moveTo(j * d, 0);
      ctx.lineTo(j * d, this.m * d);
      if (j % this.boldMeshGap === 0) {
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
  }
  printHints() {
    const ctx = this.canvas.getContext('2d');
    const w = this.canvas.width;
    const h = this.canvas.height;
    const d = w * 2 / 3 / (this.n + 1);

    ctx.fillStyle = this.backgroundColor;
    ctx.fillRect(w * 2 / 3 - 1, -1, w * 3 + 1, h * 2 / 3 + 1);
    ctx.fillRect(-1, h * 2 / 3 - 1, w * 2 / 3 + 1, h / 3 + 1);
    ctx.save();
    ctx.translate(d / 2, d / 2);
    for (let i = 0; i < this.m; i++) {
      for (let j = 0; j < this.rowHints[i].length; j++) {
        printSingleHint.call(this, 'row', i, j);
      }
      if (this.rowHints[i].length === 0) {
        printSingleHint.call(this, 'row', i, 0);
      }
    }
    for (let j = 0; j < this.n; j++) {
      for (let i = 0; i < this.colHints[j].length; i++) {
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
      ctx.fillStyle = this[`${direction}Hints`][i].isCorrect ? this.correctColor : this.wrongColor;
      if (direction === 'row') {
        ctx.fillText(this.rowHints[i][j] || 0,
          w * 2 / 3 + d * j, d * (i + 0.5), d * 0.8);
      } else if (direction === 'col') {
        ctx.fillText(this.colHints[i][j] || 0,
          d * (i + 0.5), h * 2 / 3 + d * j, d * 0.8);
      }
    }
  }
  printController() {
    return;
  }
}

class NonogramSolve extends Nonogram {
  constructor(rowHints, colHints, canvas, config) {
    super();
    this.correctColor = '#999';
    this.success = new Event('success');
    this.error = new Event('error');
    this.demoMode = true;
    this.delay = 50;
    this.cellValueMap = (() => {
      const t = new Map();
      t.set(TEMPORARILY_FILLED, FILLED);
      t.set(TEMPORARILY_EMPTY, EMPTY);
      t.set(INCONSTANT, UNSET);
      return t;
    })();

    Object.assign(this, config);
    this.rowHints = deepCopy(rowHints);
    this.colHints = deepCopy(colHints);
    this.removeNonPositiveHints();
    this.m = rowHints.length;
    this.n = colHints.length;
    this.grid = new Array(this.m);
    for (let i = 0; i < this.m; i++) {
      this.grid[i] = new Array(this.n);
    }
    this.rowHints.forEach(row => { row.isCorrect = false; });
    this.colHints.forEach(col => { col.isCorrect = false; });

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

  click(e) {
    if (this.hasAttribute('occupied')) {
      return;
    }

    const self = this.nonogram;
    const d = this.width * 2 / 3 / (self.n + 1);
    const x = e.clientX - this.getBoundingClientRect().left;
    const y = e.clientY - this.getBoundingClientRect().top;
    if (self.getLocation(x, y) === 'grid') {
      const i = Math.floor(y / d - 0.5);
      const j = Math.floor(x / d - 0.5);
      if (self.grid[i][j] === UNSET) {
        self.grid[i][j] = FILLED;
        self.solve();
      }
    } else if (self.getLocation(x, y) === 'controller') {
      self.refresh();
    }
  }
  refresh() {
    if (this.canvas.hasAttribute('occupied')) {
      return;
    }

    this.grid = new Array(this.m);
    for (let i = 0; i < this.m; i++) {
      this.grid[i] = new Array(this.n);
    }
    this.rowHints.forEach(row => { row.isCorrect = false; });
    this.colHints.forEach(col => { col.isCorrect = false; });
    this.scanner = undefined;

    this.solve();
  }
  solve() {
    if (this.canvas) {
      if (this.canvas.hasAttribute('occupied')) {
        return;
      }
      this.canvas.setAttribute('occupied', '');
    } else {
      this.demoMode = false;
    }
    scan.call(this);

    function scan() {
      do {
        updateScanner.call(this);
      }
      while (this[`${this.scanner.direction}Hints`][this.scanner.i].isCorrect && this.linesToChange);

      if (this.demoMode) {
        this.print();
      }

      if (this.linesToChange) {
        this.scanner.error = true;
        this.solveSingleLine();
        if (this.scanner.error) {
          if (this.canvas) {
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
      } else {
        this.scanner = undefined;
        if (this.canvas) {
          this.canvas.removeAttribute('occupied');
          this.print();
          this.canvas.dispatchEvent(this.success);
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
        this.scanner.error = false;
        this.scanner.i += 1;
        if (this[`${this.scanner.direction}Hints`][this.scanner.i] === undefined) {
          this.scanner.direction = (this.scanner.direction === 'row') ? 'col' : 'row';
          this.scanner.i = 0;
        }
        this.linesToChange -= 1;
      }
    }
  }
  solveSingleLine(direction = this.scanner.direction, i = this.scanner.i) {
    this.line = this.getSingleLine(direction, i);
    const finished = this.line.every(cell => cell !== UNSET);
    if (!finished) {
      this.hints = this.getHints(direction, i);
      this.blanks = [];
      this.getAllSituations(this.line.length - sum(this.hints) + 1);

      const changed = this.line.some(cell => cell === TEMPORARILY_FILLED || cell === TEMPORARILY_EMPTY);
      if (changed) {
        this.linesToChange = this.m + this.n;
      }
      this.setBackToGrid(direction, i);
    }
    if (this.checkCorrectness(direction, i)) {
      this[`${direction}Hints`][i].isCorrect = true;
      if (finished) {
        this.scanner.error = false;
      }
    }
  }
  getAllSituations(max, array = [], index = 0) {
    if (index === this.hints.length) {
      this.blanks = array.slice(0, this.hints.length);
      this.blanks[0] -= 1;
      return this.mergeSituation();
    }

    for (let i = 1; i <= max; i++) {
      array[index] = i;
      this.getAllSituations(max - array[index], array, index + 1);
    }
  }
  mergeSituation() {
    const status = [];
    for (let i = 0; i < this.hints.length; i++) {
      status.push(...new Array(this.blanks[i]).fill(TEMPORARILY_EMPTY));
      status.push(...new Array(this.hints[i]).fill(TEMPORARILY_FILLED));
    }
    status.push(...new Array(this.line.length - status.length).fill(TEMPORARILY_EMPTY));

    const improper = status.some((cell, i) => (cell === TEMPORARILY_EMPTY && this.line[i] === FILLED) || (cell === TEMPORARILY_FILLED && this.line[i] === EMPTY));
    if (improper) {
      return;
    }

    this.scanner.error = false;
    status.forEach((cell, i) => {
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
    });
  }
  setBackToGrid(direction, i) {
    if (direction === 'row') {
      this.line.forEach((cell, j) => {
        if (this.cellValueMap.has(cell)) {
          this.grid[i][j] = this.cellValueMap.get(cell);
        }
      });
    } else if (direction === 'col') {
      this.line.forEach((cell, j) => {
        if (this.cellValueMap.has(cell)) {
          this.grid[j][i] = this.cellValueMap.get(cell);
        }
      });
    }
  }

  print() {
    if (this.canvas) {
      this.printGrid();
      this.printHints();
      this.printController();
      this.printScanner();
    }
  }
  printController() {
    const ctx = this.canvas.getContext('2d');
    const w = this.canvas.width;
    const h = this.canvas.height;
    const controllerSize = Math.min(w, h) / 4;
    const filledColor = this.filledColor;

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
      const cycle = document.createElement('canvas');
      const borderWidth = controllerSize / 10;
      cycle.width = controllerSize;
      cycle.height = controllerSize;

      const ctx = cycle.getContext('2d');
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
  }
  printScanner() {
    if (this.scanner === undefined) {
      return;
    }

    const ctx = this.canvas.getContext('2d');
    const w = this.canvas.width;
    const h = this.canvas.height;
    const d = w * 2 / 3 / (this.n + 1);

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
  }
}

class NonogramEdit extends Nonogram {
  constructor(m, n, canvas, config) {
    super();
    this.filledColor = '#f69';
    this.correctColor = '#f69';
    this.hintChange = new Event('hintchange');
    this.threshold = 0.5;

    Object.assign(this, config);
    this.m = m;
    this.n = n;
    if (!this.grid) {
      this.grid = new Array(this.m);
      for (let i = 0; i < this.m; i++) {
        this.grid[i] = new Array(this.n);
        for (let j = 0; j < this.n; j++) {
          this.grid[i][j] = (Math.random() < this.threshold) ? FILLED : EMPTY;
        }
      }
    }
    this.rowHints = new Array(m);
    this.colHints = new Array(n);
    for (let i = 0; i < this.m; i++) {
      this.rowHints[i] = this.calculateHints('row', i);
      this.rowHints[i].isCorrect = true;
    }
    for (let j = 0; j < this.n; j++) {
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

  click(e) {
    const self = this.nonogram;
    const d = this.width * 2 / 3 / (self.n + 1);
    const x = e.clientX - this.getBoundingClientRect().left;
    const y = e.clientY - this.getBoundingClientRect().top;
    if (self.getLocation(x, y) === 'grid') {
      const i = Math.floor(y / d - 0.5);
      const j = Math.floor(x / d - 0.5);
      self.switchCell(i, j);
    } else if (self.getLocation(x, y) === 'controller') {
      self.refresh();
    }
  }
  switchCell(i, j) {
    this.grid[i][j] = (this.grid[i][j] === FILLED) ? EMPTY : FILLED;
    this.rowHints[i] = this.calculateHints('row', i);
    this.colHints[j] = this.calculateHints('col', j);
    this.print();
    this.canvas.dispatchEvent(this.hintChange);
  }
  refresh() {
    for (let i = 0; i < this.m; i++) {
      for (let j = 0; j < this.n; j++) {
        this.grid[i][j] = (Math.random() < this.threshold) ? FILLED : EMPTY;
      }
    }
    for (let i = 0; i < this.m; i++) {
      this.rowHints[i] = this.calculateHints('row', i);
    }
    for (let j = 0; j < this.n; j++) {
      this.colHints[j] = this.calculateHints('col', j);
    }
    this.print();
    this.canvas.dispatchEvent(this.hintChange);
  }
  printController() {
    const ctx = this.canvas.getContext('2d');
    const w = this.canvas.width;
    const h = this.canvas.height;
    const controllerSize = Math.min(w, h) / 4;
    const filledColor = this.filledColor;

    ctx.fillStyle = this.backgroundColor;
    ctx.fillRect(w * 2 / 3 - 1, h * 2 / 3 - 1, w / 3 + 1, h / 3 + 1);
    ctx.save();
    ctx.translate(w * 0.7, h * 0.7);
    ctx.drawImage(getCycle(), 0, 0);
    ctx.restore();

    function getCycle() {
      const cycle = document.createElement('canvas');
      const borderWidth = controllerSize / 10;
      cycle.width = controllerSize;
      cycle.height = controllerSize;

      const ctx = cycle.getContext('2d');
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
  }
}

class NonogramPlay extends Nonogram {
  constructor(rowHints, colHints, canvas, config) {
    super();
    this.filledColor = '#0cf';
    this.emptyColor = '#f69';
    this.wrongColor = '#999';
    this.meshed = true;
    this.success = new Event('success');
    this.animationFinish = new Event('animationfinish');

    Object.assign(this, config);
    this.rowHints = deepCopy(rowHints);
    this.colHints = deepCopy(colHints);
    this.removeNonPositiveHints();
    this.m = rowHints.length;
    this.n = colHints.length;
    this.grid = new Array(this.m);
    for (let i = 0; i < this.m; i++) {
      this.grid[i] = new Array(this.n).fill(UNSET);
    }
    this.rowHints.forEach((row, i) => { row.isCorrect = this.checkCorrectness('row', i); })
    this.colHints.forEach((col, j) => { col.isCorrect = this.checkCorrectness('col', j); })
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

  mousedown(e) {
    const self = this.nonogram;
    const x = e.clientX - this.getBoundingClientRect().left;
    const y = e.clientY - this.getBoundingClientRect().top;
    const d = this.width * 2 / 3 / (self.n + 1);
    if (self.getLocation(x, y) === 'controller') {
      self.switchBrush();
    } else if (self.getLocation(x, y) === 'grid') {
      self.draw.firstI = Math.floor(y / d - 0.5);
      self.draw.firstJ = Math.floor(x / d - 0.5);
      const cell = self.grid[self.draw.firstI][self.draw.firstJ];
      if (cell === UNSET || self.brush === cell) {
        self.draw.mode = (self.brush === cell) ? 'empty' : 'filling';
        self.isPressed = true;
        self.switchCell(self.draw.firstI, self.draw.firstJ);
      }
      self.draw.lastI = self.draw.firstI;
      self.draw.lastJ = self.draw.firstJ;
    }
  }
  mousemove(e) {
    const self = this.nonogram;
    if (self.isPressed) {
      const x = e.clientX - this.getBoundingClientRect().left;
      const y = e.clientY - this.getBoundingClientRect().top;
      const d = this.width * 2 / 3 / (self.n + 1);
      if (self.getLocation(x, y) === 'grid') {
        const i = Math.floor(y / d - 0.5);
        const j = Math.floor(x / d - 0.5);
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
  }
  switchBrush() {
    this.brush = (this.brush === EMPTY) ? FILLED : EMPTY;
    this.printController();
  }
  brushUp() {
    const self = this.nonogram;
    self.isPressed = undefined;
    self.draw.direction = undefined;
    self.draw.mode = undefined;
  }
  switchCell(i, j) {
    if (this.brush === FILLED && this.grid[i][j] !== EMPTY) {
      this.grid[i][j] = (this.draw.mode === 'filling') ? FILLED : UNSET;
      this.rowHints[i].isCorrect = eekwall(this.calculateHints('row', i), this.rowHints[i]);
      this.colHints[j].isCorrect = eekwall(this.calculateHints('col', j), this.colHints[j]);
      this.print();
      const correct = this.rowHints.every(singleRow => singleRow.isCorrect)
        && this.colHints.every(singleCol => singleCol.isCorrect);
      if (correct) {
        this.succeed();
      }
    } else if (this.brush === EMPTY && this.grid[i][j] !== FILLED) {
      this.grid[i][j] = (this.draw.mode === 'filling') ? EMPTY : UNSET;
      this.print();
    }
  }

  printCell(status) {
    const ctx = this.canvas.getContext('2d');
    const d = this.canvas.width * 2 / 3 / (this.n + 1);
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
  }
  printController() {
    const ctx = this.canvas.getContext('2d');
    const w = this.canvas.width;
    const h = this.canvas.height;
    const controllerSize = Math.min(w, h) / 4;
    const outerSize = controllerSize * 3 / 4;
    const offset = controllerSize / 4;
    const borderWidth = controllerSize / 20;
    const innerSize = outerSize - 2 * borderWidth;

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
  }

  succeed() {
    if (!this.canvas) {
      return;
    }

    this.canvas.dispatchEvent(this.success);
    this.canvas.removeEventListener('mousedown', this.mousedown);
    this.canvas.removeEventListener('mousemove', this.mousemove);
    this.canvas.removeEventListener('mouseup', this.brushUp);
    this.canvas.removeEventListener('mouseleave', this.brushUp);

    const ctx = this.canvas.getContext('2d');
    const w = this.canvas.width;
    const h = this.canvas.height;
    const controllerSize = Math.min(w, h) / 4;

    const background = ctx.getImageData(0, 0, w, h);
    const tick = getTick();
    let t = 0;
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

    function getTick() {
      const size = controllerSize * 2;
      const borderWidth = size / 10;
      const tick = document.createElement('canvas');
      tick.width = size;
      tick.height = size;

      const ctx = tick.getContext('2d');
      ctx.translate(size / 3, size * 5 / 6);
      ctx.rotate(-Math.PI / 4);
      ctx.fillStyle = '#0c6';
      ctx.fillRect(0, 0, borderWidth, -size * Math.SQRT2 / 3);
      ctx.fillRect(0, 0, size * Math.SQRT2 * 2 / 3, -borderWidth);

      return tick;
    }

    function f(t) {
      return 1 + Math.pow(t - 1, 3);
    }
  }
}

export {NonogramSolve, NonogramEdit, NonogramPlay};
