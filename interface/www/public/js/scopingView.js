var textInputIdList = ["interventionQuestion", "outcomeQuestion", "contextInput", "currentPractice"];

$( function() {
  registerChangeEvents();

});

function displayData(data) {
  textInputIdList.forEach (function(inputId) {
    var value = data[inputId];
    if (value && value.length > 0) {
      $('#' + inputId).val(value);
    } 
  });
  
  if (data.expectedOutcome) {
    var expectedOutcome = data.expectedOutcome;
    $('input:radio[name="expectedOutcome"][value="'+ expectedOutcome +'"]').prop('checked', true);
    updateExpectedOutcome(expectedOutcome);
  } else {
    updateExpectedOutcome('');  
  }
  
  // criteriaList
  $("#criteriaList").empty();
  if (data.criteriaList) {
    var criteriaList = data.criteriaList;
    criteriaList.forEach(function(criteria) {
        addCriteriaWidget(criteria);
    });
  }
  
  // confoundingVariableList
  $("#confoundingVariableList").empty();
  if (data.confoundingVariableList) {
    var confoundingVariableList = data.confoundingVariableList;
    confoundingVariableList.forEach(function(confoundingVariable) {
        addConfoundingVariableWidget(confoundingVariable);
    });
  }
  updateManagementBtnStatus();
}

function updateExpectedOutcome(currentValue) {
  $('#expectedOutcomeAlert').hide();
  if (currentValue == "correlation" || currentValue == "rate" || currentValue == "survival") {
       $('#expectedOutcomeAlert').show();  
  } 
}


function registerChangeEvents() {
   textInputIdList.forEach (function(inputId) {
      $('#' + inputId).keyup(function() {
        var value = $(this).val()
        // TODO: writeCurrentQuestionData
        writeCurrentQuestionData(inputId, value); 
        updateManagementBtnStatus();
      });
   });
   
  $('input[name="expectedOutcome"]').change(function() {
    writeCurrentQuestionData("expectedOutcome", $(this).val());
       updateManagementBtnStatus();
       updateExpectedOutcome($(this).val());
       updateEffectSizeTableColumns(true);
  });
   
  $("#addCriteriaButton").on("click", function () {
      addCriteriaWidget('');
  })
  $("#addConfoundingVariable").on("click", function () {
      addConfoundingVariableWidget('');
  })
  $("#managementBtn").on("click", function () {
      window.location = managementPage + urlSearchParams();
  })
}

function loadUserData() {
  if (authCurrentUser()) {
    var userRef = getCurrentUserRef();
    if (userRef) {
      userRef.get().then(function(user) {
          var data = [];
          if (user.exists) {
            displayData(user.data());
            $(".preloader").fadeOut();
          }
      });
    }
  }
}

function addCriteriaWidget(criteria) {
   var newWidget =
       '<li class="criteriaWidget">' +
       '<input type="text" class="custom-input-text m_criteria" autocomplete="off" value="' + criteria + '">' + 
       '<button class="close deleteCriteriaWidget">x</button></li>';

   $("#criteriaList").append(newWidget);
   
   $(".deleteCriteriaWidget").off('click');
   $(".deleteCriteriaWidget").click(function(event) {
      // remove first and then save data.
      $(this).parent().remove(); 
      writeCriteriaList();
   });
   
   $('.m_criteria').off('change');
   $('.m_criteria').change(function() {
      writeCriteriaList(); 
   }); 
} 

function addConfoundingVariableWidget(variable) {
   var newWidget =
       '<li class="confoundingVariableaWidget">' +
       '<input type="text" class="custom-input-text m_confounding" autocomplete="off" value="' + variable + '">' + 
       '<button class="close deleteConfoundingVariableWidget">x</button></li>';

   $("#confoundingVariableList").append(newWidget);
   
   $(".deleteConfoundingVariableWidget").off('click');
   $(".deleteConfoundingVariableWidget").click(function(event) {
      // remove first and then save data.
      $(this).parent().remove(); 
      writeConfoundingVariables();
   });
   
   $('.m_confounding').off('change');
   $('.m_confounding').change(function() {
       writeConfoundingVariables(); 
   }); 
} 

function writeCriteriaList() {
    var criteriaList = $("#criteriaList .criteriaWidget").toArray()
     .map(widget => $(widget).find('.m_criteria').val().trim())
     .filter(criteria => criteria && criteria.length > 0);
     writeCurrentQuestionData("criteriaList", criteriaList);
}

function writeConfoundingVariables() {
    var confoundingVariableList = $("#confoundingVariableList .confoundingVariableaWidget").toArray()
     .map(widget => $(widget).find('.m_confounding').val().trim())
     .filter(variable => variable && variable.length > 0);
     writeCurrentQuestionData("confoundingVariableList", confoundingVariableList);
}

function updateManagementBtnStatus() {
    let inputWithValueList = textInputIdList.filter(id => $('#' + id).val().trim().length > 0);
    let expectedOutcome = $('input[name="expectedOutcome"]:checked').val();
    let disabled = (inputWithValueList.length != textInputIdList.length) || !expectedOutcome;
    $("#managementBtn").prop("disabled", disabled);
}

