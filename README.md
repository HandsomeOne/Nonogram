# Nonogram

## Usage

[**Check the live demo and find out how to build your own nonogram application.**](https://handsomeone.github.io/Nonogram)

You just need to attach

```html
<script src="https://cdn.rawgit.com/HandsomeOne/Nonogram/gh-pages/nonogram.min.js"></script>
```

to `<head>`. A `<canvas>` element is required for each nonogram instance.

## API

#### `class nonogram.Solver`

`#constructor(rowHints, colHints, canvasId[, config])`: creates a nonogram solver.

- `rowHints`: a two-dimensional array, consisting of the hints of each row as an array.
- `colHints`: a two-dimensional array, consisting of the hints of each column as an array.
- `canvas`: a canvas element, or `id` of the canvas to print the nonogram on.
- *optional* `config`: an object, see [§ Configuration Items](#configuration-items).

`#solve()`: solves and prints the nonogram by given hints.

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
  {width: 500, delay: 100}
);
s.solve();
```
then the output will be like this:
```
██    ██ 1 1
██    ██ 1 1
██    ██ 1 1
████████ 4
4 1 1 4
```

Event `'success'`: dispatched by the canvas when the nonogram has been solved.

Event `'error'`: dispatched by the canvas when some contradiction has been found, usually caused by improper given hints.

#### `class nonogram.Editor`

`#constructor(m, n, canvasId[, config])`: creates a nonogram editor.

- `m`: number of rows, or the length of each column.
- `n`: number of columns, or the length of each row.
- `canvas`: a canvas element, or `id` of the canvas to print the nonogram on.
- *optional* `config`: an object, see [§ Configuration Items](#configuration-items).

`#refresh()`: randomly generates the grid.

For example, if you run
```javascript
new nonogram.Editor(4, 6, 'canvas2', {threshold: 0.9});
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

Event `'hintchange'`: dispatched by the canvas when the nonogram's hints have any change. To automatically create a new solver upon `'hintchange'`, you can use
```javascript
document.getElementById('canvas2').addEventListener('hintchange', function () {
  new nonogram.Solver(this.nonogram.rowHints, this.nonogram.colHints, 'canvas1').solve();
});
new nonogram.Editor(4, 4, 'canvas2');
```
Here `<HTMLCanvasElement>.nonogram` refers to the nonogram instance on it.

#### `class nonogram.Game`

`#constructor(rowHints, colHints, canvasId[, config])`: creates a nonogram game.

The parameters have the same definitions as those of `nonogram.Solver`'s.

Event `'success'`: dispatched by the canvas when the player has successfully solved the nonogram.

Event `'animationfinish'`: dispatched by the canvas when the success animation has been finished.

## Configuration Items

#### General

General configuration items are related to the appearance.
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

#### `nonogram.Solver`
- `demoMode`: default is `true`, and the `solve` method will print a step-by-step solution. If set to `false`, only the final result will be printed.

- `delay` (ms): default is `50`. Controls the delay between steps of the solving process.

#### `nonogram.Editor`
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
