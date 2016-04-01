# Nonogram - Edit, Play & Solve

[What is a nonogram](https://en.wikipedia.org/wiki/Nonogram)

## Usage

Check the [live demo](http://handsomeone.github.io/Nonogram) and find out how to build your own nonogram application.

First of all, You need to attach

```html
<script src="https://cdn.rawgit.com/HandsomeOne/Nonogram/master/nonogram.js"></script>
```

to the `<head>` tag. A `<canvas>` element is required for each nonogram instance.

In the future, you may use ES6 instead of ES5:
```javascript
import {NonogramSolve, NonogramEdit, NonogramPlay} from "path/to/nonogram.es6.js";
```

## Functions

### `class NonogramSolve`

`NonogramSolve::constructor(rowHints, colHints, canvasId[, config])`: creates and prints a `NonogramSolve` instance on a canvas. Time cost will be printed in console.

- `rowHints`: a two-dimensional array, consisting of the hints of each row as an array.
- `colHints`: a two-dimensional array, consisting of the hints of each column as an array.
- `canvas`: a canvas element, or `id` of the canvas to print the nonogram on.
- *optional* `config`: an object, see [§ Configuration Items](#configuration-items).

`NonogramSolve::solve()`: solves and prints the nonogram by given hints.

For example, if there is `<canvas id="canvas1"></canvas>`, then you can use
```javascript
var s = new NonogramSolve(
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

### `class NonogramEdit`

`NonogramEdit::constructor(m, n, canvasId[, config])`: creates and prints a `NonogramEdit` instance on a canvas, which can be edited.

- `m`: number of rows, or the length of each column.
- `n`: number of columns, or the length of each row.
- `canvas`: a canvas element, or `id` of the canvas to print the nonogram on.
- *optional* `config`: an object, see [§ Configuration Items](#configuration-items).

`NonogramEdit::refresh()`: randomly generates the grid.

For example, if you run
```javascript
new NonogramEdit(4, 6, 'canvas2', {threshold: 0.9});
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

### `class NonogramPlay`

`NonogramPlay::constructor(rowHints, colHints, canvasId[, config])`: creates and prints a NonogramPlay instance on a canvas, which can be played.

All the parameters have the same meanings as those of `NonogramSolve`'s.

## Custom Events

### `class NonogramSolve`

`'success'`: dispatched by the canvas when the nonogram has been solved.

`'error'`: dispatched by the canvas when some contradiction has been found, usually caused by improper given hints.

### `class NonogramEdit`

`'hintchange'`: dispatched by the canvas when the nonogram's hints have any change. To automatically create a new `NonogramSolve` instance upon `'hintchange'`, you can use
```javascript
document.getElementById('canvas2').addEventListener('hintchange', function () {
  new NonogramSolve(this.nonogram.rowHints, this.nonogram.colHints, 'canvas1').solve();
});
new NonogramEdit(4, 4, 'canvas2');
```
Here `<HTMLCanvasElement>.nonogram` refers to the nonogram instance on it.

### `class NonogramPlay`

`'success'`: dispatched by the canvas when the player has successfully solved the nonogram.

`'animationfinish'`: dispatched by the canvas when the success animation has been finished.

## Configuration Items

### General

General configuration items are related to the appearance.
- `width` (px): a number to set the canvas' width. If not given, the canvas' current `clientWidth` (**not** the value of its `width` property) will be used.
- `backgroundColor`: nonogram's background color, default is white for all classes.
- `filledColor`: filled cells' color.
- `unsetColor`: unset cells' color.
- `correctColor`: numbers' color of correct rows or columns.
- `wrongColor`: numbers' color of wrong rows or columns.
- `meshColor`: meshes' color.
- `isMeshed`: `true` or `false`, coltrols whether to print the meshes or not.
- `isBoldMeshOnly`: default is `false`.
- `boldMeshGap`: default is `5`. Controls how many cells are there between two adjacent bold meshes. If you don't want any bold meshes, simply set it to `0`.

### `NonogramSolve`-only
- `demoMode`: default is `true`, and the `solve` method will print a step-by-step solution. If set to `false`, only the final result will be printed.

- `delay` (ms): default is `50`. Controls the delay between steps of the solving process.

### `NonogramEdit`-only
- `grid`: a two-dimensional array, consisting of `true`s and `false`s, will be assigned to the nonogram's grid. For example, you can use
```javascript
[[true, false, false, true],
[true, false, false, true],
[true, false, false, true],
[true, true, true, true]]
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

### Other Default Values

Property | `NonogramSolve` | `NonogramEdit` | `NonogramPlay`
---------|---------------------|--------------------|-------------------
`filledColor`|`#999`|`#f69`|`#0cf`
`unsetColor`|`#ccc`|`#ccc`|`#ccc`
`correctColor`|`#999`|`#f69`|`#0cf`
`wrongColor`|`#f69`|`#f69`|`#999`
`meshColor`|`#999`|`#999`|`#999`
`isMeshed`|`false`|`false`|`true`
