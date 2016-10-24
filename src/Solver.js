import Nonogram from './Nonogram'
import $ from './colors'
import { on } from './event'

const sum = array => array.reduce((a, b) => a + b, 0)

export default class Solver extends Nonogram {
  constructor(rowHints, colHints, canvas = document.createElement('canvas'), config = {}) {
    super()
    this.filledColor = $.green
    this.correctColor = $.green
    this.wrongColor = $.yellow
    this.demoMode = true
    this.delay = 50

    Object.assign(this, config)
    this.handleSuccess = config.onSuccess || (() => { })
    this.handleError = config.onError || (() => { })

    this.rowHints = rowHints.slice()
    this.colHints = colHints.slice()
    this.removeNonPositiveHints()
    this.m = rowHints.length
    this.n = colHints.length
    this.grid = new Array(this.m)
    for (let i = 0; i < this.m; i += 1) {
      this.grid[i] = new Array(this.n)
    }
    this.rowHints.forEach((row) => {
      row.isCorrect = false
      row.unchangedSinceLastScanned = false
    })
    this.colHints.forEach((col) => {
      col.isCorrect = false
      col.unchangedSinceLastScanned = false
    })

    this.canvas = canvas instanceof HTMLCanvasElement ? canvas : document.getElementById(canvas)
    if (!this.canvas || this.canvas.dataset.isBusy) {
      return
    }

    this.canvas.width = this.width || this.canvas.clientWidth
    this.canvas.height = this.canvas.width * (this.m + 1) / (this.n + 1)
    on.call(this.canvas, 'click', this.click.bind(this))
    this.canvas.oncontextmenu = (e) => { e.preventDefault() }

    this.print()
  }

  click(e) {
    if (this.canvas.dataset.isBusy) {
      return
    }

    const rect = this.canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const d = rect.width * 2 / 3 / (this.n + 1)
    const location = this.getLocation(x, y)
    if (location === 'grid') {
      if (this.scanner && this.scanner.error) {
        return
      }
      const i = Math.floor(y / d - 0.5)
      const j = Math.floor(x / d - 0.5)
      if (this.grid[i][j] === Solver.UNSET) {
        this.grid[i][j] = Solver.FILLED
        this.rowHints[i].unchangedSinceLastScanned = false
        this.colHints[j].unchangedSinceLastScanned = false
        this.solve()
      }
    } else if (location === 'controller') {
      this.refresh()
    }
  }
  refresh() {
    if (this.canvas.dataset.isBusy) {
      return
    }

    this.grid = new Array(this.m)
    for (let i = 0; i < this.m; i += 1) {
      this.grid[i] = new Array(this.n)
    }
    this.rowHints.forEach((row) => {
      row.isCorrect = false
      row.unchangedSinceLastScanned = false
    })
    this.colHints.forEach((col) => {
      col.isCorrect = false
      col.unchangedSinceLastScanned = false
    })
    delete this.scanner

    this.solve()
  }
  solve() {
    if (this.canvas.dataset.isBusy) {
      return
    }

    this.canvas.dataset.isBusy = 1
    this.startTime = Date.now()
    this.scan()
  }
  scan() {
    this.updateScanner()
    if (this.scanner === undefined) {
      return
    }

    if (this.demoMode) {
      this.print()
    }
    this.scanner.error = true
    this.solveSingleLine()
    if (this.scanner.error) {
      if (this.canvas) {
        this.canvas.dataset.isBusy = ''
        this.print()
        this.handleError(new Error(`Bad hints at ${this.scanner.direction} ${this.scanner.i + 1}`))
      }
      return
    }
    if (this.demoMode) {
      setTimeout(this.scan.bind(this), this.delay)
    } else {
      this.scan()
    }
  }

  updateScanner() {
    let line
    do {
      if (this.scanner === undefined) {
        this.scanner = {
          direction: 'row',
          i: 0,
        }
      } else {
        this.scanner.error = false
        this.scanner.i += 1
        if (this[`${this.scanner.direction}Hints`][this.scanner.i] === undefined) {
          this.scanner.direction = (this.scanner.direction === 'row') ? 'col' : 'row'
          this.scanner.i = 0
        }
      }
      line = this[`${this.scanner.direction}Hints`][this.scanner.i]

      if (this.rowHints.every(row => row.unchangedSinceLastScanned) &&
        this.colHints.every(col => col.unchangedSinceLastScanned)) {
        delete this.scanner
        if (this.canvas) {
          this.canvas.dataset.isBusy = ''
          this.print()
          this.handleSuccess(Date.now() - this.startTime)
        }
        return
      }
    }
    while (line.isCorrect || line.unchangedSinceLastScanned)
  }
  solveSingleLine(direction = this.scanner.direction, i = this.scanner.i) {
    this[`${direction}Hints`][i].unchangedSinceLastScanned = true

    this.line = this.getSingleLine(direction, i)
    const finished = this.line.every(cell => cell !== Solver.UNSET)
    if (!finished) {
      this.hints = this.getHints(direction, i)
      this.blanks = []
      this.getAllSituations(this.line.length - sum(this.hints) + 1)
      this.setBackToGrid(direction, i)
    }
    if (this.checkCorrectness(direction, i)) {
      this[`${direction}Hints`][i].isCorrect = true
      if (finished) {
        this.scanner.error = false
      }
    }
  }
  getAllSituations(max, array = [], index = 0) {
    if (index === this.hints.length) {
      this.blanks = array.slice(0, this.hints.length)
      this.blanks[0] -= 1
      this.mergeSituation()
    }

    for (let i = 1; i <= max; i += 1) {
      array[index] = i
      this.getAllSituations(max - array[index], array, index + 1)
    }
  }
  mergeSituation() {
    const status = []
    for (let i = 0; i < this.hints.length; i += 1) {
      status.push(...new Array(this.blanks[i]).fill(Solver.TEMPORARILY_EMPTY))
      status.push(...new Array(this.hints[i]).fill(Solver.TEMPORARILY_FILLED))
    }
    status.push(...new Array(this.line.length - status.length).fill(Solver.TEMPORARILY_EMPTY))

    const improper = status.some((cell, i) =>
      (cell === Solver.TEMPORARILY_EMPTY && this.line[i] === Solver.FILLED) ||
      (cell === Solver.TEMPORARILY_FILLED && this.line[i] === Solver.EMPTY)
    )
    if (improper) {
      return
    }

    this.scanner.error = false
    status.forEach((cell, i) => {
      if (cell === Solver.TEMPORARILY_FILLED) {
        if (this.line[i] === Solver.TEMPORARILY_EMPTY) {
          this.line[i] = Solver.INCONSTANT
        } else if (this.line[i] === Solver.UNSET) {
          this.line[i] = Solver.TEMPORARILY_FILLED
        }
      } else if (cell === Solver.TEMPORARILY_EMPTY) {
        if (this.line[i] === Solver.TEMPORARILY_FILLED) {
          this.line[i] = Solver.INCONSTANT
        } else if (this.line[i] === Solver.UNSET) {
          this.line[i] = Solver.TEMPORARILY_EMPTY
        }
      }
    })
  }
  setBackToGrid(direction, i) {
    if (direction === 'row') {
      this.line.forEach((cell, j) => {
        if (Solver.cellValueMap.has(cell)) {
          if (this.grid[i][j] !== Solver.cellValueMap.get(cell)) {
            this.grid[i][j] = Solver.cellValueMap.get(cell)
            this.colHints[j].unchangedSinceLastScanned = false
          }
        }
      })
    } else if (direction === 'col') {
      this.line.forEach((cell, j) => {
        if (Solver.cellValueMap.has(cell)) {
          if (this.grid[j][i] !== Solver.cellValueMap.get(cell)) {
            this.grid[j][i] = Solver.cellValueMap.get(cell)
            this.rowHints[j].unchangedSinceLastScanned = false
          }
        }
      })
    }
  }

  print() {
    if (this.canvas) {
      this.printGrid()
      this.printHints()
      this.printController()
      this.printScanner()
    }
  }
  printController() {
    const ctx = this.canvas.getContext('2d')
    const w = this.canvas.width
    const h = this.canvas.height
    const controllerSize = Math.min(w, h) / 4
    const filledColor = this.filledColor

    function getCycle() {
      const cycle = document.createElement('canvas')
      const borderWidth = controllerSize / 10
      cycle.width = controllerSize
      cycle.height = controllerSize

      const c = cycle.getContext('2d')
      c.translate(controllerSize / 2, controllerSize / 2)
      c.rotate(Math.PI)
      c.arc(0, 0, controllerSize / 2 - borderWidth / 2, Math.PI / 2, Math.PI / 3.9)
      c.lineWidth = borderWidth
      c.strokeStyle = filledColor
      c.stroke()
      c.beginPath()
      c.moveTo((controllerSize / 2 + borderWidth) * Math.SQRT1_2,
        (controllerSize / 2 + borderWidth) * Math.SQRT1_2)
      c.lineTo((controllerSize / 2 - borderWidth * 2) * Math.SQRT1_2,
        (controllerSize / 2 - borderWidth * 2) * Math.SQRT1_2)
      c.lineTo((controllerSize / 2 - borderWidth * 2) * Math.SQRT1_2,
        (controllerSize / 2 + borderWidth) * Math.SQRT1_2)
      c.closePath()
      c.fillStyle = filledColor
      c.fill()

      return cycle
    }

    ctx.clearRect(w * 2 / 3 - 1, h * 2 / 3 - 1, w / 3 + 1, h / 3 + 1)
    if (this.canvas.dataset.isBusy) {
      return
    }

    ctx.save()
    ctx.translate(w * 0.7, h * 0.7)
    ctx.drawImage(getCycle(), 0, 0)
    ctx.restore()
  }
  printScanner() {
    if (this.scanner === undefined) {
      return
    }

    const ctx = this.canvas.getContext('2d')
    const w = this.canvas.width
    const h = this.canvas.height
    const d = w * 2 / 3 / (this.n + 1)

    ctx.save()
    ctx.translate(d / 2, d / 2)
    ctx.fillStyle = this.scanner.error ? this.wrongColor : this.correctColor
    ctx.globalAlpha = 0.5
    if (this.scanner.direction === 'row') {
      ctx.fillRect(0, d * this.scanner.i, w, d)
    } else if (this.scanner.direction === 'col') {
      ctx.fillRect(d * this.scanner.i, 0, d, h)
    }
    ctx.restore()
  }
}

Solver.EMPTY = false
Solver.TEMPORARILY_FILLED = 1
Solver.TEMPORARILY_EMPTY = -1
Solver.INCONSTANT = 0

Solver.cellValueMap = new Map()
Solver.cellValueMap.set(Solver.TEMPORARILY_FILLED, Solver.FILLED)
Solver.cellValueMap.set(Solver.TEMPORARILY_EMPTY, Solver.EMPTY)
Solver.cellValueMap.set(Solver.INCONSTANT, Solver.UNSET)
