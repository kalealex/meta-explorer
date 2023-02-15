// // possible sources of bias to check
// const possibleSourcesOfBias = [
//     {
//         "name": "Different Study Types",
//         "fieldToCheck": "studyType",
//         "question": "What kind of study is this?",
//         "questionId": "studyContext_1_extraction"
//     },
//     {
//         "name": "Different Study Settings",
//         "fieldToCheck": "studySetting",
//         "question": "What was the study setting?",
//         "questionId": "studyContext_2_extraction"
//     },
//     {
//         "name": "Different Study Designs",
//         "fieldToCheck": "studyDesign",
//         "question": "Was the outcome measurement between-subjects (only one observation per participant) or within-subjects (multiple observations per participant)?",
//         "questionId": "measurement_6_extraction"
//     },
//     {
//         "name": "Different Interventions",
//         "fieldToCheck": "independentVariable",
//         "question": "What was the independent variable in the study?",
//         "questionId": "measurement_1_extraction"
//     },
//     {
//         "name": "Different Outcomes",
//         "fieldToCheck": "dependentVariable",
//         "question": "What was the dependent variable in the study?",
//         "questionId": "measurement_3_extraction"
//     },
//     {
//         "name": "Different Groups",
//         "fieldToCheck": "group",
//         "question": "Do the authors report this measure separately for different groups of participants?",
//         "questionId": "measurement_8_extraction"
//     },
//     {
//         "name": "Different Timecourses",
//         "fieldToCheck": "timePoint",
//         "question": "When were measures taken?",
//         "questionId": "measurement_7_extraction"
//     },
//     {
//         "name": "Selection Bias: Recruitment",
//         "fieldToCheck": "selectionBias_recruitment",
//         "question": "Did the recruitment process result in intervention and control groups that were systematically different?",
//         "questionId":"selectionBias_1_assessment"
//     },
//     {
//         "name": "Selection Bias: Exclusion or Attrition",
//         "fieldToCheck": "selectionBias_exclusionAttrition",
//         "question": "Did exclusion or attrition result in intervention and control groups that were systematically different?",
//         "questionId": "selectionBias_2_assessment"
//     },
//     {
//         "name": "Selection Bias: Lack of Random Assignment",
//         "fieldToCheck": "selectionBias_randomAssignment",
//         "question": "Did the study fail to randomly assign participants to intervention and control conditions?",
//         "questionId": "selectionBias_3_assessment"
//     },
//     {
//         "name": "Selection Bias: Uncontrolled Confounding",
//         "fieldToCheck": "selectionBias_confounding",
//         "question": "Did the study fail to control for confounding variables that could explain differences in the outcome of interest between the intervention and control groups?",
//         "questionId": "selectionBias_4_assessment"
//     },
//     {
//         "name": "Issues Measuring Intervention",
//         "fieldToCheck": "measurementIssues_intervention",
//         "question": "Did the study fail to isolate the impact of being in the intervention versus control group?",
//         "questionId": "measurementIssues_1_assessment"
//     },
//     {
//         "name": "Issues Measuring Outcome",
//         "fieldToCheck": "measurementIssues_outcome",
//         "question": "Did the study fail to detect or measure the outcome of interest?",
//         "questionId": "measurementIssues_2_assessment"
//     },
//     {
//         "name": "Reporting Bias",
//         "fieldToCheck": "reportingBias",
//         "question": "Did the study authors seem to selectively report findings to support a particular narrative?",
//         "questionId": "reportingBias_1_assessment"
//     },
//     {
//         "name": "Different Conditions from Target Setting",
//         "fieldToCheck": "applicability_conditions",
//         "question": "Was the study conducted under conditions that differ in important ways from the situation you are trying to make an inference about?",
//         "questionId": "applicability_1_assessment"
//     },
//     {
//         "name": "Different Population than Target",
//         "fieldToCheck": "applicability_population",
//         "question": "Did the sample of participants differ in important ways from the population you are trying to make an inference about?",
//         "questionId": "applicability_2_assessment"
//     },
//     {
//         "name": "Different Intervention than Target",
//         "fieldToCheck": "applicability_intervention",
//         "question": "Was the intervention evaluated in this study different in important ways from the intervention you are interested in making an inference about?",
//         "questionId": "applicability_3_assessment"
//     },
//     {
//         "name": "Different Control Condition than No Intervention in Target",
//         "fieldToCheck": "applicability_baseline",
//         "question": "Did the study compare the intervention of interest to a control condition that is different in important ways from what would happen if you didn't intervene in the situation you are trying to make an inference about?",
//         "questionId": "applicability_4_assessment"
//     },
//     {
//         "name": "Different Outcome than Target",
//         "fieldToCheck": "applicability_outcome",
//         "question": "Was the outcome measured in this study different in important ways from the outcome you are interested in making an inference about?",
//         "questionId": "applicability_5_assessment"
//     }
// ]

// set up chart component
// var forestPlot = forestPlot();

function loadReviewData() {
    parseParams();
    return new Promise((resolve, reject) => {
        var listRef = getStorageListRef();
        var reviewData = [];
        listRef.listAll().then(function (res) {
            if (res.items.length == 0) {
                resolve(reviewData)
            }
            var count = 0,
                countExcluded = 0,
                targetCount = res.items.length;
            res.items.forEach(function (itemRef) {
                // for each itemRef (uploaded paper), retrieve file name and read extracted document data 
                Promise.all(retrieveFileInfo(itemRef)).then(function (fileInfo) {
                    var included = (fileInfo[1].customMetadata.included == "true") ? true : false;
                    var name = itemRef.name;
                    readDocumentDataWithPromise(name).then(function (docData) {
                        if (included && !Array.isArray(docData) && docData.completeCheck) {
                            return Promise.all(docResultDataPromises(docData.numOfResults, name)).then(function (resultDataList) {
                                // console.log("docData", docData);
                                if (resultDataList.length > 0) {
                                    var downloadURL = fileInfo[0];
                                    resultDataList.forEach(function (result) {
                                        // console.log("result", result);
                                        // check for inclusion after triage
                                        if (result.riskOfBias !== "Exclude" && result.consistency !== "Exclude" && result.applicability !== "Exclude") {
                                            if ((result.groupEffects === "groupEffectsReported" && result.groupEffectsInterest === "differentGroups" && result.groupingFactors[0].levels.length > 1) || (result.multiplePointsMeasurementReport === "multiplePointsInTime" && result.multipleTimePointData.length > 1)) {
                                                // add multiple table rows from these studies, one per timept and/or group reported separately
                                                var nGroups = result.groupingFactors ? result.groupingFactors[0].levels.length : 1,
                                                    nTimepts = result.multipleTimePointData ? result.multipleTimePointData.length : 1;
                                                // console.log("groups", nGroups);
                                                // console.log("timepts", nTimepts);
                                                targetCount += (nGroups * nTimepts - 1); // increase target count to reflect multiple rows for current study
                                                for (let i = 0; i < nGroups; i++) {
                                                    for (let j = 0; j < nTimepts; j++) {
                                                        count++; // count included study results
                                                        // get current group and time
                                                        var group = result.groupingFactors ? result.groupingFactors[0].levels[i] : undefined,
                                                            groupName = "group_Intervention order", // TODO: make this flexible; hardcoded for demo
                                                            time = result.multipleTimePointData ? result.multipleTimePointData[j] : undefined;
                                                        var tableRow = {
                                                            // study info
                                                            "name": name,
                                                            "downloadURL": downloadURL,
                                                            "title": docData.title,
                                                            "author": docData.authors,
                                                            "year": docData.year,
                                                            "studyType": docData.studyType,
                                                            "studySetting": docData.studySetting,
                                                            "studyDesign": result.betweenOrWithinSubjects,
                                                            "independentVariable": result.independentVariable,
                                                            "dependentVariable": result.dependantVariable,
                                                            "included": true, // default to inclusing every study with a complete review
                                                            // effect size info 
                                                            "N": result.sampleSizeReport === "overallSampleSize" ? +result.effectSizeTableData.filter(row => row.condition === "Intervention" && row[groupName] === group && row.timePoint === time)[0].sampleSize.replace('\n', '') : null,
                                                            "nExp": result.sampleSizeReport === "separateSampleSize" ? +result.effectSizeTableData.filter(row => row.condition === "Intervention" && row[groupName] === group && row.timePoint === time)[0].sampleSize.replace('\n', '') : null,
                                                            "nCtrl": result.sampleSizeReport === "separateSampleSize" ? +result.effectSizeTableData.filter(row => row.condition === "Control" && row[groupName] === group && row.timePoint === time)[0].sampleSize.replace('\n', '') : null,
                                                            "outcomeType": result.outcomeOfInterest, // continuous or dichotomous
                                                            // demo dataset does not contain every possible input format, so we'll need to test/check the cases commented below to be sure they work
                                                            "meanExp": result.outcomeOfInterest === "continuous" && result.meanReport === "meanOutcome" ? +result.effectSizeTableData.filter(row => row.condition === "Intervention" && row[groupName] === group && row.timePoint === time)[0].mean.replace('\n', '') : null,
                                                            "meanCtrl": result.outcomeOfInterest === "continuous" && result.meanReport === "meanOutcome" ? +result.effectSizeTableData.filter(row => row.condition === "Control" && row[groupName] === group && row.timePoint === time)[0].mean.replace('\n', '') : null,
                                                            "meanDiff": result.outcomeOfInterest === "continuous" && result.meanReport === "meanDifference" ? +result.effectSizeTableData.filter(row => row.condition === "Intervention" && row[groupName] === group && row.timePoint === time)[0].meanDiff.replace('\n', '') : null,                          // need to check "meanDifference"
                                                            "sdExp": result.outcomeOfInterest === "continuous" && result.reliabilityReport === "separatedStandardDeviations" ? +result.effectSizeTableData.filter(row => row.condition === "Intervention" && row[groupName] === group && row.timePoint === time)[0].sd.replace('\n', '') : null,
                                                            "sdCtrl": result.outcomeOfInterest === "continuous" && result.reliabilityReport === "separatedStandardDeviations" ? +result.effectSizeTableData.filter(row => row.condition === "Control" && row[groupName] === group && row.timePoint === time)[0].sd.replace('\n', '') : null,
                                                            "sdDiff": result.outcomeOfInterest === "continuous" && result.reliabilityReport === "pooledStandardDeviation" ? +result.effectSizeTableData.filter(row => row.condition === "Intervention" && row[groupName] === group && row.timePoint === time)[0].sd.replace('\n', '') : null,                  // need to check "pooledStandardDeviation"
                                                            "stdErrExp": result.outcomeOfInterest === "continuous" && result.reliabilityReport === "separatedStandardErrors" ? +result.effectSizeTableData.filter(row => row.condition === "Intervention" && row[groupName] === group && row.timePoint === time)[0].separatedSDErrors.replace('\n', '') : null,
                                                            "stdErrCtrl": result.outcomeOfInterest === "continuous" && result.reliabilityReport === "separatedStandardErrors" ? +result.effectSizeTableData.filter(row => row.condition === "Control" && row[groupName] === group && row.timePoint === time)[0].separatedSDErrors.replace('\n', '') : null,
                                                            "stdErrMeanDiff": result.outcomeOfInterest === "continuous" && result.reliabilityReport === "pooledStandardError" ? +result.effectSizeTableData.filter(row => row.condition === "Intervention" && row[groupName] === group && row.timePoint === time)[0].sdError.replace('\n', '') : null,         // need to check "pooledStandardError"
                                                            "pValue": result.outcomeOfInterest === "continuous" && result.reliabilityReport === "pValue" ? +result.effectSizeTableData.filter(row => row.condition === "Intervention" && row[groupName] === group && row.timePoint === time)[0].pValue.replace('\n', '') : null,                               // need to check "pValue"
                                                            "nTails": result.outcomeOfInterest === "continuous" && result.reliabilityReport === "pValue" ? +result.nTails.replace('\n', '') : null,                                                                                                      // need to check "nTails"
                                                            "tValue": result.outcomeOfInterest === "continuous" && result.reliabilityReport === "tValue" ? +result.effectSizeTableData.filter(row => row.condition === "Intervention" && row[groupName] === group && row.timePoint === time)[0].tValue.replace('\n', '') : null,                               // need to check "tValue"
                                                            "fValue": result.outcomeOfInterest === "continuous" && result.reliabilityReport === "fValue" ? +result.effectSizeTableData.filter(row => row.condition === "Intervention" && row[groupName] === group && row.timePoint === time)[0].fValue.replace('\n', '') : null,                               // need to check "fValue"
                                                            "lowerBoundCI": result.outcomeOfInterest === "continuous" && result.reliabilityReport === "confidenceInterval" ? +parseCI(result.effectSizeTableData.filter(row => row.condition === "Intervention" && row[groupName] === group && row.timePoint === time)[0].ci)[0] : null,
                                                            "upperBoundCI": result.outcomeOfInterest === "continuous" && result.reliabilityReport === "confidenceInterval" ? +parseCI(result.effectSizeTableData.filter(row => row.condition === "Intervention" && row[groupName] === group && row.timePoint === time)[0].ci)[1] : null,
                                                            "confLevelCI": result.outcomeOfInterest === "continuous" && result.reliabilityReport === "confidenceInterval" ? +result.confidenceLevelValue.replace('\n', '').replace('%', '') : null,
                                                            "r": result.outcomeOfInterest === "continuous" && result.betweenOrWithinSubjects === "withinSubjects" ? +result.effectSizeTableData.filter(row => row.condition === "Intervention" && row[groupName] === group && row.timePoint === time)[0].repeatedMeasures.replace('\n', '') : null,
                                                            "rSquared": result.outcomeOfInterest === "continuous" && docData.adjustConfounding === "includedAsCovariatesInStatModel" ? +result.effectSizeTableData.filter(row => row.condition === "Intervention" && row[groupName] === group && row.timePoint === time)[0].rSquared.replace('\n', '') : null,
                                                            "countExp": result.outcomeOfInterest === "dichotomous" && result.countOrProportion === "count" ? +result.effectSizeTableData.filter(row => row.condition === "Intervention" && row[groupName] === group && row.timePoint === time)[0].count.replace('\n', '') : null,
                                                            "countCtrl": result.outcomeOfInterest === "dichotomous" && result.countOrProportion === "count" ? +result.effectSizeTableData.filter(row => row.condition === "Control" && row[groupName] === group && row.timePoint === time)[0].count.replace('\n', '') : null,
                                                            "pExp": result.outcomeOfInterest === "dichotomous" && result.countOrProportion === "proportion" ? +result.effectSizeTableData.filter(row => row.condition === "Intervention" && row[groupName] === group && row.timePoint === time)[0].proportion.replace('\n', '') : null,
                                                            "pCtrl": result.outcomeOfInterest === "dichotomous" && result.countOrProportion === "proportion" ? +result.effectSizeTableData.filter(row => row.condition === "Control" && row[groupName] === group && row.timePoint === time)[0].proportion.replace('\n', '') : null,
                                                            "nCovariates": docData.adjustConfounding === "includedAsCovariatesInStatModel" ? +result.effectSizeTableData.filter(row => row.condition === "Intervention" && row[groupName] === group && row.timePoint === time)[0].numOfCovariates.replace('\n', '') : null,
                                                            "regressionCoef": docData.adjustConfounding === "includedAsCovariatesInStatModel" ? +result.effectSizeTableData.filter(row => row.condition === "Intervention" && row[groupName] === group && row.timePoint === time)[0].regressionCoefficient.replace('\n', '') : null,
                                                            // triage info
                                                            "flag": result.riskOfBias === "Flag",
                                                            "flagNote": ('flagNote' in result) ? result.flagNote : null,
                                                            "analyzeSeparately": result.consistency === "Analyze separately",
                                                            // "analysisGroup": (result.consistency === "Analyze separately") ? "Within Subjects Studies" : "Between Subjects Studies", // analysis groups are hardcoded for the demo, but we need to create a dialogue process for users to bin studies into groups
                                                            "analysisGroup": result.studyGroup,
                                                            // "analyzeSeparatelyNote":
                                                            "showOnly": result.applicability === "Show separately <br>but not meta-analyze",
                                                            "showOnlyNote": ('showSepNote' in result) ? result.showSepNote : null,
                                                            // grouping factor and time point data
                                                            "group": group ? group : null,
                                                            "timePoint": time ? time : null,
                                                        };
                                                        reviewData.push(tableRow);
                                                    }
                                                }
                                            } else {
                                                count++; // count included study results
                                                var tableRow = {
                                                    // study info
                                                    "name": name,
                                                    "downloadURL": downloadURL,
                                                    "title": docData.title,
                                                    "author": docData.authors,
                                                    "year": docData.year,
                                                    "studyType": docData.studyType,
                                                    "studySetting": docData.studySetting,
                                                    "studyDesign": result.betweenOrWithinSubjects,
                                                    "independentVariable": result.independentVariable,
                                                    "dependentVariable": result.dependantVariable,
                                                    "included": true, // default to inclusing every study with a complete review
                                                    // effect size info 
                                                    "N": result.sampleSizeReport === "overallSampleSize" ? +result.effectSizeTableData.filter(row => row.condition === "Intervention")[0].sampleSize.replace('\n', '') : null,
                                                    "nExp": result.sampleSizeReport === "separateSampleSize" ? +result.effectSizeTableData.filter(row => row.condition === "Intervention")[0].sampleSize.replace('\n', '') : null,
                                                    "nCtrl": result.sampleSizeReport === "separateSampleSize" ? +result.effectSizeTableData.filter(row => row.condition === "Control")[0].sampleSize.replace('\n', '') : null,
                                                    "outcomeType": result.outcomeOfInterest, // continuous or dichotomous
                                                    // demo dataset does not contain every possible input format, so we'll need to test/check the cases commented below to be sure they work
                                                    "meanExp": result.outcomeOfInterest === "continuous" && result.meanReport === "meanOutcome" ? +result.effectSizeTableData.filter(row => row.condition === "Intervention")[0].mean.replace('\n', '') : null,
                                                    "meanCtrl": result.outcomeOfInterest === "continuous" && result.meanReport === "meanOutcome" ? +result.effectSizeTableData.filter(row => row.condition === "Control")[0].mean.replace('\n', '') : null,
                                                    "meanDiff": result.outcomeOfInterest === "continuous" && result.meanReport === "meanDifference" ? +result.effectSizeTableData.filter(row => row.condition === "Intervention")[0].meanDiff.replace('\n', '') : null,                          // need to check "meanDifference"
                                                    "sdExp": result.outcomeOfInterest === "continuous" && result.reliabilityReport === "separatedStandardDeviations" ? +result.effectSizeTableData.filter(row => row.condition === "Intervention")[0].sd.replace('\n', '') : null,
                                                    "sdCtrl": result.outcomeOfInterest === "continuous" && result.reliabilityReport === "separatedStandardDeviations" ? +result.effectSizeTableData.filter(row => row.condition === "Control")[0].sd.replace('\n', '') : null,
                                                    "sdDiff": result.outcomeOfInterest === "continuous" && result.reliabilityReport === "pooledStandardDeviation" ? +result.effectSizeTableData.filter(row => row.condition === "Intervention")[0].sd.replace('\n', '') : null,                  // need to check "pooledStandardDeviation"
                                                    "stdErrExp": result.outcomeOfInterest === "continuous" && result.reliabilityReport === "separatedStandardErrors" ? +result.effectSizeTableData.filter(row => row.condition === "Intervention")[0].separatedSDErrors.replace('\n', '') : null,
                                                    "stdErrCtrl": result.outcomeOfInterest === "continuous" && result.reliabilityReport === "separatedStandardErrors" ? +result.effectSizeTableData.filter(row => row.condition === "Control")[0].separatedSDErrors.replace('\n', '') : null,
                                                    "stdErrMeanDiff": result.outcomeOfInterest === "continuous" && result.reliabilityReport === "pooledStandardError" ? +result.effectSizeTableData.filter(row => row.condition === "Intervention")[0].sdError.replace('\n', '') : null,         // need to check "pooledStandardError"
                                                    "pValue": result.outcomeOfInterest === "continuous" && result.reliabilityReport === "pValue" ? +result.effectSizeTableData.filter(row => row.condition === "Intervention")[0].pValue.replace('\n', '') : null,                               // need to check "pValue"
                                                    "nTails": result.outcomeOfInterest === "continuous" && result.reliabilityReport === "pValue" ? +result.nTails.replace('\n', '') : null,                                                                                                      // need to check "nTails"
                                                    "tValue": result.outcomeOfInterest === "continuous" && result.reliabilityReport === "tValue" ? +result.effectSizeTableData.filter(row => row.condition === "Intervention")[0].tValue.replace('\n', '') : null,                               // need to check "tValue"
                                                    "fValue": result.outcomeOfInterest === "continuous" && result.reliabilityReport === "fValue" ? +result.effectSizeTableData.filter(row => row.condition === "Intervention")[0].fValue.replace('\n', '') : null,                               // need to check "fValue"
                                                    // "lowerBoundCI": result.outcomeOfInterest === "continuous" && result.reliabilityReport === "confidenceInterval" ? +result.effectSizeTableData.filter(row => row.condition === "Intervention")[0].ciLower.replace('\n','') : null,         // ci should be split into ciLower and ciUpper but isn't yet
                                                    // "upperBoundCI": result.outcomeOfInterest === "continuous" && result.reliabilityReport === "confidenceInterval" ? +result.effectSizeTableData.filter(row => row.condition === "Intervention")[0].ciUpper.replace('\n','') : null,
                                                    "lowerBoundCI": result.outcomeOfInterest === "continuous" && result.reliabilityReport === "confidenceInterval" ? +parseCI(result.effectSizeTableData.filter(row => row.condition === "Intervention")[0].ci)[0] : null,
                                                    "upperBoundCI": result.outcomeOfInterest === "continuous" && result.reliabilityReport === "confidenceInterval" ? +parseCI(result.effectSizeTableData.filter(row => row.condition === "Intervention")[0].ci)[1] : null,
                                                    "confLevelCI": result.outcomeOfInterest === "continuous" && result.reliabilityReport === "confidenceInterval" ? +result.confidenceLevelValue.replace('\n', '').replace('%', '') : null,
                                                    "r": result.outcomeOfInterest === "continuous" && result.betweenOrWithinSubjects === "withinSubjects" ? +result.effectSizeTableData.filter(row => row.condition === "Intervention")[0].repeatedMeasures.replace('\n', '') : null,
                                                    "rSquared": result.outcomeOfInterest === "continuous" && docData.adjustConfounding === "includedAsCovariatesInStatModel" ? +result.effectSizeTableData.filter(row => row.condition === "Intervention")[0].rSquared.replace('\n', '') : null,
                                                    "countExp": result.outcomeOfInterest === "dichotomous" && result.countOrProportion === "count" ? +result.effectSizeTableData.filter(row => row.condition === "Intervention")[0].count.replace('\n', '') : null,
                                                    "countCtrl": result.outcomeOfInterest === "dichotomous" && result.countOrProportion === "count" ? +result.effectSizeTableData.filter(row => row.condition === "Control")[0].count.replace('\n', '') : null,
                                                    "pExp": result.outcomeOfInterest === "dichotomous" && result.countOrProportion === "proportion" ? +result.effectSizeTableData.filter(row => row.condition === "Intervention")[0].proportion.replace('\n', '') : null,
                                                    "pCtrl": result.outcomeOfInterest === "dichotomous" && result.countOrProportion === "proportion" ? +result.effectSizeTableData.filter(row => row.condition === "Control")[0].proportion.replace('\n', '') : null,
                                                    "nCovariates": docData.adjustConfounding === "includedAsCovariatesInStatModel" ? +result.effectSizeTableData.filter(row => row.condition === "Intervention")[0].numOfCovariates.replace('\n', '') : null,
                                                    "regressionCoef": docData.adjustConfounding === "includedAsCovariatesInStatModel" ? +result.effectSizeTableData.filter(row => row.condition === "Intervention")[0].regressionCoefficient.replace('\n', '') : null,
                                                    // triage info
                                                    "flag": result.riskOfBias === "Flag",
                                                    "flagNote": ('flagNote' in result) ? result.flagNote : null,
                                                    "analyzeSeparately": result.consistency === "Analyze separately",
                                                    // "analysisGroup": (result.consistency === "Analyze separately") ? "Within Subjects Studies" : "Between Subjects Studies", // analysis groups are hardcoded for the demo, but we need to create a dialogue process for users to bin studies into groups
                                                    "analysisGroup": result.studyGroup,
                                                    // "analyzeSeparatelyNote":
                                                    "showOnly": result.applicability === "Show separately <br>but not meta-analyze",
                                                    "showOnlyNote": ('showSepNote' in result) ? result.showSepNote : null,
                                                    // grouping factor and time point data
                                                    "group": null,
                                                    "timePoint": result.effectSizeTableData.filter(row => row.condition === "Intervention")[0].timePoint
                                                    // // quality assessment
                                                    // "selectionBias_recruitment": docData.selectionBias_q1 ? docData.selectionBias_q1.split('q1_')[1] : "",
                                                    // "selectionBias_recruitment_note": docData.selectionBias_q1_note ? docData.selectionBias_q1_note : "",
                                                    // "selectionBias_exclusionAttrition": docData.selectionBias_q2 ? docData.selectionBias_q2.split('q2_')[1] : "",
                                                    // "selectionBias_exclusionAttrition_note": docData.selectionBias_q2_note ? docData.selectionBias_q2_note : "",
                                                    // "selectionBias_randomAssignment": docData.selectionBias_q3 ? docData.selectionBias_q3.split('q3_')[1] : "",
                                                    // "selectionBias_randomAssignment_note": docData.selectionBias_q3_note ? docData.selectionBias_q3_note : "",
                                                    // "selectionBias_confounding": result.selectionBias_q4 ? result.selectionBias_q4.split('q4_')[1] : "",
                                                    // "selectionBias_confounding_note": result.selectionBias_q4_note ? result.selectionBias_q4_note : "",
                                                    // "measurementIssues_intervention": docData.measurementIssues_q1 ? docData.measurementIssues_q1.split('q1_')[1] : "",
                                                    // "measurementIssues_intervention_note": docData.measurementIssues_q1_note ? docData.measurementIssues_q1_note : "",
                                                    // "measurementIssues_outcome": result.measurementIssues_q2 ? result.measurementIssues_q2.split('q2_')[1] : "",
                                                    // "measurementIssues_outcome_note": result.measurementIssues_q2_note ? result.measurementIssues_q2_note : "",
                                                    // "reportingBias": result.reportingBias_q1 ? result.reportingBias_q1.split('q1_')[1] : "",
                                                    // "reportingBias_note": result.reportingBias_q1_note ? result.reportingBias_q1_note : "",
                                                    // "applicability_conditions": docData.applicability_q1 ? docData.applicability_q1.split('q1_')[1] : "",
                                                    // "applicability_conditions_note": docData.applicability_q1_note ? docData.applicability_q1_note : "",
                                                    // "applicability_population": docData.applicability_q2 ? docData.applicability_q2.split('q2_')[1] : "",
                                                    // "applicability_population_note": docData.applicability_q2_note ? docData.applicability_q2_note : "",
                                                    // "applicability_intervention": result.applicability_q3 ? result.applicability_q3.split('q3_')[1] : "",
                                                    // "applicability_intervention_note": result.applicability_q3_note ? result.applicability_q3_note : "",
                                                    // "applicability_baseline": result.applicability_q4 ? result.applicability_q4.split('q4_')[1] : "",
                                                    // "applicability_baseline_note": result.applicability_q4_note ? result.applicability_q4_note : "",
                                                    // "applicability_outcome": result.applicability_q5.split('q5_')[1],
                                                    // "applicability_outcome_note": result.applicability_q5_note ? result.applicability_q5_note : ""
                                                };
                                                reviewData.push(tableRow);
                                            }
                                        } else { // study results excluded after triage
                                            countExcluded++;
                                        } // triage inclusion check
                                    });
                                }

                                // console.log("count", count);
                                // console.log("count excluded", countExcluded);
                                // console.log("target", targetCount);
                                if (count === (targetCount - countExcluded)) {
                                    // We've created table rows for each result in each non-excluded study. Resolve promise.
                                    resolve(reviewData);
                                }
                            });  // Promise.all
                        } else if (!included) {
                            countExcluded++;
                        } // primary inclusion check
                    }); // end of readDocumentDataWithPromise
                }); // end of retrieveFileInfo
            }); // end of forEach
        }).catch(function (error) {
            console.log("error: " + error);
            reject(error);
        });
    }); // new Promise
}

function retrieveFileInfo(fileRef) {
    var promises = [];
    promises.push(fileRef.getDownloadURL());
    promises.push(fileRef.getMetadata());
    return promises;
}

// parse CIs formatted as single strings
function parseCI(str) {
    // remove spaces and new lines
    str = str.replace(/ /g, '');
    str = str.replace('\n', '');

    // declare output
    let ci = [null, null];
    // process with either () or [], but assume comma separation
    if (str.includes("(")) {
        ci[0] = str.substring(str.lastIndexOf("(") + 1, str.lastIndexOf(","));
        ci[1] = str.substring(str.lastIndexOf(",") + 1, str.lastIndexOf(")"));
    } else if (str.includes("[")) {
        ci[0] = str.substring(str.lastIndexOf("[") + 1, str.lastIndexOf(","));
        ci[1] = str.substring(str.lastIndexOf(",") + 1, str.lastIndexOf("]"));
    }

    return ci;
}

function createForestPlotDiv(index, label, data) {
    let plotID = "plot" + index;
    // save this plotID to each data
    data.forEach((d) => d["plotID"] = plotID)
    // append forest plot div and all its contents to main plot container
    // $("#plotContainer").append(`<div class="row"><div class="col"><div class="row buttonContainer"><h4 class="plotLabel">${label}</h4><div class="buttonPanel"><button id="toggleCharts${index}" class="btn btn-outline-secondary block">Switch to Original Units</button><button id="sortBtn${index}" class="btn btn-outline-secondary block">Sort by Effect Size</button></div></div><div class="row plotContainer"><div id="plot${index}"></div><div class="preloader" id="preloader${index}"></div></div></div></div>`);
    $("#plotContainer").append(`<div class="row" id="${plotID}"></div>`);
    // set up forest plot for this specific chart
    let thisPlotFxn = new forestPlot;
    thisPlotFxn.label(label);
    // let thisPlotFxn = jQuery.extend(true, {}, new forestPlot);
    // thisPlotFxn.index(index);
    // select plot div
    let plotDiv = d3.select(`#plot${index}`);
    // initialize chart
    plotDiv.datum(data)
        .call(thisPlotFxn);
}

// function identifyPotentialSourcesOfBias(data) {
//     let potentialSourcesOfBias = [{
//         "name": "Stop Showing Biases",
//         "fieldToCheck": ""
//     }];
//     for (i in possibleSourcesOfBias) {
//         let bias = possibleSourcesOfBias[i];
//         if (data[0][bias.fieldToCheck] === "yes" || data[0][bias.fieldToCheck] === "notSure" || !data.every(function(d) { return d[bias.fieldToCheck] === data[0][bias.fieldToCheck]; })) {
//             potentialSourcesOfBias.push(bias)
//         }
//     }

//     return potentialSourcesOfBias
// }

// main:
// load review data from Firebase 
// initialize charts for each group of studies identified during triage
$("#top").load("header.html");
loadReviewData().then(function (data) {
    console.log("data from extraction", data);
    setResearchQuestion();

    $('.fa-home').show();
    $(".fa-home").click(function () {
        window.location = window.location.origin;
    });

    // // generate buttons representing possible sources of bias
    // let biases = identifyPotentialSourcesOfBias(data);
    // $(document).ready(function() {
    //     biases.forEach(function(bias) {
    //         $('#biases').append(
    //             $(document.createElement('button')).prop({
    //                 type: 'button',
    //                 class: bias.fieldToCheck == "" ? 'btn btn-styled btn-dark' : 'btn btn-styled',
    //                 innerHTML: bias.name,
    //             }).on("click", function() {
    //                 $('#biases .btn').removeClass("selected");
    //                 if (bias.fieldToCheck != "") {
    //                   $(this).addClass("selected");
    //                 }
    //                 forestPlot.sourceOfBias(bias);
    //                 forestPlot.encodeRiskOfBias();
    //             })
    //         );
    //     })
    // });

    // initialize chart
    // plotDiv.datum(data)
    //     .call(forestPlot);


    // set aside studies to show but not analyze 
    let showSet = data.filter((d) => d.showOnly),
        analyzeSet = data.filter((d) => !d.showOnly);
    // parse groups of studies to analyze separately
    let groups = analyzeSet.map((d) => d.analysisGroup)
        .filter((group, index, groups) => groups.indexOf(group) == index)
        .sort();
    console.log(groups);
    for (let i = 0; i < groups.length; i++) {
        // create a separate forest plot for each group of data
        createForestPlotDiv(i, groups[i], analyzeSet.filter((d) => d.analysisGroup === groups[i]));
    }
    // create one more forest plot for the show only group of studies
    createForestPlotDiv(groups.length, showSet[0].analysisGroup, showSet);

}).catch(function (error) {
    console.log("error: " + error);
});
