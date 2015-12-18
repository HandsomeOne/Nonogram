# Nonogram - Play, Edit & Solve

## What is a nonogram

[Nonogram - Wikipedia, the free encyclopedia](https://en.wikipedia.org/wiki/Nonogram)

## Example

For examples, please check the [live demo](http://handsomeone.github.io/Nonogram).

## Usage

First, you need to add

```html
<script src="https://raw.githubusercontent.com/HandsomeOne/Nonogram/master/nonogram.js"></script>
```

in the head of your HTML file. A ```<canvas>``` element with a unique id is required for each nonogram instance.

## APIs

### class NonogramSolve

```NonogramSolve::constructor(rowHints, colHints, canvasId[, width])``` : creates and prints a ```NonogramSolve``` instance on a canvas.

- ```rowHints``` : a two-dimensional array, consisting of the hints of each row (which are arrays too).
- ```colHints``` : a two-dimensional array, consisting of the hints of each column.
- ```canvasId``` : the ```id``` property of the canvas to print the nonogram on.
- ```width``` (px) *optional* : a number to set the canvas' width. If not given, the canvas' current ```clientWidth``` (not the value of its ```width``` property) will be used.

```NonogramSolve::solve()``` : Auto solves and print the nonogram by given hints.

```NonogramSolve::demoMode``` : default is ```true```. if it's set to ```true```, then a step-by-step solution will be printed, otherwise only the final result will be printed when ```solve()``` is called.

```NonogramSolve::delay``` (ms) : default is ```50```. Controls the delay between steps when ```demoMode``` is ```true```.

For example, you have ```<canvas id="canvas1"></canvas>``` in your HTML file, then you can use
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
  500
);
s.delay = 100;
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

### class NonogramEdit

```NonogramEdit::constructor(m, n, canvasId[, width[, thresholdOrGrid]])``` : creates and prints a ```NonogramEdit``` instance on a canvas, and you can edit it.

- ```m``` : number of rows, or the length of each column.
- ```n``` : number of columns, or the length of each row.
- ```canvasId``` : the ```id``` property of the canvas to print the nonogram on.
- ```width``` (px) *optional* : a number to set the canvas' width. If not given, the canvas' current ```clientWidth``` (not the value of its ```width``` property) will be used.
- ```thresholdOrGrid``` *optional* : if it is a two-dimensional array, then it will be assigned to the nonogram's grid. The last example's grid is:
```javascript
[[true, false, false, true],
[true, false, false, true],
[true, false, false, true],
[true, true, true, true]]
```
Else, the function will randomly generate the grid by the threshold, whose default value is ```0.5```. If the parameter is a number, then it will be assigned to the nonogram's threshold, 

```NonogramEdit::refresh()``` : randomly generate the grid again by the threshold.

```NonogramEdit::threshold``` : default is ```0.5```. Each cell of the grid has a chance of threshold*100% to be filled, when the grid needs to be randomly generated.

For example, if you call
```javascript
new NonogramEdit(4, 6, 'canvas2', 500, 0.9);
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

```NonogramEdit::hintChange``` : a custom event on the canvas, event name is ```'hintchange'```. triggerred when its hints have any change. For example, to automatically create a new ```NonogramSolve``` instance upon ```'hintchange'```, you can use
```javascript
document.getElementById('canvas2').addEventListener('hintchange', function () {
  new NonogramSolve(this.nonogram.rowHints, this.nonogram.colHints, 'canvas1').solve();
});
new NonogramEdit(4, 4, 'canvas2');
```
Here ```<CanvasElement>.nonogram``` refers to the nonogram instance on it.

### class NonogramPlay

```NonogramPlay::constructor(rowHints, colHints, canvasId[, width])``` : creates and prints a NonogramPlay instance on a canvas, and you can play it.

All the parameters and their meanings are the same as those of ```NonogramSolve```'s. The only difference between them is that who solves the nonogram, you or the computer.
