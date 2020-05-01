/// <reference path="../node_modules/typescript/lib/lib.es6.d.ts" />
/// <reference path="../node_modules/typescript/lib/lib.webworker.d.ts" />

const WorkerStatus = {
  EMPTY: 0,
  FILLED: 1,
  UNSET: 2,
  TEMP_FILLED: 3,
  TEMP_EMPTY: 4,
  INCONSTANT: 5,
}
type status = number

const cellValueMap = new Map<status, status>()
cellValueMap.set(WorkerStatus.TEMP_FILLED, WorkerStatus.FILLED)
cellValueMap.set(WorkerStatus.TEMP_EMPTY, WorkerStatus.EMPTY)
cellValueMap.set(WorkerStatus.INCONSTANT, WorkerStatus.UNSET)


function eekwall(arr1: any[], arr2: any[]) {
  return arr1.length === arr2.length &&
    arr1.every((e, i) => e === arr2[i])
}

class Solver {
  grid: status[][]
  hints: {
    row: LineOfHints[]
    column: LineOfHints[]
  }
  isError: Boolean
  scanner: Scanner
  currentHints: LineOfHints
  currentLine: status[]
  delay: number
  message: SolverMessage
  possibleBlanks: {
    row: number[][][]
    column: number[][][]
  }

  constructor(data: any) {
    this.hints = data.hints
    this.delay = data.delay
    this.grid = data.grid

    this.scanner = {
      direction: 'row',
      i: -1,
    }
    this.possibleBlanks = {
      row: [],
      column: [],
    }
    this.scan()
  }

  getSingleLine(direction: Direction, i: number): status[] {
    const g: number[] = []
    const m = this.grid.length
    const n = this.grid.length && this.grid[0].length
    if (direction === 'row') {
      for (let j = 0; j < n; j += 1) {
        g[j] = this.grid[i][j]
      }
    } else if (direction === 'column') {
      for (let j = 0; j < m; j += 1) {
        g[j] = this.grid[j][i]
      }
    }
    return g
  }
  calculateHints(direction: Direction, i: number) {
    const hints: number[] = []
    const line = this.getSingleLine(direction, i)
    line.reduce((lastIsFilled, cell) => {
      if (cell === WorkerStatus.FILLED) {
        hints.push(lastIsFilled ? <number>hints.pop() + 1 : 1)
      } else if (cell !== WorkerStatus.EMPTY) {
        throw new Error
      }
      return cell === WorkerStatus.FILLED
    }, false)
    return hints
  }
  isLineCorrect(direction: Direction, i: number) {
    try {
      return eekwall(this.calculateHints(direction, i), this.hints[direction][i])
    } catch (e) {
      return false
    }
  }

  scan = () => {
    if (!this.updateScanner()) return

    if (this.delay) {
      this.message = {
        type: 'update',
        grid: this.grid,
        scanner: this.scanner,
        hints: this.hints,
      }
      postMessage(this.message)
    }
    this.isError = true

    const { direction, i } = this.scanner
    this.currentHints = this.hints[direction][i]
    this.currentHints.unchanged = true

    this.currentLine = this.getSingleLine(direction, i)
    const finished = this.currentLine.every(cell => cell !== WorkerStatus.UNSET)
    if (!finished) {
      this.solveSingleLine()
      this.setBackToGrid(this.currentLine)
    }

    if (this.isLineCorrect(direction, i)) {
      this.hints[direction][i].isCorrect = true
      this.isError = false
    }

    if (this.isError) {
      this.message = {
        type: 'error',
        grid: this.grid,
        scanner: this.scanner,
        hints: this.hints,
      }
      postMessage(this.message)
      return
    }
    if (this.delay) {
      setTimeout(this.scan, this.delay)
    } else {
      this.scan()
    }
  }
  updateScanner() {
    let line
    do {
      this.isError = false
      this.scanner.i += 1
      if (this.hints[this.scanner.direction][this.scanner.i] === undefined) {
        this.scanner.direction = (this.scanner.direction === 'row') ? 'column' : 'row'
        this.scanner.i = 0
      }
      line = this.hints[this.scanner.direction][this.scanner.i]

      if (this.hints.row.every(row => !!row.unchanged) &&
        this.hints.column.every(col => !!col.unchanged)) {
        this.message = {
          type: 'finish',
          grid: this.grid,
          hints: this.hints,
        }
        postMessage(this.message)
        return false
      }
    }
    while (line.isCorrect || line.unchanged)

    return true
  }
  setBackToGrid(line: status[]) {
    const { direction, i } = this.scanner
    if (direction === 'row') {
      line.forEach((cell, j) => {
        if (cellValueMap.has(cell)) {
          if (this.grid[i][j] !== cellValueMap.get(cell)) {
            this.grid[i][j] = <status>cellValueMap.get(cell)
            this.hints.column[j].unchanged = false
          }
        }
      })
    } else if (direction === 'column') {
      line.forEach((cell, j) => {
        if (cellValueMap.has(cell)) {
          if (this.grid[j][i] !== cellValueMap.get(cell)) {
            this.grid[j][i] = <status>cellValueMap.get(cell)
            this.hints.row[j].unchanged = false
          }
        }
      })
    }
  }

  solveSingleLine() {
    this.isError = true
    const { direction, i } = this.scanner
    if (this.possibleBlanks[direction][i] === undefined) {
      this.possibleBlanks[direction][i] = []
      this.findAll(this.currentLine.length)
    }
    this.merge()
  }
  // This method finds all possible starting positions of empty series of cells, for a given line & hints
  findAll(max: number, array: number[] = [], index = 0) {
    if (index === this.currentHints.length) {
      // Those "blanks" array match the "currentHints" array.
      // They indicate the shift (blanks count) from the last series of filled cells (or start of line)
      // before starting the corresponding series of filled cells from "currentHints".
      const blanks = array.slice(0, this.currentHints.length) // makes a copy, because "array" will continue to be modified during findAll recursion
      const { direction, i } = this.scanner
      this.possibleBlanks[direction][i].push(blanks)
    }
     // Min gap between filled cells is 1, so we start at 1,
     // except for first series of the line where we start at the grid border
    for (let i = index ? 1 : 0; i <= max; i += 1) {
      array[index] = i;
      const newMax = max - i - this.currentHints[index];
      if (newMax >= 0) {
        this.findAll(newMax, array, index + 1);
      }
    }
  }
  merge() {
    const { direction, i } = this.scanner
    const possibleBlanks = this.possibleBlanks[direction][i]
    possibleBlanks.forEach((blanks, p) => {
      const line: status[] = []
      for (let i = 0; i < this.currentHints.length; i += 1) {
        line.push(...new Array(blanks[i]).fill(WorkerStatus.TEMP_EMPTY))
        line.push(...new Array(this.currentHints[i]).fill(WorkerStatus.TEMP_FILLED))
      }
      line.push(...new Array(this.currentLine.length - line.length).fill(WorkerStatus.TEMP_EMPTY))

      const improper = line.some((cell, i) =>
        (cell === WorkerStatus.TEMP_EMPTY && this.currentLine[i] === WorkerStatus.FILLED) ||
        (cell === WorkerStatus.TEMP_FILLED && this.currentLine[i] === WorkerStatus.EMPTY)
      )
      if (improper) {
        delete possibleBlanks[p]
        return
      }

      this.isError = false
      line.forEach((cell, i) => {
        if (cell === WorkerStatus.TEMP_FILLED) {
          if (this.currentLine[i] === WorkerStatus.TEMP_EMPTY) {
            this.currentLine[i] = WorkerStatus.INCONSTANT
          } else if (this.currentLine[i] === WorkerStatus.UNSET) {
            this.currentLine[i] = WorkerStatus.TEMP_FILLED
          }
        } else if (cell === WorkerStatus.TEMP_EMPTY) {
          if (this.currentLine[i] === WorkerStatus.TEMP_FILLED) {
            this.currentLine[i] = WorkerStatus.INCONSTANT
          } else if (this.currentLine[i] === WorkerStatus.UNSET) {
            this.currentLine[i] = WorkerStatus.TEMP_EMPTY
          }
        }
      })
    })
    this.possibleBlanks[direction][i] = possibleBlanks.filter(e => e)
  }
}

onmessage = ({ data }) => {
  new Solver(data)
}
