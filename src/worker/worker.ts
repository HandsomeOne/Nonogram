interface SolverLineOfHints extends LineOfHints {
  possibleBlanks?: number[][]
}

const sum = (array: number[]) => array.reduce((a, b) => a + b, 0)

class Solver {
  line: Status[]
  hints: SolverLineOfHints
  isError: Boolean

  constructor({ line, hints }: { line: Status[], hints: SolverLineOfHints }) {
    this.line = line
    this.hints = hints
    this.isError = true
  }
  solve() {
    this.isError = true
    if (this.hints.possibleBlanks === undefined) {
      this.hints.possibleBlanks = []
      this.findAll(this.line.length - sum(this.hints) + 1)
    }
    this.merge()
  }
  findAll(max: number, array: number[] = [], index = 0) {
    if (index === this.hints.length) {
      const blanks = array.slice(0, this.hints.length)
      blanks[0] -= 1
      if (this.hints.possibleBlanks) {
        this.hints.possibleBlanks.push(blanks)
      }
    }

    for (let i = 1; i <= max; i += 1) {
      array[index] = i
      this.findAll(max - array[index], array, index + 1)
    }
  }
  merge() {
    const possibleBlanks = this.hints.possibleBlanks || []
    possibleBlanks.forEach((blanks, p) => {
      const line: Status[] = []
      for (let i = 0; i < this.hints.length; i += 1) {
        line.push(...new Array(blanks[i]).fill(Status.TEMP_EMPTY))
        line.push(...new Array(this.hints[i]).fill(Status.TEMP_FILLED))
      }
      line.push(...new Array(this.line.length - line.length).fill(Status.TEMP_EMPTY))

      const improper = line.some((cell, i) =>
        (cell === Status.TEMP_EMPTY && this.line[i] === Status.FILLED) ||
        (cell === Status.TEMP_FILLED && this.line[i] === Status.EMPTY)
      )
      if (improper) {
        delete possibleBlanks[p]
        return
      }

      this.isError = false
      line.forEach((cell, i) => {
        if (cell === Status.TEMP_FILLED) {
          if (this.line[i] === Status.TEMP_EMPTY) {
            this.line[i] = Status.INCONSTANT
          } else if (this.line[i] === Status.UNSET) {
            this.line[i] = Status.TEMP_FILLED
          }
        } else if (cell === Status.TEMP_EMPTY) {
          if (this.line[i] === Status.TEMP_FILLED) {
            this.line[i] = Status.INCONSTANT
          } else if (this.line[i] === Status.UNSET) {
            this.line[i] = Status.TEMP_EMPTY
          }
        }
      })
    })
    this.hints.possibleBlanks = possibleBlanks.filter(e => e)
  }
}

onmessage = (e) => {
  const solver = new Solver(e.data)
  solver.solve()
  postMessage({
    line: solver.line,
    possibleBlanks: solver.hints.possibleBlanks,
    isError: solver.isError,
  })
}
