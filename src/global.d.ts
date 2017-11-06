type Direction = 'row' | 'column'

interface LineOfHints extends Array<number> {
  isCorrect?: boolean
  unchanged?: boolean
}

interface Theme {
  filledColor: string
  unsetColor: string
  correctColor: string
  wrongColor: string
  meshColor: string
  isMeshed: boolean
  isBoldMeshOnly: boolean
  isMeshOnTop: boolean
  boldMeshGap: number
  width?: number
}

interface Scanner {
  direction: Direction
  i: number
}

interface SolverMessage {
  type: 'error' | 'finish' | 'update'
  grid: number[][]
  scanner?: Scanner
  hints: {
    row: LineOfHints[]
    column: LineOfHints[]
  }
}

declare module "worker!*" {
  const worker: {
    prototype: Worker
    new(): Worker
  }
  export default worker
}
