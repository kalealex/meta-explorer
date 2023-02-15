var resultInputIdList = ["measurementNotes", "effectSizeNotes", 
   "independentVariable", "howIndependentVariableDefined",
   "dependantVariable", "howDependantVariableDefined",
   "durationOrDoseInput",
   "timePoint", "timePointUnit",
   "confidenceLevelValue", "nameForAdjustedForCovariates"];

var effectSizeTable;
var effectSizeTableData = [];
var effectSizeTableColumns = [
   {field: 'condition', title: 'Condition'}, 
   {field: 'timePoint', title: 'Time Point'},
   {field: 'sampleSize', title: 'Sample Size (n)', cellStyle: 'cellStyle'}, 
   {field: 'count', title: 'Count'}, 
   {field: 'proportion', title: 'Proportion'}, 
   {field: 'mean', title: 'Mean'}, 
   {field: 'meanDifference', title: 'Mean Difference', cellStyle: 'cellStyle'}, 
   {field: 'sd', title: 'Standard Deviation'},   
   {field: 'separatedSDErrors', title: "Standard Errors"},
   {field: 'pooledSD', title: 'Pooled Standard Deviation', cellStyle: 'cellStyle'},   
   {field: 'sdError', title: 'Standard Error', cellStyle: 'cellStyle'},  
   {field: 'resStdErr', title: 'Residual Standard Error', cellStyle: 'cellStyle'},  
   {field: 'tValue', title: 't-value', cellStyle: 'cellStyle'}, 
   {field: 'fValue', title: 'F-value', cellStyle: 'cellStyle'}, 
   {field: 'pValue', title: 'p-value', cellStyle: 'cellStyle'}, 
   {field: 'ciLower', title: 'Confidence <br/> Interval <br/> Lower limit', cellStyle: 'cellStyle'}, 
   {field: 'ciUpper', title: 'Confidence <br/> Interval <br/> Upper limit', cellStyle: 'cellStyle'}, 
   {field: 'regressionCoefficient', title: 'Intervention effect', cellStyle: 'cellStyle'},  
   {field: 'numOfCovariates', title: 'Number of model parameters', cellStyle: 'cellStyle'}, 
   {field: 'rSquared', title: 'R<sup>2</sup> or proportion of variance explained', cellStyle: 'cellStyle'}, 
   {field: 'repeatedMeasures', title: 'Repeated measures correlation', cellStyle: 'cellStyle'}, 
   {field: 'operate', title: 'Delete', align: 'center', clickToSelect: false, 
      events: window.operateEvents, formatter: operateFormatter}];

var fieldsToMergeCells = 
  ['meanDifference', 'pooledSD', 'sdError', 'tValue', 'fValue', 'pValue', 'ciLower', 'ciUpper', 'regressionCoefficient', 'numOfCovariates', 'rSquared', 'repeatedMeasures' ];

var resultId = "";

function initResultView(resultIndex) {
   resultId = resultIndex;
   createTable();
   updateEffectSizeTableColumns();
   setUpEvents();
   initAssessmentQuestions();
   $("warningDiv").empty();
}

function updateOutcomeofInterest(currentValue) {
  $('#outcomeOfInterestAlert').hide();
  if (currentValue == "dichotomous" || currentValue== 'continuous') {
       updateExtractionIcon("measurement_6_extraction", true);  
  } else if (currentValue == "correlation" || currentValue == "rate" || currentValue == "survival") {
       $('#outcomeOfInterestAlert').show();  
       updateExtractionIcon("measurement_6_extraction", true);  
  } else {
       updateExtractionIcon("measurement_6_extraction", false);   
  }
  
  // update effect size questions depending on 'adjustConfounding' list
  updateEffectSizeQuestions();
}

function updateEffectSizeQuestions() {
   $('#effectSize_2_dichotomous_extraction').hide();  
   $('#effectSize_2_continous_extraction').hide();   
   $('#effectSize_4_extraction').hide();
   $("#effectSize_4_manual").hide();
   $('#effectSize_5_extraction').hide();
   $('#effectSize_6_extraction').hide();
   $('#effectSize_6_manual').hide();
   $('#standardErrorPanel').hide();
   $('#residualStandardError').hide();
   let outcomeOfInterest = $('input[name="outcomeOfInterest"]:checked').val();

   if (outcomeOfInterest == 'continuous') {
      $('#effectSize_2_continous_extraction').show();
   }

   if (outcomeOfInterest == 'dichotomous') {
      $('#effectSize_2_dichotomous_extraction').show();
   }

   if ($('#includedAsCovariatesInStatModel').is(":checked")) {
       $('#effectSize_5_extraction').show();
       $('#effectSize_6_extraction').show();
       $('#effectSize_6_manual').show();
       if (outcomeOfInterest == 'continuous') {
          $('#residualStandardError').show();
          $('#effectSize_4_extraction').show();
          $("#effectSize_4_manual").show();
          //$('#effectSize_4_extraction span.number').text('2'); 
          //$('#effectSize_4_manual span.number').text('2'); 
          //$('#effectSize_5_extraction span.number').text('3');
          //$('#effectSize_6_extraction span.number').text('4');
          //$('#effectSize_6_manual span.number').text('4'); 
       }
   } 

   if ($('#matchedOnConfoundingVariables').is(":checked")) {
      $('#effectSize_6_extraction').show();
      $('#effectSize_6_manual').show();
      $('#standardErrorPanel').show();
       if (outcomeOfInterest == 'continuous') {
         $('#standardError').show();
         $('#effectSize_4_extraction').show();
         $("#effectSize_4_manual").show();
         //$('#effectSize_4_extraction span.number').text('3'); 
         //$('#effectSize_4_manual span.number').text('3'); 
         //$('#effectSize_6_extraction span.number').text('4'); 
         //$('#effectSize_6_manual span.number').text('4');
       }
   } 

   if ($('#randomAssignment').is(":checked")) {
      if (outcomeOfInterest == 'continuous') {
         $('#effectSize_4_extraction').show();
         $("#effectSize_4_manual").show();
      }
   }

   resetNumberingEffectSizeQuestions();

}

function resetNumberingEffectSizeQuestions() {
   // reset 'numbering for effect size questions
   let i = $("#effectSize_1_extraction").is(":visible") ? 2 : 1
   if ($('#effectSize_2_dichotomous_extraction').is(":visible")) {
      $('#effectSize_2_dichotomous_extraction span.number').text(i);
      i += 1;
   } else if ($('#effectSize_2_continous_extraction').is(":visible")) {
      $('#effectSize_2_continous_extraction span.number').text(i);
      i += 1;
   }

   if ($('#effectSize_4_extraction').is(":visible")) {
      $('#effectSize_4_extraction span.number').text(i);
      $('#effectSize_4_manual span.number').text(i); 
      i += 1;
   }

   if ($('#effectSize_5_extraction').is(":visible")) {
      $('#effectSize_5_extraction span.number').text(i);
      i += 1;
   }

   if ($('#effectSize_6_extraction').is(":visible")) {
      $('#effectSize_6_extraction span.number').text(i);
      $('#effectSize_6_manual span.number').text(i);
   }
}

function showOrHideClusterDifferences(show) {
   let widgets = $('.confoundingVarCheckbox').toArray();
   if (widgets.length == 0) return;

   let widget = $('.confoundingVarCheckbox').toArray().filter(box => {
      return $(box).val() == "Cluster differences"
   });

   if (show && widget.length == 0) {
      addConfoundingVariable("Cluster differences", false);
   } else if (!show && widget.length == 1) {
      // remove
      let checkboxToRemove = widget[0];
      $(checkboxToRemove).parent().remove();
      onCovariatesListChange();
   }
}

function addConfoundingVariable(confoundingVariable, checked) {
   let allowDelete = (confoundingVariable != 'Individual differences' && confoundingVariable != 'Cluster differences')
   let deleteWidget =  allowDelete ? '<span class="confoundingVarDelete ml-3">x</span>' : '';
   let widget = '<div class="form-check mr-3"><input type="checkbox" class="form-check-input confoundingVarCheckbox" value="' + confoundingVariable + '"' + 
       checked + '>' + 
       '<label class="form-check-label">' + confoundingVariable + '</label>' + 
       deleteWidget + '</div>'
   
   $("#covariatesList").append(widget);
   
   $('.confoundingVarCheckbox').off('change');
   $('.confoundingVarCheckbox').change(function() {
      onCovariatesListChange();
   }); 

   $('.confoundingVarDelete').off('change');
   $('.confoundingVarDelete').click(function() {
      $(this).parent().remove();
      onCovariatesListChange();
      writeCovariatesListPerStudy();
   }); 
}

function onCovariatesListChange() {
  updateEffectSizeTableColumns(true);
  let covariatesList = getCheckedCovariatesList();
  writeResultData(resultId, "covariatesList", covariatesList); 
  readUserDataWithPromise().then(userData => {
      let covariatesListFromStudies = userData.covariatesListFromStudies;
      if (!covariatesListFromStudies) {
         covariatesListFromStudies = [];
      }
      covariatesList.forEach (covariate => {
        if (!covariatesListFromStudies.includes(covariate)) {
            covariatesListFromStudies.push(covariate);
        }
      });
      writeUserData("covariatesListFromStudies", covariatesListFromStudies);
  });   
  readDocumentDataWithPromise(getCurrentDocId()).then(docData => {
     // update only if already exists.
     if (docData.covariatesListPerStudy) {
      writeCovariatesListPerStudy();
     }
  });
}

function writeCovariatesListPerStudy() {
   let list = $("#covariatesList .confoundingVarCheckbox").toArray()
     .map(widget => $(widget).val());
   writeData('covariatesListPerStudy', list);
}


function getCheckedCovariatesList() {
    return $("#covariatesList .confoundingVarCheckbox").toArray()
      .filter(widget => $(widget).is(':checked'))
      .map(widget => $(widget).val());
}

function updateTimeScheduleForMeasurementPanel(currentValue) {
   if (currentValue == 'onePointMeasurement') {
      $("#onePointMeasurementPanel").show();
      $("#multiplePointsMeasurementPanel").hide();
      if ( $("#yesPanel").is(":visible")) {
         onYesPanelShown();   
      } else {
         updateExtractionIcon("measurement_8_extraction", true);  
      }
   } else if (currentValue == 'multiplePointsMeasurement') {
      $("#onePointMeasurementPanel").hide();
      $("#multiplePointsMeasurementPanel").show();
      updateExtractionIcon("measurement_8_extraction",  hasValue('.m_timePoint'));
   } 
}

function updateYesPanel(currentValue) {
   if (currentValue == 'yes') {
      $("#yesPanel").show();
      onYesPanelShown();
   } else {
      $("#yesPanel").hide();
      if ($("#onePointMeasurementPanel").is(":visible")) {
        updateExtractionIcon("measurement_8_extraction", true);
      }
   }   
}

function onYesPanelShown() {
   // check timePoint and timePointUnit
    var completed = ($("#timePoint").val().length > 0 || $("#timePointUnit").val().length > 0);
    updateExtractionIcon("measurement_8_extraction", completed);      
}

function updateGroupEffectsPanel(currentValue) {
   if (currentValue == 'groupEffectsReported') {
       $("#groupEffectsReportedPanel").show();
       if ($("#differentGroupsPanel").is(":visible")) {
          onDifferentGroupsPanelShown();
       } else {
          updateExtractionIcon("measurement_9_extraction", true); 
       }
   } else {
       $("#groupEffectsReportedPanel").hide();
       updateExtractionIcon("measurement_9_extraction", true);
   }   
}

function updateGroupEffectsInterestPanel(currentValue) {
   if (currentValue == 'differentGroups') {
       $("#differentGroupsPanel").show();
       onDifferentGroupsPanelShown();
   } else {
       $("#differentGroupsPanel").hide();
       updateExtractionIcon("measurement_9_extraction", true);
   }   
}

function onDifferentGroupsPanelShown() {
   var completed = hasValidGroupingFactorData();
   updateExtractionIcon("measurement_9_extraction", completed);   
}

function updateSampleSizeAlert(currentValue) {
  if (currentValue == 'neitherSampleSize') {
     $('#neitherSampleSizeAlert').show();
  } else {
     $('#neitherSampleSizeAlert').hide();
  }
}

function updateCountOrProportionAlert(currentValue) {
  if (currentValue == 'neitherCountOrProportion') {
     $('#neitherCountOrProportionAlert').show();
  } else {
     $('#neitherCountOrProportionAlert').hide();
  }
}

function updateMeanReportAlert(currentValue) {
  if (currentValue == 'neitherMeanReport') {
     $('#neitherMeanReportAlert').show();
  } else {
     $('#neitherMeanReportAlert').hide();
  }
}

function updateReliabilityReport(currentValue) {
  $('#pValuePanel').hide();
  $('#confidenceIntervalPanel').hide();
  $('#noneReliabilityReportError').hide();
  if (currentValue == 'pValue') {
     $('#pValuePanel').show();
  } else if (currentValue == 'confidenceInterval' ) {
     $('#confidenceIntervalPanel').show();
  } else  if (currentValue == 'none') {
     $('#noneReliabilityReportError').show();
  }
  
  updateExtractionIcon("effectSize_4_extraction", true);      
}

function displayResultData(data, docData, resultDataList, measurementsData, userData) {
  if (data.durationOrDose) {
    var durationOrDose = data.durationOrDose;
    $('input:radio[name="durationOrDose"][value="'+ durationOrDose +'"]').prop('checked', true);
    if (durationOrDose == 'yesDurationOrDose') {
       $('#yesDurationOrDosePanel').show();
    } else {
       $('#yesDurationOrDosePanel').hide();		   
    }
  }
  
  if (data.outcomeOfInterest) {
    var outcomeOfInterest = data.outcomeOfInterest;
    $('input:radio[name="outcomeOfInterest"][value="'+ outcomeOfInterest +'"]').prop('checked', true);
    updateOutcomeofInterest(outcomeOfInterest);
  } else {
    updateOutcomeofInterest('');  
  }
    
  if (data.betweenOrWithinSubjects) {
    var betweenOrWithinSubjects = data.betweenOrWithinSubjects;
    $('input:radio[name="betweenOrWithinSubjects"][value="'+ betweenOrWithinSubjects +'"]').prop('checked', true);
    updateExtractionIcon("measurement_7_extraction", true);
    updateEffectSizeFirstQuestion();
  } else {
    updateExtractionIcon("measurement_7_extraction", false);  
  }
  
  if (data.timeScheduleForMeasurement) {
     var timeScheduleForMeasurement = data.timeScheduleForMeasurement;
     $('input:radio[name="timeScheduleForMeasurement"][value="'+ timeScheduleForMeasurement +'"]').prop('checked', true);   
     updateTimeScheduleForMeasurementPanel(timeScheduleForMeasurement);  
  } else { // nothing selected yet
     updateExtractionIcon("measurement_8_extraction", false);  
   }
  
  if (data.onePointMeasurementReport) {
     var onePointMeasurementReport = data.onePointMeasurementReport;
     $('input:radio[name="onePointMeasurementReport"][value="'+ onePointMeasurementReport +'"]').prop('checked', true);   
     updateYesPanel(onePointMeasurementReport); 
  }
  
  if (data.multiplePointsMeasurementReport) {
     var multiplePointsMeasurementReport = data.multiplePointsMeasurementReport;
     $('input:radio[name="multiplePointsMeasurementReport"][value="'+ multiplePointsMeasurementReport +'"]').prop('checked', true);   
  }
  
  if (data.groupEffects) {
     var groupEffects = data.groupEffects;
     $('input:radio[name="groupEffects"][value="'+ groupEffects +'"]').prop('checked', true);   
     updateGroupEffectsPanel(groupEffects);       
  } else {
     updateExtractionIcon("measurement_9_extraction", false);    
  }
  
  if (data.groupEffectsInterest) {
     var groupEffectsInterest = data.groupEffectsInterest;
     $('input:radio[name="groupEffectsInterest"][value="'+ groupEffectsInterest +'"]').prop('checked', true);   
     updateGroupEffectsInterestPanel(groupEffectsInterest);       
  }
  
  if (data.sampleSizeReport) {
    var sampleSizeReport = data.sampleSizeReport;
    $('input:radio[name="sampleSizeReport"][value="'+ data.sampleSizeReport +'"]').prop('checked', true);
    updateSampleSizeAlert(sampleSizeReport);
  }
  
  if (data.countOrProportion) {
    $('input:radio[name="countOrProportion"][value="'+ data.countOrProportion +'"]').prop('checked', true);
    updateCountOrProportionAlert(data.countOrProportion);
  }
  
  if (data.meanReport) {
    $('input:radio[name="meanReport"][value="'+ data.meanReport +'"]').prop('checked', true);
    updateMeanReportAlert(data.meanReport);
  }
  
  if (data.reliabilityReport) {
    $('input:radio[name="reliabilityReport"][value="'+ data.reliabilityReport +'"]').prop('checked', true);
    updateReliabilityReport(data.reliabilityReport);   
  } else {
    updateExtractionIcon("effectSize_4_extraction", false);   
  }
  
  if (data.pValueTailed) {
    $('input:radio[name="pValueTailed"][value="'+ data.pValueTailed +'"]').prop('checked', true);  
  }
  
  if (data.effectSizeTableData) {
     // used to be 'ci' for confidence interval e.g. (-7.3, -0.7)
     let needToSave = false
     data.effectSizeTableData.forEach (row => {
        if (row.ci && !row.ciLower && !row.ciUpper) {
           let ci = row.ci.replace('(', '').replace(')', '')
           let splitted = ci.split(",")
           if (splitted.length == 2) {
             row.ciLower = splitted[0]
             row.ciUpper = splitted[1]
           } 
           needToSave = true
        } else if (row.ci == "" && !row.ciLower && !row.ciUpper) {
           row.ciLower = ''
           row.ciUpper = ''
           needToSave = true
        }
     }) 
     effectSizeTableData = data.effectSizeTableData
     if (needToSave)
       writeResultData(resultId, "effectSizeTableData", effectSizeTableData);

     effectSizeTable.bootstrapTable('load', effectSizeTableData); 
     updateExtractionIcon("effectSize_7_extraction", isTableCompleted());
  } 
  $("#timePointWidgetList").empty();
  if (data.multipleTimePointData) {
    var multipleTimePointData = data.multipleTimePointData;
    multipleTimePointData.forEach(function(timePointUnitData) {
        addTimePointWidget(timePointUnitData);
    });
    
    updateExtractionIcon("measurement_8_extraction", multipleTimePointData.length > 0);
  }
  if ($("#timePointWidgetList").is(':empty')) {
     // make sure that there's at least one time point widget
     addTimePointWidget("");
     updateExtractionIcon("measurement_8_extraction", false);
  } 
  
  $("#groupingFactorWidgetList").empty();
  var needToUpdate = false;
  if (data.groupingFactors) {
    var groupingFactors = data.groupingFactors;
    // figure out which grouping factor should be updated
    var id = "groupingFactors";
    var savedGroupingFactors = measurementsData[id];
    if (!savedGroupingFactors) {
         savedGroupingFactors = []; 
    }
    var listToUpdate = savedGroupingFactors.filter(savedGroup => groupingFactors.find(group => sameGroupingFactor(savedGroup, group)));
    needToUpdate = listToUpdate.length > 0;
    if (needToUpdate) {
      // update with the current grouping factor
      listToUpdate.forEach(groupToUpdate => {
        var index = groupingFactors.findIndex(group => sameGroupingFactor(groupToUpdate, group));
        if (index >= 0) {
           groupingFactors.splice(index, 1, groupToUpdate);
        }
      });
      writeResultData(resultId, "groupingFactors", groupingFactors);
    }
    
    groupingFactors.forEach(function(groupingFactor) {
        addGroupingFactorWidget(groupingFactor.factor, groupingFactor.levels);
    });
    if ($("#differentGroupsPanel").is(':visible')) {
        updateExtractionIcon("measurement_9_extraction", hasValidGroupingFactorData());
    } 
  }
  if ($("#groupingFactorWidgetList").is(':empty')) {
     // make sure that there's at least one grouping factor widget
     addGroupingFactorWidget("", []);
     if ($("#differentGroupsPanel").is(':visible')) {
       updateExtractionIcon("measurement_9_extraction", false);
     }
  } 
  
  $("#covariatesList").empty();
  let variableSet = new Set();
  variableSet.add('Individual differences'); // add by default

  let resultDataCovariatesList = data.covariatesList;
  if (docData.covariatesListPerStudy) {
     docData.covariatesListPerStudy.forEach(variable => variableSet.add(variable));
  } else if (userData.confoundingVariableList || userData.covariatesListFromStudies || resultDataCovariatesList) {
    // add variables from other study results data
    if (userData.confoundingVariableList) { // defined in scoping view.
        userData.confoundingVariableList.forEach(variable => variableSet.add(variable))
    }
    if (userData.covariatesListFromStudies) { // list from all study results
        userData.covariatesListFromStudies.forEach(variable => variableSet.add(variable))
    }
    
    if (resultDataCovariatesList) {
        resultDataCovariatesList.forEach(variable => variableSet.add(variable))
    } 
  }

  // TODO: probably not needed, since it's already done in extraction.js
  if (docData.adjustConfounding && !docData.adjustConfoundingList) {
   docData.adjustConfoundingList = [docData.adjustConfounding];
   writeData("adjustConfoundingList", docData.adjustConfoundingList)
  }
  if (docData.adjustConfoundingList && docData.adjustConfoundingList.includes('randomAssignment') && docData.randomization == 'clusterRandomization') {
   variableSet.add('Cluster differences');
  } else {
   variableSet.delete('Cluster differences');
  }

  if (!resultDataCovariatesList) {
     resultDataCovariatesList = [];
  }
    
  variableSet.forEach(function(confoundingVariable) {
    let checked = resultDataCovariatesList.includes(confoundingVariable) ? 'checked' : '';
    addConfoundingVariable(confoundingVariable, checked);
  });

  
  // Note: this should be called after all other udpates, since 
  // 'updateExtractionIconForResultTextInput' method checks other input status.
  resultInputIdList.forEach (function(inputId) {
    var value = data[inputId];
    if (value && value.length > 0) {
      $('#' + inputId).val(data[inputId]);
      if (inputId == 'measurementNotes' || inputId == 'effectSizeNotes') {
         $('#' + inputId).show();
      }
      updateExtractionIconForResultTextInput(inputId, true);
    } else {
      $('#' + inputId).val("");
      updateExtractionIconForResultTextInput(inputId, false);
    }
  });
  
  assessmentQuestionsForResult.forEach (function(questionId) {
      var inputId = getInputNoteId(questionId);
      if (data[inputId]) {
        $('#' + inputId).val(data[inputId]);
      }
      updateAlertDiv(questionId, data[questionId]);
      
      var checkedValue = data[questionId];
      if (checkedValue) {
        $('input:radio[name="' + questionId + '"][value="'+ checkedValue + '"]').prop('checked', true);
        updateAssessmentIcon(questionId);
      } else {
        $('input:radio[name="' + questionId + '"]').prop('checked', false);  
      }
  }); 
  
  // measurementsData
  Object.keys(measurementsData).forEach(key => {
      updateDataList(key, measurementsData[key]);
  });
  
  // should call this method after updating all other UI: update visible state for effect size table columns
  updateEffectSizeTableColumns(needToUpdate);
  
  if (docData) {
    markReviewCompleted(docData, resultDataList);
  }
}

function groupFieldName(group) {
   return "group_" + group.factor;
}

function updateEffectSizeTableColumns(requireUpdate) {
  // group
  var groupEffects = $('input[name="groupEffects"]:checked').val();
  var groupEffectsInterest = $('input[name="groupEffectsInterest"]:checked').val();
  var showGroup = (groupEffects == 'groupEffectsReported' && groupEffectsInterest == 'differentGroups');  
  var groupList = [];
  var newColumns = effectSizeTableColumns;
  var groupColumns = [];
  if (showGroup) {
     groupList = groupingFactorData().filter(group => group && group.levels.length >= 2);
     groupColumns = groupList.map((group, index) => {
       // capitalize the first character
       var titleString = group.factor.charAt(0).toUpperCase();
       if (group.factor.length > 1) {
          titleString += group.factor.slice(1);   
       }
       return {field: groupFieldName(group), title: titleString};
     });
     if (groupColumns.length > 0) {
       newColumns = effectSizeTableColumns.slice(0, 1).concat(groupColumns).concat(effectSizeTableColumns.slice(1));
     }
  }
  
  // refresh table with the columns
  effectSizeTable.bootstrapTable('refreshOptions', {columns: newColumns});
  groupColumns.forEach(groupColumn => updateEffectSizeTableColumn(groupColumn.field, showGroup));      
 
  var outcomeOfInterest = $('input[name="outcomeOfInterest"]:checked').val();
  var isDichotomous =  (outcomeOfInterest == 'dichotomous');
  var isContinuous = (outcomeOfInterest == 'continuous');
  var sampleSizeReport = $('input[name="sampleSizeReport"]:checked').val()
  var meanReport = getMeanReportValue();
  var reliabilityReport =  $('input[name="reliabilityReport"]:checked').val();
  
  // condition
  var conditionColumnVisible = isDichotomous
      || (sampleSizeReport == 'separateSampleSize')
      || (meanReport == 'meanOutcome')
      || (reliabilityReport == 'separatedStandardDeviations')
      || (reliabilityReport == 'separatedStandardErrors')   
  updateEffectSizeTableColumn('condition', conditionColumnVisible);
  
  // count or proportion
  var countOrProportion = getCountOrProportionValue();
  updateEffectSizeTableColumn('count', isDichotomous && (countOrProportion == 'count'));
  updateEffectSizeTableColumn('proportion', isDichotomous && (countOrProportion == 'proportion'));
      
  // mean or mean difference     
  updateEffectSizeTableColumn('mean', isContinuous && (meanReport == 'meanOutcome'));   
  updateEffectSizeTableColumn('meanDifference', isContinuous && (meanReport == 'meanDiff'));  
  
  let isConfoundingAdjustedInStatModel = $('#effectSize_5_extraction').is(':visible');
  // Standard Deviation     
  updateEffectSizeTableColumn('sd', isContinuous && (reliabilityReport == 'separatedStandardDeviations'));  
  // Separated Standard Errors
  updateEffectSizeTableColumn('separatedSDErrors', isContinuous && (reliabilityReport == 'separatedStandardErrors'));  
  // Pooled Standard Deviation
  updateEffectSizeTableColumn('pooledSD', isContinuous && (reliabilityReport == 'pooledStandardDeviations'));  
  // Standard Error
  updateEffectSizeTableColumn('sdError', isContinuous && (reliabilityReport == 'standardError') && !isConfoundingAdjustedInStatModel);  
  // Residual Standard Error
  updateEffectSizeTableColumn('resStdErr', isContinuous && (reliabilityReport == 'residualStandardError') && isConfoundingAdjustedInStatModel);  
  // t-value
  updateEffectSizeTableColumn('tValue', isContinuous && (reliabilityReport == 'tValue'));  
  // F-value
  updateEffectSizeTableColumn('fValue', isContinuous && (reliabilityReport == 'fValue'));  
  // p-value
  updateEffectSizeTableColumn('pValue', isContinuous && (reliabilityReport == 'pValue'));  
  // confidence level
  let showConfidenceLevel = isContinuous && (reliabilityReport == 'confidenceInterval')
  updateEffectSizeTableColumn('ciLower', showConfidenceLevel);  
  updateEffectSizeTableColumn('ciUpper', showConfidenceLevel);  
  
  // Intervention effect
  updateEffectSizeTableColumn('regressionCoefficient', isConfoundingAdjustedInStatModel);  
  // Number of model parameters
  updateEffectSizeTableColumn('numOfCovariates', isConfoundingAdjustedInStatModel);  
  // R2 or proportion of variance explained
  updateEffectSizeTableColumn('rSquared', isConfoundingAdjustedInStatModel);  
  // repeatedMeasures
  updateEffectSizeTableColumn('repeatedMeasures', isWithinSubjects());  

  
  // timePoint
  var timeScheduleForMeasurement = $('input[name="timeScheduleForMeasurement"]:checked').val();
  var multiplePointsMeasurementReport = $('input[name="multiplePointsMeasurementReport"]:checked').val();
  var showTime = (timeScheduleForMeasurement == 'multiplePointsMeasurement' && multiplePointsMeasurementReport == 'multiplePointsInTime');   
  var timePointList = (showTime) ? getTimePoints() : [];
  updateEffectSizeTableColumn('timePoint', timePointList.length > 0);

  
  // operate column
  var enabled = isSampleSizeFirstVisibleColumn();
  updateEffectSizeTableColumn('operate', enabled);
  
  if (requireUpdate) {
    effectSizeTableData = updateTableData(groupList, timePointList, conditionColumnVisible); 
   
    effectSizeTable.bootstrapTable('load', effectSizeTableData);   
    writeResultData(resultId, "effectSizeTableData", effectSizeTableData);
    updateExtractionIcon("effectSize_7_extraction", isTableCompleted());
  }
  
   // merge cells
   mergeCells(conditionColumnVisible, groupList, timePointList, sampleSizeReport);
   // Add Data button
   $("#addDataBtn").attr("disabled", !enabled);

   // update complete check button   
   updateCompleteCheckButton();
}

function getMeanReportValue() {
  let isMeanReportVisible = $('#effectSize_2_continous_extraction').is(':visible');
  return isMeanReportVisible ? $('input[name="meanReport"]:checked').val() : '';   
}

function getCountOrProportionValue() {
  let isCountOrProportionVisible =  $('#effectSize_2_dichotomous_extraction').is(':visible');
  return isCountOrProportionVisible ? $('input[name="countOrProportion"]:checked').val() : '';
}

function mergeCells(conditionColumnVisible, groupList, timePointList, sampleSizeReport) {
  if (conditionColumnVisible) {
     // when conditionColumnVisible is true,
     // meanDiff, pooledSD, standard error, tValue, fValue, pValue, and ci columns should be just one row
     if ( timePointList.length <= 1 && groupList.length == 0 ) {
         fieldsToMergeCells.forEach(fieldName => effectSizeTable.bootstrapTable('mergeCells', 
           {index: 0, field: fieldName, rowspan: effectSizeTableData.length })) 
         if (sampleSizeReport == 'overallSampleSize') {
             effectSizeTable.bootstrapTable('mergeCells', 
               {index: 0, field: 'sampleSize', rowspan: effectSizeTableData.length });
         }
     } 
     
     var numIntervals = effectSizeTableData.length / 2;
     if (numIntervals > 1) {
        // condition column: intervention and control
        effectSizeTable.bootstrapTable('mergeCells', {index: 0, field: 'condition', rowspan: numIntervals });
        effectSizeTable.bootstrapTable('mergeCells', {index: numIntervals, field: 'condition', rowspan: effectSizeTableData.length });
     } 
  } 
  
  // merge cells for group and timePoint
  var numTimePoints = timePointList.length;
  // total number of group levels
  var numGroupLevels = groupList.reduce(((total, currentGroup) => total * currentGroup.levels.length), 1);
  var totalRows = (numTimePoints > 0) ? numGroupLevels * numTimePoints : numGroupLevels;
  totalRows = conditionColumnVisible ? totalRows * 2 : totalRows;
  
  var numGroups = groupList.length;
  if (numGroups > 0) {
      // calculate how many rows should be merged for each group
      var startVal = numTimePoints > 0 ? numTimePoints : 1;
      var numMergeCellsList = groupList.map((group, groupIndex) => calculateNumMergeCells(groupList, groupIndex + 1, startVal));
      numMergeCellsList.forEach((numMergeCells, i) => {
          var currentGroup = groupList[i];
          var fieldName = groupFieldName(currentGroup);
          var numLevels = currentGroup.levels.length;
          var numIterations = totalRows / (numMergeCells * numLevels);
          var j = 0;
          while (j < numIterations) {
            currentGroup.levels.forEach((level, levelIndex) => {
              var indexStart = (levelIndex * numMergeCells) + (j * numMergeCells * numLevels);
              effectSizeTable.bootstrapTable('mergeCells', {index: indexStart, field: fieldName, rowspan: numMergeCells });
            });
            j += 1;
          }
      });
      
      if (numTimePoints == 1) {
          numTimePoints = conditionColumnVisible ? numTimePoints * 2 : numTimePoints;
          var i = 0;
          while (i < numTimePoints) {
             effectSizeTable.bootstrapTable('mergeCells', {index: (i * numGroupLevels), field: 'timePoint', rowspan: numGroupLevels });
             i += 1;
          }
      }
  } 
}

function calculateNumMergeCells(groupList, index, numTimePoints) {
    if (index < groupList.length) {
      var subgroups = groupList.slice(index);
      return numTimePoints * subgroups.reduce(((accumulator, currentGroup) => accumulator * currentGroup.levels.length), 1);
    }
    return numTimePoints;
}

function updateTableData(groupList, timePointList, conditionColumnVisible) {
  var conditionColumn = 'condition';
  var interventionRow = 'Intervention';
  var controlRow = 'Control';
  // add intervention and control rows if they don't exist yet
  if (conditionColumnVisible) {
      var hasInterventionRow = effectSizeTableData.find(row => row[conditionColumn] == interventionRow);
      if (!hasInterventionRow) {
          var row = createNewRow();
          row[conditionColumn] = interventionRow;
          effectSizeTableData.push(row);
      }
      var hasControlRow = effectSizeTableData.find(row => row[conditionColumn] == controlRow);
      if (!hasControlRow) {
          var row = createNewRow();
          row[conditionColumn] = controlRow;
          effectSizeTableData.push(row);
      }
  }

  var timePointRows = timePointList.map(timePoint => { return {'timePoint': timePoint}});
  var groupRows = generateRows(groupList, 0, []);
  var rows = [];
  if (groupRows.length > 0 && timePointRows.length > 0) {
     rows = groupRows.flatMap(groupRow => timePointRows.map(timePointRow => { return {...groupRow, ...timePointRow} }));
  } else if (groupRows.length > 0 && timePointRows.length == 0) {
     rows = groupRows;
  } else if (groupRows.length == 0 && timePointRows.length > 0) {
     rows = timePointRows;
  }
  
  var rowSize = rows.length;
  var interventionRows = effectSizeTableData.filter(row => row[conditionColumn] == interventionRow);
  var diff = rowSize - interventionRows.length;
  while (diff > 0) { // add new rows
      var row = createNewRow();
      row[conditionColumn] = interventionRow;
      interventionRows.push(row);
      diff -= 1;
  }

  if (rowSize == 0 && interventionRows.length > 0) {
      interventionRows = Array.of(interventionRows[0]); // keep one intervention row
  } else if (interventionRows.length - rowSize > 0) { // remove rows
      interventionRows = interventionRows.filter(interventionRow => 
         rows.find(data => includes(data, interventionRow))
      );
      // keep the top rows and remove the rest
      interventionRows = interventionRows.slice(0, rowSize);
  }

  interventionRows.forEach((interventionRow, index) => {
     var data = rows[index];
     if (data) {
         Object.keys(data).forEach(key => interventionRow[key] = data[key]);
     } else {
         interventionRow['timePoint'] = '';   
     }
  });
  
  if (!conditionColumnVisible) {
     return effectSizeTableData.filter(row => row.condition == '').concat(interventionRows);
  }
  
  var controlRows = effectSizeTableData.filter(row => row[conditionColumn] == controlRow);
  diff = rowSize - controlRows.length;
  while (diff > 0) {
      var row = createNewRow();
      row[conditionColumn] = controlRow;
      controlRows.push(row);
      diff -= 1;
  }
  
  if (rowSize == 0 && controlRows.length > 0) {
     controlRows = Array.of(controlRows[0]);  // keep one control row
  } else if (controlRows.length - rowSize > 0) { // remove rows
     // figure out which rows should be removed
     controlRows = controlRows.filter(controlRow => 
        rows.find(data => includes(data, controlRow))
     );
     controlRows = controlRows.slice(0, rowSize);
  }
  
  controlRows.forEach((controlRow, index) => {
    var data = rows[index];
    if (data) {
       Object.keys(data).forEach(key => controlRow[key] = data[key]);
    } else {
       controlRow['timePoint'] = '';   
    }
  });
  
  return interventionRows.concat(controlRows);     
}

function includes(data, rowToCheck ) {
   // true if rowToCheck contains all the key and value pairs in data
   var keys = Object.keys(data);
   return keys.filter(key => data[key] == rowToCheck[key]).length == keys.length;
}

function generateRows(groupList, index, rows) {
    if (index < groupList.length) {
        var group = groupList[index];
        var fieldName = groupFieldName(group);
        rows = generateRowsPerGroup(group.levels, fieldName, rows);
        // recursively call the method
        return generateRows(groupList, index + 1, rows);
    }
    return rows;
}

function generateRowsPerGroup(groupLevels, field, rows) {
   var levels = groupLevels.map(level => {
       var row = {};
       // field is the name of a column and each level corresponds to a row
       row[field] = level;   
       return row;
   });
   if (rows.length == 0) return levels;
   // combine groups into one row e.g. { 'group_age': 'age 20', 'group_smoking': 'smoking_yes' }
   return rows.flatMap(row => levels.map(levelRow => { return {...row, ...levelRow} }));
}

function createNewRow() {
  var row = {};
  row["id"] = createUUID();
  effectSizeTableColumns.forEach(function(col) {
     if (col.field != 'operate') {
        row[col.field] = ''
     } 
  });
  return row;
}

function getTimePoints() {
   return $("#timePointWidgetList .timePointWidget").toArray()
     .map(widget => $(widget).find('.m_timePoint').val().trim())
     .filter(timePoint => timePoint && timePoint.length > 0);
}

function setUpEvents() {
   resultInputIdList.forEach (function(inputId) {
      $('#' + inputId).keyup(function() {
        var value = $(this).val();
        writeResultData(resultId, inputId, value); 
        if (value.length > 0) {
           updateExtractionIconForResultTextInput(inputId, true);
           
           if (inputId == 'independentVariable' || inputId == 'dependantVariable') {
               var dataListId = $(this).attr('list');
               readMeasurementsDataWithPromise().then(function (data) {
                  var dataList = data[dataListId];
                  if (!dataList) {
                     dataList = [];
                  }
                  if (!dataList.includes(value)) {
                     dataList.push(value);
                     writeMeasurementsData(dataListId, dataList);
                     // update the corresponding datalist
                     updateDataList(dataListId, dataList);
                  }
               });
           }
        } else {
           updateExtractionIconForResultTextInput(inputId, false); 
        }
      });
   }); 
   
   // durationOrDose
   $('#yesDurationOrDosePanel').hide();	
   $('input:radio[name="durationOrDose"]').change(function() {
       var durationOrDose = $(this).val();
       writeResultData(resultId, "durationOrDose", durationOrDose)
       if (durationOrDose == 'yesDurationOrDose') {
          $('#yesDurationOrDosePanel').show();
       } else {
          $('#yesDurationOrDosePanel').hide();		   
       }
   });
   
   // outcomeOfInterest
   $('input[name="outcomeOfInterest"]').change(function() {
       writeResultData(resultId, "outcomeOfInterest", $(this).val());
       updateOutcomeofInterest($(this).val());
       updateEffectSizeTableColumns(true);
   });
   
   
   // betweenOrWithinSubjects
   $('input[name="betweenOrWithinSubjects"]').change(function() {
       writeResultData(resultId, "betweenOrWithinSubjects", $(this).val());
       updateEffectSizeFirstQuestion();
       updateExtractionIcon("measurement_7_extraction", true);
       updateEffectSizeTableColumns(true);
   });
   
   // timeScheduleForMeasurement
   $("#onePointMeasurementPanel").hide();
   $("#multiplePointsMeasurementPanel").hide();
   $('input[name="timeScheduleForMeasurement"]').change(function() {
       updateTimeScheduleForMeasurementPanel($(this).val());
       writeResultData(resultId, "timeScheduleForMeasurement", $(this).val());
       updateEffectSizeTableColumns(true);
   });
   
   // onePointMeasurementReport
   $("#yesPanel").hide();
   $('input[name="onePointMeasurementReport"]').change(function() {
       updateYesPanel($(this).val());
       writeResultData(resultId, "onePointMeasurementReport", $(this).val());
   });
    
   $('input[name="multiplePointsMeasurementReport"]').change(function() {
       var value = $(this).val();
       writeResultData(resultId, "multiplePointsMeasurementReport", value);
       updateEffectSizeTableColumns(true);
   });
   
   // groupEffects
   $("#groupEffectsReportedPanel").hide();
   $('input[name="groupEffects"]').change(function() {
       var value = $(this).val();
       updateGroupEffectsPanel(value);
       writeResultData(resultId, "groupEffects", value);
       updateEffectSizeTableColumns(true);
   });
   
   // groupEffectsInterest
   $("#differentGroupsPanel").hide();
   $('input[name="groupEffectsInterest"]').change(function() {
       var value = $(this).val();
       updateGroupEffectsInterestPanel(value);
       writeResultData(resultId, "groupEffectsInterest", value);
       updateEffectSizeTableColumns(true);
   });
   
   $('#neitherSampleSizeAlert').hide();		
   $('input[name="sampleSizeReport"]').change(function() {
       var sampleSizeReport = $(this).val();
       writeResultData(resultId, "sampleSizeReport", sampleSizeReport);
       updateSampleSizeAlert(sampleSizeReport);
       updateEffectSizeTableColumns(true);
   });
   
   $("#neitherCountOrProportionAlert").hide();
   $('input[name="countOrProportion"]').change(function() {
       var value = $(this).val();
       updateCountOrProportionAlert(value);
       writeResultData(resultId, "countOrProportion", value);
       updateEffectSizeTableColumns();
   }); 
   
   $("#neitherMeanReportAlert").hide();
   $('input[name="meanReport"]').change(function() {
       var value = $(this).val();
       updateMeanReportAlert(value);
       writeResultData(resultId, "meanReport", value);
       updateEffectSizeTableColumns(true);
   }); 
   
   $("#noneReliabilityReportError").hide();
   $("#confidenceIntervalPanel").hide();
   $("#pValuePanel").hide();
   $('input[name="reliabilityReport"]').change(function() {
       var value = $(this).val();
       updateReliabilityReport(value);
       writeResultData(resultId, "reliabilityReport", value);
       updateEffectSizeTableColumns(true);
   }); 
   
   $('input[name="pValueTailed"]').change(function() {
       var value = $(this).val();
       writeResultData(resultId, "pValueTailed", value);
   }); 
   
   
   $("#addDataBtn").click(function(event) {
       // add an empty row to table
       var row = createNewRow();
       effectSizeTableData.push(row);
       effectSizeTable.bootstrapTable('load', effectSizeTableData);
       var lastRow = $("#effectSizeTable")[0].rows[effectSizeTableData.length];
       var firstCell = lastRow.cells[0];
       $(firstCell).attr("contenteditable", true);  
       $(firstCell).focus();
  });
  
   $("#AddTimePointBtn").click(function(event) {
      addTimePointWidget("");
   });
   
   $("#AddGroupingFactorBtn").click(function(event) {
      addGroupingFactorWidget("", []);
   });
   
   $("#addConfoundingVariableBtn").on("click", function () {
      let newVariable = $('#newConfoundingVariableInput').val().trim();
      if (newVariable.length > 0) {
        let list =  $("#covariatesList .confoundingVarCheckbox").toArray().map(widget => $(widget).val());
        if (!list.includes(newVariable)) {              
           addConfoundingVariable(newVariable, 'checked');
           $('#newConfoundingVariableInput').val("");
           onCovariatesListChange();
        } else {
           alert("'" + newVariable + "' already exists.  Enter a different variable");
           $('#newConfoundingVariableInput').val("");
        }
      }  
   })
   
   // assessment questions
   assessmentQuestionsForResult.forEach (function(questionId) {
        $('input:radio[name="' + questionId + '"]').change(function() {
           var value = $(this).val();
           updateAlertDiv(questionId, value);
           writeResultData(resultId, questionId, value);
           $('input:radio[name="' + questionId + '"][value="'+ value + '"]').prop('checked', true);
           updateAssessmentIcon(questionId);
        });
        // input for yes note
        var inputId = getInputNoteId(questionId);
        $('input[id="' + inputId + '"]').change(function() {
          var value = $(this).val();
          writeResultData(resultId, inputId, value);
          // update both text input in wrapper and in main form
          $('input[id="' + inputId + '"]').val(value);

          // autofill for each text type input
          var dataListId = $(this).attr('list');
          readMeasurementsDataWithPromise().then(function (data) {
            var dataList = data[dataListId];
            if (!dataList) {
               dataList = [];
            }
            if (!dataList.includes(value)) {
              dataList.push(value);
              writeMeasurementsData(dataListId, dataList);
              // update the corresponding datalist
              updateDataList(dataListId, dataList);
            }
          });

        });  
    });  
    
   $("#completeCheck").click(function(event) {
      toggleCompleteCheck(); 
   });
   
}

function isWithinSubjects() {
   return $('input:radio[name="betweenOrWithinSubjects"][value="withinSubjects"]').is(':checked');
}
 
function updateEffectSizeFirstQuestion() {
  if (isWithinSubjects()) {
    $("#effectSize_1_extraction").hide();
  } else {
    $("#effectSize_1_extraction").show(); 
  }

  resetNumberingEffectSizeQuestions();
}

function createUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function isSampleSizeFirstVisibleColumn() {
  return getVisibleColFields()[0] == 'sampleSize';
}

function getVisibleColFields() {
  return effectSizeTable.bootstrapTable('getVisibleColumns').map(function(vCol) {return vCol.field;});
}

function initAssessmentQuestions() {
  // evidence quality assessment questions
   assessmentQuestionsForResult.forEach (function(questionId) {
     // update only visible questions
     var alertDiv = $("#" + getAlertId(questionId));
     alertDiv.hide();
   });
}


function updateEffectSizeTableColumn(field, show, refresh) {
  if (show) {
     effectSizeTable.bootstrapTable('showColumn', field)	  
  } else {
  	 effectSizeTable.bootstrapTable('hideColumn', field)	  
  }
  if (refresh) {
    effectSizeTable.bootstrapTable('refresh');
  }
}


function addTimePointWidget(timePointData) {
   var newTimePointWidget =
       '<div class="timePointWidget"><label for="m_timePoint">Time Point with Unit:</label>' +
       '<input list="timePoints" type="text" class="custom-input-text m_timePoint" autocomplete="off" value="' + timePointData + '">' + 
       '<button class="close deleteTimePointWidget">x</button></div>';
   if ($("#timePointWidgetList").find("#timePoints").length == 0) {
       $("#timePointWidgetList").append('<datalist id="timePoints"></datalist>');
   }
   $("#timePointWidgetList").append(newTimePointWidget);
   
   $(".deleteTimePointWidget").off('click');
   $(".deleteTimePointWidget").click(function(event) {
      // remove first and then save data.
      $(this).parent().remove(); 
      writeMultipleTimePointData(false);
   });
   $('.m_timePoint').off('change');
   $('.m_timePoint').change(function() {
       writeMultipleTimePointData(true); 
   });
}

function writeMultipleTimePointData(requireSave) {
   // update datalist for time point input list
   var timePointsId = "timePoints";
   var currentTimePoints = getTimePoints();
   writeResultData(resultId, "multipleTimePointData", currentTimePoints);
   updateExtractionIcon("measurement_8_extraction", currentTimePoints.length > 0);
   if ($("#timePointWidgetList .timePointWidget").length == 0) {
       addTimePointWidget('');
   }

   updateEffectSizeTableColumns(true);
   
   if (requireSave) {
      readMeasurementsDataWithPromise().then(function (measurementsData) {
         updateTimePointDataList(measurementsData, currentTimePoints, true);
      });
  }
}

function updateTimePointDataList(measurementsData, currentTimePoints, requireSave) {
  var timePointsId = "timePoints";
  var timePoints = measurementsData[timePointsId];
  if (!timePoints) {
      timePoints = [];
  }
  var listToAdd = currentTimePoints.filter(timePoint => !timePoints.includes(timePoint));
  if (listToAdd.length > 0 && requireSave) {
     timePoints = timePoints.concat(listToAdd);
     updateDataList(timePointsId, timePoints);
     writeMeasurementsData(timePointsId, timePoints);
  }
}

function addGroupingFactorWidget(groupingFactor, levels) {
   // datalist tag
   if ($("#groupingFactorWidgetList").find("#groupingFactors").length == 0) {
       $("#groupingFactorWidgetList").append('<datalist id="groupingFactors"></datalist>');
   }

   var newWidget =
       '<div class="groupingFactorWidget"><label for="groupingFactor">Grouping Factor:</label>' +
       '<input type="text" class="custom-input-text groupingFactor" list="groupingFactors" value="' + groupingFactor + '">' + 
       '<button class="close deleteGroupingFactorWidget" title="Remove Grouping Factor">x</button>' +
       '<div class="levels d-flex flex-wrap"><label>Factor Levels:</label>';
   if (levels.length == 0) {
      // require at least two levels
      levels = ['', ''];   
   }
   levels.forEach(level => newWidget += addGroupLevelWidget(level));
   newWidget += '<button type="button" class="btn btn-outline-primary btn-sm addGroupLevel">Add Level</button>' +
                '</div></div>';
   $("#groupingFactorWidgetList").append(newWidget);
   
   $(".deleteGroupingFactorWidget").off('click');
   $(".deleteGroupingFactorWidget").click(function(event) {
      // remove first and then save data.
      $(this).parent().remove(); 
      writeGroupingFactorData();
   });
   
   $(".deleteGroupLevelWidget").off('click');
   $(".deleteGroupLevelWidget").click(function(event) {
       deleteGroupLevel(this);
   });
   
   $(".addGroupLevel").off('click');
   $(".addGroupLevel").click(function(event) {
       $(this).before(addGroupLevelWidget(''));
       $(this).parent().find(".deleteGroupLevelWidget").click(function(event) {
           deleteGroupLevel(this);
       });
       // grouping factor level input change
       $(this).parent().find('.groupingFactorLevel').change(function() {
           writeGroupingFactorData(true); 
       }); 
   });
   
   // grouping factor input change
   $('.groupingFactor').off('change');
   $('.groupingFactor').change(function() {
       // check if the grouping factor is one of the saved grouping factors
       var value = $(this).val();
       var filtered = $("#groupingFactors option").toArray().filter(option => option.value == value);
       var levels = $(this).parent().find('.groupingFactorLevel').toArray();
       var emptyLevels = (levels.length == 2) && (levels.filter(level => level.value == '').length == 2);
       if (filtered.length == 1 && emptyLevels) {
         // fill out the levels from the saved data
         var groupingFactorLevels = $(filtered[0]).data("levels").split(",");
         levels.forEach((levelWidget,index) => levelWidget.value = groupingFactorLevels[index]);
         writeGroupingFactorData(false);   
       } else {
         writeGroupingFactorData(true); 
       }
   });
   
   // grouping factor level input change
   $('.groupingFactorLevel').off('change');
   $('.groupingFactorLevel').change(function() {
       writeGroupingFactorData(true); 
   });
}

function deleteGroupLevel(levelWidget) {
    $(levelWidget).parent().remove(); 
    writeGroupingFactorData(true);
}

function addGroupLevelWidget(level) {
   return '<div class="mr-3"><input type="text" class="custom-input-text groupingFactorLevel" value="' + level + '">' + 
       '<button class="close deleteGroupLevelWidget" title="Remove Level">x</button></div>';   
}

function writeGroupingFactorData(changeGroupingFactor) {
   var data = groupingFactorData();
   writeResultData(resultId, "groupingFactors", data);
   if ($("#differentGroupsPanel").is(':visible')) {
       updateExtractionIcon("measurement_9_extraction", hasValidGroupingFactorData(data));
   } 
   if ($("#groupingFactorWidgetList .groupingFactorWidget").length == 0) {
       addGroupingFactorWidget('', []);
   }
   updateEffectSizeTableColumns(true);
   
   if (changeGroupingFactor) {
       readMeasurementsDataWithPromise().then(function (measurementsData) {
         updateGroupingFactorDataList(measurementsData, data, true);
      });
   }
}

function updateGroupingFactorDataList(measurementsData, currentGroupingFactors, requireSave) {
  var groupingFactorsId = "groupingFactors";
  var groupingFactors = measurementsData[groupingFactorsId];
  if (!groupingFactors) {
      groupingFactors = [];
  }

  currentGroupingFactors = currentGroupingFactors.filter(group => group && group.levels.length >= 2);
  var listToAdd = currentGroupingFactors.filter(group => !groupingFactors.find(existingGroup => sameGroupingFactor(existingGroup, group)));
  var listToUpdate = currentGroupingFactors.filter(group => !listToAdd.includes(group));
  if (requireSave && (listToUpdate.length > 0 || listToAdd.length > 0)) {
     groupingFactors = groupingFactors.concat(listToAdd);
     // update with the current grouping factor
     listToUpdate.forEach(groupToUpdate => {
        var index = groupingFactors.findIndex(existingGroup => sameGroupingFactor(groupToUpdate, existingGroup));
        if (index >= 0) {
           groupingFactors.splice(index, 1, groupToUpdate);
        }
     });
     
     updateDataList(groupingFactorsId, groupingFactors);
     writeMeasurementsData(groupingFactorsId, groupingFactors);
  }
}

function sameGroupingFactor(group1, group2) {
   // just check the grouping factor name
   return group1.factor == group2.factor;
}

function hasValidGroupingFactorData(data) {
   if (!data) {
       data = groupingFactorData();   
   }
   
   // at least two group factor levels.
   return data.find(group => group && group.levels.length >= 2);
}

function groupingFactorData() {
   return $("#groupingFactorWidgetList .groupingFactorWidget").toArray().map(widget => {
      var groupingFactor = $(widget).find('.groupingFactor').val().trim();
      if (groupingFactor && groupingFactor.length > 0) {
        var levels = $(widget).find('.groupingFactorLevel')
            .toArray()
            .map(input => $(input).val().trim())
            .filter(levelText => levelText && levelText.length > 0);
        return {'factor': groupingFactor, 'levels': levels};
      }
   });   
}

function createTable() {
   effectSizeTable = $('#effectSizeTable').bootstrapTable({
     classes: ['table', 'table-bordered', 'table-responsive-md'],
     columns: effectSizeTableColumns,
     data: effectSizeTableData,
     undefinedText: '', // use empty string for undefined text instead of '-'
     onClickCell: function(field, value, row, element) {
        // enable edit in the clicked cell
        var editable = field != 'condition' && !field.startsWith('group') && field != 'timePoint';
        if (isDisabled(row, field)) {
            editable = false; 
        }
        $(element).attr("contenteditable", editable);
     }
    });
    
    $("#effectSizeTable").on('paste', function(e) {
       let textData = e.originalEvent.clipboardData.getData("text");
       let htmlData = e.originalEvent.clipboardData.getData("text/html");
       if (textData != htmlData) {
          // remove any formatting 
          e.target.innerHTML = textData;
          e.target.innerText = textData;
          e.preventDefault();
       }
    });
    
    $("#effectSizeTable").on('input', function(e) {
       // update effectSizeTableData from table.
       var visibleColFields = getVisibleColFields();
       var tableRows = $(this)[0].rows;
       var numColRows = 1;
       effectSizeTableData.forEach(function(rowData, index) {
           var tableRow = tableRows[index + numColRows] 
           visibleColFields.forEach(function(visibleColumn, colIndex) {
               if (visibleColumn != 'operate') {
                 rowData[visibleColumn] = tableRow.cells[colIndex].innerText;
               }
           });
       });
       
       writeResultData(resultId, "effectSizeTableData", effectSizeTableData);
       updateExtractionIcon("effectSize_7_extraction", isTableCompleted());
       updateCompleteCheckButton();
   });
    
}

function updateExtractionIconForResultTextInput(inputId, completed) {
   if ($("#yesPanel").is(":visible") && (inputId == 'timePoint' || inputId == 'timePointUnit')) {
       completed = $('#timePoint').val().length > 0 || $('#timePointUnit').val().length > 0;
       updateExtractionIcon("measurement_8_extraction", completed);   
   } else if (inputId == 'howIndependentVariableDefined') {
       updateExtractionIcon("measurement_2_extraction", completed);   
   } else if (inputId == 'howDependantVariableDefined') {
       updateExtractionIcon("measurement_5_extraction", completed);   
   }
}

function hasValue(inputId) {
   return $(inputId).filter(function () { return !!this.value;}).length > 0;
}

function operateFormatter(value, row, index) {
    return [
      '<a class="removeRow" href="javascript:void(0)" title="Remove">',
      '<i class="fa fa-trash"></i>',
      '</a>'
    ].join('')
}

window.operateEvents = {
    'click .removeRow': function (e, value, row, index) {
      effectSizeTableData.splice(index, 1)
      $('#effectSizeTable').bootstrapTable('load', effectSizeTableData);
      writeResultData(resultId, "effectSizeTableData", effectSizeTableData);
      updateExtractionIcon("effectSize_7_extraction", isTableCompleted());
      updateCompleteCheckButton();
  }
}

function isTableCompleted() {
  var outcomeOfInterest = $('input[name="outcomeOfInterest"]:checked').val();
  var isDichotomous =  (outcomeOfInterest == 'dichotomous');
  var isContinuous = (outcomeOfInterest == 'continuous');
  
  var isConfoundingAdjustedInStatModel = $('#includedAsCovariatesInStatModel').is(':checked');
  var countOrProportion = getCountOrProportionValue();
  var sampleSizeReport = $('input[name="sampleSizeReport"]:checked').val()
  var meanReport = getMeanReportValue();
  var reliabilityReport = $('input[name="reliabilityReport"]:checked').val();
  
  return isEffectSizeTableCompleted(effectSizeTableData, isConfoundingAdjustedInStatModel,
       isDichotomous, isContinuous, countOrProportion, sampleSizeReport, meanReport, reliabilityReport, isWithinSubjects())
   
}
function markReviewCompleted(docData, resultDataList) {
  var completeCheck = docData.completeCheck;
  var canUserMarkComplete = filterResultDataList(docData, resultDataList).length > 0;
  if (completeCheck == true && canUserMarkComplete == true) { // user marked as complete
      $("#completeCheck").attr("disabled", false);
      $("#completeCheck").addClass("complete"); 
      $("#completeCheck").text("Completed");
      showWarning(true);
  } else {
      updateCompleteCheckButton(canUserMarkComplete);
  }
}

function updateCompleteCheckButton(canUserMarkComplete){
  // called whenever effect size table data is updated.
  if (canUserMarkComplete != undefined) {
      var disabled = !canUserMarkComplete;
      updateCompleteCheckButtonStatus(disabled);
  } else {
      var docId = getCurrentDocId();
      var numOfResults = $("#numOfResults").val();
      readDocumentDataWithPromise(docId).then(function(docData) {
        Promise.all(docResultDataPromises(numOfResults, docId)).then(function(resultDataList) {   
            if (filterResultDataList(docData, resultDataList).length > 0) {
               updateCompleteCheckButtonStatus(false); 
            } else {
               updateCompleteCheckButtonStatus(true);
            }
        });
      });
  }
}

function updateCompleteCheckButtonStatus(disabled) {
   $("#completeCheck").attr("disabled", disabled);
   // if disabled and marked as complete before, then toggle complete button.
   if (disabled && $("#completeCheck").hasClass("complete")) {
       toggleCompleteCheck();
   } 
}

function toggleCompleteCheck() {
  $("#completeCheck").toggleClass("complete"); 
  var complete = $("#completeCheck").hasClass("complete");
  if (complete) {
     $("#completeCheck").text("Completed");
     writeData("completeCheck", complete);
     showWarning(true);
  } else {
     $("#completeCheck").text("Mark Review as Complete");
     writeData("completeCheck", '');
  }
}

function showWarning(complete) {
 if (complete) {
     var docId = getCurrentDocId();
     readDocumentDataWithPromise(docId).then(function(docData) {
       Promise.all(docResultDataPromises(docData.numOfResults, docId)).then(function(resultDataList) {   
           $("#warningDiv").empty();
           var doneExtractionResults = filterResultDataList(docData, resultDataList)
           var doneAssessmentResults = doneExtractionResults.filter(resultData => completedQualityAssessmentForResult(resultData));
           if (!completedQualityAssessment(docData) || doneExtractionResults.length != doneAssessmentResults.length) {
             // warning : not completed assessment questions    
             var alertHtml = '<div class="alert alert-danger mt-2" id="completeAlertMsg-1" role="alert">You have not completed the quality of evidence questionnaire</div>';
             $("#warningDiv").append(alertHtml);
           }
          
           var numOfResults = docData.numOfResults;
           if (numOfResults) {
             if (parseInt(numOfResults) > doneExtractionResults.length) {
               var alertHtml = '<div class="alert alert-danger mt-2" id="completeAlertMsg-2" role="alert">You have not extracted effect size information for all measurements</div>';
               $("#warningDiv").append(alertHtml);
             }
           }
       });
     });
  }
}

function isDisabled(row, field) {
 return (row.condition == 'Control') &&  // control row
   (fieldsToMergeCells.includes(field) || 
     (field == 'sampleSize' && $('input[name="sampleSizeReport"]:checked').val() == 'overallSampleSize'));
}

function cellStyle(value, row, index, field) {
    if (isDisabled(row, field)) {
      return { classes: 'disabled' };
    }
    return {};
}

function writeMeasurementsData(key, value) {
   measurementDoc().set({
       [key]  : value
     }, { merge: true });
}

function updateDataList(id, dataList) {
   // check if the current result has the data list first.
   let docRef = getCurrentUserDocRef();
   readDocResultDataWithPromise(docRef, resultId).then(function (resultData) {
      let idPerResult = id + '_result';
      if (resultData[idPerResult]) {
         // use data list from the result data.
         dataList = resultData[idPerResult];
      }

      var dataListWidget = $('#' + id);
      dataListWidget.empty();
      dataList.forEach(val =>  {
         if (id == 'groupingFactors') {
           var levels = val.levels.toString();
           var widget = '<option value="' + val.factor + '" data-levels="' + levels + '">';
           dataListWidget.append(widget);  
         } else if (id == 'timePoints') {
            dataListWidget.append('<option value="' + val + '">')
         } else {
           dataListWidget.append('<div class="dropdown-item">' + val + '<span class="delete mr-2">x</span></div>')
         }
      });


     dataListWidget.find('.delete').off('click')
     dataListWidget.find('.delete').click(function (e) {
       // remove the clicked item
       $(this).parent().remove();

       // TODO: not working well 
       // keep the dropdown open
       //dataListWidget.dropdown('toggle');
       //dataListWidget.dropdown('update');

       let newList = dataListWidget.find('.dropdown-item')
         .toArray()
         .map(w => $(w).text().replace($(w).find('.delete').text(), ''));
       writeResultData(resultId, idPerResult, newList);

     });

     dataListWidget.find('.dropdown-item').off('click')
     dataListWidget.find('.dropdown-item').click(function (e) {
       let inputId = dataListWidget.parents(".input-group").find("input[type=text]").attr('id')
       if (inputId) {
         let value = $(this).text();
         value = value.replace($(this).find('.delete').text(), '');
         $('#' + inputId).val(value);
         // save 
         if (inputId == 'independentVariable' || inputId == 'dependentVariable') {
           writeResultData(resultId, inputId, value);
         } else {
           writeData(inputId, value);
         }
       }
     });
   });
}




