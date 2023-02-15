const WIDTH = 350;
const HEIGHT = 350;
const margin = 50;
// main circle
const CX = WIDTH / 2;
const CY = HEIGHT / 2;
const R = 20;
// little circles
const r = 2;

// degree - radian conversion
function radian(degree) {
  return degree * Math.PI / 180;
}
// parametric equation of a circle is : x=cx+r*cos(t) and y=cy+r*sin(t)
function x(radian) {
  return CX + R * Math.cos(radian);
}
function y(radian) {
  return CY + R * Math.sin(radian);
}

// root svg
const svg = d3
  .select("body")
  .append("svg")
  .attr("width", WIDTH + margin * 2)
  .attr("height", HEIGHT + margin * 2)
  .style("background-color", "lightblue")
  .append("g")
  .attr("transform", "translate(" + margin + "," + margin + ")");

// g and rect are useless : just for showing element g
const justForShowing_g = svg
  .append("rect")
  .style("fill", "transparent")
  .attr("width", WIDTH)
  .attr("height", HEIGHT);

// main circle : just for explanation purpose
// uncomment if needed
/*
const mainCircle = svg
  .append("circle")
  .attr("id", "main")
  .attr("cx", CX)
  .attr("cy", CY)
  .attr("r", R)
  .style("stroke", "red")
  .style("fill", "none");
*/

// little circles
// 10 equal sectors for 10 points on the main circle
const SECTORS = 10; // number of sectors
const SECTOR = 360 / SECTORS; // sector in degree: each equal
let anglesList = [];

for (let index = 0; index < SECTORS; index++) {
  anglesList.push(radian(index * SECTOR));
}
const MAX = anglesList[SECTORS - 1];

// opacity
function getOpacity(datum) {
  return Number((datum / MAX).toFixed(1));
}

// little circle radius
function getRadius(datum) {
  return Number(r + r * (datum / MAX).toFixed(1));
}

function update(dataset) {
  let littleCircle = svg.selectAll("#little").data(dataset);

  // UPDATE
  // Update old elements as needed.
  littleCircle
    .attr("r", function(d) {
      return getRadius(d);
    })
    .style("opacity", function(d) {
      return getOpacity(d);
    });

  // ENTER
  // Create new elements as needed.
  littleCircle
    .enter()
    .append("circle")
    .attr("id", "little")
    .attr("fill", "blue")
    .attr("cx", function(d) {
      return x(d);
    })
    .attr("cy", function(d) {
      return y(d);
    })
    .attr("r", function(d) {
      return getRadius(d);
    })
    .style("opacity", function(d) {
      return getOpacity(d);
    });

  // EXIT
  // Remove old elements as needed.
  // littleCircle.exit().remove();
}

update(anglesList);

function arrayRotate(arr, count) {
  count -= arr.length * Math.floor(count / arr.length);
  arr.push.apply(arr, arr.splice(0, count));
  return arr;
}

// cyclic circular permutation
d3.interval(function() {
  anglesList = arrayRotate(anglesList.slice(), -1);
  update(anglesList);
}, 150);
