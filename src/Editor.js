import Nonogram from './Nonogram'
import {
  FILLED,
  EMPTY,
} from './type'
import $ from './colors'

export default class Editor extends Nonogram {
  constructor(m, n, canvas, config) {
    super()
    Object.assign(this, config)

    this.m = m
    this.n = n
    if (!this.grid) {
      this.grid = new Array(this.m)
      for (let i = 0; i < this.m; i += 1) {
        this.grid[i] = new Array(this.n)
        for (let j = 0; j < this.n; j += 1) {
          this.grid[i][j] = (Math.random() < this.threshold) ? FILLED : EMPTY
        }
      }
    } else {
      this.grid.forEach((a) => {
        a.forEach((e, i, arr) => {
          arr[i] = e ? FILLED : EMPTY
        })
      })
    }
    this.rowHints = new Array(m)
    this.colHints = new Array(n)
    for (let i = 0; i < this.m; i += 1) {
      this.rowHints[i] = this.calculateHints('row', i)
      this.rowHints[i].isCorrect = true
    }
    for (let j = 0; j < this.n; j += 1) {
      this.colHints[j] = this.calculateHints('col', j)
      this.colHints[j].isCorrect = true
    }
    this.canvas = canvas instanceof HTMLCanvasElement ? canvas : document.getElementById(canvas)
    if (!this.canvas || this.canvas.dataset.isBusy) {
      return
    }

    this.canvas.width = this.width || this.canvas.clientWidth
    this.canvas.height = this.canvas.width * (this.m + 1) / (this.n + 1)
    this.canvas.nonogram = this
    this.canvas.addEventListener('mousedown', this.mousedown)
    this.canvas.addEventListener('mousemove', this.mousemove)
    this.canvas.addEventListener('mouseup', this.brushUp)
    this.canvas.addEventListener('mouseleave', this.brushUp)
    this.canvas.oncontextmenu = (e) => {
      e.preventDefault()
    }

    this.draw = {}
    this.print()
    this.canvas.dispatchEvent(Editor.hintChange)
  }

  static get hintChange() { return new Event('hintchange') }
  mousedown(e) {
    const self = this.nonogram
    const x = e.clientX - this.getBoundingClientRect().left
    const y = e.clientY - this.getBoundingClientRect().top
    const d = this.clientWidth * 2 / 3 / (self.n + 1)
    const location = self.getLocation(x, y)
    if (location === 'controller') {
      self.refresh()
    } else if (location === 'grid') {
      self.draw.firstI = Math.floor(y / d - 0.5)
      self.draw.firstJ = Math.floor(x / d - 0.5)
      const cell = self.grid[self.draw.firstI][self.draw.firstJ]
      self.draw.brush = (cell === FILLED) ? EMPTY : FILLED
      self.isPressed = true
      self.switchCell(self.draw.firstI, self.draw.firstJ)
      self.draw.lastI = self.draw.firstI
      self.draw.lastJ = self.draw.firstJ
    }
  }
  mousemove(e) {
    const self = this.nonogram
    if (self.isPressed) {
      const x = e.clientX - this.getBoundingClientRect().left
      const y = e.clientY - this.getBoundingClientRect().top
      const d = this.clientWidth * 2 / 3 / (self.n + 1)
      if (self.getLocation(x, y) === 'grid') {
        const i = Math.floor(y / d - 0.5)
        const j = Math.floor(x / d - 0.5)
        if (i !== self.draw.lastI || j !== self.draw.lastJ) {
          if (self.draw.direction === undefined) {
            if (i === self.draw.firstI) {
              self.draw.direction = 'row'
            } else if (j === self.draw.firstJ) {
              self.draw.direction = 'col'
            }
          }
          if ((self.draw.direction === 'row' && i === self.draw.firstI) ||
            (self.draw.direction === 'col' && j === self.draw.firstJ)) {
            self.switchCell(i, j)
            self.draw.lastI = i
            self.draw.lastJ = j
          }
        }
      }
    }
  }
  brushUp() {
    const self = this.nonogram
    delete self.isPressed
    self.draw = {}
  }
  switchCell(i, j) {
    this.grid[i][j] = this.draw.brush
    this.rowHints[i] = this.calculateHints('row', i)
    this.rowHints[i].isCorrect = true
    this.colHints[j] = this.calculateHints('col', j)
    this.colHints[j].isCorrect = true
    this.print()
    this.canvas.dispatchEvent(Editor.hintChange)
  }
  refresh() {
    for (let i = 0; i < this.m; i += 1) {
      for (let j = 0; j < this.n; j += 1) {
        this.grid[i][j] = (Math.random() < this.threshold) ? FILLED : EMPTY
      }
    }
    for (let i = 0; i < this.m; i += 1) {
      this.rowHints[i] = this.calculateHints('row', i)
      this.rowHints[i].isCorrect = true
    }
    for (let j = 0; j < this.n; j += 1) {
      this.colHints[j] = this.calculateHints('col', j)
      this.colHints[j].isCorrect = true
    }
    this.print()
    this.canvas.dispatchEvent(Editor.hintChange)
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
Object.assign(Editor.prototype, {
  filledColor: $.violet,
  correctColor: $.violet,
  threshold: 0.5,
})
