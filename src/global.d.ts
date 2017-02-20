declare const enum Status {
  EMPTY = 0,
  FILLED = 1,
  UNSET,
  TEMP_FILLED,
  TEMP_EMPTY,
  INCONSTANT,
}

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
