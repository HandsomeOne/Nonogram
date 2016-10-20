import Nonogram from './Nonogram'
import {
  FILLED,
  EMPTY,
  UNSET,
} from './type'
import $ from './colors'

const eekwall = (object1, object2) => object1.toString() === object2.toString()

export default class Game extends Nonogram {
  constructor(rowHints, colHints, canvas, config) {
    super()
    Object.assign(this, config)

    this.rowHints = rowHints.slice()
    this.colHints = colHints.slice()
    this.removeNonPositiveHints()
    this.m = rowHints.length
    this.n = colHints.length
    this.grid = new Array(this.m)
    for (let i = 0; i < this.m; i += 1) {
      this.grid[i] = new Array(this.n).fill(UNSET)
    }
    this.rowHints.forEach((row, i) => { row.isCorrect = this.checkCorrectness('row', i) })
    this.colHints.forEach((col, j) => { col.isCorrect = this.checkCorrectness('col', j) })
    this.canvas = canvas instanceof HTMLCanvasElement ? canvas : document.getElementById(canvas)
    if (!this.canvas || this.canvas.hasAttribute('occupied')) {
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

    this.brush = FILLED
    this.draw = {}
    this.print()
  }

  static get success() { return new Event('success') }
  static get animationFinish() { return new Event('animationfinish') }
  mousedown(e) {
    const self = this.nonogram
    const x = e.clientX - this.getBoundingClientRect().left
    const y = e.clientY - this.getBoundingClientRect().top
    const d = this.clientWidth * 2 / 3 / (self.n + 1)
    const location = self.getLocation(x, y)
    if (location === 'controller') {
      self.switchBrush()
    } else if (location === 'grid') {
      self.draw.firstI = Math.floor(y / d - 0.5)
      self.draw.firstJ = Math.floor(x / d - 0.5)
      self.draw.inverted = e.button === 2
      const cell = self.grid[self.draw.firstI][self.draw.firstJ]
      let brush = self.brush
      if (self.draw.inverted) {
        brush = self.brush === FILLED ? EMPTY : FILLED
      }
      if (cell === UNSET || brush === cell) {
        self.draw.mode = (brush === cell) ? 'empty' : 'filling'
        self.isPressed = true
        self.switchCell(self.draw.firstI, self.draw.firstJ)
      }
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
  switchBrush() {
    this.brush = (this.brush === EMPTY) ? FILLED : EMPTY
    this.printController()
  }
  brushUp() {
    const self = this.nonogram
    delete self.isPressed
    self.draw = {}
  }
  switchCell(i, j) {
    let brush = this.brush
    if (this.draw.inverted) {
      brush = this.brush === FILLED ? EMPTY : FILLED
    }
    if (brush === FILLED && this.grid[i][j] !== EMPTY) {
      this.grid[i][j] = (this.draw.mode === 'filling') ? FILLED : UNSET
      this.rowHints[i].isCorrect = eekwall(this.calculateHints('row', i), this.rowHints[i])
      this.colHints[j].isCorrect = eekwall(this.calculateHints('col', j), this.colHints[j])
      this.print()
      const correct = this.rowHints.every(singleRow => singleRow.isCorrect) &&
        this.colHints.every(singleCol => singleCol.isCorrect)
      if (correct) {
        this.succeed()
      }
    } else if (brush === EMPTY && this.grid[i][j] !== FILLED) {
      this.grid[i][j] = (this.draw.mode === 'filling') ? EMPTY : UNSET
      this.print()
    }
  }

  printCell(status) {
    const ctx = this.canvas.getContext('2d')
    const d = this.canvas.width * 2 / 3 / (this.n + 1)
    switch (status) {
      case FILLED:
        ctx.fillStyle = this.filledColor
        ctx.fillRect(-d * 0.05, -d * 0.05, d * 1.1, d * 1.1)
        break
      case EMPTY:
        ctx.strokeStyle = this.emptyColor
        ctx.lineWidth = d / 15
        ctx.beginPath()
        ctx.moveTo(d * 0.3, d * 0.3)
        ctx.lineTo(d * 0.7, d * 0.7)
        ctx.moveTo(d * 0.3, d * 0.7)
        ctx.lineTo(d * 0.7, d * 0.3)
        ctx.stroke()
        break
      default:
        return
    }
  }
  printController() {
    const ctx = this.canvas.getContext('2d')
    const w = this.canvas.width
    const h = this.canvas.height
    const controllerSize = Math.min(w, h) / 4
    const outerSize = controllerSize * 3 / 4
    const offset = controllerSize / 4
    const borderWidth = controllerSize / 20
    const innerSize = outerSize - 2 * borderWidth

    function printFillingBrush() {
      ctx.save()
      ctx.translate(offset, 0)
      ctx.fillStyle = this.meshColor
      ctx.fillRect(0, 0, outerSize, outerSize)
      ctx.fillStyle = this.filledColor
      ctx.fillRect(borderWidth, borderWidth, innerSize, innerSize)
      ctx.restore()
    }

    function printEmptyBrush() {
      ctx.save()
      ctx.translate(0, offset)
      ctx.fillStyle = this.meshColor
      ctx.fillRect(0, 0, outerSize, outerSize)
      ctx.clearRect(borderWidth, borderWidth, innerSize, innerSize)
      ctx.strokeStyle = $.red
      ctx.lineWidth = borderWidth
      ctx.beginPath()
      ctx.moveTo(outerSize * 0.3, outerSize * 0.3)
      ctx.lineTo(outerSize * 0.7, outerSize * 0.7)
      ctx.moveTo(outerSize * 0.3, outerSize * 0.7)
      ctx.lineTo(outerSize * 0.7, outerSize * 0.3)
      ctx.stroke()
      ctx.restore()
    }

    ctx.clearRect(w * 2 / 3 - 1, h * 2 / 3 - 1, w / 3 + 1, h / 3 + 1)
    ctx.save()
    ctx.translate(w * 0.7, h * 0.7)
    if (this.brush === FILLED) {
      printEmptyBrush.call(this)
      printFillingBrush.call(this)
    } else if (this.brush === EMPTY) {
      printFillingBrush.call(this)
      printEmptyBrush.call(this)
    }
    ctx.restore()
  }

  succeed() {
    if (!this.canvas) {
      return
    }

    this.canvas.dispatchEvent(Game.success)
    this.canvas.removeEventListener('mousedown', this.mousedown)
    this.canvas.removeEventListener('mousemove', this.mousemove)
    this.canvas.removeEventListener('mouseup', this.brushUp)
    this.canvas.removeEventListener('mouseleave', this.brushUp)

    const ctx = this.canvas.getContext('2d')
    const w = this.canvas.width
    const h = this.canvas.height
    const controllerSize = Math.min(w, h) / 4
    const background = ctx.getImageData(0, 0, w, h)

    function getTick() {
      const size = controllerSize * 2
      const borderWidth = size / 10
      const tick = document.createElement('canvas')
      tick.width = size
      tick.height = size

      const c = tick.getContext('2d')
      c.translate(size / 3, size * 5 / 6)
      c.rotate(-Math.PI / 4)
      c.fillStyle = $.green
      c.fillRect(0, 0, borderWidth, -size * Math.SQRT2 / 3)
      c.fillRect(0, 0, size * Math.SQRT2 * 2 / 3, -borderWidth)

      return tick
    }

    const tick = getTick()
    let t = 0

    function f(_) {
      return 1 + Math.pow(_ - 1, 3)
    }

    function fadeTickIn() {
      ctx.putImageData(background, 0, 0)
      t += 0.03
      ctx.globalAlpha = f(t)
      ctx.fillStyle = 'white'
      ctx.fillRect(w * 2 / 3, h * 2 / 3, w / 3, h / 3)
      ctx.drawImage(tick,
        w * 0.7 - (1 - f(t)) * controllerSize / 2,
        h * 0.7 - (1 - f(t)) * controllerSize / 2,
        (2 - f(t)) * controllerSize,
        (2 - f(t)) * controllerSize)
      if (t <= 1) {
        requestAnimationFrame(fadeTickIn.bind(this))
      } else {
        this.canvas.dispatchEvent(Game.animationFinish)
      }
    }

    fadeTickIn.call(this)
  }
}
Object.assign(Game.prototype, {
  filledColor: $.blue,
  emptyColor: $.red,
  wrongColor: $.grey,
  isMeshed: true,
})
