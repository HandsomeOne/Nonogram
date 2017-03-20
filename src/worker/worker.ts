interface SolverLineOfHints extends LineOfHints {
  possibleBlanks?: number[][]
}

interface Scanner {
  line: Status[]
  hints: SolverLineOfHints
  error: Boolean
}

const sum = (array: number[]) => array.reduce((a, b) => a + b, 0)

class Solver {
  constructor(public scanner: Scanner) {}
  solveSingleLine() {
    this.scanner.error = true
    if (this.scanner.hints.possibleBlanks === undefined) {
      this.scanner.hints.possibleBlanks = []
      this.findAllSituations(this.scanner.line.length - sum(this.scanner.hints) + 1)
    }
    this.mergeSituation()
  }
  findAllSituations(max: number, array: number[] = [], index = 0) {
    if (index === this.scanner.hints.length) {
      const blanks = array.slice(0, this.scanner.hints.length)
      blanks[0] -= 1
      if (this.scanner.hints.possibleBlanks) {
        this.scanner.hints.possibleBlanks.push(blanks)
      }
    }

    for (let i = 1; i <= max; i += 1) {
      array[index] = i
      this.findAllSituations(max - array[index], array, index + 1)
    }
  }
  mergeSituation() {
    const possibleBlanks = this.scanner.hints.possibleBlanks || []
    possibleBlanks.forEach((blanks, p) => {
      const line: Status[] = []
      for (let i = 0; i < this.scanner.hints.length; i += 1) {
        line.push(...new Array(blanks[i]).fill(Status.TEMP_EMPTY))
        line.push(...new Array(this.scanner.hints[i]).fill(Status.TEMP_FILLED))
      }
      line.push(...new Array(this.scanner.line.length - line.length).fill(Status.TEMP_EMPTY))

      const improper = line.some((cell, i) =>
        (cell === Status.TEMP_EMPTY && this.scanner.line[i] === Status.FILLED) ||
        (cell === Status.TEMP_FILLED && this.scanner.line[i] === Status.EMPTY)
      )
      if (improper) {
        delete possibleBlanks[p]
        return
      }

      this.scanner.error = false
      line.forEach((cell, i) => {
        if (cell === Status.TEMP_FILLED) {
          if (this.scanner.line[i] === Status.TEMP_EMPTY) {
            this.scanner.line[i] = Status.INCONSTANT
          } else if (this.scanner.line[i] === Status.UNSET) {
            this.scanner.line[i] = Status.TEMP_FILLED
          }
        } else if (cell === Status.TEMP_EMPTY) {
          if (this.scanner.line[i] === Status.TEMP_FILLED) {
            this.scanner.line[i] = Status.INCONSTANT
          } else if (this.scanner.line[i] === Status.UNSET) {
            this.scanner.line[i] = Status.TEMP_EMPTY
          }
        }
      })
    })
    this.scanner.hints.possibleBlanks = possibleBlanks.filter(e => e !== null)
  }
}

onmessage = (e) => {
  const solver = new Solver(e.data)
  solver.solveSingleLine()
  postMessage(solver.scanner)
}
