var biasEvaluationTable, measurementTable, applicabilityTable;
var biasEvaluationTableData = [], measurementTableData = [], applicabilityTableData = [];
var biasEvaluationTableColumns = [
   {field: 'study', title: 'Study' },  
   {field: 'lackOfRandomAssignment', title: 'Lack of random<br>assignment <br><span>Failure to randomly assign intervention and control conditions</span>'}, 
   {field: 'exclusionOrAttritionBias', title: 'Exclusion<br>or attrition bias <br><span>Exclusion or attrition lead to differences between intervention and control conditions</span>'},
   {field: 'uncontrolledCovariates', title: 'Uncontrolled<br>covariates <br><span>Failure to control for confounding variables</span>'}, 
   {field: 'covariatesAdjustmentSet', title: 'Covariates<br>adjustment set'}, 
   {field: 'action', title: 'What will you do<br> about it'}]
var measurementTableColumns = [
   {field: 'study', title: 'Study'},  
   {field: 'studyType', title: 'Study type <br><span>e.g., experimental vs observational</span>', cellStyle: 'cellStyle'},
   {field: 'studySetting', title: 'Study setting <br><span>Where the study was conducted</span>', cellStyle: 'cellStyle'},
   {field: 'studyDesign', title: 'Study design <br><span>Intervention/control conditions compared within- or between-subjects</span>', cellStyle: 'cellStyle'}, 
   {field: 'finalSampleOfParticipants', title: 'Participant <br>characteristics <br><span>Failure to create similar intervention and control conditions</span>', cellStyle: 'cellStyle'}, 
   {field: 'timecourse', title: 'Timecourse of <br>measurement', cellStyle: 'cellStyle'},
   {field: 'subgroupsOfParticipants', title: 'Subgroups of <br>participants', cellStyle: 'cellStyle'}, 
   {field: 'intervention', title: 'Intervention', cellStyle: 'cellStyle'}, 
   {field: 'interventionDose', title: 'Intervention<br>dose <br><span>How much were participants exposed to the intervention/control?</span>', cellStyle: 'cellStyle'}, 
   {field: 'outcome', title: 'Outcome', cellStyle: 'cellStyle'},  
   {field: 'outcomeMeasurement', title: 'Outcome<br> measurement <br><span>Did the study fail to detect the outcome? Was the measurement scale invalid?</span>', cellStyle: 'cellStyle'},  
   {field: 'action', title: 'What will you do <br>about it'}]
var applicabilityTableColumns = [
   {field: 'study', title: 'Study'},
   {field: 'setting', title: 'Setting <br><span>Does the study setting differ from your target setting?</span>'},  
   {field: 'population', title: 'Population <br><span>Does the study population differ from your target population?</span>'}, 
   {field: 'intervention', title: 'Intervention <br><span>Does the intervention condition differ from your target intervention?</span>'},
   {field: 'control', title: 'Control <br><span>Does the control condition differ from what currently happens in your target context?</span>'},
   {field: 'outcome', title: 'Outcome <br><span>Does the measured outcome differ from your target outcome?</span>'},  
   {field: 'action', title: 'What will you do <br>about it'}]
var highlightMap = {};

var defaultStudyGroups = ["Main analysis", "Separate analysis", "Less applicable studies"]
    

function loadReviewData() {
    setResearchQuestion();
    return new Promise((resolve, reject) => {
        var listRef = getStorageListRef();
        var reviewData = [];
            listRef.listAll().then(function(res) {
              if (res.items.length == 0) {
                resolve(reviewData)
              }
            var count = 0,
                countExcluded = 0;
            res.items.forEach(function(itemRef) {
                // for each itemRef (uploaded paper), retrieve file name and read extracted document data 
                Promise.all(retrieveFileInfo(itemRef)).then(function(fileInfo) {
                    var included = (fileInfo[1].customMetadata.included == "true") ? true : false;
                    var name = itemRef.name;
                    readDocumentDataWithPromise(name).then(function(docData) {
                        if (hasEmptyExtractionData(docData)) {
                           count++;
                           if (count == (res.items.length - countExcluded)) {
                            resolve(reviewData);
                           } 
                        }
                        else if (included && !Array.isArray(docData) && docData.completeCheck) {
                            return Promise.all(docResultDataPromises(docData.numOfResults, name)).then(function(resultDataList) {
                                count++;
                                //console.log("count: " + count);
                                if (resultDataList.length > 0) {
                                    var downloadURL = fileInfo[0];
                                    resultDataList.forEach(function(result, index) {
                                        let resultIndex = resultDataList.length > 1 ? " result " + (index + 1) : "";
                                        var tableRow = {
                                            // study info
                                            "downloadURL": downloadURL,
                                            "resultIndex": index + 1,
                                            "name": name,
                                            "title": docData.title,
                                            "author": docData.authors,
                                            "year": docData.year,
                                            "study": docData.authors.split(',')[0] + ' et al. ' + docData.year + resultIndex,
                                            "studyType": getStudyType(docData),
                                            "studySetting": getStudySetting(docData),
                                            "criteriaParticipants": docData.criteriaParticipants,
                                            "covariatesList": result.covariatesList,
                                            "selectionBias_q1": docData.selectionBias_q1,
                                            "selectionBias_q2": docData.selectionBias_q2,
                                            "selectionBias_q3": result.selectionBias_q3,    
                                            "studyDesign": getStudyDesign(result.betweenOrWithinSubjects),
                                            "sampleOfParticipants": docData.sampleOfParticipants,
                                            "timeScheduleForMeasurement": result.timeScheduleForMeasurement,
                                            "multiplePointsMeasurementReport": result.multiplePointsMeasurementReport,
                                            "multipleTimePointData": result.multipleTimePointData,
                                            "groupEffects": result.groupEffects,
                                            "groupingFactors": result.groupingFactors,
                                            "independentVariable": result.independentVariable,
                                            "durationOrDose": result.durationOrDose,
                                            "durationOrDoseInput": result.durationOrDoseInput,
                                            "dependentVariable": result.dependantVariable,
                                            "outcomeOfInterest": result.outcomeOfInterest,
                                            "included": true, // default to including every study with a complete review
                                            // quality assessment
                                            "selectionBias_recruitment": docData.selectionBias_q1 ? docData.selectionBias_q1.split('q1_')[1] : "",
                                            "selectionBias_recruitment_note": docData.selectionBias_q1_note ? docData.selectionBias_q1_note : "",
                                            "selectionBias_exclusionAttrition": docData.selectionBias_q2 ? docData.selectionBias_q2.split('q2_')[1] : "",
                                            "selectionBias_exclusionAttrition_note": docData.selectionBias_q2_note ? docData.selectionBias_q2_note : "",
                                            "selectionBias_confounding": result.selectionBias_q3 ? result.selectionBias_q3.split('q3_')[1] : "",
                                            "selectionBias_confounding_note": result.selectionBias_q3_note ? result.selectionBias_q3_note : "",
                                            "measurementIssues_intervention": docData.measurementIssues_q1 ? docData.measurementIssues_q1.split('q1_')[1] : "",
                                            "measurementIssues_intervention_note": docData.measurementIssues_q1_note ? docData.measurementIssues_q1_note : "",
                                            "measurementIssues_outcome": result.measurementIssues_q2 ? result.measurementIssues_q2.split('q2_')[1] : "",
                                            "measurementIssues_outcome_note": result.measurementIssues_q2_note ? result.measurementIssues_q2_note : "",
                                            "measurementIssues_effect": result.measurementIssues_q3 ? result.measurementIssues_q3.split('q3_')[1] : "",
                                            "measurementIssues_effect_note": result.measurementIssues_q3_note ? result.measurementIssues_q3_note : "",
                                            "applicability_conditions": docData.applicability_q1 ? docData.applicability_q1.split('q1_')[1] : "",
                                            "applicability_conditions_note": docData.applicability_q1_note ? docData.applicability_q1_note : "",
                                            "applicability_population": docData.applicability_q2 ? docData.applicability_q2.split('q2_')[1] : "",
                                            "applicability_population_note": docData.applicability_q2_note ? docData.applicability_q2_note : "",
                                            "applicability_intervention": result.applicability_q3 ? result.applicability_q3.split('q3_')[1] : "",
                                            "applicability_intervention_note": result.applicability_q3_note ? result.applicability_q3_note : "",
                                            "applicability_baseline": result.applicability_q4 ? result.applicability_q4.split('q4_')[1] : "",
                                            "applicability_baseline_note": result.applicability_q4_note ? result.applicability_q4_note : "",
                                            "applicability_outcome": result.applicability_q5.split('q5_')[1],
                                            "applicability_outcome_note": result.applicability_q5_note ? result.applicability_q5_note : "",
                                            // triage data
                                            "riskOfBias" : result.riskOfBias,
                                            "flagNote" : result.flagNote,
                                            "consistency" : result.consistency,
                                            "applicability" : result.applicability,
                                            "showSepNote" : result.showSepNote
                                        };
                                        reviewData.push(tableRow);
                                    });
                                }

                                if (count == (res.items.length - countExcluded)) {
                                    // We've created table rows for each result in each non-excluded study. Resolve promise.
                                    resolve(reviewData);
                                } 
                            });  // Promise.all
                        } else if (!included) {
                            countExcluded++;
                        }
                    }); // end of readDocumentDataWithPromise
                }); // end of retrieveFileInfo
            }); // end of forEach
        }).catch(function(error) {
            console.log("error: " + error);
            reject(error);
        }); 
    }); // new Promise
}

function getStudyType(data) {
  let studyType = data.studyType;
  if (studyType) {
     studyType = studyType.replace("Type", "");
     if (studyType == "other") {
         studyType = data.otherTypeName;
     }
  }
  
  return studyType;
}

function getStudySetting(data) {
  let studySetting = data.studySetting;
  if (studySetting) {
     studySetting = studySetting.replace("Setting", "");
     if (studySetting == "other") {
         studySetting = data.otherSettingName;
         if (data.otherSettingDescription) {
             studySetting += "<br>" + data.otherSettingDescription; 
         }
     }
  }
  
  return studySetting;
}

function getStudyDesign(data) {
  let studyDesign = data;
  if (studyDesign == 'betweenSubjects') {
     return 'between-subjects';  
  } else if (studyDesign == 'withinSubjects') {
     return 'within-subjects';  
  }
  
  studyDesign;
}

function initTriageView() {
  $("#metaAnalyzeBtn").click(function(event) {
      window.location = visualizationPage + urlSearchParams();
  });
  
  $(".fa-th-list").click(function(){
    window.location = managementPage + urlSearchParams();
  });

  loadReviewData().then(function(data) {
    $(document).ready(function() {
      $(".preloader").fadeOut();
      // sort by study
      data = data.sort(function(row1, row2) {
	    return row1.study.localeCompare(row2.study);
      });
      
      // init table data
      initBiasEvaluationTableData(data);
      initMeasurementTableData(data);
      initApplicabilityTableData(data);
          
      // create tables
      createTables();
      
      $("#navDiv a").click(function() {
         $("#navDiv a").removeClass('selected');
         $(this).addClass('selected');
         let href  = $(this).attr("href")
         if ( href == "#biasEvaluationTable") {
            $("#biasEvaluationTableDiv").show({done:moveScrollToTop, duration: 10});
            $("#measurementTableDiv").hide();
            $("#applicabilityTableDiv").hide(); 
         } else if (href == "#measurementTable") {
            $("#biasEvaluationTableDiv").hide();
            $("#measurementTableDiv").show({done:moveScrollToTop, duration: 10});
            $("#applicabilityTableDiv").hide(); 
         } else {
            $("#biasEvaluationTableDiv").hide();
            $("#measurementTableDiv").hide();
            $("#applicabilityTableDiv").show({done:moveScrollToTop, duration: 10}); 
         }
         
      });
    });
  });

  // click listener to AddStudyGroupButton
  $("#AddStudyGroupButton").on('click', function() {
    let index = $("#studyGroupsDialog").find(".studyGroup").length + 1
    let groupname = "Untitled study group"
    createStudyGroupView(index, groupname, [], "");
    let input = $("#studyGroupsDialog input[value='" + groupname + "']").last();
    $(input).trigger('select');
    $(input).trigger('focus');
  });

  // save study groups
  $("#saveStudyGroups").on('click', function() {
    let groups = [];
    let skipSave = false;
    $("#studyGroupsDialog .studyGroup").toArray().forEach(function(groupWidget) {
      let groupname = $(groupWidget).find("input")[0].value;
      if ((groupname == "" || groups.includes(groupname)) && $(groupWidget).find(".list-group-item").length > 0) {
        alert("Require unique study group name")
        skipSave = true;
        return;
      } 
      if (skipSave)
        return;

      groups.push(groupname)
    });

    if (!skipSave) {
      writeUserData("studyGroups", groups)

      groups.forEach(function(groupname) {
        $("#studyGroupsDialog input[value='" + groupname + "']").parent().parent().find(".list-group-item").toArray().forEach(function(study) {
          let studyname = $(study).attr("data-studyname");
          let resultIndex = $(study).attr("data-resultIndex");
          // save study group for each study result
          writeUserAction(studyname, resultIndex, "studyGroup", groupname)
        });
      });

      $("#studyGroupsDialog").modal('hide');
    }
  });

  $("#showStudyGroupsBtn").on('click', function(){
    showStudyGroupsDialog("");
  });

  $("#autoHighlightingCheckbox").on('change', function() {
    if ($(this).prop("checked")) {
      $(".highlight").removeClass("off")
    } else {
      $(".highlight").addClass("off")
    }
  })
}

function moveScrollToTop() {
 $("html").scrollTop(0);   
}

function createCell(cellValue) {
  return "<div>" + cellValue + "</div>"; 
}

function getCellValue(value) {
  if (value)
    return value.replace("<div>", "").replace("</div>", ""); 
  return value;
}

function initBiasEvaluationTableData(data) {
    let rows = [];
    for (var i = 0; i < data.length; i++) {
      let rowData = data[i];
      let studyContextQ1Link = createExtractionLink("Evidence Extraction: Participants 2" , "participants_2_extraction", rowData);
      let covariates = rowData.covariatesList
      if (!covariates) {
          covariates = ""
      }
      rows.push({
        "name": rowData.name,
        "resultIndex": rowData.resultIndex,
        "flagNote": rowData.flagNote,
        "study": createCell(rowData.study),
        "lackOfRandomAssignment": createCell(rowData.selectionBias_recruitment + " : " + rowData.selectionBias_recruitment_note + "<br><br>(" + rowData.studyType + ")"),
        "exclusionOrAttritionBias": createCell(rowData.selectionBias_exclusionAttrition + " : " + rowData.selectionBias_exclusionAttrition_note + "<br><br>" + studyContextQ1Link),
        "uncontrolledCovariates": createCell(rowData.selectionBias_confounding + " : " + rowData.selectionBias_confounding_note + "<br><br>(" + rowData.studyType + ")"),
        "covariatesAdjustmentSet": createCell(covariates).replace(",", "<br>"),
        "action": createActionTableCell("biasEvalTableAction-" + i, ["Exclude", "Include", "Flag"], 
            rowData.riskOfBias, true, rowData.flagNote)
      });      
    }
    biasEvaluationTableData = rows;
}

function initMeasurementTableData(data) {
    let rows = [];
    let measurementQuestion2LinkTitle = "Evidence Extraction: Measurement 2";
    let measurementQuestion2LinkTarget = "measurement_2_extraction";
    let measurementQuestion5LinkTitle= "Evidence Extraction: Measurement 5";
    let measurementQuestion5LinkTarget= "measurement_5_extraction";
    let map = {};
    for (var i = 0; i < data.length; i++) {
      let rowData = data[i];
      let measurementQuestion2Link = createExtractionLink(measurementQuestion2LinkTitle, measurementQuestion2LinkTarget, rowData);
      let measurementQuestion5Link = createExtractionLink(measurementQuestion5LinkTitle, measurementQuestion5LinkTarget, rowData);
      let participantsQuestion3Link = createExtractionLink("Evidence Extraction: Participants 3", "participants_3_extraction", rowData);
      
      updateMap(map, "studyType", rowData.studyType);
      updateMap(map, "studySetting", rowData.studySetting);
      updateMap(map, "studyDesign", rowData.studyDesign);
      
      let finalSample = rowData.measurementIssues_intervention + " : " + rowData.measurementIssues_intervention_note;
      updateMap(map, "finalSampleOfParticipants", finalSample);

      let multipleTimePointData = rowData.multipleTimePointData;
      if (!multipleTimePointData || typeof(multipleTimePointData) == 'undefined') {
          multipleTimePointData = "";
      }
      let timeScheduleForMeasurement = rowData.timeScheduleForMeasurement
      if (timeScheduleForMeasurement == 'multiplePointsMeasurement') {
          timeScheduleForMeasurement = 'multiplePoints'
      } else if (timeScheduleForMeasurement = 'onePointMeasurement') {
          timeScheduleForMeasurement = 'onePoint'   
      }
      let timecourse = timeScheduleForMeasurement + "<br><br>" 
          + multipleTimePointData + "<br><br>(" + rowData.multiplePointsMeasurementReport + ")"
      updateMap(map, "timecourse", timecourse);
      
      let groupEffects = rowData.groupEffects
      if (rowData.groupingFactors) {
          groupEffects += '<br>';
          
          rowData.groupingFactors.forEach(grouping => {
              groupEffects += '<br>' + grouping.factor + " (" +  grouping.levels + ")"
          });
      }
      updateMap(map, "subgroupsOfParticipants", groupEffects);
      
      let intervention = rowData.independentVariable  
      updateMap(map, "intervention", intervention);
      let interventionDose = rowData.durationOrDose + "<br><br>" + rowData.durationOrDoseInput
      updateMap(map, "interventionDose", interventionDose);
      let outcome = rowData.dependentVariable 
            + "<br><br>(" + rowData.outcomeOfInterest + ")";
      updateMap(map, "outcome", outcome);
      
      let outcomeMeasurement = rowData.measurementIssues_outcome + " : " + rowData.measurementIssues_outcome_note
          + "<br><br>" + rowData.measurementIssues_effect + " : " + rowData.measurementIssues_effect_note;
      let outcomeMeasurementValue = rowData.measurementIssues_outcome + " " + rowData.measurementIssues_effect;
      updateMap(map, "outcomeMeasurement", outcomeMeasurementValue);
      
      rows.push({
        "name": rowData.name,
        "resultIndex": rowData.resultIndex,
        "study": createCell(rowData.study),
        "studyType": createCell(rowData.studyType),
        "studySetting": createCell(rowData.studySetting),
        "studyDesign": createCell(rowData.studyDesign),
        "finalSampleOfParticipants": createCell(finalSample + "<br><br>" + participantsQuestion3Link),
        "timecourse": createCell(timecourse).replace(",", "<br>"),
        "subgroupsOfParticipants": createCell(groupEffects),
        "intervention": createCell(measurementQuestion2Link + " " + intervention),
        "interventionValue": intervention,
        "interventionDose": createCell(interventionDose),
        "outcome": createCell(measurementQuestion5Link + " " + outcome),
        "outcomeValue": outcome,
        "outcomeMeasurement": createCell(outcomeMeasurement),
        "outcomeMeasurementValue": outcomeMeasurementValue,
        "action": createActionTableCell("measurementTableAction-" + i, ["Exclude", "Include", "Analyze separately"], rowData.consistency)
      });      
    }
    
    // figure out which cell should be highlighted.
    Object.keys(map).forEach(function(key) {
      let majorityVal = Object.keys(map[key]).reduce((a, b) => map[key][a] > map[key][b] ? a : b);
      if (map[key][majorityVal] == 1) {
         majorityVal = "MAJORY_VAL";   
      }
      highlightMap[key] = majorityVal;
    });   
    
    measurementTableData = rows;
    
}

function cellStyle(value, row, index, field) {
    let majorityVal = highlightMap[field];
    let cellValue = getCellValue(value);
    if (field == "intervention") {
      cellValue = measurementTableData[index].interventionValue;  
    } else if (field == "outcome") {
      cellValue = measurementTableData[index].outcomeValue;   
    } else if (field == "outcomeMeasurement") {
      cellValue = measurementTableData[index].outcomeMeasurementValue;     
    }
    
    if (majorityVal && majorityVal != cellValue) {
      return { classes: 'highlight' };
    } 
    return {};
}


function updateMap(map, key, rowData) {
  if (!map[key]) {
    map[key] = {};   
  }
  let count = map[key][rowData];
  if (!count) {
     map[key][rowData] = 1
  } else {
     map[key][rowData] = count + 1;   
  }
}

function createExtractionLink(title, target, rowData) {
  return '<i class="fa fa-lg fa-pencil-square mr-3" title="' + title
      + '" target="' + target + '" data-name="' + rowData.name 
      + '" data-resultIndex="' + rowData.resultIndex
      + '" data-downloadURL="' + rowData.downloadURL + '"/>';
}

function initApplicabilityTableData(data) {
    let rows = [];
    for (var i = 0; i < data.length; i++) {
      let rowData = data[i];
      rows.push({
        "name": rowData.name,
        "resultIndex": rowData.resultIndex,
        "showSepNote": rowData.showSepNote,
        "study": createCell(rowData.study),
        "setting": createCell(rowData.applicability_conditions + " : " + rowData.applicability_conditions_note),
        "population": createCell(rowData.applicability_population + " : " + rowData.applicability_population_note),
        "intervention": createCell(rowData.applicability_intervention + " : " + rowData.applicability_intervention_note),
        "control": createCell(rowData.applicability_baseline + " : " + rowData.applicability_baseline_note),
        "outcome": createCell(rowData.applicability_outcome + " : " + rowData.applicability_outcome_note),
        "action": createActionTableCell("applicabilityTableAction-" + i, 
            ["Exclude", "Include", "Show separately <br>but not meta-analyze"], rowData.applicability, true, rowData.showSepNote)
      });      
    }
    applicabilityTableData = rows;
}

function createTables() {
    // biasEvaluationTable
   biasEvaluationTable = $('#biasEvaluationTable').bootstrapTable({
     classes: ['table', 'table-bordered', 'table-hover', 'table-responsive-sm'],
     columns: biasEvaluationTableColumns,
     data: biasEvaluationTableData,
     undefinedText: '', // use empty string for undefined text instead of '-'
     'onPostBody': function() {
        // need to register events 
        registerClickEventsForBiasEvaluationTable();
     }    
    });
    
   measurementTable = $('#measurementTable').bootstrapTable({
     classes: ['table', 'table-bordered', 'table-hover', 'table-responsive-sm'],
     columns: measurementTableColumns,
     data: measurementTableData,
     undefinedText: '', // use empty string for undefined text instead of '-'
     'onPostBody': function() {
        // need to register events 
        registerClickEventsForMeasurementTable();
     }    
    });
   
   applicabilityTable = $('#applicabilityTable').bootstrapTable({
     classes: ['table', 'table-bordered', 'table-hover', 'table-responsive-sm'],
     columns: applicabilityTableColumns,
     data: applicabilityTableData,
     undefinedText: '', // use empty string for undefined text instead of '-'
     'onPostBody': function() {
        // need to register events 
        registerClickEventsForApplicabilityTable();
     }    
    });
    
    let h = 1000;
    $('#biasEvaluationTable').bootstrapTable('resetView', {height: h} );
    $('#measurementTable').bootstrapTable('resetView', {height: h});
    $('#applicabilityTable').bootstrapTable('resetView', {height: h}); 
    
    $('#navDiv a:first-child').addClass('selected');
    $('#measurementTableDiv').hide();
    $('#applicabilityTableDiv').hide();

}

function createActionTableCell(radioName, radioOptions, val, showNote, note) {
  let html = '';
  radioOptions.forEach(op => {
     let checked = (val == op) ? 'checked' : '';
     html += '<div><input type="radio" name="' + radioName + '" value="' + op + '" ' + checked + '>'
     + '<label class="ml-2">' + op + '</label></div>'
  });
     
  if (showNote) {
    let noteId = radioName + "_note"
    let noteText = note ? note : "";
    html += '<input id="' + noteId + '" type="text" ' + 'value="' + noteText + '">' 
  }
     
  return html; 
}

function onSaveNotesClicked(rowData, key, note) {
   writeUserAction(rowData.name, rowData.resultIndex, key, note);
   $("#notesModal").modal('hide');
}

function writeUserAction(docId, resultIndex, key, value) {
   if (authCurrentUser()) {
     getUserDocRef(docId).collection("results").doc("result-" + resultIndex).set({
        [key]  : value
     }, { merge: true });
   }   
}

function registerClickEventsForBiasEvaluationTable() {
   let noteAction = "Flag"
   biasEvaluationTableData.forEach((rowData, i) => {
     let inputName  = "biasEvalTableAction-" + i
     let noteInputId = "#" + inputName + "_note";
     $('input[name="' + inputName + '"]').on('change', function() {
        let selectedAction = $(this).val();
        writeUserAction(rowData.name, rowData.resultIndex, "riskOfBias", selectedAction)
        if (selectedAction == noteAction) {
          let note = rowData.flagNote ? rowData.flagNote : ""
          $("#notes").val(note);
          $("#notesModal .btn-primary").off("click");
          $("#notesModal .btn-primary").on("click", function() {
               let newNote = $("#notes").val();
               biasEvaluationTableData[i]["flagNote"] = newNote;
               $(noteInputId).val(newNote);
               onSaveNotesClicked(rowData, "flagNote", newNote);
          });
          $("#notesModal").modal('show'); 
           $(noteInputId).show();  
        } else {
           $(noteInputId).hide();     
        }
     });
     $(noteInputId).on('change', function() {
       let newNote = $(this).val();
       biasEvaluationTableData[i]["flagNote"] = newNote;
       writeUserAction(rowData.name, rowData.resultIndex, "flagNote", newNote);
     });
     
     let visible = $('input[name="' + inputName + '"]:checked').val() == noteAction;
     if (!visible)
       $(noteInputId).hide();
     
   });
   
   registerExtractionLinkClickEvent();
}

function registerExtractionLinkClickEvent() {
    $(".fa-pencil-square").on("click", function () {
     localStorage.setItem("documentId", $(this).attr("data-name"));
     localStorage.setItem("downloadURL",$(this).attr("data-downloadURL"));
     localStorage.setItem("resultIndex",$(this).attr("data-resultIndex"));
     let resultIndex = parseInt($(this).attr("data-resultIndex"));
     if (resultIndex > 1) {
        localStorage.setItem("resultIndex", resultIndex);
     } else {
        localStorage.removeItem("resultIndex"); 
     }

     localStorage.setItem("topicId", currentResearchTopicId);
     localStorage.setItem("questionId", currentQuestionId);
     let url = extractionPage +  "#" +  $(this).attr("target")
     window.open(url, '_blank');
   })
}

function registerClickEventsForMeasurementTable() {
   measurementTableData.forEach((rowData, i) => {
     let inputName = "measurementTableAction-" + i
     $('input[name="' + inputName + '"]').change(function() {
        let selectedAction = $(this).val();
        writeUserAction(rowData.name, rowData.resultIndex, "consistency", selectedAction)

        if (selectedAction == "Analyze separately") {
          // display study groups
          showStudyGroupsDialog(rowData.name);
        } 
     });
   });
     
   registerExtractionLinkClickEvent();
   
}

function registerClickEventsForApplicabilityTable() {
   let noteAction = "Show separately <br>but not meta-analyze"
   applicabilityTableData.forEach((rowData, i) => {
     let inputName = "applicabilityTableAction-" + i
     let noteInputId = "#" + inputName + "_note";
     $('input[name="' + inputName + '"]').change(function() {
        let selectedAction = $(this).val();
        writeUserAction(rowData.name, rowData.resultIndex, "applicability", selectedAction)
        if (selectedAction == noteAction) {
          let note = rowData.showSepNote ? rowData.showSepNote : ""
          $("#notes").val(note);
          $("#notesModal .btn-primary").off("click");
          $("#notesModal .btn-primary").on("click",  function() {
              let newNote = $("#notes").val();
              applicabilityTableData[i]["showSepNote"] = newNote;
              $(noteInputId).val(newNote);
              onSaveNotesClicked(rowData, "showSepNote", newNote);
          });
          $("#notes").val(note);
          $("#notesModal").modal('show');   
          $(noteInputId).show(); 
        } else {
          $(noteInputId).hide();
        }
    });
    
    $(noteInputId).keyup(function() {
       let newNote = $(this).val();
       applicabilityTableData[i]["showSepNote"] = newNote;
       writeUserAction(rowData.name, rowData.resultIndex, "showSepNote", newNote);
    });
    
    let visible = $('input[name="' + inputName + '"]:checked').val() == noteAction;
    if (!visible)
      $(noteInputId).hide();
     
  });
}

function showStudyGroupsDialog(studyName) {
  $("#studyGroups").empty();
  loadStudyGroups().then(groups => {
    if (!groups || groups.length == 0) {
      // add default study groups
      groups = defaultStudyGroups;
      writeUserData("studyGroups", groups)
    }

    let studyGroupsMap = {};
    groups.forEach(function (group) {
      studyGroupsMap[group] = [];
    });

    loadStudyPapers(studyGroupsMap).then(map => {
      let index = 1;
      Object.keys(map).forEach(function (group) {
        // create each study group UI
        createStudyGroupView(index, group, map[group], studyName)
        index++;
      });

      // ready to show the dialog
      $("#studyGroupsDialog").modal('show');  
    });
  });

}

function createStudyGroupView(index, groupName, studies, studyName) {
  let disableWidget = defaultStudyGroups.includes(groupName)
  let groupWidget =
       '<div class="studyGroup m-3">' +
       '<div class="d-flex flex-row mb-3">' + 
       '<input type="text" class="custom-input-text" value="' + groupName + '"'
  if (disableWidget) {
    groupWidget += ' disabled></div>'
  } else {
    groupWidget += '><span class="close deleteStudyGroupWidget" title="Remove study group">x</span></div>'
  }

  let id = "studyGroup-" + index
  let listWidget = '<ul id=' + id + ' class="list-group">'
  studies.forEach(function (studyInfo) {
    let item = '<li data-studyname="' + studyInfo.name + '" data-resultIndex=' + studyInfo.resultIndex + ' class="list-group-item'
    if (studyInfo.name == studyName) {
      item += ' highlight">' + studyInfo.study + '</li>'
    } else {
      item += '">' + studyInfo.study + '</li>'
    }

    listWidget += item;
  });

  listWidget += '</ul>'
  groupWidget += listWidget + '</div>'
  $("#studyGroups").append(groupWidget);

  $("#" + id).parent().find(".deleteStudyGroupWidget").on('click', function() {
    if ($(this).parent().parent().find(".list-group-item").length > 0) {
      alert("Only empty study group can be removed.")
    } else {
      $(this).parent().parent().remove();
    }
  });

  // enable drag and drop
  let list = $("#" + id)[0]
  Sortable.create(list, {
    group: 'studyGroupShared',
    sort: false,
    draggable: '.list-group-item',
    handle: '.list-group-item'
  }); 

}

function loadStudyGroups() {
  if (authCurrentUser()) {
    var userRef = getCurrentUserRef();
    if (userRef) {
      return userRef.get().then(function(user) {
          var data = [];
          if (user.exists) {
            data = user.data();
          }
          return Promise.resolve(data["studyGroups"]); 
      });
    } else {
      return Promise.resolve([]);
    }
  } else {
    return Promise.resolve([]);  
  }
}

function loadStudyPapers(studyGroupsMap) {
  return new Promise((resolve, reject) => {
    var listRef = getStorageListRef();
    listRef.listAll().then(function(res) {
      if (res.items.length == 0) {
        resolve(studyGroupsMap)
      }
      var count = 0,
      countExcluded = 0;
        res.items.forEach(function(itemRef) {
            // for each itemRef (uploaded paper), retrieve file name and read extracted document data 
            Promise.all(retrieveFileInfo(itemRef)).then(function(fileInfo) {

                var included = (fileInfo[1].customMetadata.included == "true") ? true : false;
                var name = itemRef.name;
                readDocumentDataWithPromise(name).then(function(docData) {
                  if (hasEmptyExtractionData(docData)) {
                    count++;
                    if (count == (res.items.length - countExcluded)) {
                      resolve(studyGroupsMap);
                    }
                  }
                  else if (included && !Array.isArray(docData) && docData.completeCheck) {
                      return Promise.all(docResultDataPromises(docData.numOfResults, name)).then(function(resultDataList) {
                        count++;
                        if (resultDataList.length > 0) {
                            var downloadURL = fileInfo[0];
                            resultDataList.forEach(function(result, index) {
                                let resultIndex = resultDataList.length > 1 ? " result " + (index + 1) : "";
                                let study = {
                                    // study info
                                    "name": name,
                                    "study": docData.authors.split(',')[0] + ' et al. ' + docData.year + resultIndex,
                                    "resultIndex": index + 1
                                }
                                if (result.studyGroup) {
                                  studyGroupsMap[result.studyGroup].push(study)
                                } else {
                                  //studyGroupsMap[defaultStudyGroups[0]].push(study)

                                  // set study group depending on other saved data when there's no 'studyGroup' data
                                  if (result.consistency && result.consistency.startsWith("Show separately")) {
                                    studyGroupsMap[defaultStudyGroups[2]].push(study)
                                  } else if (result.applicability && result.applicability.startsWith("Analyze separately")) {
                                    studyGroupsMap[defaultStudyGroups[1]].push(study)
                                  } else {
                                    studyGroupsMap[defaultStudyGroups[0]].push(study)
                                  } 
                                }
                            });
                        }

                        if (count == (res.items.length - countExcluded)) {
                          // We've created table rows for each result in each non-excluded study. Resolve promise.
                          resolve(studyGroupsMap);
                        } 
                      }) // end of Promise.all
                    } else if (!included) {
                      countExcluded++;
                    }
                }); // end of readDocumentDataWithPromise

            }); // end of retrieveFileInfo
        }); // end of forEach
      });
  }); 
}


