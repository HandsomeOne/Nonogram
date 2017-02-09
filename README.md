# Nonogram

[![demo](http://i.imgur.com/XRs3jk7.gif)](https://handsomeone.github.io/Nonogram)

## Usage

[**Check the live demo and find out how to build your own nonogram application.**](https://handsomeone.github.io/Nonogram)

You just need to attach

```html
<script src="https://cdn.rawgit.com/HandsomeOne/Nonogram/gh-pages/nonogram.min.js"></script>
```

to `<head>`. A `<canvas>` element is required for each nonogram instance.

## API

### `class nonogram.Solver`

#### `#constructor(row, column, canvas[, config])`

Creates a nonogram solver.

- `row`: a two-dimensional array, consisting of the hints of each row as an array.
- `column`: a two-dimensional array, consisting of the hints of each column as an array.
- *optional* `canvas`: a canvas element, or `id` of the canvas to print the nonogram on. If not given, a new canvas element will be created and assigned to `this.canvas` so you can put it to the document later.
- *optional* `config`: an object, see [§ Configuration Items](#configuration-items).

#### `#solve()`

Solves and prints the nonogram by given hints.

For example, if there is `<canvas id="canvas1"></canvas>`, then you can use
```javascript
var s = new nonogram.Solver(
  [
    [1, 1],
    [1, 1],
    [1, 1],
    [4]
  ],
  [
    [4],
    [1],
    [1],
    [4]
  ],
  'canvas1',
  { width: 500, delay: 100 }
)
s.solve()
```
then the output will be like this:
```
██    ██ 1 1
██    ██ 1 1
██    ██ 1 1
████████ 4
4 1 1 4
```

### `class nonogram.Editor`

#### `#constructor(m, n, canvas[, config])`

Creates a nonogram editor.

- `m`: number of rows, or the length of each column.
- `n`: number of columns, or the length of each row.
- *optional* `canvas`: same as that of `nonogram.Solver`.
- *optional* `config`: an object, see [§ Configuration Items](#configuration-items).

#### `#refresh()`

Randomly generates the grid.

For example, if you run
```javascript
new nonogram.Editor(4, 6, 'canvas2', {threshold: 0.9})
```
then the output is likely to be
```
████████████ 6
████  ██████ 2 3
  ██████████ 5
████████████ 6
2 4 1 4 4 4
1   2
```

### `class nonogram.Game`

#### `#constructor(row, column, canvas[, config])`

Creates a nonogram game. The parameters have the same definitions as those of `nonogram.Solver`'s.

## Configuration Items

- `theme`: an plain object, controls the appearance.
  - `width` (px): a number to set the canvas' width. If not given, the canvas' current `clientWidth` (**not** the value of its `width` property) will be used.
  - `filledColor`: filled cells' color.
  - `unsetColor`: unset cells' color.
  - `correctColor`: numbers' color of correct rows or columns.
  - `wrongColor`: numbers' color of wrong rows or columns.
  - `meshColor`: meshes' color.
  - `isMeshed`: `true` or `false`, coltrols whether to print the meshes or not.
  - `isBoldMeshOnly`: default is `false`.
  - `isMeshOnTop`: default is `false`.
  - `boldMeshGap`: default is `5`. Controls how many cells are there between two adjacent bold meshes. If you don't want any bold meshes, simply set it to `0`.

### `nonogram.Solver`

- `demoMode`: default is `true`, and the `solve` method will print a step-by-step solution. If set to `false`, only the final result will be printed.

- `delay` (ms): default is `50`. Controls the delay between steps of the solving process.

- `onSuccess(time)`: fired when the nonogram has been solved, `time` is how many milliseconds cost.

- `onError(err)`: when some contradiction has been found, `err` tells the bad hints' location (index starts at 1).

### `nonogram.Editor`

- `grid`: a two-dimensional array, consisting of `1`s and `0`s, will be assigned to the nonogram's grid. For example, you can use
```javascript
[[1, 0, 0, 1],
[1, 0, 0, 1],
[1, 0, 0, 1],
[1, 1, 1, 1]]
```
to create
```
██    ██ 1 1
██    ██ 1 1
██    ██ 1 1
████████ 4
4 1 1 4
```

- `threshold`: if `grid` is not given, then the nonogram's grid will be randomly generated. Each cell of the grid has a chance of threshold*100% to be filled. Default is `0.5`.

- `onHintChange(row, column)`: fired when the nonogram's hints have any change. To automatically create a new solver on hint change, you can use
```javascript
new nonogram.Editor(4, 4, 'canvas1', {
  onHintChange: function (row, column) {
    new nonogram.Solver(row, column, 'canvas2').solve()
  })
})
```

### `nonogram.Game`

- `onSuccess()`: fired when the player has successfully solved the nonogram.

- `onAnimationEnd()`: fired when when the success animation has been finished.
