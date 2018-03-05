import Nonogram from './Nonogram'
import $ from './colors'
import Status from './status'

export default class Editor extends Nonogram {
  threshold: number
  handleHintChange: (row: LineOfHints[], column: LineOfHints[]) => void
  draw: {
    firstI?: number
    firstJ?: number
    lastI?: number
    lastJ?: number
    inverted?: boolean
    mode?: 'empty' | 'filling'
    direction?: Direction
    brush?: Status
  }
  isPressed: boolean

  constructor(
    m: number,
    n: number,
    canvas: string | HTMLCanvasElement,
    {
      theme = {},
      grid = [],
      threshold = 0.5,
      onHintChange = () => { },
    } = {},
  ) {
    super()
    this.theme.filledColor = $.violet
    this.theme.correctColor = $.violet
    Object.assign(this.theme, theme)

    this.threshold = threshold
    this.handleHintChange = onHintChange

    this.m = m
    this.n = n
    this.grid = new Array(this.m)
    for (let i = 0; i < this.m; i += 1) {
      this.grid[i] = new Array(this.n)
      for (let j = 0; j < this.n; j += 1) {
        if (grid.length) {
          this.grid[i][j] = (grid[i] && (<Status[][]>grid)[i][j]) ? Status.FILLED : Status.EMPTY
        } else {
          this.grid[i][j] = (Math.random() < this.threshold) ? Status.FILLED : Status.EMPTY
        }
      }
    }
    this.hints = {
      row: new Array(m),
      column: new Array(n),
    }
    for (let i = 0; i < this.m; i += 1) {
      this.hints.row[i] = this.calculateHints('row', i)
      this.hints.row[i].isCorrect = true
    }
    for (let j = 0; j < this.n; j += 1) {
      this.hints.column[j] = this.calculateHints('column', j)
      this.hints.column[j].isCorrect = true
    }

    this.initCanvas(canvas)

    this.draw = {}
    this.print()
    this.handleHintChange(this.hints.row, this.hints.column)
  }

  initListeners() {
    this.listeners = [
      ['mousedown', this.mousedown],
      ['mousemove', this.mousemove],
      ['mouseup', this.brushUp],
      ['mouseleave', this.brushUp],
    ]
  }
  mousedown = (e: MouseEvent) => {
    const rect = this.canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const d = rect.width * 2 / 3 / (this.n + 1)
    const location = this.getLocation(x, y)
    if (location === 'controller') {
      this.refresh()
    } else if (location === 'grid') {
      this.draw.firstI = Math.floor(y / d - 0.5)
      this.draw.firstJ = Math.floor(x / d - 0.5)
      const cell = this.grid[this.draw.firstI][this.draw.firstJ]
      this.draw.brush = (cell === Status.FILLED) ? Status.EMPTY : Status.FILLED
      this.isPressed = true
      this.paintCell(this.draw.firstI, this.draw.firstJ)
      this.draw.lastI = this.draw.firstI
      this.draw.lastJ = this.draw.firstJ
    }
  }
  mousemove = (e: MouseEvent) => {
    if (this.isPressed) {
      const rect = this.canvas.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      const d = rect.width * 2 / 3 / (this.n + 1)
      if (this.getLocation(x, y) === 'grid') {
        const i = Math.floor(y / d - 0.5)
        const j = Math.floor(x / d - 0.5)
        if (i !== this.draw.lastI || j !== this.draw.lastJ) {
          if (this.draw.direction === undefined) {
            if (i === this.draw.firstI) {
              this.draw.direction = 'row'
            } else if (j === this.draw.firstJ) {
              this.draw.direction = 'column'
            }
          }
          if ((this.draw.direction === 'row' && i === this.draw.firstI) ||
            (this.draw.direction === 'column' && j === this.draw.firstJ)) {
            this.paintCell(i, j)
            this.draw.lastI = i
            this.draw.lastJ = j
          }
        }
      }
    }
  }
  brushUp = () => {
    delete this.isPressed
    this.draw = {}
  }
  paintCell(i: number, j: number) {
    this.grid[i][j] = <Status>this.draw.brush
    this.hints.row[i] = this.calculateHints('row', i)
    this.hints.row[i].isCorrect = true
    this.hints.column[j] = this.calculateHints('column', j)
    this.hints.column[j].isCorrect = true
    this.print()
    this.handleHintChange(this.hints.row, this.hints.column)
  }
  refresh() {
    for (let i = 0; i < this.m; i += 1) {
      for (let j = 0; j < this.n; j += 1) {
        this.grid[i][j] = (Math.random() < this.threshold) ? Status.FILLED : Status.EMPTY
      }
    }
    for (let i = 0; i < this.m; i += 1) {
      this.hints.row[i] = this.calculateHints('row', i)
      this.hints.row[i].isCorrect = true
    }
    for (let j = 0; j < this.n; j += 1) {
      this.hints.column[j] = this.calculateHints('column', j)
      this.hints.column[j].isCorrect = true
    }
    this.print()
    this.handleHintChange(this.hints.row, this.hints.column)
  }
  printController() {
    const { ctx } = this
    const { width: w, height: h } = this.canvas
    const controllerSize = Math.min(w, h) / 4
    const filledColor = this.theme.filledColor

    function getCycle() {
      const cycle = document.createElement('canvas')
      const borderWidth = controllerSize / 10
      cycle.width = controllerSize
      cycle.height = controllerSize

      const c = cycle.getContext('2d') || new CanvasRenderingContext2D()
      c.translate(controllerSize / 2, controllerSize / 2)
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
    ctx.save()
    ctx.translate(w * 0.7, h * 0.7)
    ctx.drawImage(getCycle(), 0, 0)
    ctx.restore()
  }
}
