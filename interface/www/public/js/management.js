var managementTable;
var managementTableData = [];
var managementTableColumns = [
   {field: 'state', checkbox: true, align: 'center'},
   {field: 'study', title: 'Study', sortable: 'true'},  
   {field: 'extract', title: '', align: 'center'},  
   {field: 'status', title: 'Review Status', align: 'center', sortable: 'true'},
   {field: 'include', title: 'Include', align: 'center', sortable: 'true'}
   ];


$( function() {
   $("#upload input[type=file]").change(function(event) {
       var files = event.target.files;
       if (files.length == 1) {
          upload(files[0]);   
       }
   });
   
   $("#metaAnalyzeBtn").click(function(event) {
       window.location = visualizationPage + urlSearchParams();
   });
   
   $("#triageBtn").click(function(event) {
       window.location = "triage.html" + urlSearchParams();
   });
   
   $("#deleteUpload").hide();
   
   $("#deleteModal .btn-danger").on("click", function () {
      var selections = getSelections();
      var promises = selections.map(file => {
        var fileRef = getUploadRef(file);
        return fileRef.delete();
      });      
      
      Promise.all(promises).then(function() {
        $('#managementTable').bootstrapTable('remove', {
           field: 'name',
           values: selections
        });
        selections.forEach(selection => removeDocument(selection));
        updateTable();
        $("#deleteUpload").hide();        
          
      }).catch(function(error) {
        // error occurred
        console.log("Error occurred while trying to delete study files");
      });
   });
   
   $("#deleteModal .btn-secondary").on("click", function () {
      // cancel out of delete modal
      $('#managementTable').bootstrapTable('uncheckBy', {field: 'name', values: getSelections()});
      $("#deleteUpload").hide();        
   });
   
   
});
  
function upload(file) {
  // check if file is already uploaded
  if (exists(file.name)) {
    alert(file.name + " already uploaded");  
    return;   
  }
  
  if (file.type != "application/pdf") {
    alert(file.name + " is not a PDF file");
    return;   
  }
    
  // set file metadata
  var metadata = {
      contentType: 'application/pdf',
      customMetadata: {'included': true }
  };
  
  // use Firebase push call to upload file to Firebase
  var uploadTask = getUploadRef(file.name).put(file, metadata);

  // monitor Firebase upload progress and catch errors
  uploadTask.on(firebase.storage.TaskEvent.STATE_CHANGED, 
  function(snapshot) {
   initUploadStatus();
   $('#uploadStatus .alert label').html('<span class="spinner-border mr-2" role="status"></span>Uploading...');
 }, function(error) {
    // catch an error when it happens, note: there are more error codes
    switch(error.code) {
        case 'storage/bucket_not_found':
            console.log('The Bucket for this storage could not be found');
            break;
        case 'storage/unauthorized':
            console.log('User doesn\'t have access');
            break;
        case 'storage/cancelled':
            console.log('User cancelled the upload process');
            break;
        case 'storage/unknown':
            console.log('Unknown error');
            break;
    }
    $('#uploadStatus .alert').removeClass("alert-secondary");
    $('#uploadStatus .alert').addClass("alert-danger");
    $('#uploadStatus .alert label').html("Error while trying to upload :" + error.code);
    return;
  }, function() {
    // upload is done.
    $('#uploadStatus .alert').removeClass("alert-secondary");
    $('#uploadStatus .alert').addClass("alert-success");
    $('#uploadStatus .alert label').html("Upload complete: <b>" + file.name + "</b>");
    
    loadPapers();
})
}  

function exists(filename) {
   var found = false;
   found = managementTableData.find(function(data) {
       if (data.name == filename) {
          return true;   
       }
   });
   return found;
}

function initUploadStatus() {
     var html = '<div class="alert alert-secondary" role="alert"><label></label>'
       + '<button type="button" class="close" data-dismiss="alert" aria-label="Close">'
       + '<span aria-hidden="true">&times;</span>'
       + '</button></div>';
     $('#uploadStatus').html(html);
}

function createTable() {
   managementTable = $('#managementTable').bootstrapTable({
     columns: managementTableColumns,
     data: managementTableData,
     theadClasses: "thead-light",
     classes: "table",
     formatLoadingMessage: function() {
        return '<span class="preloader"></span>';
     },
     'onPostBody': function() {
        managementTableData.forEach((rowData, i) => {
           if (!rowData["includeVal"]) {
              $("#managementTable tr[data-index=" + i + "]").removeClass("off").addClass("off");
          }
        });
        // need to register events 
        registerClickEventsForTable();
     }    
   });
}

function loadPapers() {
  setResearchQuestion();
  var listRef = getStorageListRef();
  managementTableData = [];
  listRef.listAll().then(function(res) {
    createTable();
    managementTable.bootstrapTable('showLoading')
    if (res.items.length == 0) {
       managementTable.bootstrapTable('hideLoading');
       if (demoVersion) {
           updateDemoWidgets(false);
       }
    }
    var count = 0;
    res.items.forEach(function(itemRef) {
      // for each itemRef (uploaded paper), retrieve file info : downloadURL and custom metadata 
      Promise.all(retrieveFileInfo(itemRef)).then(function(fileInfo) {
        var downloadURL = fileInfo[0];
        var included = (fileInfo[1].customMetadata.included == "true") ? true : false;
        var name = itemRef.name;
        // use name (uploaded file name)
        readDocumentDataWithPromise(name).then(function(docData) {
          count ++;
          return Promise.all(docResultDataPromises(docData.numOfResults, name)).then(function(resultDataList) {
            var disabled = (included) ? "" : " disabled";
            var tableRow = {};
            tableRow["name"] = name;
            tableRow["study"] = "<a href=" + downloadURL + ">" + name + "</a>";
            tableRow["extract"] = "<button class='btn btn-dark btn-sm extract' data-document='" + name 
              + "' data-downloadurl='" + downloadURL + "'" + disabled 
              + "><i class='fa fa-lg fa-pencil-square mr-2'/>Review</button>";
            var status = getStatus(docData, resultDataList);
            if (status.warning != '') {
               status.warning = '<button data-toggle="popover" data-html="true" data-trigger="focus" class="btn btn-sm btn-outline-danger" ' 
                 + 'data-content="' + status.warning + '"><b>!</b></button>';   
            }
            tableRow["status"] = status.html + " " + status.warning;
            var radioName = "options-" + managementTableData.length;
            tableRow["include"] = createIncludedTableCell(radioName, included);
            tableRow["includeVal"] = included;
            managementTableData.push(tableRow);
          
            if (count == res.items.length) {
               updateTable();
            } 
          });  // Promise.all
        }); // end of readDocumentDataWithPromise
      }); // end of retrieveFileInfo
    }); // end of forEach
  
  }).catch(function(error) {
    console.log("error: " + error);
  }); 
}

function updateTable() {
  // sort by uploaded paper name
  managementTableData.sort(function(a, b) {
      if (a.name.toLowerCase() < b.name.toLowerCase()) return -1;
      if (a.name.toLowerCase() > b.name.toLowerCase()) return 1;
      return 0; 
  });
  managementTable.bootstrapTable('hideLoading')
  managementTable.bootstrapTable('load', managementTableData);
  registerClickEventsForTable();
  updateMetaAnalyzeBtn();   
  $('[data-toggle="popover"]').popover();   
  if (demoVersion) {
      updateDemoWidgets(false);
  }
}

function updateMetaAnalyzeBtn() {
  var numExcluded = 0;
  var numCompleted = 0;
  managementTableData.forEach(function(rowData) {
     var included = rowData["includeVal"];
     var status = rowData["status"];
     if (!included) {
        numExcluded ++;
     } 
     if (included && status.includes('Completed')) {
        numCompleted ++;
     }
  });
  var total = numExcluded + numCompleted;
  // TODO: enable / disable "Triage" button
  var enableMetaAnalyze = (numCompleted > 0) && (total == managementTableData.length);
  if (enableMetaAnalyze) {
       $("#metaAnalyzeBtn").attr("disabled", false);
       $("#metaAnalyzeBtn").removeClass("btn-secondary").addClass("btn-primary");
  } else {
      $("#metaAnalyzeBtn").attr("disabled", true);
      $("#metaAnalyzeBtn").removeClass("btn-primary").addClass("btn-secondary");
  }
}

function createIncludedTableCell(radioName, included) {
  var html = '<div class="btn-group btn-group-toggle" data-toggle="buttons">'
     + '<label class="btn btn-sm btn-success btn-yes';
  if (included) {
     html += ' active">';
  } else {
     html += '">';   
  }
  html += '<input type="radio" name=' + radioName + ' autocomplete="off">Yes</label>'
     + '<label class="btn btn-sm btn-secondary btn-no';
  if (!included) {
     html += ' active">';
  } else {
     html += '">';   
  }
  html += '<input type="radio" name=' + radioName + ' autocomplete="off">No</label>';   
 
  return html;
}

function registerClickEventsForTable() {
  $(".extract").off('click');
  $(".extract").on("click", function () {
    localStorage.setItem("documentId", $(this).attr("data-document"));
    localStorage.setItem("downloadURL", $(this).attr("data-downloadurl"));
    localStorage.setItem("topicId", currentResearchTopicId);
    localStorage.setItem("questionId", currentQuestionId);
    window.location = extractionPage;
  })
    
  // register click events for yes and no buttons
  $(".btn-yes").off('click');
  $(".btn-yes").on("click", function () {
      updateIncluded(this, true);
  })

  $(".btn-no").off('click');
  $(".btn-no").on("click", function () {
     updateIncluded(this, false); 
  })   
      
  $("#managementTable").off('check.bs.table uncheck.bs.table check-all.bs.table uncheck-all.bs.table');
  $('#managementTable').on('check.bs.table uncheck.bs.table ' +
      'check-all.bs.table uncheck-all.bs.table',
    function () {
      var numSelected = $('#managementTable').bootstrapTable('getSelections').length;
      if (numSelected > 0) {
        $("#deleteUpload").show();
      } else {
        $("#deleteUpload").hide();
      }
    })
}

function getSelections() {
    return $.map($('#managementTable').bootstrapTable('getSelections'), function (row) {
      return row.name;
    })
  }

function updateIncluded(clickedButton, included) {
  var row = $(clickedButton).parents('tr')[0];
  if (included) {
      $(row).removeClass("off");
      $(row).find(".extract").attr("disabled", false);
  } else {
      $(row).addClass("off"); 
      $(row).find(".extract").attr("disabled", true);
  }
  
  var extractCell = $(row).find(".extract")[0];
  var docId= $(extractCell).attr("data-document");
  var newMetadata = { customMetadata: {'included': included } }
  getUploadRef(docId).updateMetadata(newMetadata).then(function(metadata) {
    // updated
    var index = $(row).attr("data-index");
    var rowData = managementTableData[index];
    rowData["includeVal"] = included;
    updateMetaAnalyzeBtn();
  })
}


function getStatus(docData, resultDataList) {
  var status = {html:'', warning:''};
  if (hasEmptyExtractionData(docData)) {
     status.html = '<span class="badge badge-light">Not Started</span>';
     return status;
  }
  
  var completedStatus = '<span class="badge badge-success">Completed</span>';
  var inProgressStatus = '<span class="badge badge-light">In Progress</span>';
  
  // no extraction 
  if (resultDataList.length == 0) {
     status.html = inProgressStatus;
     return status;
  } else {
      var doneExtractionResults = filterResultDataList(docData, resultDataList)
      if (doneExtractionResults.length == 0) {
         status.html = inProgressStatus;
         return status;
      }
      // user marked as complete
      if (docData.completeCheck == true) {    
          var doneAssessmentResults = doneExtractionResults.filter(resultData => completedQualityAssessmentForResult(resultData));
          if (!completedQualityAssessment(docData) || doneExtractionResults.length != doneAssessmentResults.length) {
             // warning : not completed assessment questions    
             status.warning = "You have not completed the quality of evidence questionnaire."; 
          }
          
          var numOfResults = docData.numOfResults;
          if (numOfResults) {
             if (parseInt(numOfResults) > doneExtractionResults.length) {
                if (status.warning != '') {
                    status.warning = "<li>" + status.warning + "<li>"
                }
                status.warning += "You have not extracted effect size information for all measurements."; 
             }
          }
          
          status.html = completedStatus;
          return status;
      } else {
         status.html = inProgressStatus;
         return status;   
      }
  }
}

     