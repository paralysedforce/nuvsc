var current_term = "";
var current_school = "";
var current_subject = [];

function parseTextList(li){
    if (li[0] == '[' && li[li.length - 1] == ']'){
        var str_li = li.substring(1, li.length - 1).split('{').slice(1);
    } else{
        var str_li = li.split('{').slice(1);
    }
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

function insertAfter(newNode, referenceNode){
    referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
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
            //TODO change this to creating a button using javascript then appending child
            back.innerHTML = "<button type='button' class='btn btn-default btn-sm' onclick='back(this)'>Back</button>";
            document.getElementById("visual_course_finder").appendChild(back);
            $('#visual_course_finder').append("<br class='subject_box'>");
            // Generate subject links
            var subjects = xhttp.responseText;
            var subjects_list = JSON.parse(subjects);
            for (var i = 0; i < subjects_list.length; i++){
                var subject_box = document.createElement('div');
                subject_box.setAttribute('class', 'subject_box');
                subject_box.setAttribute('id', subjects_list[i]['symbol']);
                subject_box.innerHTML = "<button type='button' class='btn btn-primary btn-xs btn-block subject_btn' onclick='show_courses(this)'>" + subjects_list[i]['name'] + "</button>";
                document.getElementById("visual_course_finder").appendChild(subject_box);
            }
            var btt_div = document.createElement('div');
            btt_div.setAttribute('class', 'back_to_top');
            // Back to top button
            var back_to_top = document.createElement('a');
            back_to_top.setAttribute('class', 'btn btn-default btn-xs subject_box');
            back_to_top.setAttribute('href', '#');
            back_to_top.setAttribute('role', 'button');
            back_to_top.innerHTML = "Back to top";
            
            btt_div.appendChild(back_to_top);
            document.getElementById("visual_course_finder").appendChild(btt_div);
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

            // Get all the subject boxes
            var subjects = document.getElementsByClassName("subject_box");
            var subject_box_obj = {};
            for (var j = 0; j < subjects.length; j++){
                // Make sure it's being appended to the subject, not the school 
                // (Some schools have same symbol as some subjects)
                if (subjects[j].getAttribute('id') == current_subject[current_subject.length - 1]){
                    // Choose the right subject_box
                    subject_box_obj = subjects[j];
                }
            }
            // Make a ul element
            var subject_ul = document.createElement('ul');
            subject_ul.setAttribute('id', courses_list[0]['subject'] + "_ul");
            // Put the ul element inside of subject_box
            subject_box_obj.appendChild(subject_ul);
            // For every course in subject
            for (var i = 0; i < courses_list.length; i++){
                var course = courses_list[i];
                // Make course link
                var course_link = document.createElement('a');
                course_link.setAttribute('id', course['name']);
                course_link.setAttribute('class', 'course_link');
                course_link.setAttribute('onclick', "show_sections(this)");
                course_link.setAttribute('data-toggle', 'modal');
                course_link.setAttribute('data-target', '#sections_modal');
                course_link.setAttribute('href', 'javascript:;');
                course_link.innerHTML = course['name'];
                // Put link inside li element
                var course_li = document.createElement('li');
                course_li.appendChild(course_link);
                // Put li element inside ul
                subject_ul.appendChild(course_li);
            }
        }
    }
    xhttp.open("GET", "/courses/" + current_subject[current_subject.length - 1], true);
    xhttp.send();
}

function show_sections(input){
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function(){
        if (xhttp.readyState == 4 && xhttp.status == 200){
            // Get ajax sections info
            text_data = xhttp.responseText;
            sections_list = parseTextList(text_data);
            // clear modal
            var modal_ul = document.getElementById('modal_ul');
            var modal_children = modal_ul.children;
            while (modal_ul.firstChild){
                modal_ul.removeChild(modal_ul.firstChild);
            }
            // Set modal title
            document.getElementById('modal_title').innerHTML = sections_list[0]['course'];
            // turn into html section links
            for (var i = 0; i < sections_list.length; i++){
                var section = sections_list[i];
                var section_link = document.createElement('a');
                section_link.setAttribute('id', section['id']);
                section_link.setAttribute('class', 'section_link');
                section_link.setAttribute('onclick', "add_section_visual(this.id)");
                section_link.setAttribute('href', 'javascript:;');
                var times = section['start_time'] + "-" + section['end_time'];
                if (section['start_time'] == 'None'){
                    times = "";
                }
                section_link.innerHTML = "Section " + section['section'] + "  " + section['dow'] + " " + times + "  " + section['instructor'];
                // Check if course is aleady in cart
                var sections_in_cart = document.getElementById("cart").children;
                for (var j = 0; j < sections_in_cart.length; j++){
                    // If yes, make link red
                    if (sections_in_cart[j].id == section['id'] && sections_in_cart[j].getAttribute('class') == "section_cart"){
                        section_link.style.color = 'red';
                    }
                }

                var li = document.createElement('li');
                li.setAttribute('id', section['id'] + '_li');
                li.setAttribute('class', 'section_li');

                // insert html section links to dialog div
                li.appendChild(section_link);
                document.getElementById('modal_ul').appendChild(li);
            }
        }
    }
    xhttp.open("GET", "/sections/" + input.id, true);
    xhttp.send();
}

function add_section_visual(id){
    var section_link = document.getElementById(id);
    if (section_link.getAttribute('class') == 'section_link'){
        section_link.style.color = 'red';
    }
    add_section(id);
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
    $.get("/section/" + id, function(section_request_data){
        $.get("/descriptions/" + id, function(descriptions_data){
            $.get("/components/" + id, function(components_data){

                var components = parseTextList(components_data)[0];
                if (components != ""){
                    var components_link = document.getElementById(id);
                    var comp_panel = document.createElement('div');
                    comp_panel.setAttribute('class', 'panel panel-default');
                    var comp_heading = document.createElement('div');
                    comp_heading.setAttribute('class', 'panel-heading');
                    comp_heading.innerHTML = "Choose a component:";
                    var comp_body = document.createElement('div');
                    comp_body.setAttribute('class', 'panel-body');
                    comp_panel.appendChild(comp_heading);
                    comp_panel.appendChild(comp_body);
                    for (var key in components){
                        var comp_link = document.createElement('a');
                        comp_link.innerHTML = components[key];
                        comp_body.appendChild(comp_link);
                    }
                    insertAfter(comp_panel, components_link);
                }

                // Create containing div
                var section_data = document.createElement('div');
                section_data.setAttribute('class', 'section_cart panel panel-default');
                section_data.setAttribute('id', id);

                // Populate div with content
                var section = parseTextList(section_request_data)[0];

                // Create panel heading and panel
                var panel_head = document.createElement('div');
                panel_head.setAttribute('class', 'panel-heading');
                var panel_title = document.createElement('h4');
                panel_title.setAttribute('class', 'panel-title');
                panel_title.innerHTML = "<a data-toggle='collapse' href='#" + id + "_collapse'>" + section['course'] + "</a>";
                panel_head.appendChild(panel_title);
                var panel = document.createElement('div');
                panel.setAttribute('class', 'panel-collapse collapse');
                panel.setAttribute('id', id + '_collapse');
                var panel_body = document.createElement('div');
                panel_body.setAttribute('class', 'panel-body');
                panel.appendChild(panel_body);
                
                var course_p = document.createElement('p');
                course_p.innerHTML = "<h4><b>" + section['course'] + "</b></h4>";

                var section_p = document.createElement('p');
                section_p.innerHTML = "Section " + section['section'];
                
                var instructor_p = document.createElement('p');
                instructor_p.innerHTML = section['instructor'];

                var room_p = document.createElement('p');
                room_p.innerHTML = section['room'];

                var overview_p = document.createElement('p');
                overview_p.innerHTML = "<b>Overview:</b> " + section['overview'];

                var requirements_p = document.createElement('p');
                requirements_p.innerHTML = "<b>Requirements:</b> " + section['requirements'];

                var remove_a = document.createElement('a');
                remove_a.setAttribute('onclick', 'remove_course(this.parentElement.parentElement.parentElement.id)');
                remove_a.setAttribute('href', 'javascript:;');
                remove_a.innerHTML = "Remove";

                panel_body.appendChild(course_p);
                panel_body.appendChild(instructor_p);
                panel_body.appendChild(section_p);
                panel_body.appendChild(room_p);
                panel_body.appendChild(overview_p);
                panel_body.appendChild(requirements_p);

                descriptions = parseTextList(descriptions_data)[0];

                if (descriptions != "") {
                    var descriptions_link = document.createElement('a');
                    descriptions_link.setAttribute('role', 'button');
                    descriptions_link.setAttribute('data-toggle', 'collapse');
                    descriptions_link.setAttribute('data-target', '#' + id + '_descriptions');
                    descriptions_link.innerHTML = "Toggle More Descriptions";
                    var descriptions_div = document.createElement('div');
                    descriptions_div.setAttribute('class', 'collapse');
                    descriptions_div.setAttribute('id', id + '_descriptions');
                    for (var key in descriptions){
                        var desc_name = document.createElement('b');
                        desc_name.innerHTML = key;
                        descriptions_div.appendChild(desc_name);
                        var desc_desc = document.createElement('p');
                        desc_desc.innerHTML = descriptions[key];
                        descriptions_div.appendChild(desc_desc);
                    }
                    panel_body.appendChild(descriptions_link);
                    panel_body.appendChild(descriptions_div);
                }

                panel_body.appendChild(document.createElement('br'));
                panel_body.appendChild(remove_a);

                section_data.appendChild(panel_head);
                section_data.appendChild(panel);

                // Append the course
                document.getElementById("cart").appendChild(section_data);

                var start_formatted = "2015-10-09" + 'T' + section['start_time'] + ':00';
                var end_formatted = "2015-10-09" + 'T' + section['end_time'] + ':00';

                // Adding course to calendar
                if (section['dow'] == '[]'){
                    var unscheduled_section = document.createElement('div');
                    unscheduled_section.setAttribute('id', id);
                    unscheduled_section.innerHTML = "<p>" + section['course'] + "</p>";
                    document.getElementById("unscheduled").appendChild(unscheduled_section);
                }
                else {
                    var section_event = {
                        title: section['course'],
                        id: id,
                        //TODO add start and end date functionality
                        start: start_formatted,
                        end: end_formatted,
                        dow: section['dow'],
                        section: section['section'],
                        instructor: section['instructor'],
                        room: section['room'],
                        overview: section['overview'],
                        requirements: section['requirements']
                    }
                    $('#calendar').fullCalendar('renderEvent', section_event, 'stick');
                }

                // Increment number of courses
                var num = parseInt(document.getElementById("number_of_courses").innerHTML) + 1;
                document.getElementById("number_of_courses").innerHTML = num;

                // Increment hours per week
                var start = new Date(start_formatted);
                var end = new Date(end_formatted);
                var min = (end - start) / 60000;
                // in case of unscheduled courses
                if (isNaN(min)){
                    min = 0;
                }
                if (min % 30 == 20){
                    min += 10;
                }
                var hr = parseFloat(min) / 60;
                var days = $('#calendar').fullCalendar('clientEvents', idOrFilter = id).length;
                var old_hr = parseFloat(document.getElementById("course_hours").innerHTML);
                document.getElementById("course_hours").innerHTML = old_hr + hr * days;
            });
        });
    });
}

function remove_course(id){
    // Decrement hrs / wk
    var calendar_event = $('#calendar').fullCalendar('clientEvents', idOrFilter = id);
    var days = calendar_event.length;
    var start_moment = calendar_event[0].start;
    var end_moment = calendar_event[0].end;
    var start = start_moment['_d'];
    var end = end_moment['_d'];
    var min = (end - start) / 60000;
    // in case of unscheduled courses
    if (isNaN(min)){
        min = 0;
    }
    if (min % 30 == 20){
        min += 10;
    }
    var hr = parseFloat(min) / 60;
    var old_hr = parseFloat(document.getElementById("course_hours").innerHTML);
    document.getElementById("course_hours").innerHTML = old_hr - hr * days;
    
    // Remove event from calendar
    $('#calendar').fullCalendar('removeEvents', idOrFilter = id);
    // Remove event from cart
    var children = document.getElementById("cart").children;
    for (var i = 0; i < children.length; i++){
        if (children[i].id == id){
            document.getElementById("cart").removeChild(children[i]);
        }
    }
    // If the event is unscheduled it, remove it from the unscheduled section
    var unscheduled_children = document.getElementById("unscheduled").children;
    for (var i = 0; i < unscheduled_children.length; i++){
        if (unscheduled_children[i].getAttribute('id') == id){
            unscheduled_children[i].remove();
        }
    }
    // Decrement number of courses
    var num = parseInt(document.getElementById("number_of_courses").innerHTML) - 1;
    document.getElementById("number_of_courses").innerHTML = num;
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
    // Load calendar
    $('#calendar').fullCalendar({
        googleCalendarApiKey: 'AIzaSyDEbFn8eSO-K5iIv3LerSaHyonOC7plNcE',
        defaultView: 'agendaWeek',
        weekends: false,
        header: false,
        columnFormat: 'ddd',
        height: "auto",
        minTime: "07:00:00",
        maxTime: "23:00:00",
        allDaySlot: false,
        events: {
            googleCalendarId: '57bcm4ch79o7820fm5d66e09j8@group.calendar.google.com',
        },
        eventColor: '#520063',
        eventRender: function(event, element){
            element[0].setAttribute('data-toggle', 'popover');
            element[0].setAttribute('title', "<b>" + event.title + "</b>");
            element[0].setAttribute('data-content', "Section " + event.section + "<br>" + event.instructor + "<br><a onclick='remove_course(" + event.id + ")' href='javascript:;'>Remove</a>");
            // Make sure it stays open when you move your mouse over to it
            $(element[0]).popover({
                animation: false,
                html: true,
                trigger: 'manual',
            }).on("mouseenter", function(){
                var _this = this;
                $(this).popover("show");
                $(".popover").on("mouseleave", function(){
                    $(_this).popover('hide');
                });
            }).on("mouseleave", function(){
                var _this = this;
                setTimeout(function(){
                    if (!$(".popover:hover").length){
                        $(_this).popover("hide");
                    }
                }, 300);
            });
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
