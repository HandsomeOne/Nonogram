import Nonogram from './Nonogram'
import $ from './colors'

const sum = array => array.reduce((a, b) => a + b, 0)

export default class Solver extends Nonogram {
  constructor(row, column, canvas, {
    theme,
    demoMode = true,
    delay = 50,
    onSuccess = () => { },
    onError = () => { },
  } = {}) {
    super()
    this.theme.filledColor = $.green
    this.theme.correctColor = $.green
    this.theme.wrongColor = $.yellow
    Object.assign(this.theme, theme)

    this.demoMode = demoMode
    this.delay = delay
    this.handleSuccess = onSuccess
    this.handleError = onError

    this.hints = {
      row: row.slice(),
      column: column.slice(),
    }
    this.removeNonPositiveHints()
    this.m = this.hints.row.length
    this.n = this.hints.column.length
    this.grid = new Array(this.m)
    for (let i = 0; i < this.m; i += 1) {
      this.grid[i] = new Array(this.n)
    }
    this.hints.row.forEach((r) => {
      r.isCorrect = false
      r.unchanged = false
    })
    this.hints.column.forEach((c) => {
      c.isCorrect = false
      c.unchanged = false
    })

    this.initCanvas(canvas)

    this.print()
  }

  initListeners() {
    this.listeners = [
      ['click', this.click.bind(this)],
    ]
  }
  click(e) {
    if (this.isBusy) {
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
        this.hints.row[i].unchanged = false
        this.hints.column[j].unchanged = false
        this.solve()
      }
    } else if (location === 'controller') {
      this.refresh()
    }
  }
  refresh() {
    if (this.isBusy) {
      return
    }

    this.grid = new Array(this.m)
    for (let i = 0; i < this.m; i += 1) {
      this.grid[i] = new Array(this.n)
    }
    this.hints.row.forEach((r) => {
      r.isCorrect = false
      r.unchanged = false
      delete r.possibleBlanks
    })
    this.hints.column.forEach((c) => {
      c.isCorrect = false
      c.unchanged = false
      delete c.possibleBlanks
    })
    delete this.scanner

    this.solve()
  }
  solve() {
    if (this.isBusy) {
      return
    }

    this.isBusy = true
    this.startTime = Date.now()
    this.scan()
  }
  scan() {
    if (this.canvas.nonogram !== this) {
      return
    }

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
      this.isBusy = false
      this.print()
      this.handleError(new Error(`Bad hints at ${this.scanner.direction} ${this.scanner.i + 1}`))
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
        if (this.hints[this.scanner.direction][this.scanner.i] === undefined) {
          this.scanner.direction = (this.scanner.direction === 'row') ? 'column' : 'row'
          this.scanner.i = 0
        }
      }
      line = this.hints[this.scanner.direction][this.scanner.i]

      if (this.hints.row.every(row => row.unchanged) &&
        this.hints.column.every(col => col.unchanged)) {
        delete this.scanner
        this.isBusy = false
        this.print()
        this.handleSuccess(Date.now() - this.startTime)
        return
      }
    }
    while (line.isCorrect || line.unchanged)
  }
  solveSingleLine() {
    const { direction, i } = this.scanner
    this.scanner.hints = this.hints[direction][i]
    this.scanner.hints.unchanged = true

    this.scanner.line = this.getSingleLine(direction, i)
    const finished = this.scanner.line.every(cell => cell !== Solver.UNSET)
    if (!finished) {
      if (this.scanner.hints.possibleBlanks === undefined) {
        this.scanner.hints.possibleBlanks = []
        this.getAllSituations(this.scanner.line.length - sum(this.scanner.hints) + 1)
      }
      this.mergeSituation()
      this.setBackToGrid()
    }
    if (this.isLineCorrect(direction, i)) {
      this.hints[direction][i].isCorrect = true
      if (finished) {
        this.scanner.error = false
      }
    }
  }
  getAllSituations(max, array = [], index = 0) {
    if (index === this.scanner.hints.length) {
      const blanks = array.slice(0, this.scanner.hints.length)
      blanks[0] -= 1
      this.scanner.hints.possibleBlanks.push(blanks)
    }

    for (let i = 1; i <= max; i += 1) {
      array[index] = i
      this.getAllSituations(max - array[index], array, index + 1)
    }
  }
  mergeSituation() {
    const { possibleBlanks } = this.scanner.hints
    possibleBlanks.forEach((blanks, p) => {
      const line = []
      for (let i = 0; i < this.scanner.hints.length; i += 1) {
        line.push(...new Array(blanks[i]).fill(Solver.TEMP_EMPTY))
        line.push(...new Array(this.scanner.hints[i]).fill(Solver.TEMP_FILLED))
      }
      line.push(...new Array(this.scanner.line.length - line.length).fill(Solver.TEMP_EMPTY))

      const improper = line.some((cell, i) =>
        (cell === Solver.TEMP_EMPTY && this.scanner.line[i] === Solver.FILLED) ||
        (cell === Solver.TEMP_FILLED && this.scanner.line[i] === Solver.EMPTY)
      )
      if (improper) {
        possibleBlanks[p] = null
        return
      }

      this.scanner.error = false
      line.forEach((cell, i) => {
        if (cell === Solver.TEMP_FILLED) {
          if (this.scanner.line[i] === Solver.TEMP_EMPTY) {
            this.scanner.line[i] = Solver.INCONSTANT
          } else if (this.scanner.line[i] === Solver.UNSET) {
            this.scanner.line[i] = Solver.TEMP_FILLED
          }
        } else if (cell === Solver.TEMP_EMPTY) {
          if (this.scanner.line[i] === Solver.TEMP_FILLED) {
            this.scanner.line[i] = Solver.INCONSTANT
          } else if (this.scanner.line[i] === Solver.UNSET) {
            this.scanner.line[i] = Solver.TEMP_EMPTY
          }
        }
      })
    })
    this.scanner.hints.possibleBlanks = possibleBlanks.filter(e => e !== null)
  }
  setBackToGrid() {
    const { direction, i } = this.scanner
    if (direction === 'row') {
      this.scanner.line.forEach((cell, j) => {
        if (Solver.cellValueMap.has(cell)) {
          if (this.grid[i][j] !== Solver.cellValueMap.get(cell)) {
            this.grid[i][j] = Solver.cellValueMap.get(cell)
            this.hints.column[j].unchanged = false
          }
        }
      })
    } else if (direction === 'column') {
      this.scanner.line.forEach((cell, j) => {
        if (Solver.cellValueMap.has(cell)) {
          if (this.grid[j][i] !== Solver.cellValueMap.get(cell)) {
            this.grid[j][i] = Solver.cellValueMap.get(cell)
            this.hints.row[j].unchanged = false
          }
        }
      })
    }
  }

  print() {
    this.printGrid()
    this.printHints()
    this.printController()
    this.printScanner()
  }
  printController() {
    const ctx = this.canvas.getContext('2d')
    const w = this.canvas.width
    const h = this.canvas.height
    const controllerSize = Math.min(w, h) / 4
    const filledColor = this.theme.filledColor

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
    if (this.isBusy) {
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
    ctx.fillStyle = this.scanner.error ? this.theme.wrongColor : this.theme.correctColor
    ctx.globalAlpha = 0.5
    if (this.scanner.direction === 'row') {
      ctx.fillRect(0, d * this.scanner.i, w, d)
    } else if (this.scanner.direction === 'column') {
      ctx.fillRect(d * this.scanner.i, 0, d, h)
    }
    ctx.restore()
  }
}

Solver.TEMP_FILLED = 1
Solver.TEMP_EMPTY = -1
Solver.INCONSTANT = 0

Solver.cellValueMap = new Map()
Solver.cellValueMap.set(Solver.TEMP_FILLED, Solver.FILLED)
Solver.cellValueMap.set(Solver.TEMP_EMPTY, Solver.EMPTY)
Solver.cellValueMap.set(Solver.INCONSTANT, Solver.UNSET)
