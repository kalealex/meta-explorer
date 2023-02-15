/*
 * REUSABLE CHART COMPONENTS
 * 
 */
function histogramDotplot() {
 
  var margin = { 'top': 3, 'right': 13, 'left': 13, 'bottom': 3 },
    width, 
    height,
    svg,
    chartWrapper,
    nDots = 20,
    dotRadius = 3,
    xAxisHeight = 35,
    directionLabelsMinHeight = 35,
    directionLabelsHeight = directionLabelsMinHeight,
    nTicks = 7,
    xLabel = "",
    againstLabel = "",
    forLabel = "",
    maxDots, 
    xExtent, 
    x,
    binMidpoints,
    binOffsets,
    noEffect,
    noEffectLine,
    showXAxis = false,
    showDirectionLabels = false,
    showOriginalUnits = false,
    tooltip;

  function chart(selection) {
    this.selection = selection
    var that = this;
    selection.each(function(data, i) {
      init(data, that);
    })
  }

  function init(data, that) {
    // initialize svg and wrapper for our chart
    svg = that.selection;

    // if there is no selection, create a wrapper for our chart
    if(svg.select('g').empty()) {
      chartWrapper = svg.append('g').attr('class','chart-wrapper');
      chartWrapper.append('g').attr('class', 'x axis');
    } else {
      chartWrapper = svg.select('g')
    }

    // create line for no effect
    noEffectLine = chartWrapper.append('svg')
      .attr('class', 'overlay')
      .append('line')
      .attr('class', 'no-effect-line')
      .style("stroke-dasharray", ("8, 2"));

    chart.render(data);
  }

  chart.render = function(data) {
    width = svg.node().parentNode.getBoundingClientRect().width;
    setX(); // use width to set x
    
    // format the distribution parameters as points for a quantile dotplot
    data = formatDataFromParams(data);

    // histogram binning
    const histogram = createHistogram(data);
    const bins = histogram(data);

    // binning data and filtering out empty bins
    const filteredBins = bins.filter(d => d.length > 0)

    // find the maximum number of elements from the bins
    maxDots = findMaxLength(filteredBins);
    // set height based on maxDots
    setHeight(); 

    // set svg dimensions
    svg.attr('width', width) 
      .attr('height', height);

    //g container for each bin
    let binContainer = chartWrapper.selectAll(".gBin")
      .data(filteredBins);
    
    binContainer.exit().remove();

    let binContainerEnter = binContainer.enter()
      .append("g")
        .attr("class", "gBin")
        .attr("transform", d => `translate(${x(d.x0)}, ${height})`)

    //need to populate the bin containers with data
    binContainerEnter.selectAll("circle")
      .data(function (d, i) {
        return d.map((p, j) => {
          return {
            binIdx: i,
            stackIdx: j,
            value: p.value,
            radius: dotRadius,
            binStart: d.x0,
            binEnd: d.x1,
            chance: d3.format(",.0%")(d.length / nDots)
          }
        })
      })   
      .enter()
      .append("circle")
        .attr("cx", function(d) { return x(binOffsets[d.binIdx]) - x(0); }) // center dot at bin midpoint by moving to the right the number of pixels that the bin edge is offest from the bin midpoint
        .attr("cy", function(d) { return circleY(d); })
        .on("mouseover", tooltipOn)
        .on("mouseout", tooltipOff)
        .attr("r", function(d) {
          return (d.length==0) ? 0 : d.radius; })

    displayDirectionLabelsAndXAxis()
    setNoEffectLineLocation();
  }


  function displayDirectionLabelsAndXAxis() {
    var chartWrapperTop = margin.top;
    if (showDirectionLabels) {
      // add x axis
      var space = 5; // some space between top of chart and labels
      svg.append("text")
        .attr("class", "against")
        .attr("dy", 0.1)             
        .attr("transform", "translate(" + (margin.left) + " ," +  (space + margin.top) + ")")
        .style("text-anchor", "left")
        .style("text-align", "right")
        .style("font-size", "10px")
        .text(againstLabel)
        .call(wrap, x(noEffect) - margin.left);
      svg.append("text")   
        .attr("class", "for") 
        .attr("dy", 0.1)         
        .attr("transform", "translate(" + (margin.left + x(noEffect) + 5) + " ," +  (space + margin.top) + ")")
        .style("text-anchor", "left")
        .style("text-align", "left")
        .style("font-size", "10px")
        .text(forLabel)
        .call(wrap, width - (margin.left + x(noEffect) + 5));
      var againstLabelHeight = d3.select('text.against').node().getBoundingClientRect().height;
      var forLabelRectHeight = d3.select('text.for').node().getBoundingClientRect().height;
      directionLabelsHeight = Math.max(againstLabelHeight, forLabelRectHeight, directionLabelsMinHeight);
      if (directionLabelsHeight > directionLabelsMinHeight) {
          directionLabelsHeight += space; 
      }
      // update the height for svg
      height += directionLabelsHeight; 
      svg.attr("height", height);
      chartWrapperTop += directionLabelsHeight;
    }
    // since the svg's height can be changed if showDirectionLabels is true,
    // the following code should be called after checking showDirectionLabels. 
    if (showXAxis) {
      // add x axis
      var space = height + 1; // some space between dots and x axis.
      svg.append("text")             
        .attr("transform", "translate(" + (width / 2) + " ," +  (space + margin.bottom) + ")")
        .style("text-anchor", "middle")
        .text(xLabel);
      
      if (showDirectionLabels) {
         // adjust space if showDirectionLabels is true for x-axis
         space -= directionLabelsHeight;
      }
      svg.select('.x.axis')
        .attr("transform", "translate(0," + space + ")")
        .call(d3.axisBottom(x).ticks(nTicks));

      chartWrapperTop -= xAxisHeight;
    } 
    
    // finally ready to set transform for chartWrapper
    chartWrapper.attr("transform", `translate(${margin.left}, ${chartWrapperTop})`);
  }

  function wrap(text, width) {
    text.each(function() {
      var text = d3.select(this),
          words = text.text().split(/\s+/).reverse(),
          word,
          line = [],
          lineNumber = 0,
          lineHeight = 1.1, // ems
          y = text.attr("y"),
          dy = parseFloat(text.attr("dy")),
          tspan = text.text(null).append("tspan").attr("x", 0).attr("y", y).attr("dy", dy + "em");
      while (word = words.pop()) {
        line.push(word);
        tspan.text(line.join(" "));
        if (tspan.node().getComputedTextLength() > width) {
          line.pop();
          tspan.text(line.join(" "));
          line = [word];
          var currentDy = (++lineNumber * dy) + lineHeight
          tspan = text.append("tspan").attr("x", 0).attr("y", y).attr("dy", currentDy + "em").text(word);
        }
      }
    });
  } 

  function circleY(data) {
    return - data.stackIdx * 2 * data.radius - data.radius;
  }

  function findMaxLength(bins) {
    return bins.length > 0 ? Math.max.apply(Math, $.map(bins, function (el) { return el.length })) : 0;
  }

  // TODO: set binwidth and dot size flexibly based on data
  function createHistogram(data) {
    // calculate symmetrical bin midpoints based on data
    binMidpoints = binFromCenter(data.map(d => d.value));

    // create array of bin edges from binMidpoints (in data units)
    let edges = [];
    binOffsets = [];
    for (let i = 0; i < binMidpoints.length; i++) {
      if (i == 0) {
        // first bin
        edges.push(binMidpoints[i] - x.invert(x(0) + dotRadius));
      } else {
        // middle bins
        edges.push((binMidpoints[i] + binMidpoints[i - 1]) / 2);
      }
      // document offsets of left bin edges from midpoints
      binOffsets[i] = Math.abs(binMidpoints[i] - edges[i]);
    }
    // add far edge to last bin
    edges.push(binMidpoints[binMidpoints.length - 1] + x.invert(x(0) + dotRadius)); 

    return d3.histogram()
      .domain([edges[0], edges[edges.length - 1]])
      .thresholds(edges)
      .value(function (d) { return d.value; });
  }

  // a variant of the basic wilkinson binning method (credit: Matt Kay)
  // expects sorted dataArray
  function wilkinsonBinMidpoints(dataArray, rightToLeft) {
    if (dataArray.length == 0) {
      return null;
    }
    
    // right to left sort
    if (rightToLeft) {
      dataArray = dataArray.reverse();
    }

    // get dot width on data scale
    let binWidth = x.invert(x(0) + 2 * dotRadius); 

    // determine midpoints of bins
    let midpoints = [];
    let currBin = 1;            // counter
    let firstPt = dataArray[0]; // first data point in current bin
    for (let i = 1; i < dataArray.length; i++) {
      // difference in pixes from first point in current bin
      let diff = Math.abs(dataArray[i] - firstPt); 

      // This is equivalent to diff >= binWidth but it accounts for machine precision (epsilon).
      // If we instead used `>=` directly some things that should be symmetric will not be
      if (diff > binWidth || Math.abs(diff - binWidth) < Number.EPSILON) {
        // bin midpoint is halfway between first and last points in the bin
        midpoints.push((dataArray[i - 1] + firstPt) / 2);
        // start new bin
        currBin++;
        firstPt = dataArray[i]
      }
    }
    if (midpoints.length < currBin) {
      // calculate midpoint for last bin
      midpoints.push((dataArray[dataArray.length - 1] + firstPt) / 2);
    }
  
    return midpoints.sort((a, b) => a - b);
  }

  // a modified wilkinson-style binning that expands outward from the center of the data (credit: Matt Kay)
  // works best on symmetric data
  // expects sorted dataArray
  function binFromCenter(dataArray) {
    if (dataArray.length == 0) {
      return null;
    } 
    
    // get dot width on data scale
    let binWidth = x.invert(x(0) + 2 * dotRadius); 
    
    if (dataArray.length == 1 || Math.abs(dataArray[dataArray.length - 1] - dataArray[0]) < binWidth) {
      // everything is in one bin
      return [(dataArray[0] + dataArray[dataArray.length - 1]) / 2];
    }

    // used to construct center bin 
    // adjustment is 0 if there are an odd number of points; 0.5 if even and there is still a center bin
    let offsetAdjustment = 0;

    // if we made it this far, there is more than one bin
    if (dataArray.length % 2 == 0) {
      // even number of data points
      if (dataArray[dataArray.length / 2 - 1] != dataArray[dataArray.length / 2]) {
        // two points in middle not equal => 
        // even number of bins and we bin out from center on either side of the middle
        let left = wilkinsonBinMidpoints(dataArray.slice(0, dataArray.length / 2), true)
        let right = wilkinsonBinMidpoints(dataArray.slice(dataArray.length / 2), false)

        return left.concat(right);
      } else {
        // two points in the middle are equal => 
        // stick them into a single bin together and make that the center bin
        offsetAdjustment = 0.5;
      }
    }

    // if we made it this far, there is either an odd number of items OR 
    // an even number of items where the center two items are equal to each other. 
    // In both of these cases, we construct a center bin first and then bin out from around it.
    let iCenter = dataArray.length / 2 - 0.5;
    let edgeIndexOffsetFromCenter = offsetAdjustment;
    for (let offset = 0; offset < Math.floor(dataArray.length / 2); offset++) {
      let adjustedOffset = offset - offsetAdjustment;
      if (Math.abs(dataArray[iCenter + adjustedOffset] - dataArray[iCenter - adjustedOffset]) < binWidth) {
        // add both points to current bin
        edgeIndexOffsetFromCenter = adjustedOffset;
      } else {
        break;
      }
    }
    // calculate midpoint of center bin and place in Array
    let center = [(dataArray[iCenter - edgeIndexOffsetFromCenter] + dataArray[iCenter + edgeIndexOffsetFromCenter]) / 2];

    // construct bins for left / right of center
    left = wilkinsonBinMidpoints(dataArray.slice(0, iCenter - edgeIndexOffsetFromCenter), true)
    right = wilkinsonBinMidpoints(dataArray.slice(iCenter + edgeIndexOffsetFromCenter + 1), false)

    return left.concat(center, right);
  }

  function setNoEffectLineLocation() {
    var parentRect = svg.node().parentNode.getBoundingClientRect();
    var svgRect = svg.node().getBoundingClientRect();
    var y1 = parentRect.y - svgRect.y;
    var noEffectLineHeight = parentRect.height;
    if (showXAxis) {
      y1 = y1 + xAxisHeight;
      noEffectLineHeight -= xAxisHeight;
    }
    if (showDirectionLabels) {
      // noEffectLineHeight -= directionLabelsHeight;
      y1 -= directionLabelsHeight;
    }
    // console.log(noEffect);
    // console.log(x.domain());
    // console.log(x(noEffect));
    noEffectLine.attr('y1', y1) // not from data
      .attr('y2', y1 + noEffectLineHeight)
      .attr('x1', x(noEffect)) // from data
      .attr('x2', x(noEffect))
        
  }

  function formatDataFromParams(data) {
    // generate nDots points to display based on distribution parameters
    // each dot represents an equally potioned quantile
    // evenly space probabilities within 95% containment interval
    var quantiles = [],
      lowerP = 0.025, 
      upperP = 0.975,
      idx = [...Array(nDots).keys()], // [0, 1, 2, ... nDots - 1]
      probabilities = idx.map(i => (upperP - lowerP) * i / (idx.length - 1) + lowerP);
    probabilities.forEach(p => {
      // get distribution value at this quantile and corresponding bin
      if (showOriginalUnits) {
        quantiles.push({
          'value': jStat.normal.inv(p, data.originalEffect, data.stdErrOriginalEffect)
        });
      } else { // standardized units
        quantiles.push({
          'value': jStat.normal.inv(p, data.effectSize, data.stdErrEffectSize)
        });
      }      
    });
    return quantiles;
  }

  function setX() {
    x = d3.scaleLinear()
    .domain(xExtent)
    .range([0, width - margin.right- margin.left]);
  }

  function setHeight() {
    height = (maxDots * dotRadius * 2 ); 
    if (showXAxis) {
      height += xAxisHeight;
    } 
  }

  // TODO: set dotRadius based some maximum row height (need another function OR handle this in forestPlot.js)

  function tooltipOn(d) {
    let gX = d3.event.pageX;
    let gY = d3.event.pageY + (dotRadius * 3); 

    d3.select(this)
      .classed("selected", true)
    tooltip.transition()
         .duration(200)
         .style("opacity", .9);
    
    let html = "There is a " + d.chance + " chance that an exact replication of this study would produce an effect estimate between " 
      + d3.format(",.2")(d.binStart) + " and " + d3.format(",.2")(d.binEnd);
    tooltip.html(html)
      .style("left", gX + "px")
      .style("top", gY + "px")
      .style("padding", "5px");
  }//tooltipOn
  
  function tooltipOff(d) {
    d3.select(this)
        .classed("selected", false);
    tooltip.transition()
           .duration(500)
           .style("opacity", 0); 
  }//tooltipOff
  
  
  // getter and setter functions
  chart.margin = function(_) {
    if (!arguments.length) return margin;
    margin = _;
    return chart;
  };

  chart.width = function(_) {
    if (!arguments.length) return width;
    width = _;
    return chart;
  };

  chart.height = function(_) {
    if (!arguments.length) return height;
    height = _;
    return chart;
  };

  chart.dotRadius = function(_) {
    if (!arguments.length) return dotRadius;
    dotRadius = _;
    return chart;
  };

  chart.showXAxis = function(_) {
    if (!arguments.length) return showXAxis;
    showXAxis = _;
    return chart;
  };

  chart.xExtent = function(_) {
    if (!arguments.length) return xExtent;
    xExtent = _;
    return chart;
  };

  // get pixels at x==0
  chart.noEffect = function(_) {
    if (!arguments.length) return noEffect;
    noEffect = _;
    return chart;
  }

  chart.xPixel = function(xValue) {
    return x(xValue);
  }

  chart.xAxisHeight = function(_) {
    if (!arguments.length) return xAxisHeight;
    xAxisHeight = _;
    return chart;
  };

  chart.xLabel = function(_) {
    if (!arguments.length) return xLabel;
    xLabel = _;
    return chart;
  };

  chart.showDirectionLabels = function(_) {
    if (!arguments.length) return showDirectionLabels;
    showDirectionLabels = _;
    return chart;
  };

  chart.againstLabel = function(_) {
    if (!arguments.length) return againstLabel;
    againstLabel = _;
    return chart;
  };

  chart.forLabel = function(_) {
    if (!arguments.length) return forLabel;
    forLabel = _;
    return chart;
  };

  chart.tooltip = function(_) {
    if (!arguments.length) return tooltip;
    tooltip = _;
    return chart;
  };

  chart.init = function(_) {
    if (!arguments.length) return init;
    init = _;
    return chart;
  };

  chart.showOriginalUnits = function(_) {
    if (!arguments.length) return showOriginalUnits;
    showOriginalUnits = _;
    return chart;
  }

  chart.transform = function(_) {
    if (!arguments.length) return chartWrapper.attr("transform");

    chartWrapper.attr("transform", `translate(${_.left}, ${_.top})`);
    return chart;
  }

  return chart;
}
