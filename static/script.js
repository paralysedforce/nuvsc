var current_term = "";
var current_school = "";
var current_subject = [];

function parseTextList(li){
    var str_li = li.substring(1, li.length - 1).split('{').slice(1);
    var json_li = [];
    for (var i = 0; i < str_li.length; i++){
        if (i == str_li.length - 1){
            json_li.push(JSON.parse('{' + str_li[i]));
        }
        else {
            var str_trimmed = '{' + str_li[i].trim();
            json_li.push(JSON.parse(str_trimmed.substring(0, str_trimmed.length - 1)));
        }
    }
    return json_li;
}

function checkListedCourses(input){
    for (var i = 0; i < current_subject.length; i++){
        // If it's already open, remove the courses
        if (current_subject[i] == input.parentElement.getAttribute('id')){
            var courses_num = input.parentElement.children.length;
            for (var j = 0; j < courses_num; j++){
                if (j != 0){
                    input.parentElement.removeChild(input.parentElement.lastChild);
                }
            }
            current_subject.splice(i, 1);
            return true;
        }
    }
    return false;
}

function show_subjects(input){
    $('.school_box').css({'display':'none'});
    current_school = input.getAttribute('id');

    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function(){
        if (xhttp.readyState == 4 && xhttp.status == 200){
            // Back link
            var back = document.createElement('div');
            back.setAttribute('class', 'subject_box');
            back.innerHTML = "<a onclick='back(this)' href='javascript:;'>Back</a>";
            document.getElementById("visual_course_finder").appendChild(back);
            $('#visual_course_finder').append("<br class='subject_box'>");
            // Generate subject links
            var subjects = xhttp.responseText;
            var subjects_list = JSON.parse(subjects);
            for (var i = 0; i < subjects_list.length; i++){
                var subject_box = document.createElement('div');
                subject_box.setAttribute('class', 'subject_box');
                subject_box.setAttribute('id', subjects_list[i]['symbol']);
                subject_box.innerHTML = "<a onclick='show_courses(this)' href='javascript:;'>" + subjects_list[i]['name'] + "</a>";
                document.getElementById("visual_course_finder").appendChild(subject_box);
            }
        }
    }
    xhttp.open("GET", "/subjects/" + current_school, true);
    xhttp.send();
}

function show_courses(input){
    // Go through list of open subjects and check if it's already open
    if (checkListedCourses(input)){ return; }
    // Add courses under subject heading
    current_subject.push(input.parentElement.getAttribute('id'));

    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function(){
        if (xhttp.readyState == 4 && xhttp.status == 200){
            text_data = xhttp.responseText;
            courses_list = parseTextList(text_data);
            for (var i = 0; i < courses_list.length; i++){
                var course = courses_list[i];
                var course_link = document.createElement('a');
                course_link.setAttribute('id', course['name']);
                course_link.setAttribute('class', 'course_link');
                course_link.setAttribute('onclick', "show_sections(this)");
                course_link.setAttribute('href', 'javascript:;');
                course_link.innerHTML = "-- " + course['name'];
                var subjects = document.getElementsByClassName("subject_box");
                for (var j = 0; j < subjects.length; j++){
                    // Make sure it's being appended to the subject, not the school 
                    // (Some schools have same symbol as some subjects)
                    if (subjects[j].getAttribute('id') == current_subject[current_subject.length - 1]){
                        subjects[j].appendChild(course_link);
                    }
                }
            }
        }
    }
    xhttp.open("GET", "/courses/" + current_subject[current_subject.length - 1], true);
    xhttp.send();
}

function show_sections(input){
    $('#dialog').dialog("open");

    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function(){
        if (xhttp.readyState == 4 && xhttp.status == 200){
            // Get ajax sections info
            text_data = xhttp.responseText;
            sections_list = parseTextList(text_data);
            // clear dialog div
            //TODO the jquery ui package puts other things in dialog div so this won't work
            var overlay = document.getElementById('dialog');
            while (overlay.firstChild) {
                overlay.removeChild(overlay.removeChild);
            }
            // turn into into html section links
            for (var i = 0; i < sections_list.length; i++){
                var section = sections_list[i];
                var section_link = document.createElement('a');
                section_link.setAttribute('class', 'section_link');
                section_link.setAttribute('onclick', "add_section(this.id)");
                section_link.setAttribute('href', 'javascript:;');
                section_link.innerHTML = "Section " + section['section'] + "  " + section['dow'] + " " + section['start_time'] + "-" + section['end_time'], + "  " + section['instructor'];
                // insert html section links to dialog div
                document.getElementById('dialog').appendChild(section_link);
                document.getElementById('dialog').setAttribute("title", section['course']);
            }
        }
    }
}
    

function add_section(id){
    // Check if course is aleady in cart
    var sections_in_cart = document.getElementById("cart").children;
    for (var i = 0; i < sections_in_cart.length; i++){
        if (sections_in_cart[i].id == id){
            window.alert("This course is already in your cart.");
            return;
        }
    }

    // Adding info to cart
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function(){
        if (xhttp.readyState == 4 && xhttp.status == 200){
            // Create containing div
            var section_data = document.createElement('div');
            section_data.setAttribute('id', id);
            // Populate div with content
            var section = parseTextList(xhttp/responseText)[0];
            //TODO Add instructor (and description?)
            course_data.innerHTML = "<p>" + course['subject'] + " " + course['catalog_num'] + " " + course['title'] + "</p><a onclick='remove_course(this.parentElement)' href='javascript:;'>Remove</a>"
            ;
            // Append the course
            document.getElementById("cart").appendChild(section_data);

            // Adding course to calendar
            if (section['dow'] == '[]'){
                var unscheduled_section = document.createElement('div');
                unscheduled_section.setAttribute('id', id);
                unscheduled_section.innerHTML = "<p>" + section['subject'] + " " + section['catalog_num'] + " " + section['title'] + "</p>";
                document.getElementById("unscheduled").appendChild(unscheduled_section);
            }
            else {
                var section_event = {
                    title: section['name'],
                    id: id,
                    //TODO add start and end date functionality
                    start: "2015-10-09" + 'T' + start_time + ':00',
                    end: "2016-10-09" + 'T' + end_time + ':00',
                    dow: section['dow']
                }
                $('#calendar').fullCalendar('renderEvent', section_event, 'stick');
            }
        }
    }
    xhttp.open("GET", "/section/" + id, true);
    xhttp.send();
}

function remove_course(input){
    // Remove event from calendar
    $('#calendar').fullCalendar('removeEvents', idOrFilter = input.id);
    // Remove event from cart
    document.getElementById("cart").removeChild(input);
    // If the event is unscheduled it, remove it from the unscheduled section
    var unscheduled_children = document.getElementById("unscheduled").children;
    for (var i = 0; i < unscheduled_children.length; i++){
        if (unscheduled_children[i].getAttribute('id') == input.getAttribute('id')){
            unscheduled_children[i].remove();
        }
    }
}

function back(input){
    if (input.parentElement.getAttribute("class") == 'subject_box'){
        if (current_subject != []){
            for (var i = 0; i < current_subject.length; i++){
                checkListedCourses(document.getElementById(current_subject[i]));
            }
        }
        $('.school_box').css({'display':'block'});
        $('.subject_box').remove();
        current_subject = [];
    }
}

$(document).ready(function(){
    // Load section dialog
    $('#dialog').dialog({
        autoOpen: false,
        modal: true
    });

    // Load calendar
    $('#calendar').fullCalendar({
        googleCalendarApiKey: 'AIzaSyDEbFn8eSO-K5iIv3LerSaHyonOC7plNcE',
        defaultView: 'agendaWeek',
        height: "auto",
        minTime: "07:00:00",
        maxTime: "23:00:00",
        allDaySlot: false,
        events: {
            googleCalendarId: '57bcm4ch79o7820fm5d66e09j8@group.calendar.google.com',
        }
    });

    // Load search box
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function(){
        if (xhttp.readyState == 4 && xhttp.status == 200){
            var search_list = parseTextList(xhttp.responseText);

            $("#autocomplete").autocomplete({
                source: search_list,
                autoFocus: true,
                select: function(event, ui){
                    add_section(ui.item.id);
                }
            }).autocomplete("instance")._renderItem = function(ul, item){
                return $("<li>").append("<a>" + item.label + "<br>" + item.desc + " " + item.instructor + "</a>").appendTo(ul);
            };
        }
    }
    xhttp.open("GET", '/all_sections', true);
    xhttp.send();

});
