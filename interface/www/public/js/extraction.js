var textInputIdList = ["title", "authors", "year", "otherTypeName",
   "otherTypeDescription", "otherSettingName", "otherSettingDescription",
   "studyIdentityNotes", "studyContextNotes", "participantsNotes", 
   "recruitParticipants", "criteriaParticipants", "sampleOfParticipants"];


var LOCATION_PATH_START = 'extraction.html#';


$( function() {
 Split(['#left', '#right'], {
        gutterSize: 3,
        sizes: [50, 50],
        cursor: 'col-resize'
 });

 if (!getCurrentDocId()) {        
    return;   
 }
 $("#evidenceQualityAssessment").load("assessment.html", function() {
     $("#codingManual").load("codingManual.html", function() {
         // finished loading all html 
         registerChangeEvents();
         updateResults();
         
         var hash = location.hash;
         if (hash) {
           if (hash.startsWith("#selectionBias_") || hash.startsWith("#measurementIssues_")
             ||hash.startsWith("#reportingBias_") || hash.startsWith("#applicability_")) {
                showAssessment();
           } else {
             showExtractionForm(); 
           }
           
           updateHref(hash.replace("#", ""));
         } else {
            showExtractionForm();
         }
     });
 });

 $(".fa-th-list").click(function(){
    window.location = window.location.origin + "/" + managementPage + urlSearchParams();
 });

});

function updateStudyTypePanel(currentValue) {
   updateExtractionIcon("studyContext_1_extraction", true);
   if (currentValue == 'observationalType') {
      $("#observationalTypeAlert").show();
      $("#otherTypePanel").hide();
   } else if (currentValue == 'otherType') {
        $("#otherTypePanel").show();
        $("#observationalTypeAlert").hide();
   } else {
      $("#observationalTypeAlert").hide();
      $("#otherTypePanel").hide();
   }
}

function updateOtherSettingPanel(currentValue) {
   updateExtractionIcon('studyContext_setting_extraction', true);
   if (currentValue == 'otherSetting') {
      $("#otherSettingPanel").show();
   } else {
      $("#otherSettingPanel").hide();
   }   
}


function displayDocData(data) {
  textInputIdList.forEach (function(inputId) {
    var value = data[inputId];
    if (value && value.length > 0) {
      $('#' + inputId).val(value);
      if (inputId == 'studyIdentityNotes' 
        || inputId == 'studyContextNotes' || inputId== 'participantsNotes') {
         $('#' + inputId).show();
      }
      updateExtractionIconForTextInput(inputId, true);
    }
  });
  
  if (data.studyType) {
    var studyType = data.studyType;
    $('input:radio[name="studyType"][value="'+ studyType +'"]').prop('checked', true);
    updateStudyTypePanel(studyType);
  } 
  
  if (data.useControlGroup) {
  	var useControlGroup = data.useControlGroup;
    $('input:radio[name="useControlGroup"][value="'+ useControlGroup +'"]').prop('checked', true);
    if (useControlGroup == 'observationalStudyNotUseControlGroup') {
      $('#noControlGroupAlert').show();	
    } else {
      $('#noControlGroupAlert').hide();	   
    }
  }
  

  if (data.adjustConfounding && !data.adjustConfoundingList) {
     data.adjustConfoundingList = [data.adjustConfounding];
     writeData("adjustConfoundingList", data.adjustConfoundingList)
  }
  if (data.randomization) {
     let randomization = data.randomization;
     $('input:radio[name="randomization"][value="'+ randomization +'"]').prop('checked', true);
     onChangeRandomization(randomization);
  }
  if (data.adjustConfoundingList) {
     data.adjustConfoundingList.forEach( adjustConfounding => {
       $('input:checkbox[name="adjustConfounding"][value="'+ adjustConfounding +'"]').prop('checked', true);
       onChangeAdjustConfounding(adjustConfounding);
     });
  }

 
  
  /*if (data.groupOfInterest) {
    var groupOfInterest = data.groupOfInterest;
    $('input:radio[name="groupOfInterest"][value="'+ groupOfInterest +'"]').prop('checked', true);
  } */
  
  if (data.studySetting) {
    var studySetting = data.studySetting;
    $('input:radio[name="studySetting"][value="'+ studySetting +'"]').prop('checked', true);
    updateOtherSettingPanel(studySetting);
  }
  
  if (data.numOfResults) {
    $("#numOfResults").val(data.numOfResults);
    updateResults();
  } else {
    writeData("numOfResults", $("#numOfResults").val());
  }
  
  assessmentQuestions.forEach (function(questionId) {
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
  
}

function updateExtractionIconForTextInput(inputId, completed) {
   if (inputId == 'recruitParticipants') {
       updateExtractionIcon("participants_1_extraction", completed);   
   } else if (inputId == 'criteriaParticipants') {
       updateExtractionIcon("participants_2_extraction", completed);   
   } else if (inputId == 'sampleOfParticipants') {
       updateExtractionIcon("participants_3_extraction", completed);   
   } 
}

function updateExtractionIcon(target, completed) {
   if (completed) {
     $(".fa-pencil-square[target=" + target + "]").addClass("complete");
   } else {
     $(".fa-pencil-square[target=" + target + "]").removeClass("complete");  
   }
}

function updateAssessmentIcon(questionId) {
   var target = questionId.replace("_q", "_") + "_assessment";
   $(".fa-list-alt[target=" + target + "]").addClass("complete");
}

function registerChangeEvents() {
   textInputIdList.forEach (function(inputId) {
      $('#' + inputId).keyup(function() {
        var value = $(this).val()
        writeData(inputId, value); 
        if (value.length > 0) {
           updateExtractionIconForTextInput(inputId, true);

           // autofill options
           if (inputId == 'otherSettingDescription') {
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
           updateExtractionIconForTextInput(inputId, false); 
        }
      });
   });
   
   // studyType
   $("#otherTypePanel").hide();
   $("#observationalTypeAlert").hide();
   var studyType = "studyType";
   $('input[name="' + studyType + '"]').change(function() {
        updateStudyTypePanel($(this).val());
        writeData(studyType, $(this).val());
   });
   
   $('#noControlGroupAlert').hide();		
   $('input[name="useControlGroup"]').change(function() {
   	 var useControlGroup = $(this).val();
       writeData("useControlGroup", useControlGroup);
       if (useControlGroup == 'observationalStudyNotUseControlGroup') {
       	   $('#noControlGroupAlert').show();
       } else {
       	   $('#noControlGroupAlert').hide();		   
       }
   });
   
   $('#nothingForConfoundingAlert').hide();	
   $('#randomAssignmentPanel').hide();		
   $('input:checkbox[name="adjustConfounding"]').change(function() {
   	 var adjustConfounding = $(this).val();
       onChangeAdjustConfounding(adjustConfounding, true);
       updateEffectSizeTableColumns(true);
   });

   $('#randomizationAlert').hide();		
   $('input:radio[name="randomization"]').change(function() {
       var randomization = $(this).val();
       onChangeRandomization(randomization);
       writeData("randomization", randomization);
   });

   /* $('input[name="groupOfInterest"]').change(function() {
        writeData("groupOfInterest", $(this).val());
   }); */
    
   //studySetting
   $("#otherSettingPanel").hide();
   var studySetting = "studySetting";
   $('input[name="' + studySetting + '"]').change(function() {
       updateOtherSettingPanel($(this).val());
       writeData(studySetting, $(this).val());
   });
   
   // numOfResults
   $('#numOfResults').change(function() {
       writeData("numOfResults", $(this).val());
       updateResults();
   });
   
   $(".dropdown-item").click(function() {
       var id = $(this).parents(".nav-item")[0].id;
       if (id == "evidenceExtractionNavItem") {
          showExtractionForm();   
       } else if (id == "assessmentNavItem") {
          showAssessment();   
       } else if (id == "codingManualNavItem") {
          showCodingManual();   
       }
   });
   
   $(".fa-pencil-square").click(function() {
      showExtractionForm();
      updateHref($(this).attr("target")); 
   });
   
   assessmentQuestions.forEach (function(questionId) {
        $('input:radio[name="' + questionId + '"]').change(function() {
           var value = $(this).val();
           updateAlertDiv(questionId, value);
           writeData(questionId, value);
           $('input:radio[name="' + questionId + '"][value="'+ value + '"]').prop('checked', true);
           updateAssessmentIcon(questionId);
        });
        // input for yes note
        var inputId = getInputNoteId(questionId);
        $('input[id="' + inputId + '"]').change(function() {
          var value = $(this).val();
          writeData(inputId, value);
          // update both text input in wrapper and in main form.
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

}

function onChangeAdjustConfounding(changedValue, needToSave) {
   if (changedValue == 'nothingForConfounding') {
      if ($('#nothingForConfounding').is(":checked")) {
   	     $('#nothingForConfoundingAlert').show();
         // deselect other checkboxes
         $('input:checkbox[name="adjustConfounding"]:checked').toArray()
           .filter(widget => $(widget).val() != changedValue )
           .forEach(widget => $(widget).prop("checked", false));
      } else {
   	     uncheckNothingForConfounding();
      }
   } else if ($('#' + changedValue).is(":checked")) {
       uncheckNothingForConfounding();
   }

   
   let showRandomAssignmentPanel = $('#randomAssignment').is(":checked")
   if (showRandomAssignmentPanel) {
      $('#randomAssignmentPanel').show();
      onChangeRandomization($('input:radio[name="randomization"]:checked').val());
   } else {
      $('#randomAssignmentPanel').hide();
      showOrHideClusterDifferences(false); 
   }
   
   if (needToSave) {
      let adjustConfoundingList = $('input:checkbox[name="adjustConfounding"]:checked').toArray()
         .map(widget => $(widget).val());
      writeData("adjustConfoundingList", adjustConfoundingList);
   }
   
   updateEffectSizeQuestions();
}

function onChangeRandomization(randomization) {
   let showWarning = (randomization == 'somethingElse')
   if (showWarning) {
      $('#randomizationAlert').show();
   } else {
      $('#randomizationAlert').hide();
   }
   showOrHideClusterDifferences(randomization == 'clusterRandomization'); 
}

function uncheckNothingForConfounding() {
  $('#nothingForConfoundingAlert').hide();	
  $('#nothingForConfounding').prop("checked", false);      
}

function registerEventsForIcons() {
    $(".fa-question-circle").click(function() {
      showCodingManual(); 
      updateHref($(this).attr("target")); 
   });
   
   $(".fa-list-alt").click(function() {
      showAssessment();
      updateHref($(this).attr("target")); 
   });
}

function updateHref(target) {
   location.href = LOCATION_PATH_START + target; 
   // remove any existing class.
   $('.highlight').removeClass('highlight');
   $('#' + target).addClass('highlight');
}

function updateResults() {
   var numOfResults = $("#numOfResults").val();
   if (numOfResults == "1") {
       $("#resultsNav").hide();
       loadResult(1, numOfResults);
       $("#results").removeClass("scrollable");
       
   } else { // more than one results
       $("#resultsNav").empty();
       for (var i = 1; i <= parseInt(numOfResults); i++) {
           var isSelected = (i == 1) ? ' selected' : '';
           var resultItem = '<li class="nav-item"><a class="nav-link' + isSelected + 
               '" id="result-' + i + '"' + 'data-index=' + i + '>Result-' + i + '</a></li>';
             $("#resultsNav").append(resultItem);
       }
       $("#resultsNav").show();
       $("#resultsNav .nav-item a").on('click', function() {
          $("#resultsNav .nav-item a").removeClass('selected');
          $(this).addClass('selected');
          var index = $(this).attr("data-index");
          loadResult(index, numOfResults);
       });
       $("#results").addClass("scrollable");
       // show the first result by default
       let resultIndex = 1;
       let resultIndexInStorage = localStorage.getItem("resultIndex");
       if (resultIndexInStorage) {
           resultIndex = parseInt(resultIndexInStorage);
           localStorage.removeItem("resultIndex");
           $("#resultsNav .nav-item a").removeClass('selected');
           $("#resultsNav .nav-item a[data-index=" + resultIndex + "]").addClass('selected');
       }
       loadResult(resultIndex, numOfResults);
   }
}

function readUserDataWithPromise() {
  if (authCurrentUser()) {
    var userRef = getCurrentUserRef();
    if (userRef) {
      return userRef.get().then(function(user) {
          var data = [];
          if (user.exists) {
            data = user.data();
          }
          return Promise.resolve(data); 
      });
    } else {
      return Promise.resolve([]);
    }
  } else {
    return Promise.resolve([]);  
  }
}


function loadResult(resultIndex, numOfResults) {
   $("#results").load("result.html", function() {
      initResultView(resultIndex);
      registerEventsForIcons();
      
      let hash = location.hash;
      if (hash) {
        let id = hash.replace("#", "")
        document.getElementById(id).scrollIntoView();
        updateHref(id)
      }
      
      // get the current document data and result data 
      var docId = getCurrentDocId();
      var promises = [];
      promises.push(readDocumentDataWithPromise(docId));
      promises.push(readMeasurementsDataWithPromise());
      promises.push(readUserDataWithPromise());
      Promise.all(promises).then(function(dataList) {
          var docData = dataList[0];
          var measurementsData = dataList[1];
          var userData = dataList[2];
          Promise.all(docResultDataPromises(numOfResults, docId)).then(function(resultDataList) {
              var resultData = resultDataList[resultIndex-1];
              if (resultIndex > 1 && resultData && resultData.length == 0) {
                  // copy data from the first result
                  var firstResultData = resultDataList[0];
                  resultData = firstResultData;
                  getDocResultRef(getUserDocRef(docId), resultIndex).set(resultData);
              }
              displayResultData(resultData, docData, resultDataList, measurementsData, userData);
          });
      });
   });
}


function showExtractionForm() {
  $(".nav-link").removeClass("active");
  $("#evidenceExtractionButton").addClass("active");
  $("#evidenceExtraction").show();
  $("#evidenceQualityAssessment").hide();
  $("#codingManual").hide();
}

function showAssessment() {
  $(".nav-link").removeClass("active");
  $("#assessmentButton").addClass("active");
  $("#evidenceExtraction").hide();
  $("#evidenceQualityAssessment").show();
  $("#codingManual").hide();
} 

function showCodingManual() {
  $(".nav-link").removeClass("active");
  $("#codingManualButton").addClass("active");
  $("#evidenceExtraction").hide();
  $("#evidenceQualityAssessment").hide();
  $("#codingManual").show();
}

function getAlertId(assessmentQuestionId) {
   return assessmentQuestionId + "_alert";  
}

function updateAlertDiv(assessmentQuestionId, value) {
  var alertId = getAlertId(assessmentQuestionId);
  var alertDiv = $("#" + alertId);
  var label = $("#" + alertId + " label");

  if (value) {
     if (value == assessmentQuestionId + "_yes") {
        label.text("What are the specific issues?");
     } else if (value == assessmentQuestionId + "_no") {
        label.text("Notes");
     } else { // not sure
        label.text("What issues might there be?"); 
     }
     alertDiv.show();
  } else {
     alertDiv.hide();
  }
}

function getInputNoteId(assessmentQuestionId) {
   return assessmentQuestionId + "_note";   
}

function measurementDoc() {
   if (authCurrentUser()) {
       return firebase.firestore().collection("measurements").doc("measurementDoc");
   }
   return Promise.resolve([]);
}

function readMeasurementsDataWithPromise() {
    return measurementDoc().get().then(function(measurements) {
        if (measurements.exists) {
           return Promise.resolve(measurements.data());   
        } else {
           return Promise.resolve([]);   
        }
    });
}



	
