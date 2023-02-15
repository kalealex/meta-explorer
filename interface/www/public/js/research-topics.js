$(function () {
    registerChangeEvents();
});

function registerChangeEvents() {

    $("#createTopicModal input").keyup(function () {
        let text = $(this).val()
        let enabled = (text && text.length > 0)
        $("#createTopicModal .btn-primary").attr("disabled", !enabled)
    });


    $("#createTopicModal .btn-primary").on("click", function () {
        let topicText = $("#createTopicModal input").val();
        // create a new topic ref
        let topicRef = topicsRef().doc()
        let data = { topic: topicText };
        topicRef.set(data);
        addResearchTopic(topicRef, data, true, true);
        $("#createTopicModal input").val("")
        $("#createTopicModal").modal('hide');
    });

    $("#interventionQuestion").keyup(function () {
        updateCreateQuestionButton();
    });

    $("#outcomeQuestion").keyup(function () {
        updateCreateQuestionButton();
    });

    $("#createQuestionModal .btn-primary").on("click", function () {
        let interventionQuestion = $("#interventionQuestion").val();
        let outcomeQuestion = $("#outcomeQuestion").val();
        let newQuestionRef = getCurrentResearchTopic().collection("questions").doc()
        let data = { interventionQuestion: interventionQuestion, outcomeQuestion: outcomeQuestion, notes: "" };
        newQuestionRef.set(data);
        // add new question to UI
        addResearchQuestion(currentResearchTopicId, newQuestionRef, data);
        $("#interventionQuestion").val("")
        $("#outcomeQuestion").val("")
    });
}

function updateCreateQuestionButton() {
    let enabled = $("#interventionQuestion").val().length > 0 && $("#outcomeQuestion").val().length > 0
    $("#createQuestionModal .btn-primary").attr("disabled", !enabled)
}

function addResearchTopic(topicRef, topicData, expand, isNew) {
    let id = topicRef.id
    let newWidget =
        '<div class="mb-3 topic" id="' + id + '">' +
        '<i class="fa fa-angle-right" style="cursor:pointer; font-size:20px;">' +
        '<span class="ml-2 topic-text">' + topicData.topic + '</span></i>' +
        '<i class="fa fa-angle-down" style="cursor:pointer; font-size:20px;">' +
        '<span class="ml-2 topic-text">' + topicData.topic + '</span></i>' +
        '<button class="close deleteTopic" title="Delete Topic" data-topic-id=' + id + '>x</button>' +
        '<div class="collapse m-3 p-3">' +
        '<div class="research-question-list"></div>' +
        '<button type="button" class="btn btn-outline-secondary mt-2 addResearchBtn"' +
        ' data-toggle="modal" data-target="#createQuestionModal" data-topic-id=' + id + '>Add Research Question</button>' +
        '</div></div>'

    $("#research-topic-list").append(newWidget);

    if (!isNew) {
        topicRef.ref.collection("questions").get().then(function (questions) {
            questions.docs.forEach(questionRef =>
                addResearchQuestion(id, questionRef, questionRef.data()));
        });
    }

    $('.addResearchBtn').off('click');
    $('.addResearchBtn').click(function () {
        // currentResearchTopicId is defined in auth.js
        currentResearchTopicId = $(this).attr("data-topic-id");
    });

    $(".deleteTopic").off('click');
    $(".deleteTopic").click(function (event) {
        let topicId = $(this).attr("data-topic-id")
        topicsRef().doc(topicId).delete();
        $(this).parent().remove();
    });

    $('.fa-angle-right').off('click');
    $('.fa-angle-right').click(function () {
        $(this).hide();
        $(this).siblings('.fa-angle-down').show();
        $(this).parent().find('.collapse').show();
    });

    $('.fa-angle-down').off('click');
    $('.fa-angle-down').click(function () {
        $(this).hide();
        $(this).siblings('.fa-angle-right').show();
        $(this).parent().find('.collapse').hide();
    });

    // TODO: edit topic 



    let topicWidget = $("#" + id)
    if (expand) {
        topicWidget.find(".fa-angle-right").hide();
        topicWidget.find('.fa-angle-down').show();
        topicWidget.find('.collapse').show();
    } else {
        topicWidget.find(".fa-angle-right").show();
        topicWidget.find('.fa-angle-down').hide();
        topicWidget.find('.collapse').hide();
    }

}

function addResearchQuestion(topicId, questionRef, questionData) {
    let notesId = "notes-" + questionRef.id;
    let url = "scope.html?topicId=" + topicId + "&questionId=" + questionRef.id
    let questionText = "What is the impact of " + questionData.interventionQuestion + " on " + questionData.outcomeQuestion + "?";
    let newWidget =
        '<div class="mb-3 question" id="' + questionRef.id + '">' +
        '<a class="question-text" style="width: 95%;" href=' + url + '>' + questionText + '</a>' +
        '<button class="close deleteQuestion" title="Delete Question" data-topic-id=' + topicId + ' data-question-id=' + questionRef.id + '>x</button>' +
        '<textarea class="form-control rounded-2 notes mt-2" id="' + notesId +
        '" rows="3" placeholder="Notes on this research question go here">' + questionData.notes + '</textarea>' +
        '</div>'

    $("#" + topicId).find(".collapse .research-question-list").append(newWidget);

    $(".deleteQuestion").off('click');
    $(".deleteQuestion").click(function (event) {
        let topicIdentifier = $(this).attr("data-topic-id");
        let questionIdentifier = $(this).attr("data-question-id");
        getQuestionRef(topicIdentifier, questionIdentifier).delete()
        $(this).parent().remove();
    });

    $("#" + notesId).keyup(function (event) {
        let notesText = $(this).val();
        getQuestionRef(topicId, questionRef.id).set({ notes: notesText }, { merge: true });
    });


    // TODO: edit question

}


function displayData(topics) {
    topics.forEach((topicRef, index) => addResearchTopic(topicRef, topicRef.data(), index == 0))
}




