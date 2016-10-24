import $ from './colors'

export default class Nonogram {
  constructor() {
    this.filledColor = $.grey
    this.unsetColor = $.greyVeryLight
    this.correctColor = $.green
    this.wrongColor = $.red
    this.meshColor = $.yellow
    this.isMeshed = false
    this.isBoldMeshOnly = false
    this.isMeshOnTop = false
    this.boldMeshGap = 5
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
  removeNonPositiveHints() {
    function removeNonPositiveElement(array, j, self) {
      self[j] = array.filter(v => v > 0)
    }
    this.hints.row.forEach(removeNonPositiveElement)
    this.hints.column.forEach(removeNonPositiveElement)
  }
  getHints(direction, i) {
    return this.hints[direction][i].slice()
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
  checkCorrectness(direction, i) {
    return this.calculateHints(direction, i).toString() === this.hints[direction][i].toString()
  }

  getLocation(x, y) {
    const w = this.canvas.width
    const h = this.canvas.height
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
    if (this.canvas) {
      this.printGrid()
      this.printHints()
      this.printController()
    }
  }
  printGrid() {
    const ctx = this.canvas.getContext('2d')
    const w = this.canvas.width
    const h = this.canvas.height
    const d = w * 2 / 3 / (this.n + 1)

    ctx.clearRect(-1, -1, w * 2 / 3 + 1, h * 2 / 3 + 1)
    if (this.isMeshed && !this.isMeshOnTop) {
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
    if (this.isMeshed && this.isMeshOnTop) {
      this.printMesh()
    }
  }
  printCell(status) {
    const ctx = this.canvas.getContext('2d')
    const d = this.canvas.width * 2 / 3 / (this.n + 1)
    switch (status) {
      case Nonogram.UNSET:
        ctx.fillStyle = this.unsetColor
        ctx.fillRect(d * 0.05, d * 0.05, d * 0.9, d * 0.9)
        break
      case Nonogram.FILLED:
        ctx.fillStyle = this.filledColor
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
      if (!this.isBoldMeshOnly) {
        ctx.moveTo(0, i * d)
        ctx.lineTo(this.n * d, i * d)
      }
      if (i % this.boldMeshGap === 0) {
        ctx.moveTo(0, i * d)
        ctx.lineTo(this.n * d, i * d)
        if (!this.isBoldMeshOnly) {
          ctx.moveTo(0, i * d - 1)
          ctx.lineTo(this.n * d, i * d - 1)
          ctx.moveTo(0, i * d + 1)
          ctx.lineTo(this.n * d, i * d + 1)
        }
      }
    }
    for (let j = 1; j < this.n; j += 1) {
      if (!this.isBoldMeshOnly) {
        ctx.moveTo(j * d, 0)
        ctx.lineTo(j * d, this.m * d)
      }
      if (j % this.boldMeshGap === 0) {
        ctx.moveTo(j * d, 0)
        ctx.lineTo(j * d, this.m * d)
        if (!this.isBoldMeshOnly) {
          ctx.moveTo(j * d - 1, 0)
          ctx.lineTo(j * d - 1, this.m * d)
          ctx.moveTo(j * d + 1, 0)
          ctx.lineTo(j * d + 1, this.m * d)
        }
      }
    }
    ctx.lineWidth = 1
    ctx.strokeStyle = this.meshColor
    ctx.stroke()
    ctx.restore()
  }
  printHints() {
    const ctx = this.canvas.getContext('2d')
    const w = this.canvas.width
    const h = this.canvas.height
    const d = w * 2 / 3 / (this.n + 1)

    function printSingleHint(direction, i, j) {
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.font = `${d}pt "Courier New", Inconsolata, Consolas, monospace`
      const line = this.hints[direction][i]
      ctx.fillStyle = line.isCorrect ? this.correctColor : this.wrongColor
      ctx.globalAlpha = (!line.isCorrect && line.unchangedSinceLastScanned) ? 0.5 : 1
      if (direction === 'row') {
        ctx.fillText(this.hints.row[i][j] || 0,
          w * 2 / 3 + d * j, d * (i + 0.5), d * 0.8)
      } else if (direction === 'column') {
        ctx.fillText(this.hints.column[i][j] || 0,
          d * (i + 0.5), h * 2 / 3 + d * j, d * 0.8)
      }
    }

    ctx.clearRect(w * 2 / 3 - 1, -1, w * 3 + 1, h * 2 / 3 + 1)
    ctx.clearRect(-1, h * 2 / 3 - 1, w * 2 / 3 + 1, h / 3 + 1)
    ctx.save()
    ctx.translate(d / 2, d / 2)
    for (let i = 0; i < this.m; i += 1) {
      for (let j = 0; j < this.hints.row[i].length; j += 1) {
        printSingleHint.call(this, 'row', i, j)
      }
      if (this.hints.row[i].length === 0) {
        printSingleHint.call(this, 'row', i, 0)
      }
    }
    for (let j = 0; j < this.n; j += 1) {
      for (let i = 0; i < this.hints.column[j].length; i += 1) {
        printSingleHint.call(this, 'column', j, i)
      }
      if (this.hints.column[j].length === 0) {
        printSingleHint.call(this, 'column', j, 0)
      }
    }
    ctx.restore()
  }
}

Nonogram.FILLED = true
Nonogram.UNSET = undefined
Nonogram.EMPTY = false
