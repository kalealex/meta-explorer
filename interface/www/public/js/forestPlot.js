/*
 * REUSABLE CHART COMPONENTS
 * 
 */
function forestPlot() {

  const UNITS = { 'noramlized' : 'normalized', 'original': 'original' };
  const X_LABEL = { 
    'meanDiff': 'Mean Difference', 
    'riskDiff': 'Risk Difference',
    'SMD': 'Standardized Mean Difference', 
    'logOddsRatio': 'Log Odds Ratio',
    'logRiskRatio': 'Log Risk Ratio'
  };
  // wait time before updating table data
  const WAIT_TIME = 2000; 

  var margin = { 'top': 5, 'right': 5, 'left': 5, 'bottom': 5 },
    width = 600,
    height = 800,
    div,
    label,
    id,
    toggleBtn,
    sortBtn,
    preloader,
    table,
    qdp,
    // lastVisibleRow,
    tooltip,
    // displayUnits,
    // sourceOfBias = {},
    // index,
    // firstVisibleRow,
    studyStats = "",
    startUpdate = false;
    columns = [
      {
        head: 'Author', cl: 'study center',
        html: function (row) { 
          var flagIcon = (!row.summary && row.flag) ? "<span class='flag ml-2'><i class='fa fa-lg fa-flag' aria-hidden='true' style='color: #a80000;'/></span>" : "";
          return getStudyName(row) + flagIcon }
      },
      {
        head: 'Group', cl: 'study center',
        html: function (row) { return row.group; }
      },
      {
        head: 'Timepoint', cl: 'study center',
        html: function (row) { return row.timePoint; }
      },
      {
        head: 'Mean', cl: 'num',   // experimental/intervention condition
        html: function (row) { return row.meanExp; }
      },
      {
        head: 'SD', cl: 'num',
        html: function (row) { return row.sdExp; }
      },
      {
        head: 'Count', cl: 'num',
        html: function (row) { return row.countExp; }
      },
      {
        head: 'N', cl: 'num',
        html: function (row) { return row.nExp; }
      },
      {
        head: 'Mean', cl: 'num',   // control condition
        html: function (row) { return row.meanCtrl; }
      },
      {
        head: 'SD', cl: 'num',
        html: function (row) { return row.sdCtrl; }
      },
      {
        head: 'Count', cl: 'num',
        html: function (row) { return row.countExp; }
      },
      {
        head: 'N', cl: 'num',
        html: function (row) { return row.nCtrl; }
      },
      // {
      //   head: 'Mean', cl: 'num',  // effect size
      //   html: function (row) { return row.originalEffect; }
      // },
      // {
      //   head: '95% CI', cl: 'center',
      //   html: function (row) {
      //     if (row.summary) return "";
      //     else {
      //       var CI = confint(row);
      //       return '(' + CI[0] + ', ' + CI[1] + ')';
      //     }
      //   }
      // },
      // {
      //   head: 'N', cl: 'num',
      //   html: function (row) { return row.N }
      // },
      {
        head: 'Weight', cl: 'num',
        html: function (row) { return row.summary ? "I<sup>2</sup> = " + (row.I2 > 0 ? d3.format(",.2%")(row.I2) : "0%") : row.weight ? d3.format(",.2")(row.weight) : "NA"; }
      },
      {
        head: 'Forest Plot', cl: 'chart',
        html: function (row, i) {
          // wait until the DOM is ready so that td.chart exists
          $(function () {
            // select the current row's table data cell classed 'chart'
            // var currRow = document.getElementById('r' + i);
            // var currRow = document.getElementById('t' + this.index + 'r' + i);
            //var currTable = document.getElementById(div.attr('id')); // this works but returns the most recent forest plot's div

            // select window to get state
            var state = $(window)[0];
            // find the current table by row.plotID
            var currTable = document.getElementById(row.plotID); 
            var rowId = getTableRowId(row, i) // get the unique table row id.
            var currRow = currTable.querySelector('#' + rowId); 

            var chart = currRow.querySelector('.chart');

            // set up quantile dotplot component
            qdp.showXAxis(i == state.lastVisibleRow[row.plotID] || state.displayUnits[row.plotID] == UNITS.original);
            qdp.showOriginalUnits(!row.summary && state.displayUnits[row.plotID] == UNITS.original);
            qdp.xLabel(qdp.showOriginalUnits() ? X_LABEL[row.originalMetric] : X_LABEL[row.standardizedMetric]);
            qdp.xExtent((!row.summary && state.displayUnits[row.plotID] == UNITS.original) ? row.originalDataExtent : row.standardizedDataExtent);
            qdp.showDirectionLabels( i == state.firstVisibleRow[row.plotID] );
            qdp.againstLabel(row.outcomeType == "dichotomous" ? "Decreased chance of " + row.dependentVariable + " with " + row.independentVariable : "Decreased " + row.dependentVariable + " with " + row.independentVariable);
            qdp.forLabel(row.outcomeType == "dichotomous" ? "Increased chance of " + row.dependentVariable + " with " + row.independentVariable : "Increased " + row.dependentVariable + " with " + row.independentVariable);
            qdp.tooltip(tooltip)
            qdp.noEffect(row.noEffect);

            // append svg to td.chart, bind row data, call plotting function
            if (d3.select(chart).select('svg').empty()) {
              d3.select(chart).append('svg');
            }
            d3.select(chart).select('svg').attr('class', 'qdp')
            // if (chart.select('.qdp').empty()) {
            //   chart.append('svg').attr('class', 'qdp');
            // }
            // chart.select('.qdp')
              .datum(row)
              .call(qdp);
            
          });
        }
      },
      {
        head: '', cl: 'include center',
        html: function (row, i) {
          if (!row.summary && row.included) {
            return '<div class="btn-group btn-group-toggle" data-toggle="buttons">' +
              '<label class="btn btn-sm btn-success btn-yes active">' +
              '<input type="radio" {"Value": ="options" autocomplete="off" checked>Yes' +
              '</label>' +
              '<label class="btn btn-sm btn-secondary btn-no">' +
              '<input type="radio" {"Value": ="options" autocomplete="off">No' +
              '</label>';
          } else if (!row.summary && !row.included) {
            return '<div class="btn-group btn-group-toggle" data-toggle="buttons">' +
              '<label class="btn btn-sm btn-success btn-yes">' +
              '<input type="radio" {"Value": ="options" autocomplete="off" checked>Yes' +
              '</label>' +
              '<label class="btn btn-sm btn-secondary btn-no active">' +
              '<input type="radio" {"Value": ="options" autocomplete="off">No' +
              '</label>';
          }
        }
      }
    ],

    columnGroup = [
      { head: 'Study', cl: 'center description', colspan: 3, rowspan: 1 },
      { head: 'Intervention', cl: 'center description', colspan: studyStats == "Count" ? 2 : 3, rowspan: 1 },
      { head: 'Control', cl: 'center description', colspan: studyStats == "Count" ? 2 : 3, rowspan: 1 },
      { head: 'Effect Size', cl: 'center description', colspan: 2, rowspan: 1 },
      { head: 'Include', cl: 'center description', colspan: 1, rowspan: 2 },
    ];
  
  function chart(selection) {
    this.selection = selection;
    // generate and select DOM elements for this forest plot
    $(selection.node()).append(`<div class="col"><div class="row buttonContainer"><h4 class="plotLabel">${label}</h4><div class="buttonPanel"><button class="toggleCharts btn btn-outline-secondary block">Switch to Original Units</button><button class="sortBtn btn btn-outline-secondary block">Sort by Effect Size</button></div></div><div class="row plotContainer"><div class="plot"></div><div class="preloader"></div></div></div>`);
    updateBlockStatus(true);
    var that = this;
    selection.each(function (data, i) {
      init(data, that);
    })
  }

  function init(data, that) {
    div = that.selection;

    // if there is no selection, create a table
    if (div.select('.plot').select('table').empty()) {
      table = div.select('.plot').append('table');
    } else {
      table = div.select('.plot').select('table');
    }

    // if there is no selection, create a tooltip
    if (d3.select(".tooltip").empty()) {
      tooltip = d3.select("body")
        .append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);
    } else {
      tooltip = d3.select(".tooltip");
    }

    // set up quantile dotplot component
    qdp = histogramDotplot();

    chart.render(data);
    
    // register click events that update the table
    // d3.selectAll("#toggleCharts").on("click", function () {
    // d3.selectAll(`#toggleCharts${this.index}`).on("click", function () {
    toggleBtn.on("click", function () {
      selectCurrentByButton(this, true);
      var btnText = $(this).text();
      if (btnText == "Switch to Standardized Units") {
        $(this).text("Switch to Original Units");
        // displayUnits = UNITS.noramlized;
      } else {
        $(this).text("Switch to Standardized Units");
        // displayUnits = UNITS.original;
      }
      updateTablebody();
    });
        
    // d3.select("#sortBtn").on("click", function () {
    // d3.select(`#sortBtn${this.index}`).on("click", function () {
    sortBtn.on("click", function () {
      var btnText = $(this).text();
      if (btnText == "Sort by Effect Size") {
        $(this).text("Sort by Study");
      } else {
        $(this).text("Sort by Effect Size");
      }
      selectCurrentByButton(this, false);
      sort();
      var state = $(window)[0];
      state.lastVisibleRow[div.attr('id')] = getLastVisibleRow();
      state.firstVisibleRow[div.attr('id')] = getFirstVisibleRow();
      updateTablebody();
      // var selectedBias = $('#biases .selected');
      // if (selectedBias.length > 0) {
      //    selectedBias[0].click();   
      // }
    });

  }

  chart.render = function (data) {
    // use the updated margins with the current parent width
    updateDimensions(div.node().parentNode.getBoundingClientRect().width)
    // set div width only
    div.style('width', width + margin.right + margin.left + 'px')
        
    // fill in data from information provided
    if (data.length > 1 && !data[0].showOnly) {
      calculateEstimatesPerStudy(data).then(function(response) {
        return fetchData(response);
      }).then(function(data) {
        // determine smart default effect size metric for this forest plot
        data = defaultUnits(data);
        // run meta-analysis
        return sensitivityAnalysis(data);
        // return metaAnalyze(data);  
      }).then(function(response) {
        return fetchData(response);
      }).then(function(results) {
        this.sensitivityAnalysis = this.sensitivityAnalysis ? this.sensitivityAnalysis : {};
        this.sensitivityAnalysis[results[0][0].plotID] = deepCopy(results); // store deep copy of results of sensitivity analysis for later
        let fullStudySet = results[results.length - 1]; // start with the full inclusion set
        console.log("sensitivity analysis result", this.sensitivityAnalysis[results[0][0].plotID]);
        let data = selectResultForCurrentInclusionSet(fullStudySet); 
        // post-processing and table construction
        onAfterCalculateEstimates(data);
      }).catch(function(err) {
        console.log(err);
      });
    } else { // no summary
      calculateEstimatesPerStudy(data).then(function(response) {
        return fetchData(response);
      }).then(function(data) {
        // determine smart default effect size metric for this forest plot
        return defaultUnits(data);
      }).then(function(data) {
        // post-processing and table construction
        onAfterCalculateEstimates(data);
      }).catch(function(err) {
        console.log(err);
      });
    }
  }
  
  function getStudyName(rowData) {
    if (rowData.summary) {
       return "<b>Average</b>"; 
    } else {
      // return rowData.id ? rowData.id : rowData.author.split(',')[0] + ' et al. ' + rowData.year + ' ' + (rowData.group ? rowData.group : '') + ' ' + (rowData.timePoint ? rowData.timePoint : '');
       return rowData.author.split(',')[0] + ' et al. ' + rowData.year;   
    }
  }
  
  function sort() {
    // var btnText = d3.select("#sortBtn").text();
    // var btnText = d3.select(`#sortBtn${this.index}`).text();
    var btnText = sortBtn.text();
     if (btnText == "Sort by Effect Size") {
        $(this).text("Sort by Study");
        sortByStudy();
     } else {
        $(this).text("Sort by Effect Size");
        sortByEffectSize();
     }
  }
  
  function sortByStudy() {
    this.data.sort((d1, d2) => {
       var study_1 = getStudyName(d1) + d1.group + d1.timePoint;
       var study_2 = getStudyName(d2) + d2.group + d2.timePoint;
       if (d1.summary) return 1;
       if (d2.summary) return -1;
       if (study_1 < study_2) return -1;
       if (study_1 > study_2) return 1;
       return 0; 
    }); 
  }
  
  function sortByEffectSize() {
    this.data.sort((d1, d2) => {
      if (d1.summary) return 1;
      if (d2.summary) return -1;
      return d1.effectSize - d2.effectSize;
    });
  }
  
  function onAfterCalculateEstimates(data) {
    // initialize units
    this.displayUnits = this.displayUnits ? this.displayUnits : {};
    this.displayUnits[data[0].plotID] = UNITS.noramlized;
    // wrangle data 
    this.data = updateDataExtent(data);
    sort();
    this.lastVisibleRow = this.lastVisibleRow ? this.lastVisibleRow : {};
    this.lastVisibleRow[this.data[0].plotID] = getLastVisibleRow();
    this.firstVisibleRow = this.firstVisibleRow ? this.firstVisibleRow : {};
    this.firstVisibleRow[this.data[0].plotID] = getFirstVisibleRow();
    // build table
    constructTable(data);
    registerClickEvents();
    updateBlockStatus(false);
  }
  
  function constructTable(data) {
    // determine whether this table should show stats per study (do all outcomeType fields match?)
    studyStats = data.every((d) => { return (d.summary || d.outcomeType == "dichotomous"); }) ? "Count" : data.every((d) => { return (d.summary || d.outcomeType == "continuous"); }) ? "Mean" : "";
    
    // append column group
    table.attr("class", "table table-bordered")
    table.append('tr')
      .selectAll('th')
      .data(studyStats != "" ? columnGroup : columnGroup.filter((c) => { return !(c.head == "Intervention" || c.head == "Control"); }))
      .enter()
      .append('th')
      .attr('class', function (d) { return d.cl; })
      .attr('colspan', function (d) { return d.colspan; })
      .attr('rowspan', function (d) { return d.rowspan; })
      .text(function (d) { return d.head; });

    // bind columns to table header
    var filteredColumns = columns.filter(function (c) { return c.head.length > 0; });
    if (studyStats == "Count") {
      filteredColumns = filteredColumns.filter(function (c) { return c.head != "Mean" && c.head != "SD"; });
    } else if (studyStats == "Mean") {
      filteredColumns = filteredColumns.filter(function (c) { return c.head != "Count"; });
    } else {
      filteredColumns = filteredColumns.filter(function (c) { return c.head != "Mean" && c.head != "SD" && c.head != "Count"; });
    }
    var header = table.append('tr')
      .selectAll('th')
      .data(filteredColumns)
      .enter()
      .append('th')
      .attr('class', function (col) { return col.cl; })
      .text(function (col) { return col.head; })
             
    header.exit().remove();

    // bind data to table body
    table.append('tbody').selectAll('tr').data(data)
      .enter()
      .append('tr')
      .attr('class', function (d, i) {
        if (!d.included && !d.summary) {
          return 'off';
        } else {
          return '';
        }
      })
      // .attr('id', function (row, i) { return 't' + this.index + 'r' + i; })
      // id for table row.
      .attr('id', function (row, i) { return getTableRowId(row, i) })
      .selectAll('td')
      .data(function (row, i) {
        return columns.map(function (c) {
          // compute cell values for this specific row
          var cell = {};
          d3.keys(c).forEach(function (k) {
            cell[k] = typeof c[k] == 'function' ? c[k](row, i) : c[k];
          });
          return cell;
        }).filter(function (c) {
          // show different stats for dichotomous vs continuous outcomes
          return !((studyStats == "Count" && (c.head == "Mean" || c.head == "SD")) || (studyStats == "Mean" && c.head == "Count"));
        });
      }).enter() //enter table data
      .append('td')
      .html(function (col) { return col.html; })
      .attr('class', function (col) { return col.cl });
  }

  function getTableRowId(row, index) {
     // use plotID to create a unique table row id
     return row.plotID + '_r' +  index;
  }

  function registerClickEvents() {
    $(function () {
      // register click events for yes and no buttons
      d3.selectAll(".btn-yes").on("click", function () {
        var row = $(this).parents('tr')[0];
        updateData(row, true);
      });

      d3.selectAll(".btn-no").on("click", function () {
        var row = $(this).parents('tr')[0];
        updateData(row, false);
      });

      table.select('tbody').selectAll('.flag')
        .on("mouseover", function(d) {   
          let curRow = $(this).parents('tr')[0],
            curData = d3.select(curRow).data(),
            html = curData[0].flagNote ? "Note: " + curData[0].flagNote : "",
            gX = d3.event.pageX,
            gY = d3.event.pageY;
          if (html.length > 0 && shouldTooltipOn(gX, curRow)) {
            tooltip.transition()
              .duration(200)
              .style("opacity", .9)
              .style("padding", "10px")
            tooltip.html(html)
              .style("left", gX + "px")
              .style("top", gY + "px");
          }
        }).on("mouseout", function(d) {
          tooltip.transition()
            .duration(500)
            .style("opacity", 0);   
        });
    });
  }

  function updateData(row, include) {
    var needUpdate = false,
      curData = d3.select(row).data()[0];
    if (curData.included != include) {
      curData.included = include;
      needUpdate = true;
    }
    //  d3.select(row).data().forEach(function (d) {
    //   if (d.included != include) {
    //     d.included = include;
    //     needUpdate = true;
    //   }
    // })
    if (needUpdate) {
      setTimeout(function() {
        // if already start updating, do nothing
        if (startUpdate) return;
        
        startUpdate = true;
        selectCurrentByRow(row);
        updateBlockStatus(true);
        updateMetaAnalysis();
      }, WAIT_TIME);
    } 
  }

  function selectCurrentByRow(row) {
    table = d3.select($(row).parents('table')[0]);
    div = d3.select($(table.node()).parents('div')[3]);
    this.data = table.select('tbody').selectAll('tr').data();
  }

  function selectCurrentByButton(btn, changeUnits) {
    div = d3.select($(btn).parents('div')[3]);
    table = div.select('table');
    this.data = table.select('tbody').selectAll('tr').data();
    if (changeUnits && $(btn).text() == "Switch to Standardized Units") {
      this.displayUnits[div.attr('id')] = UNITS.noramlized;
    } else if (changeUnits) {
      this.displayUnits[div.attr('id')] = UNITS.original;
    }
  }
  
  function updateBlockStatus(block) {
    if (table) {
      // re-render
      toggleBtn = div.selectAll(".toggleCharts");
      sortBtn = div.selectAll(".sortBtn");
      preloader = $(table.node().parentNode.parentNode).find(".preloader");
      
      table.classed('block', block);
    } else {
      // initial render
      toggleBtn = this.selection.selectAll(".toggleCharts");
      sortBtn = this.selection.selectAll(".sortBtn");
      preloader = $(this.selection.node()).find(".preloader");
    }

    toggleBtn.classed('block', block);
    sortBtn.classed('block', block);
    // d3.selectAll(".buttonSidebar").classed('block', block);
    if (block) {
      preloader.fadeIn();
    } else {
      preloader.fadeOut();
    }
    if (demoVersion) {
      updateDemoWidgets(block);
    }
  }
  
  function updateMetaAnalysis() {
    // remove previous result from data
    data = removeOverallEstimate(this.data);
    
    // set aside excluded studies 
    // excluded = [];
    excluded = data.map((d, i) => {
      if (d.hasOwnProperty("included") && !d.included) {
        return {
          'data': d,
          'index': i
        };
      }
    }).filter((d) => d); // remove undefined rows
    data = data.filter((d) => !excluded.map((study) => study.data).includes(d));
    
    // let totalIncluded = data.length;
    // data.forEach(function(d, i) {
    //   if (d.hasOwnProperty("included") && !d.included) {
    //     totalIncluded--;
    //     excluded.push({
    //       "data": data.splice(i, 1),
    //       "index": i
    //     });
    //   }
    // });

    // determine smart default effect size metric for this forest plot
    data = defaultUnits(data);

    // force sequential data processing using promises
    let selectExcluded = Promise.resolve(excluded),
      selectData;
    if (data.length > 1 && !data[0].showOnly) {
      // select result from sensitivity analysis to display
      selectData = Promise.resolve(selectResultForCurrentInclusionSet(data));
      // re-run meta-analysis
      // metaAnalyze(data).then(function(response) {
      //   return fetchData(response);
      // }).then(function(data) {
      //   onAfterUpdateData(data, excluded);
      // }).catch(function(err) {
      //   console.log(err);
      // });
    } else { // no summary
      selectData = Promise.resolve(data);
      // onAfterUpdateData(data, excluded);
    }
    Promise.all([selectData, selectExcluded]).then((values) => {
      [data, excluded] = values;
      onAfterUpdateData(data, excluded);
    }).catch(function(err) {
      console.log(err);
    });
  }

  function onAfterUpdateData(data, excluded) {
    // add excluded studies back to data
    excluded.forEach(function(study) {
      data.splice(study.index, 0, study.data);
    });
    // post-processing and table update
    let selectData = Promise.resolve(updateDataExtent(data));
    Promise.all([selectData]).then((values) => {
      [this.data] = values;
      // lastVisibleRow = getLastVisibleRow();
      // firstVisibleRow = getFirstVisibleRow();
      sort();
      this.lastVisibleRow[this.data[0].plotID] = getLastVisibleRow();
      this.firstVisibleRow[this.data[0].plotID] = getFirstVisibleRow();
      updateTablebody();
      startUpdate = false;
      updateBlockStatus(false);
    }).catch(function(err) {
      console.log(err);
    });
  }

  // remove results of meta-analysis from data
  function removeOverallEstimate(data) {
    let summaryIdx = data.findIndex((d) => (d.hasOwnProperty("summary") && d.summary));
    if (summaryIdx >= 0 && summaryIdx < data.length) {
      data.splice(summaryIdx, 1);
    }
    // data.forEach(function(d, i) {
    //   if (d.hasOwnProperty("summary") && d.summary) {
    //     data.splice(i, 1);
    //   }
    // });
    
    return data;
  }

  function getLastVisibleRow() {
    var reduced = this.data.reduce(function(filtered, d, i) {
      if (d.included || d.summary) {
         filtered.push(i);
      }
      return filtered;
    }, []);
    
    return reduced[reduced.length - 1];
  }
  
  function getFirstVisibleRow() {
    return this.data.findIndex(d => d.included);
  }

  function updateTablebody() {
    // console.log("this.data rendering", this.data);
    
    if (table.select('tbody').empty()) {
      table.append('tbody');
    }

    var tbody = table.select('tbody');

    var rows = tbody.selectAll('tr')
      .data(this.data)
      .join('tr')
      .attr('id', function (row, i) { return getTableRowId(row, i) }) // set id for each row
      .attr('class', function (d, i) {
        if (!d.included && !d.summary) {
          return 'off';
        } else {
          return '';
        }
      });
    // // remove exit set rows
    // rows.exit().remove();

    // // enter rows and set id and class
    // rows.enter()
    //   .append('tr')
    //   .attr('id', function (row, i) { return getTableRowId(row, i) }) // set id for each row
    //   .attr('class', function (d, i) {
    //     if (!d.included && !d.summary) {
    //       return 'off';
    //     } else {
    //       return '';
    //     }
    //   });

    
    // // update id and class for each row
    // rows.attr('id', function (row, i) { return getTableRowId(row, i) }) // set id for each row
    //   .attr('class', function (d, i) {
    //     if (!d.included && !d.summary) {
    //       return 'off';
    //     } else {
    //       return '';
    //     }
    //   })

    // update assignment of data to cells in each row
    var cells = rows.selectAll('td')
      .data(function (row, i) {
        return columns.map(function (c) {
          // compute cell values for this specific row
          var cell = {};
          d3.keys(c).forEach(function (k) {
            cell[k] = typeof c[k] == 'function' ? c[k](row, i) : c[k];
          });
          return cell;
        }).filter(function (c) {
            // show different stats for dichotomous vs continuous outcomes
            return !((studyStats == "Count" && (c.head == "Mean" || c.head == "SD")) || (studyStats == "Mean" && c.head == "Count"));
        });
      })

    cells.join('td')
      .attr('class', function (col) { return col.cl })
      .html(function (col) {
        return col.html;
      })
    // // remove and create new cells
    // cells.exit().remove();
    // cells.enter() 
    //   .append('td')
    //   .attr('class', function (col) { return col.cl })

    // // update html for cells
    // cells.html(function (col) {
    //   return col.html;
    // })

    registerClickEvents();
  }


  // fill in estimates of mean and sd of effect size estimate per study within open cpu session
  async function calculateEstimatesPerStudy(data) {
    // pass data to vectorized unit conversion function in R
    // const url = await ocpu.rpc("calculateEffectSize", {
    const url = await ocpu.rpc("escalcWrapper", {
      jsonData : JSON.stringify(data)
    });

    return(url.split('\n')[0]);
  }

  // fetch data from open cpu given a url
  // Seems silly that open cpu returns a session url rather than the data itself.
  async function fetchData(url) {
    const newData = await fetch("https://cloud.opencpu.org/" + url + "/json")
    .then(function(response) {
      return response.json();
    })
    .then(function(result) {
      return JSON.parse(result.data);
    }).catch(function(err) {
      console.log(err);
    });

    return newData;
  }

  // run every possible meta-analysis with current data
  async function sensitivityAnalysis(data) {
    // pass data to meta-analysis function in R
    const url = await ocpu.rpc("runSensitivityAnalysis", {
      jsonData : JSON.stringify(data)
    });
    
    return(url.split('\n')[0]);
  }
  // // run meta-analysis model to get overall effect size estimate, standard error, and study weights
  // async function metaAnalyze(data) {
  //   // pass data to meta-analysis function in R
  //   const url = await ocpu.rpc("runMetaAnalysis", {
  //     jsonData : JSON.stringify(data)
  //   });
    
  //   return(url.split('\n')[0]);
    
  //   // Here's the math behind the meta-analysis for reference. (difficult to implement vectorized formulas in js)
  //   // w.fixed <- 1 / seES^2
  //   // Q <- sum(w.fixed * ES^2) - sum(w.fixed * ES)^2 / sum(w.fixed)
  //   // tau2 <- (Q - (k - 1)) / (sum(w.fixed) - sum(w.fixed^2) / sum(w.fixed))
  //   // w.random <- 1 / (seES^2 + tau2)
  //   // ES.random   <- weighted.mean(ES, w.random, na.rm = TRUE)
  //   // seES.random <- sqrt(1 / sum(w.random, na.rm = TRUE))
  // }

  // helper function for elementwise comparison of two arrays
  function arrayCompare(_arr1, _arr2) {
    if (
      !Array.isArray(_arr1)
      || !Array.isArray(_arr2)
      || _arr1.length !== _arr2.length
      ) {
        return false;
      }
    
    // .concat() to not mutate arguments
    const arr1 = _arr1.concat().sort();
    const arr2 = _arr2.concat().sort();
    
    for (let i = 0; i < arr1.length; i++) {
        if (arr1[i] !== arr2[i]) {
            return false;
         }
    }
    
    return true;
  }

  function deepCopy(inObject) {
    let outObject, value, key
  
    if (typeof inObject !== "object" || inObject === null) {
      return inObject // Return the value if inObject is not an object
    }
  
    // Create an array or object to hold the values
    outObject = Array.isArray(inObject) ? [] : {}
  
    for (key in inObject) {
      value = inObject[key]
  
      // Recursively (deep) copy for nested objects, including arrays
      outObject[key] = deepCopy(value)
    }
  
    return outObject
  }

  // select the sensitivity analysis results for the current inclusion set
  function selectResultForCurrentInclusionSet(includedStudies) {
    let includedSet = includedStudies.map((study) => study.id).filter((d) => d !== undefined);
    // return deep copy of selected analysis
    return deepCopy(this.sensitivityAnalysis[includedStudies[0].plotID].filter((analysis) => arrayCompare(includedSet, analysis[analysis.length - 1].study_set))[0]);
  } 

  // update the data extent for each study
  function updateDataExtent(data) {
    var standardizedDataExtent = [-0.2, 0.2];
    for (i in data) {
      // calculate extent of 95% CI in STANDARDIZED UNITS for full forest plot
      if (data[i].included || data[i].summary) {   
        var standardizedDataMin = Math.floor((data[i].effectSize - 1.96 * data[i].stdErrEffectSize) * 10) / 10,
          standardizedDataMax = Math.ceil((data[i].effectSize + 1.96 * data[i].stdErrEffectSize) * 10) / 10;
        // update min and max standardized mean difference across studies
        if (standardizedDataMin < standardizedDataExtent[0]) {
          standardizedDataExtent[0] = standardizedDataMin;
        }
        if (standardizedDataMax > standardizedDataExtent[1]) {
          standardizedDataExtent[1] = standardizedDataMax;
        }
      }

      // calculate 95% CI in ORIGINAL UNITS for each row
      // later, we'll adjust this to align the no effect line across charts
      if (data[i].included && !data[i].summary) {
        data[i].originalDataExtent = [Math.floor((data[i].originalEffect - 1.96 * data[i].stdErrOriginalEffect) * 10) / 10, Math.ceil((data[i].originalEffect + 1.96 * data[i].stdErrOriginalEffect) * 10) / 10];
      }

      // set no effect reference line (should be zero for all possible units since we do not use risk ratios)
      data[i].noEffect = 0;
    }
    // second loop to make position of no effect line consistent across charts and to assign same standardized extent for each study
    for (i in data) {
      if (data[i].included && !data[i].summary) {
        // calculate position of no effect line relative to extent of standardized units and original units
        var target = (0 - standardizedDataExtent[0]) / (standardizedDataExtent[1] - standardizedDataExtent[0]),
          position = (0 - data[i].originalDataExtent[0]) / (data[i].originalDataExtent[1] - data[i].originalDataExtent[0]);
        // adjust bounds of original units to align no effect line across charts
        if (target < position) {
          // adjust upper bound
          data[i].originalDataExtent[1] = (0 - data[i].originalDataExtent[0] + target * data[i].originalDataExtent[0]) / target;
        } else if (target > position) {
          // adjust lower bound
          data[i].originalDataExtent[0] = (0 - target * data[i].originalDataExtent[1]) / (1 - target);
        }
      }

      // fill in extent in standardized units for each study
      data[i].standardizedDataExtent = standardizedDataExtent;
    }
    return data;
  }

  function defaultUnits(data) {
    if (data.every(function(d) {
      return d.hasOwnProperty("logRiskRatio");
    })) { 
      // all outcomes are dichotomous (default to log risk ratios)
      data.forEach(function(d) {
        d['standardizedMetric'] = "logRiskRatio"; //"logRiskRatio"
        d['effectSize'] = d.logRiskRatio;
        d['stdErrEffectSize'] = d.stdErrLogRiskRatio;
        // d['standardizedMetric'] = "logOddsRatio"; //"logOddsRatio"
        // d['effectSize'] = d.logOddsRatio;
        // d['stdErrEffectSize'] = d.stdErrLogOddsRatio;
        d['originalMetric'] = "riskDiff";
        d['originalEffect'] = d.riskDiff;
        d['stdErrOriginalEffect'] = d.stdErrRiskDiff;
      });
    } else if (data.every(function(d) {
      return d.hasOwnProperty("SMD") | d.hasOwnProperty("arcsineRiskDiff");
    })) { 
      // all outcomes can be combined as continuous
      data.forEach(function(d) {
        if (d.hasOwnProperty("SMD")) {
          d['standardizedMetric'] = "SMD";
          d['effectSize'] = d.SMD;
          d['stdErrEffectSize'] = d.stdErrSMD;
          d['originalMetric'] = "meanDiff";
          d['originalEffect'] = d.meanDiff;
          d['stdErrOriginalEffect'] = d.stdErrMeanDiff;
        } else if (d.hasOwnProperty("arcsineRiskDiff")) {
          d['standardizedMetric'] = "arcsineRiskDiff";
          d['effectSize'] = d.arcsineRiskDiff;
          d['stdErrEffectSize'] = d.stdErrArcsineRiskDiff;
          d['originalMetric'] = "riskDiff"; 
          d['originalEffect'] = d.riskDiff; 
          d['stdErrOriginalEffect'] = d.stdErrRiskDiff;
        }
      });
    } //else if (data.every(function(d) {
    //   return d.hasOwnProperty("zCor");
    // })) { 
    //   // all outcomes are associations
    //   d['standardizedMetric'] = "zCor";
    //   d['effectSize'] = d.zCor;
    //   d['stdErrEffectSize'] = d.stdErrZCor;
    //   d['originalMetric'] = "pearsonCor";
    //   d['originalEffect'] = d.pearsonCor;
    //   d['stdErrOriginalEffect'] = d.stdErrPearsonCor;
    // }
    
    return data;
  }


  // // encode risk of bias in color and tooltip
  // chart.encodeRiskOfBias = function () {
  //   var studies = table.select('tbody').selectAll('tr')
  //   // apply color encoding
  //   studies.style("background-color", function (d) {
  //     riskOfBias = assignRiskOfBias(d);
  //     var hasRiskOfBias = riskOfBias >= 0;
  //     d3.select(this).select('.extract').classed('invisible', !hasRiskOfBias);
  //     return hasRiskOfBias ? d3.interpolateReds(riskOfBias) : "transparent"; 
  //   });
  //   // show text on hover
  //   studies.on("mouseover", function(d) {
  //     riskOfBias = assignRiskOfBias(d);

  //     let html = d[sourceOfBias.fieldToCheck] === undefined ? "" : "<i>" + sourceOfBias.question + "</i><br/><span style='font-weight:bolder; color:" + (riskOfBias >= 0 ? d3.interpolateReds(riskOfBias) : "black") + ";'>" + d[sourceOfBias.fieldToCheck] + "</span>" + (d[sourceOfBias.fieldToCheck + "_note"] === undefined || d[sourceOfBias.fieldToCheck + "_note"] === "" ? "" : "&ensp; note: " + d[sourceOfBias.fieldToCheck + "_note"])
  //     let gX = d3.event.pageX;
  //     let gY = d3.event.pageY;
  //     if (html.length > 0 && shouldTooltipOn(gX, this)) {
  //       tooltip.transition()
  //        .duration(200)
  //        .style("opacity", .9)
  //        .style("padding", "10px")
  //       tooltip.html(html)
  //        .style("left", gX + "px")
  //        .style("top", gY + "px");
  //     }
  //   }).on("mouseout", function(d) {
  //     tooltip.transition()
  //          .duration(500)
  //          .style("opacity", 0);   
  //   })
        
  //   var studiesWithBias = table.select('tbody').selectAll('.extract:not(.invisible)');
  //   studiesWithBias.on('click', function(d) {
  //       localStorage.setItem("documentId", d.name);
  //       localStorage.setItem("downloadURL", d.downloadURL);
        
  //       var target = sourceOfBias.questionId;
  //       window.location = extractionPage + '#' + target;
  //   });
    
  // }
  
  function shouldTooltipOn(x, tr) {
      var chartRect = d3.select(tr).select('td.chart').node().getBoundingClientRect();
      return x < chartRect.left;
  }

  // // assign risk of bias [0, 1], where 1 is most severe possible bias (rating different potential sources of bias on this scale may require expert guidance)
  // function assignRiskOfBias(row) {
  //   if (row[sourceOfBias.fieldToCheck] == "yes") {
  //     return 0.7;
  //   } else if (row[sourceOfBias.fieldToCheck] == "notSure") {
  //     return 0.35;
  //   } else {
  //     return -1; // dummy code for no color
  //   }
  // }


  // calculate 95% CI
  function confint(d) {
    return [
      Math.round((d.originalEffect - 1.96 * d.stdErrOriginalEffect) * 100) / 100,
      Math.round((d.originalEffect + 1.96 * d.stdErrOriginalEffect) * 100) / 100
    ];
  }

  // set width based on current window
  function updateDimensions(winWidth) {
    width = winWidth - margin.left - margin.right;
  }

  // getter and setter functions
  chart.margin = function (_) {
    if (!arguments.length) return margin;
    margin = _;
    return chart;
  };

  chart.width = function (_) {
    if (!arguments.length) return width;
    width = _;
    return chart;
  };

  chart.height = function (_) {
    if (!arguments.length) return height;
    height = _;
    return chart;
  };

  chart.init = function (_) {
    if (!arguments.length) return init;
    init = _;
    return chart;
  };

  // chart.sourceOfBias = function (_) {
  //   if (!arguments.length) return sourceOfBias;
  //   sourceOfBias = _;
  //   return chart;
  // };

  chart.label = function (_) {
    if (!arguments.length) return label;
    label = _;
    return chart;
  };

  // chart.index = function (_) {
  //   if (!arguments.length) return this.index;
  //   this.index = _;
  //   return chart;
  // };

  return chart;
}