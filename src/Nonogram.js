import $ from './colors'

export default class Nonogram {
  constructor() {
    this.theme = {
      filledColor: $.grey,
      unsetColor: $.greyVeryLight,
      correctColor: $.green,
      wrongColor: $.red,
      meshColor: $.yellow,
      isMeshed: false,
      isBoldMeshOnly: false,
      isMeshOnTop: false,
      boldMeshGap: 5,
    }
  }

  initCanvas(canvas) {
    this.canvas = canvas instanceof HTMLCanvasElement ? canvas : document.getElementById(canvas)
    if (!(this.canvas instanceof HTMLCanvasElement)) {
      this.canvas = document.createElement('canvas')
    }

    this.canvas.width = this.theme.width || this.canvas.clientWidth
    this.canvas.height = this.canvas.width * (this.m + 1) / (this.n + 1)

    if (this.canvas.nonogram) {
      this.canvas.nonogram.listeners.forEach(([type, listener]) => {
        this.canvas.removeEventListener(type, listener)
      })
    }

    this.canvas.nonogram = this
    this.initListeners()
    this.listeners.forEach(([type, listener]) => {
      this.canvas.addEventListener(type, listener)
    })
    this.canvas.oncontextmenu = (e) => { e.preventDefault() }
  }
  initListeners() {
    this.listeners = []
  }
  removeNonPositiveHints() {
    function removeNonPositiveElement(array, j, self) {
      self[j] = array.filter(v => v > 0)
    }
    this.hints.row.forEach(removeNonPositiveElement)
    this.hints.column.forEach(removeNonPositiveElement)
  }
  getSingleLine(direction, i) {
    const g = []
    if (direction === 'row') {
      for (let j = 0; j < this.n; j += 1) {
        g[j] = this.grid[i][j]
      }
    } else if (direction === 'column') {
      for (let j = 0; j < this.m; j += 1) {
        g[j] = this.grid[j][i]
      }
    }
    return g
  }
  calculateHints(direction, i) {
    const hints = []
    const line = this.getSingleLine(direction, i)
    line.reduce((lastIsFilled, cell) => {
      if (cell === Nonogram.FILLED) {
        hints.push(lastIsFilled ? hints.pop() + 1 : 1)
      }
      return cell === Nonogram.FILLED
    }, false)
    return hints
  }
  isLineCorrect(direction, i) {
    return this.calculateHints(direction, i).toString() === this.hints[direction][i].toString()
  }

  getLocation(x, y) {
    const rect = this.canvas.getBoundingClientRect()
    const w = rect.width
    const h = rect.height
    const w23 = w * 2 / 3
    const h23 = h * 2 / 3
    const d = w23 / (this.n + 1)

    if (x < 0 || x >= w || y < 0 || y >= h) {
      return 'outside'
    }
    if (x >= 0 && x <= w23 && y >= 0 && y < h23) {
      if (d / 2 <= x && x < w23 - d / 2 && d / 2 <= y && y < h23 - d / 2) {
        return 'grid'
      }
      return 'limbo'
    }
    if (w23 <= x && x < w && h23 <= y && y < h) {
      return 'controller'
    }
    return 'hints'
  }

  print() {
    this.printGrid()
    this.printHints()
    if (this.printController) {
      this.printController()
    }
  }
  printGrid() {
    const ctx = this.canvas.getContext('2d')
    const w = this.canvas.width
    const h = this.canvas.height
    const d = w * 2 / 3 / (this.n + 1)

    ctx.clearRect(-1, -1, w * 2 / 3 + 1, h * 2 / 3 + 1)
    if (this.theme.isMeshed && !this.theme.isMeshOnTop) {
      this.printMesh()
    }
    ctx.save()
    ctx.translate(d / 2, d / 2)
    for (let i = 0; i < this.m; i += 1) {
      for (let j = 0; j < this.n; j += 1) {
        ctx.save()
        ctx.translate(d * j, d * i)
        this.printCell(this.grid[i][j])
        ctx.restore()
      }
    }
    ctx.restore()
    if (this.theme.isMeshed && this.theme.isMeshOnTop) {
      this.printMesh()
    }
  }
  printCell(status) {
    const ctx = this.canvas.getContext('2d')
    const d = this.canvas.width * 2 / 3 / (this.n + 1)
    switch (status) {
      case Nonogram.UNSET:
        ctx.fillStyle = this.theme.unsetColor
        ctx.fillRect(d * 0.05, d * 0.05, d * 0.9, d * 0.9)
        break
      case Nonogram.FILLED:
        ctx.fillStyle = this.theme.filledColor
        ctx.fillRect(-d * 0.05, -d * 0.05, d * 1.1, d * 1.1)
        break
      default:
        return
    }
  }
  printMesh() {
    const ctx = this.canvas.getContext('2d')
    const d = this.canvas.width * 2 / 3 / (this.n + 1)

    ctx.save()
    ctx.translate(d / 2, d / 2)
    ctx.beginPath()
    for (let i = 1; i < this.m; i += 1) {
      if (!this.theme.isBoldMeshOnly) {
        ctx.moveTo(0, i * d)
        ctx.lineTo(this.n * d, i * d)
      }
      if (i % this.theme.boldMeshGap === 0) {
        ctx.moveTo(0, i * d)
        ctx.lineTo(this.n * d, i * d)
        if (!this.theme.isBoldMeshOnly) {
          ctx.moveTo(0, i * d - 1)
          ctx.lineTo(this.n * d, i * d - 1)
          ctx.moveTo(0, i * d + 1)
          ctx.lineTo(this.n * d, i * d + 1)
        }
      }
    }
    for (let j = 1; j < this.n; j += 1) {
      if (!this.theme.isBoldMeshOnly) {
        ctx.moveTo(j * d, 0)
        ctx.lineTo(j * d, this.m * d)
      }
      if (j % this.theme.boldMeshGap === 0) {
        ctx.moveTo(j * d, 0)
        ctx.lineTo(j * d, this.m * d)
        if (!this.theme.isBoldMeshOnly) {
          ctx.moveTo(j * d - 1, 0)
          ctx.lineTo(j * d - 1, this.m * d)
          ctx.moveTo(j * d + 1, 0)
          ctx.lineTo(j * d + 1, this.m * d)
        }
      }
    }
    ctx.lineWidth = 1
    ctx.strokeStyle = this.theme.meshColor
    ctx.stroke()
    ctx.restore()
  }
  printHints() {
    const ctx = this.canvas.getContext('2d')
    const w = this.canvas.width
    const h = this.canvas.height
    const d = w * 2 / 3 / (this.n + 1)

    ctx.clearRect(w * 2 / 3 - 1, -1, w * 3 + 1, h * 2 / 3 + 1)
    ctx.clearRect(-1, h * 2 / 3 - 1, w * 2 / 3 + 1, h / 3 + 1)
    ctx.save()
    ctx.translate(d / 2, d / 2)
    for (let i = 0; i < this.m; i += 1) {
      for (let j = 0; j < this.hints.row[i].length; j += 1) {
        this.printSingleHint('row', i, j)
      }
      if (this.hints.row[i].length === 0) {
        this.printSingleHint('row', i, 0)
      }
    }
    for (let j = 0; j < this.n; j += 1) {
      for (let i = 0; i < this.hints.column[j].length; i += 1) {
        this.printSingleHint('column', j, i)
      }
      if (this.hints.column[j].length === 0) {
        this.printSingleHint('column', j, 0)
      }
    }
    ctx.restore()
  }
  printSingleHint(direction, i, j) {
    const ctx = this.canvas.getContext('2d')
    const w = this.canvas.width
    const h = this.canvas.height
    const d = w * 2 / 3 / (this.n + 1)

    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.font = `${d}pt "Courier New", Inconsolata, Consolas, monospace`
    const line = this.hints[direction][i]
    ctx.fillStyle = line.isCorrect ? this.theme.correctColor : this.theme.wrongColor
    ctx.globalAlpha = (!line.isCorrect && line.unchanged) ? 0.5 : 1
    if (direction === 'row') {
      ctx.fillText(this.hints.row[i][j] || 0,
        w * 2 / 3 + d * j, d * (i + 0.5), d * 0.8)
    } else if (direction === 'column') {
      ctx.fillText(this.hints.column[i][j] || 0,
        d * (i + 0.5), h * 2 / 3 + d * j, d * 0.8)
    }
  }
}

Nonogram.FILLED = true
Nonogram.UNSET = undefined
Nonogram.EMPTY = false
