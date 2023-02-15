var storageRef = firebase.storage().ref();
var usersRef = firebase.firestore().collection("users");
var demoVersion = false; //true;
var currentResearchTopicId = '';
var currentQuestionId = '';
// TODO: need a different source UID
var defaultSourceUid = "UKMUiF3iF3dYxCVUcX7vTWfK2F13";
var demoTestUrl = window.location.origin + "/?uid=";
var keysToKeep = ["lastSignInTime", "sourceUid", "lastSignInTimeAnonymously", "signInTimeAnonymously"];
var papersPath = "eval-papers/"; // demoVersion ? "demo-papers/" : "papers/";

// selectionBias 1 - 3, measurementIssues 1 - 3
var assessmentQuestions = ["selectionBias_q1", "selectionBias_q2", "measurementIssues_q1", "applicability_q1", "applicability_q2"];
var assessmentQuestionsForResult = ["selectionBias_q3", "measurementIssues_q2", "measurementIssues_q3", "reportingBias_q1", "applicability_q3", "applicability_q4", "applicability_q5"];

var extractionPage = "extraction.html"
var managementPage = "management.html"
var visualizationPage = "visualization.html"

function getPapersPath() {
  // per user and per research topic
  return papersPath + authCurrentUser().uid + "/" + currentResearchTopicId + "/";
}

function urlSearchParams() {
  return (currentResearchTopicId != "" && currentQuestionId != "") ? ("?topicId=" + currentResearchTopicId + "&questionId=" + currentQuestionId) : ""
}


// get the current authenticated user
function authCurrentUser() {
  return firebase.auth().currentUser;
}

function parseParams() {
  let params = new URLSearchParams(window.location.search)
  if (params.has("topicId"))
    currentResearchTopicId = params.get("topicId");
  else if (localStorage.getItem("topicId"))
    currentResearchTopicId = localStorage.getItem("topicId");
  if (params.has("questionId"))
    currentQuestionId = params.get("questionId")
  else if (localStorage.getItem("questionId"))
    currentQuestionId = localStorage.getItem("questionId");
}

function handleSignInAnonymously(callback) {
  firebase.auth().signInAnonymously().then(function () {
    var userRef = getCurrentUserRef();
    userRef.get().then(function (userDoc) {
      callback();
      setLastSignInTimeAnonymously(userRef);

      /*if (!userDoc.exists) {
        let sourceUid = createNewUserDoc(userRef);
        loadDataForDemoVersion(sourceUid).then(function () {
          callback();
          setLastSignInTimeAnonymously(userRef);
        });
      } else if (shouldReload(userDoc)) {
        let sourceUidFromParam = getSourceUidFromParam();
        setSourceUid(userRef, sourceUidFromParam);
        loadDataForDemoVersion(sourceUidFromParam).then(function () {
          callback();
          setLastSignInTimeAnonymously(userRef);
        });
      } else {
        callback();
        setLastSignInTimeAnonymously(userRef);
      } */
    });
  });
}

function setLastSignInTimeAnonymously(userRef) {
  userRef.set({ 'lastSignInTimeAnonymously': getCurrentDateTime() }, { merge: true });
}

function shouldReload(userDoc) {
  let sourceUidFromParam = getSourceUidFromParam();
  return sourceUidFromParam
    && usersRef.doc(sourceUidFromParam).exists // source exists
    && sourceUidFromParam != userDoc.data().sourceUid  // different source
    && sourceUidFromParam != authCurrentUser().uid // not the same as the current user's uid
    && confirm('You are about to reload from a different source UID.  Are you sure you want to continue?');
}

function getSourceUidFromParam() {
  let params = new URLSearchParams(location.search);
  return params.get("uid");
}

function createNewUserDoc(userRef) {
  let sourceUid = getSourceUidFromParam();
  if (sourceUid && !usersRef.doc(sourceUid).exists) {
    alert("Unknown uid: " + sourceUid);
    return;
  }
  if (!sourceUid) {
    sourceUid = defaultSourceUid;
  }
  setSourceUid(userRef, sourceUid);
  userRef.set({ 'signInTimeAnonymously': getCurrentDateTime() }, { merge: true });
  return sourceUid;
}

function setSourceUid(userRef, sourceUid) {
  userRef.set({ 'sourceUid': sourceUid }, { merge: true });
}

function getStorageListRef() {
  return storageRef.child(getPapersPath());
}

function getUploadRef(filename) {
  return storageRef.child(getPapersPath() + filename);
}

/**
* Handles the sign in button press.
*/
function toggleSignIn() {
  // Disable the sign-in button during async sign-in tasks.
  document.getElementById('sign-in-out').disabled = true;
  if (authCurrentUser()) {
    firebase.auth().signOut().catch(function (error) {
      handleError(error);
    });
  } else {
    // Google sign in
    var provider = new firebase.auth.GoogleAuthProvider();
    provider.setCustomParameters({
      prompt: 'select_account'
    });
    // Opens a popup window and returns a promise to handle errors
    firebase.auth().signInWithPopup(provider).then(function () {
      var userRef = getCurrentUserRef();
      userRef.set({ 'lastSignInTime': getCurrentDateTime() }, { merge: true });
      // Re-enable the sign-in button.
      document.getElementById('sign-in-out').disabled = false;
    }).catch(function (error) {
      handleError(error);
    });
  }
}

function getCurrentDateTime() {
  var now = new Date();
  var date = (now.getMonth() + 1) + '-' + now.getDate() + '-' + now.getFullYear();
  var time = now.getHours() + ":" + now.getMinutes() + ":" + now.getSeconds();
  return date + ' ' + time;
}

/**
 * Handles Errors from various Promises..
 */
function handleError(error) {
  // Display Error.
  alert('Error: ' + error.message);
  console.log(error);
  // Re-enable the sign-in button.
  document.getElementById('sign-in-out').disabled = false;
}

function getCurrentUserRef() {
  // TODO: for multiple research topics / questions - use this id: x0gAV95H7rT4IzsDcdBU0YIyewE2
  return usersRef.doc(authCurrentUser().uid);
  //return usersRef.doc("x0gAV95H7rT4IzsDcdBU0YIyewE2");
}

// get the reference for the specified docId for the current user
function getUserDocRef(docId) {
  var userRef = getCurrentUserRef();
  return getCurrentQuestionRef().collection("docs").doc(docId);
  //return userRef.collection("docs").doc(docId);
}

// get the reference for the current user's doc.
function getCurrentUserDocRef() {
  return getUserDocRef(getCurrentDocId());
}

// the current doc id
function getCurrentDocId() {
  return localStorage.getItem("documentId");
}

// save key value pair data for the specified docId
function writeDocumentData(docId, key, value) {
  if (authCurrentUser()) {
    getUserDocRef(docId).set({
      [key]: value
    }, { merge: true });
  }
}

function writeUserData(key, value) {
  if (authCurrentUser()) {
    getCurrentUserRef().set({
      [key]: value
    }, { merge: true });
  }
}

function writeCurrentQuestionData(key, value) {
  if (authCurrentUser()) {
    getCurrentQuestionRef().set({
      [key]: value
    }, { merge: true });
  }
}


function removeDocument(docId) {
  if (authCurrentUser()) {
    getUserDocRef(docId).delete();
  }
}

// read saved data for the specified docId
function readDocumentDataWithPromise(docId) {
  if (authCurrentUser()) {
    var docRef = getUserDocRef(docId);
    if (docRef) {
      return docRef.get().then(function (doc) {
        var docData = [];
        if (doc.exists) {
          docData = doc.data();
        }
        return Promise.resolve(docData);
      });
    } else {
      return Promise.resolve([]);
    }
  } else {
    return Promise.resolve([]);
  }
}

// read the result reference for the specified result index under the docRef
function getDocResultRef(docRef, resultIndex) {
  return docRef.collection("results").doc("result-" + resultIndex);
}

// read the result data for the specified result index under the docRef.
function readDocResultDataWithPromise(docRef, resultIndex) {
  if (authCurrentUser()) {
    return getDocResultRef(docRef, resultIndex).get().then(function (result) {
      var loadedResultData = [];
      if (result.exists) {
        loadedResultData = result.data();
      }
      return Promise.resolve(loadedResultData);
    });
  } else {
    return Promise.resolve([]);
  }
}

// gets the list of promises to get all results data for the doc with the specified name
function docResultDataPromises(numOfResults, name) {
  if (numOfResults) {
    // retrieve all results data for the given doc name / id.
    var resultIndices = Array.from(Array(parseInt(numOfResults)).keys()).map(i => i + 1);
    var docRef = getUserDocRef(name);
    // return an array of promises : Caller of this function should use Promise.all 
    return resultIndices.map(function (resultIndex) {
      return readDocResultDataWithPromise(docRef, resultIndex);
    });
  } else {
    return []; // no result
  }
}

function completedQualityAssessment(docData) {
  return filter(docData, assessmentQuestions).length == 0;
}

function completedQualityAssessmentForResult(resultData) {
  return filter(resultData, assessmentQuestionsForResult).length == 0;
}
// return the list of fields that are not completed
function filter(docData, fields) {
  return fields.filter(field => {
    var value = docData[field];
    return !value || value == '';
  });
}

// returns the list of result data with extraction completed
function filterResultDataList(docData, resultDataList) {
  var filtered = resultDataList.filter(resultData => canCalculateEffectSize(docData, resultData));
  return filtered;
}

function canCalculateEffectSize(docData, resultData) {
  var outcomeOfInterest = resultData.outcomeOfInterest;
  if (!outcomeOfInterest) return false;

  // effect size - 1
  var sampleSizeReport = resultData.sampleSizeReport;
  if (!sampleSizeReport || sampleSizeReport == 'neitherSampleSize') {
    return false;
  }
  // effect size - 2 & 3
  var isDichotomous = (outcomeOfInterest == 'dichotomous');
  var isContinuous = (outcomeOfInterest == 'continuous');

  if (docData.adjustConfounding && !docData.adjustConfoundingList) {
    docData.adjustConfoundingList = [docData.adjustConfounding]
  }
  var isConfoundingAdjustedInStatModel = docData.adjustConfoundingList ? docData.adjustConfoundingList.includes('includedAsCovariatesInStatModel') : false;
  var countOrProportion = resultData.countOrProportion;
  var meanReport = resultData.meanReport;
  var reliabilityReport = resultData.reliabilityReport;

  if (!isConfoundingAdjustedInStatModel) {
    if (isDichotomous && (!countOrProportion || countOrProportion == 'neitherCountOrProportion')) {
      return false;
    }
    if (isContinuous) {
      if (!meanReport || meanReport == 'neitherMeanReport') {
        return false;
      }
      if (!reliabilityReport || reliabilityReport == 'none') {
        return false;
      }
    }
  }

  let isWithinSubjects = resultData.betweenOrWithinSubjects == 'withinSubjects';

  // check table data
  return isEffectSizeTableCompleted(resultData.effectSizeTableData, isConfoundingAdjustedInStatModel,
    isDichotomous, isContinuous, countOrProportion, sampleSizeReport, meanReport, reliabilityReport, isWithinSubjects);
}

function isEffectSizeTableCompleted(tableData, isConfoundingAdjustedInStatModel, isDichotomous, isContinuous,
  countOrProportion, sampleSizeReport, meanReport, reliabilityReport, isWithinSubjects) {

  if (tableData.length == 0) return false; // empty table

  var numRows = tableData.length;
  var numRowsWhenConditionVisible = numRows / 2;

  // sample size column is disabled for 'Control' rows when condition column is visible 
  // and sample size report is overall option.
  let sampleSizeDisabled = (isDichotomous
    || (meanReport == 'meanOutcome')
    || (reliabilityReport == 'separatedStandardDeviations' || reliabilityReport == 'separatedStandardErrors'))
    && sampleSizeReport == 'overallSampleSize';
  let numRowsForSampleSize = sampleSizeDisabled ? numRowsWhenConditionVisible : numRows;
  if (!hasData(tableData, 'sampleSize', numRowsForSampleSize)) {
    return false;
  }

  // count or proportion:  every row 
  if (isDichotomous && !isConfoundingAdjustedInStatModel) {
    if (countOrProportion == 'count' && !hasData(tableData, 'count', numRows)) {
      return false;
    } else if (countOrProportion == 'proportion' && hasData(tableData, 'proportion', numRows)) {
      return false;
    }
  } else if (isContinuous) {
    // update 'meanReport' depending on 'isConfoundingAdjustedInStatModel'
    meanReport = isConfoundingAdjustedInStatModel ? '' : meanReport;
    var conditionColumnVisible = (sampleSizeReport == 'separateSampleSize')
      || (meanReport == 'meanOutcome')
      || (reliabilityReport == 'separatedStandardDeviations')
      || (reliabilityReport == 'separatedStandardErrors');
    // mean outcome: every row 
    if (meanReport == 'meanOutcome' && !hasData(tableData, 'mean', numRows)) {
      return false;
    } else if (meanReport == 'meanDiff') {
      if (conditionColumnVisible && !hasData(tableData, 'meanDifference', numRowsWhenConditionVisible)) {
        return false;
      } else if (!conditionColumnVisible && !hasData(tableData, 'meanDifference', numRows)) {
        return false;
      }
    }
    if ((reliabilityReport == 'separatedStandardDeviations' && !hasData(tableData, 'sd', numRows))
      || (reliabilityReport == 'separatedStandardErrors' && !hasData(tableData, 'separatedSDErrors', numRows))) {
      // require every row
      return false;
    } else if (conditionColumnVisible && // expect value for only half of the table length
      ((reliabilityReport == 'pooledStandardDeviations' && !hasData(tableData, 'pooledSD', numRowsWhenConditionVisible))
        || (reliabilityReport == 'standardError' && !hasData(tableData, 'sdError', numRowsWhenConditionVisible))
        || (reliabilityReport == 'residualStandardError' && !hasData(tableData, 'resStdErr', numRowsWhenConditionVisible))
        || (reliabilityReport == 'tValue' && !hasData(tableData, 'tValue', numRowsWhenConditionVisible))
        || (reliabilityReport == 'fValue' && !hasData(tableData, 'fValue', numRowsWhenConditionVisible))
        || (reliabilityReport == 'pValue' && !hasData(tableData, 'pValue', numRowsWhenConditionVisible))
        || (reliabilityReport == 'confidenceInterval'
          && (!hasData(tableData, 'ciLower', numRowsWhenConditionVisible) || !hasData(tableData, 'ciUpper', numRowsWhenConditionVisible))))) {
      return false;
    } else if (!conditionColumnVisible &&  // expect every row
      ((reliabilityReport == 'pooledStandardDeviations' && !hasData(tableData, 'pooledSD', numRows))
        || (reliabilityReport == 'standardError' && !hasData(tableData, 'sdError', numRows))
        || (reliabilityReport == 'residualStandardError' && !hasData(tableData, 'resStdErr', numRows))
        || (reliabilityReport == 'tValue' && !hasData(tableData, 'tValue', numRows))
        || (reliabilityReport == 'fValue' && !hasData(tableData, 'fValue', numRows))
        || (reliabilityReport == 'pValue' && !hasData(tableData, 'pValue', numRows))
        || (reliabilityReport == 'confidenceInterval'
          && (!hasData(tableData, 'ciLower', numRowsWhenConditionVisible) || !hasData(tableData, 'ciUpper', numRowsWhenConditionVisible))))) {
      return false;
    }
  }

  // TODO: syl - will need to revisit here!
  let expectedNumRows = conditionColumnVisible ? numRowsWhenConditionVisible : numRows;
  if (isConfoundingAdjustedInStatModel) {
    // (regressionCoefficient or mean, or mean difference), numOfCovariates, and rSquared
    return (hasAtLeastData(tableData, 'regressionCoefficient', expectedNumRows) ||
      hasAtLeastData(tableData, 'mean', expectedNumRows) ||
      hasAtLeastData(tableData, 'meanDifference', expectedNumRows))
      && hasAtLeastData(tableData, 'numOfCovariates', expectedNumRows)
      && hasAtLeastData(tableData, 'rSquared', expectedNumRows);
  }

  if (isWithinSubjects) {
    // repeatedMeasures
    if (!hasData(tableData, 'repeatedMeasures', expectedNumRows)) {
      return false;
    }
  }

  // all completed
  return true;
}


// true if table has the expected number of rows with non-empty value for the specified field.
function hasData(tableData, field, expectedNumRows) {
  return tableData.filter(rowData => rowData[field] != '').length == expectedNumRows;
}

function hasAtLeastData(tableData, field, minNumRows) {
  return tableData.filter(rowData => rowData[field] != '').length >= minNumRows;
}

function loadDataForDemoVersion(sourceUid) {
  return new Promise(resolve => {
    cleanUpCurrentUserDoc().then(function () {
      var sourceDocRef = usersRef.doc(sourceUid);
      sourceDocRef.get().then(userDoc => {
        var sourceData = userDoc.data();
        for (key in sourceData) {
          if (!keysToKeep.includes(key)) {
            getCurrentUserRef().set({ [key]: sourceData[key] }, { merge: true });
          }
        }
        var docsRef = sourceDocRef.collection("docs");
        docsRef.get().then(snapshot => {
          var numDocs = 0
          snapshot.forEach(doc => {
            // doc data
            var docId = doc.id;
            getUserDocRef(docId).set(doc.data());
            docsRef.doc(docId).collection("results").get().then(results => {
              results.forEach(result => {
                // result data
                getUserDocRef(docId).collection("results").doc(result.id).set(result.data());
              })
              numDocs++;
              if (numDocs == snapshot.size) {
                console.log("finished loading from source : " + sourceUid);
                resolve("done");
              }
            }) // results
          }) //snapshot.forEach
        }) // docsRef
      }); // sourceDocRef
    }); // cleanUpCurrentUserDoc
  }) // promise
}

function cleanUpCurrentUserDoc() {
  // delete existing data for the current user doc
  return new Promise(resolve => {
    let currentUserRef = getCurrentUserRef();
    currentUserRef.get().then(currentUserDoc => {
      // user data
      for (key in currentUserDoc.data()) {
        if (!keysToKeep.includes(key)) {
          currentUserRef.update({ [key]: firebase.firestore.FieldValue.delete() });
        }
      }

      // docs
      let currentDocsRef = currentUserRef.collection("docs");
      currentDocsRef.get().then(snapshot => {
        if (snapshot.size == 0) { resolve("done"); }

        let numDocs = 0
        snapshot.forEach(doc => {
          // doc data
          let docId = doc.id;
          currentDocsRef.doc(docId).collection("results").get().then(results => {
            // delete each result
            results.forEach(result => { getUserDocRef(docId).collection("results").doc(result.id).delete(); })
            numDocs++;
            currentDocsRef.doc(docId).delete();
            if (numDocs == snapshot.size) {
              resolve("done");
            }
          }) // results
        }) //snapshot.forEach
      }) // currentDocsRef
    }); // currentUserRef  
  }); // Promise
}

function initForDemoVersion() {
  $('#sign-in-out').hide();
  $('#userName').hide();
  $('#resetBtn').hide();
  $('#copyLinkBtn').hide()
  /* $('#resetBtn').show();
   $('#resetBtn').on("click", function () {
     if (confirm('Are you sure you want to delete all your changes and reload?')) {
       $('#resetBtn').attr("disabled", true);
       getCurrentUserRef().get().then(function (user) {
         let sourceUid = user.data().sourceUid;
         loadDataForDemoVersion(sourceUid).then(function () {
           $('#resetBtn').attr("disabled", false);
           window.setTimeout(function () {
             location.reload();
           }, 1000);
         });
       });
     }
   });
   $('#copyLinkBtn').show();
   $('#copyLinkBtn').on("click", function () {
     copyLink();
   });
   $('#alertContainer').hide(); */
}

function updateUserInfo(user) {
  let authenticatedUser = user && !user.isAnonymous;
  let signInOut = authenticatedUser ? 'Sign Out' : "Sign In";
  let userName = authenticatedUser ? user.displayName : '';
  $('#sign-in-out').text(signInOut);
  $('#userName').text(userName);
  $('#sign-in-out').attr("disabled", false);
}

function copyLink() {
  let el = document.createElement('textarea');
  el.value = demoTestUrl + authCurrentUser().uid;
  el.setAttribute('readonly', '');
  el.style.position = 'absolute';
  el.style.left = '-9999px';
  document.body.appendChild(el);
  el.select();
  document.execCommand('copy');
  document.body.removeChild(el);
  $('#alertContainer').show();
  $('#alertContainer span').text("Link copied");
  $('#alertContainer').fadeTo(100, 1);
  window.setTimeout(function () {
    $("#alertContainer").fadeTo("slow", 0, function () {
      $('#alertContainer span').text("");
    });
  }, 1000);
}

function hideDemoWidgets() {
  $('#resetBtn').hide();
  $('#copyLinkBtn').hide();
  $('#alertContainer').hide();
}

function updateDemoWidgets(disabled) {
  $('#resetBtn').attr("disabled", disabled);
  $('#copyLinkBtn').attr("disabled", disabled);
}

function loadAndInit() {
  $("#top").load("header.html", function () {
    parseParams();
    initialize();
  });
}

function setResearchQuestion() {
  if (authCurrentUser()) {
    var userRef = getCurrentUserRef();
    if (userRef) {
      getCurrentQuestionRef().get().then(questionRef => {
        let data = questionRef.data();
        let question = "What is the impact of " + data.interventionQuestion + " on " + data.outcomeQuestion + "?";
        $("#researchQuestion").text(question);
      });

      /*userRef.get().then(function (user) {
        if (user.exists) {
          let data = user.data();
          let question = "What is the impact of " + data.interventionQuestion + " on " + data.outcomeQuestion + "?";
          $("#researchQuestion").text(question);
        }
      }); */
    }
  }
}

function retrieveFileInfo(fileRef) {
  var promises = [];
  promises.push(fileRef.getDownloadURL());
  promises.push(fileRef.getMetadata());
  return promises;
}

function getQuestionRef(topicId, questionId) {
  return topicsRef().doc(topicId).collection("questions").doc(questionId);
}
 
function getCurrentResearchTopic() {
  return topicsRef().doc(currentResearchTopicId);
}

function getCurrentQuestionRef() {
  return getQuestionRef(currentResearchTopicId, currentQuestionId);
}

function topicsRef() {
  return getCurrentUserRef().collection("topics");
}

function hasEmptyExtractionData(docData) {
  let empty = docData.length == 0 || (Object.entries(docData).length == 1 && docData.numOfResults)
  return empty || !docData.completeCheck;
}



