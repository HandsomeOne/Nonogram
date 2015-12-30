# Nonogram - Play, Edit & Solve

## What is a nonogram

[Nonogram - Wikipedia, the free encyclopedia](https://en.wikipedia.org/wiki/Nonogram)

## Example

For examples, please check the [live demo](http://handsomeone.github.io/Nonogram).

## Usage

First, you need to add

```html
<script src="https://cdn.rawgit.com/HandsomeOne/Nonogram/master/nonogram.js"></script>
```

in the head of your HTML file. A ```<canvas>``` element with a unique id is required for each nonogram instance.

In the future, you may use ES6 instead of ES5:
```javascript
import {NonogramSolve, NonogramEdit, NonogramPlay} from "path/to/nonogram.es6.js";
```

## APIs

### ```class NonogramSolve```

```NonogramSolve::constructor(rowHints, colHints, canvasId[, config])```: creates and prints a ```NonogramSolve``` instance on a canvas.

- ```rowHints```: a two-dimensional array, consisting of the hints of each row (which are arrays too).
- ```colHints```: a two-dimensional array, consisting of the hints of each column.
- ```canvas```: a canvas element, or the ```id``` property of the canvas to print the nonogram on.
- ```config``` *optional*: an object, see [§ Configuration Items](#configuration-items).

```NonogramSolve::solve()```: Auto solves and print the nonogram by given hints.

For example, if you have ```<canvas id="canvas1"></canvas>``` in your HTML file, and you run
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

```NonogramSolve::success```: a custom event on the canvas, event name is ```'success'```. Triggerred when the nonogram has been solved.

```NonogramSolve::error```: a custom event on the canvas, event name is ```'error'```. Triggerred when some contradiction has been found, usually caused by improper given hints.

### ```class NonogramEdit```

```NonogramEdit::constructor(m, n, canvasId[, config])```: creates and prints a ```NonogramEdit``` instance on a canvas, and you can edit it.

- ```m```: number of rows, or the length of each column.
- ```n```: number of columns, or the length of each row.
- ```canvas```: a canvas element, or the ```id``` property of the canvas to print the nonogram on.
- ```config``` *optional*: an object, see [§ Configuration Items](#configuration-items).

```NonogramEdit::refresh()```: randomly generate the grid again by the threshold.

For example, if you run
```javascript
new NonogramEdit(4, 6, 'canvas2', {threshold: 0.9});
```
then the output is mostly like to be
```
████████████ 6
████  ██████ 2 3
  ██████████ 5
████████████ 6
2 4 1 4 4 4
1   2
```

### ```class NonogramPlay```

```NonogramPlay::constructor(rowHints, colHints, canvasId[, config])```: creates and prints a NonogramPlay instance on a canvas, and you can play it.

All the parameters and their meanings are the same as those of ```NonogramSolve```'s. The only difference between them is that who solves the nonogram, you or the computer.

## Custom Events

### ```class NonogramEdit```

```'hintchange'```: Triggerred when the nonogram's hints have any change. For example, to automatically create a new ```NonogramSolve``` instance upon ```'hintchange'```, you can use
```javascript
document.getElementById('canvas2').addEventListener('hintchange', function () {
  new NonogramSolve(this.nonogram.rowHints, this.nonogram.colHints, 'canvas1').solve();
});
new NonogramEdit(4, 4, 'canvas2');
```
Here ```<HTMLCanvasElement>.nonogram``` refers to the nonogram instance on it.

### ```class NonogramPlay```

```'success'```: Triggerred when the player has finished the nonogram.

```'animationfinish'```: Triggerred when the success animation has been finished.

## Configuration Items

### General

Those general configuration items are related to the appearance, such as width and component's colors. All of them have default values for each class.
- ```width``` (px): a number to set the canvas' width. If not given, the canvas' current ```clientWidth``` (not the value of its ```width``` property) will be used.
- ```backgroundColor```: nonogram's background color, default is white for all classes.
- ```filledColor```: filled cells' color.
- ```unsetColor```: unset cells' color.
- ```correctColor```: numbers' color of correct rows or columns.
- ```wrongColor```: numbers' color of wrong rows or columns.
- ```meshColor```: meshes' color.
- ```meshed```: ```true``` or ```false```, print the meshes or not.
- ```boldMeshGap```: default is ```5```. Controls how many cells are there between two adjacent bold meshes. If you do not want any bold meshes, just simply set it to ```0```.

### Default Values

Property | ```NonogramSolve``` | ```NonogramEdit``` | ```NonogramPlay```
---------|---------------------|--------------------|-------------------
```filledColor```|```#999```|```#f69```|```#0cf```
```unsetColor```|```#ccc```|```#ccc```|```#ccc```
```correctColor```|```#999```|```#f69```|```#0cf```
```wrongColor```|```#f69```|```#f69```|```#999```
```meshColor```|```#999```|```#999```|```#999```
```meshed```|```false```|```false```|```true```

### ```NonogramSolve```-only
- ```demoMode```: default is ```true```. if it's set to ```true```, then ```solve()``` will print a step-by-step solution, otherwise only the final result.

- ```delay``` (ms): default is ```50```. Controls the delay between steps when solved in ```demoMode```.

### ```NonogramEdit```-only
- ```grid```: a two-dimensional array, consisting of ```true```s and ```false```s, will be assigned to the nonogram's grid. For example, the grid of
```
██    ██ 1 1
██    ██ 1 1
██    ██ 1 1
████████ 4
4 1 1 4
```
is
```javascript
[[true, false, false, true],
[true, false, false, true],
[true, false, false, true],
[true, true, true, true]]
```

- ```threshold```: default is ```0.5```. If ```grid``` is not given, then it will be randomly generated. Each cell of the grid has a chance of threshold*100% to be filled.