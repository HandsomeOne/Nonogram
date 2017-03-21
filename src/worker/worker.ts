interface SolverLineOfHints extends LineOfHints {
  possibleBlanks?: number[][]
}

const sum = (array: number[]) => array.reduce((a, b) => a + b, 0)

const cellValueMap = new Map<Status, Status>()
cellValueMap.set(Status.TEMP_FILLED, Status.FILLED)
cellValueMap.set(Status.TEMP_EMPTY, Status.EMPTY)
cellValueMap.set(Status.INCONSTANT, Status.UNSET)


function eekwall(arr1: any[], arr2: any[]) {
  return arr1.length === arr2.length &&
    arr1.every((e, i) => e === arr2[i])
}

class Solver {
  grid: Status[][]
  hints: {
    row: SolverLineOfHints[]
    column: SolverLineOfHints[]
  }
  isError: Boolean
  scanner: Scanner
  currentHints: SolverLineOfHints
  currentLine: Status[]
  demoMode: boolean
  delay: number
  message: SolverMessage

  constructor(data: any) {
    this.hints = data.hints
    this.demoMode = data.demoMode
    this.delay = data.delay
    this.grid = data.grid

    this.scanner = {
      direction: 'row',
      i: -1,
    }
    this.scan()
  }

  getSingleLine(direction: Direction, i: number): Status[] {
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
      if (cell === Status.FILLED) {
        hints.push(lastIsFilled ? <number>hints.pop() + 1 : 1)
      } else if (cell !== Status.EMPTY) {
        throw new Error
      }
      return cell === Status.FILLED
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

    if (this.demoMode) {
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
    const finished = this.currentLine.every(cell => cell !== Status.UNSET)
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
    if (this.demoMode) {
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
  setBackToGrid(line: Status[]) {
    const { direction, i } = this.scanner
    if (direction === 'row') {
      line.forEach((cell, j) => {
        if (cellValueMap.has(cell)) {
          if (this.grid[i][j] !== cellValueMap.get(cell)) {
            this.grid[i][j] = <Status>cellValueMap.get(cell)
            this.hints.column[j].unchanged = false
          }
        }
      })
    } else if (direction === 'column') {
      line.forEach((cell, j) => {
        if (cellValueMap.has(cell)) {
          if (this.grid[j][i] !== cellValueMap.get(cell)) {
            this.grid[j][i] = <Status>cellValueMap.get(cell)
            this.hints.row[j].unchanged = false
          }
        }
      })
    }
  }

  solveSingleLine() {
    this.isError = true
    if (this.currentHints.possibleBlanks === undefined) {
      this.currentHints.possibleBlanks = []
      this.findAll(this.currentLine.length - sum(this.currentHints) + 1)
    }
    this.merge()
  }
  findAll(max: number, array: number[] = [], index = 0) {
    if (index === this.currentHints.length) {
      const blanks = array.slice(0, this.currentHints.length)
      blanks[0] -= 1
      if (this.currentHints.possibleBlanks) {
        this.currentHints.possibleBlanks.push(blanks)
      }
    }

    for (let i = 1; i <= max; i += 1) {
      array[index] = i
      this.findAll(max - array[index], array, index + 1)
    }
  }
  merge() {
    const possibleBlanks = this.currentHints.possibleBlanks || []
    possibleBlanks.forEach((blanks, p) => {
      const line: Status[] = []
      for (let i = 0; i < this.currentHints.length; i += 1) {
        line.push(...new Array(blanks[i]).fill(Status.TEMP_EMPTY))
        line.push(...new Array(this.currentHints[i]).fill(Status.TEMP_FILLED))
      }
      line.push(...new Array(this.currentLine.length - line.length).fill(Status.TEMP_EMPTY))

      const improper = line.some((cell, i) =>
        (cell === Status.TEMP_EMPTY && this.currentLine[i] === Status.FILLED) ||
        (cell === Status.TEMP_FILLED && this.currentLine[i] === Status.EMPTY)
      )
      if (improper) {
        delete possibleBlanks[p]
        return
      }

      this.isError = false
      line.forEach((cell, i) => {
        if (cell === Status.TEMP_FILLED) {
          if (this.currentLine[i] === Status.TEMP_EMPTY) {
            this.currentLine[i] = Status.INCONSTANT
          } else if (this.currentLine[i] === Status.UNSET) {
            this.currentLine[i] = Status.TEMP_FILLED
          }
        } else if (cell === Status.TEMP_EMPTY) {
          if (this.currentLine[i] === Status.TEMP_FILLED) {
            this.currentLine[i] = Status.INCONSTANT
          } else if (this.currentLine[i] === Status.UNSET) {
            this.currentLine[i] = Status.TEMP_EMPTY
          }
        }
      })
    })
    this.currentHints.possibleBlanks = possibleBlanks.filter(e => e)
  }
}

onmessage = ({ data }) => {
  new Solver(data)
}
