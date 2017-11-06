import Nonogram from './Nonogram'
import $ from './colors'
import Status from './status'

import SolverWorker from 'worker!./worker.ts'

export default class Solver extends Nonogram {
  worker: Worker = new SolverWorker()

  delay: number
  handleSuccess: (time: number) => void
  handleError: (e: Error) => void
  isBusy: boolean
  isError: boolean
  scanner?: {
    direction: Direction
    i: number
  }
  startTime: number

  constructor(
    row: number[][],
    column: number[][],
    canvas: string | HTMLCanvasElement,
    {
      theme = {},
      delay = 50,
      onSuccess = () => { },
      onError = () => { },
    } = {},
  ) {
    super()
    this.theme.filledColor = $.green
    this.theme.correctColor = $.green
    this.theme.wrongColor = $.yellow
    Object.assign(this.theme, theme)

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
      this.grid[i] = new Array(this.n).fill(Status.UNSET)
    }

    this.initCanvas(canvas)
    this.print()
  }

  initListeners() {
    this.listeners = [
      ['click', this.click],
    ]
  }
  click = (e: MouseEvent) => {
    if (this.isBusy) return

    const rect = this.canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const d = rect.width * 2 / 3 / (this.n + 1)
    const location = this.getLocation(x, y)
    if (location === 'grid') {
      if (this.isError) return

      const i = Math.floor(y / d - 0.5)
      const j = Math.floor(x / d - 0.5)
      if (this.grid[i][j] === Status.UNSET) {
        this.grid[i][j] = Status.FILLED
        this.hints.row[i].unchanged = false
        this.hints.column[j].unchanged = false
        this.solve()
      }
    } else if (location === 'controller') {
      this.refresh()
    }
  }
  private refresh() {
    this.grid = new Array(this.m)
    for (let i = 0; i < this.m; i += 1) {
      this.grid[i] = new Array(this.n).fill(Status.UNSET)
    }
    this.hints.row.forEach((r) => {
      r.isCorrect = false
      r.unchanged = false
    })
    this.hints.column.forEach((c) => {
      c.isCorrect = false
      c.unchanged = false
    })
    this.solve()
  }
  solve() {
    if (this.isBusy) return

    this.print()
    this.isBusy = true
    this.startTime = Date.now()
    this.worker.onmessage = ({ data }: {data: SolverMessage}) => {
      if (this.canvas.nonogram !== this) {
        this.worker.terminate()
        return
      }

      this.scanner = data.scanner
      this.grid = data.grid
      this.hints = data.hints
      if (data.type !== 'update') {
        this.isBusy = false
        if (data.type === 'error') {
          this.isError = true
          const { direction, i } = <Scanner>this.scanner
          this.handleError(new Error(
            `Bad hints at ${direction} ${i + 1}`
          ))
        } else if (data.type === 'finish') {
          this.isError = false
          this.handleSuccess(Date.now() - this.startTime)
        }
      }
      this.print()
    }
    this.worker.postMessage({
      delay: this.delay,
      grid: this.grid,
      hints: this.hints,
    })
  }

  print() {
    this.printGrid()
    this.printHints()
    this.printScanner()
    this.printController()
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
    if (this.isBusy) return

    ctx.save()
    ctx.translate(w * 0.7, h * 0.7)
    ctx.drawImage(getCycle(), 0, 0)
    ctx.restore()
  }
  printScanner() {
    if (!this.scanner) return

    const { ctx } = this
    const { width: w, height: h } = this.canvas
    const d = w * 2 / 3 / (this.n + 1)

    ctx.save()
    ctx.translate(d / 2, d / 2)
    ctx.fillStyle = this.isError ? this.theme.wrongColor : this.theme.correctColor
    ctx.globalAlpha = 0.5
    if (this.scanner.direction === 'row') {
      ctx.fillRect(0, d * this.scanner.i, w, d)
    } else if (this.scanner.direction === 'column') {
      ctx.fillRect(d * this.scanner.i, 0, d, h)
    }
    ctx.restore()
  }
}
