import os
import sqlite3
from flask import Flask, render_template, url_for, g

import json
from nuapiclient import NorthwesternAPIClient

import urllib2


def convertDaysToDOW(section_str):
    if section_str == None:
        return []
    days = [section_str[x:x + 2] for x in range(0, 
        len(section_str), 2)]
    dow_list = []
    for day in days:
        if day == 'Mo': dow_list.append(1)
        elif day == 'Tu': dow_list.append(2)
        elif day == 'We': dow_list.append(3)
        elif day == 'Th': dow_list.append(4)
        elif day == 'Fr': dow_list.append(5)
    return dow_list
    
def convertDOWToDays(dow):
    meeting_str = ""
    meeting_days = dow[1:len(dow) - 1].split(",")
    for day in meeting_days:
        if day == '1' or day == ' 1': meeting_str += "M"
        elif day == '2' or day == ' 2': meeting_str += "Tu"
        elif day == '3' or day == ' 3': meeting_str += "W"
        elif day == '4' or day == ' 4': meeting_str += "Th"
        elif day == '5' or day == ' 5': meeting_str += "F"
    return meeting_str


DATABASE = 'cache.db'

app = Flask(__name__)
app.config.from_object(__name__)

client = NorthwesternAPIClient(os.environ['NUAPICLIENT_KEY'])


def connect_db():
    rv = sqlite3.connect(app.config['DATABASE'])
    rv.row_factory = sqlite3.Row
    return rv

def get_db():
    if not hasattr(g, '_database'):
        g._database = connect_db()
    return g._database

def query_db(query, args = ()):
    cur = get_db().execute(query, args)
    rv = cur.fetchall()
    cur.close()
    return rv

@app.teardown_appcontext
def teardown_db(exception):
    db = getattr(g, '_database', None)
    if db is not None:
        db.close()


def update_terms():
    old_ids = [x['id'] for x in query_db("SELECT id FROM terms ORDER BY id DESC")]
    # for each id from nu client, see if it's in the terms db, if not, add it
    new_terms = client.terms()
    new_ids = [x['id'] for x in new_terms]
    if new_ids != old_ids:
        for new_term in new_terms:
            if new_term['id'] not in old_ids:
                vals = [int(new_term['id']), str(new_term['name']),
                        str(new_term['start_date']), str(new_term['end_date'])]
                db = get_db()
                db.execute("INSERT INTO terms VALUES (?, ?, ?, ?)", vals)
                db.commit()

def initialize_schools():
    # The schools at Northwestern can reliably be predicted to not change
    new_schools = client.schools()
    for new_school in new_schools:
        vals = [str(new_school['symbol']), str(new_school['name'])]
        db = get_db()
        db.execute("INSERT INTO schools VALUES (?, ?)", vals)
        db.commit()

def update_subjects():
    school_symbols = [x['symbol'] for x in query_db("SELECT symbol FROM schools")]

    term_id = query_db("SELECT MAX(id) FROM terms")[0][0]
    # For each school
    for school_symb in school_symbols:
        old_symbols = [x['symbol'] for x in query_db("SELECT symbol FROM subjects WHERE school = ? ORDER BY symbol ASC", [school_symb])]
        # Alphabetically sort by symbol
        new_subjects = sorted(client.subjects(term = term_id, school = school_symb), key = lambda k: k['symbol'])
        new_symbols = [x['symbol'] for x in new_subjects]
        if new_symbols != old_symbols:
            for new_subject in new_subjects:
                if new_subject['symbol'] not in old_symbols:
                    vals = [str(new_subject['symbol']), str(new_subject['name']), school_symb]
                    db = get_db()
                    db.execute("INSERT INTO subjects VALUES (?, ?, ?)", vals)
                    db.commit()

def update_courses():
    # Get a list of old course names that are already in db
    old_names = [x['name'] for x in query_db("SELECT name FROM courses ORDER BY name ASC")]
    # Make sure we are getting courses for every subject and the most recent term
    subject_symbols = [x['symbol'] for x in query_db("SELECT symbol FROM subjects")]

    term_id = query_db("SELECT MAX(id) FROM terms")[0][0]

    # Get a list of new courses from the northwestern api
    new_courses = []
    for subj_symb in subject_symbols:
        courses = client.courses(term = term_id, subject = str(subj_symb))
        for course in courses:
            new_courses.append({'name':str(course['subject']) + " " + str(course['catalog_num']) + " " + str(course['title']),
                                'term':course['term'],
                                'subject':course['subject']})

    # new_courses is now filled
    # Sort new courses list
    new_names = sorted([x['name'] for x in new_courses])
    # Compare new and old lists
    # If they're not the same, add the new courses to old
    if new_names != old_names:
        for new_course in new_courses:
            if new_course['name'] not in old_names:
                    vals = [new_course['name'], str(new_course['term']), str(new_course['subject'])]
                    try:
                        db = get_db()
                        db.execute("INSERT INTO courses VALUES (?, ?, ?)", vals)
                        db.commit()
                    except sqlite3.IntegrityError:
                        pass

def update_sections():
    old_ids = [x['id'] for x in query_db("SELECT id FROM sections ORDER BY id ASC")]

    subject_symbols = [x['symbol'] for x in query_db("SELECT symbol FROM subjects")]

    term_id = query_db("SELECT MAX(id) FROM terms")[0][0]

    new_sections = []
    for sub_symb in subject_symbols:
        sections = client.courses_details(term = term_id, subject = str(sub_symb))
        for section in sections:
            if section['room'] is None:
                room_val = 0
            else:
                room_val = section['room']['building_name'] + " " + section['room']['name']
            new_sections.append(
                {'id':int(section['id']),
                 'catalog_num':str(section['catalog_num']),
                 'title':str(section['title']),
                 'dow':str(convertDaysToDOW(section['meeting_days'])),
                 'start_time':str(section['start_time']),
                 'end_time':str(section['end_time']),
                 'instructor':str(section['instructor']['name']),
                 'section':str(section['section']),
                 'course':str(section['subject'] + " " + section['catalog_num'] + " " + section['title']),
                 'room':str(room_val),
                 'overview':str(section['overview']),
                 'requirements':str(section['requirements'])
                }
            )

    new_ids = sorted([x['id'] for x in new_sections])
    if new_ids != old_ids:
        for new_section in new_sections:
            if new_section['id'] not in old_ids:
                    vals = [new_section['id'],
                            new_section['catalog_num'],
                            new_section['title'],
                            new_section['dow'],
                            new_section['start_time'],
                            new_section['end_time'],
                            new_section['instructor'],
                            new_section['section'],
                            new_section['course'],
                            new_section['room'],
                            new_section['overview'],
                            new_section['requirements']]
                    try:
                        db = get_db()
                        db.execute("INSERT INTO sections VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", vals)
                        db.commit()
                    except sqlite3.IntegrityError:
                        pass

#TODO Change to update method
def initialize_descriptions():
    subject_symbols = [x['symbol'] for x in query_db("SELECT symbol FROM subjects")]

    term_id = query_db("SELECT MAX(id) FROM terms")[0][0]

    new_descriptions = []
    for sub_symb in subject_symbols:
        sections = client.courses_details(term = term_id, subject = str(sub_symb))
        for section in sections:
            for description in section['course_descriptions']:
                new_descriptions.append(
                    {'id':int(section['id']),
                     'name':str(description['name']),
                     'description':str(description['desc'])
                    }
                )

    for new_description in new_descriptions:
        vals = [new_description['id'],
                new_description['name'],
                new_description['description']]
        db = get_db()
        db.execute("INSERT INTO descriptions VALUES (?, ?, ?)", vals)
        db.commit()

#TODO Change to update method
def initialize_components():
    subject_symbols = [x['symbol'] for x in query_db("SELECT symbol FROM subjects")]

    term_id = query_db("SELECT MAX(id) FROM terms")[0][0]

    new_components = []
    for sub_symb in subject_symbols:
        sections = client.courses_details(term = term_id, subject = str(sub_symb))
        for section in sections:
            for component in section['course_components']:
                new_components.append(
                    {'id':int(section['id']),
                     'component':str(component['component']),
                     'dow':str(convertDaysToDOW(component['meeting_days'])),
                     'start_time':str(component['start_time']),
                     'end_time':str(component['end_time']),
                     'section':str(component['section']),
                     'room':str(component['room'])
                    }
                )

    for new_component in new_components:
        vals = [new_component['id'],
                new_component['component'],
                new_component['dow'],
                new_component['start_time'],
                new_component['end_time'],
                new_component['section'],
                new_component['room']]
        db = get_db()
        db.execute("INSERT INTO components VALUES (?, ?, ?, ?, ?, ?, ?)", vals)
        db.commit()

# UNUSED, test later (Takes almost 5000 api requests!)
def initialize_rooms():
    room_ids = [x['room'] for x in query_db("SELECT room FROM sections")]

    new_rooms = []
    for room_id in room_ids:
        rooms = client.rooms_details(id = room_id)
        for room in rooms:
            if room['building']['lat'] is None:
                lat_val = 0
            else:
                lat_val = room['building']['lat']
            if room['building']['lon'] is None:
                lon_val = 0
            else:
                lon_val = room['building']['lon']
            new_rooms.append(
                {'id':int(room['id']),
                 'name':str(room['name']),
                 'building':str(room['building']['name']),
                 'lat':float(lat_val),
                 'lon':float(lon_val)
                }
            )

    for new_room in new_rooms:
        vals = [new_room['id'],
                new_room['name'],
                new_room['building'],
                new_room['lat'],
                new_room['lon']]
        db = get_db()
        db.execute("INSERT INTO rooms VALUES (?, ?, ?, ?, ?)", vals)
        db.commit()

def update_rooms():
    ids = query_db("SELECT id FROM sections")
    for iden in ids:
        try:
            course = client.courses_details(id = iden['id'])[0]
            if course['room'] is None:
                room_val = ""
            else:
                room_val = course['room']['building_name'] + " " + course['room']['name']
            db = get_db()
            db.execute("UPDATE sections SET room=? WHERE id=?", [room_val, iden['id']])
            db.commit()
        except urllib2.URLError:
            pass

@app.route('/')
def index():
    term_name = query_db("SELECT MAX(id), name FROM terms")[0]['name']
    schools = query_db("SELECT symbol, name FROM schools")
    update_sections()
    return render_template('index.html', term = term_name, schools = schools)

@app.route('/about')
def about():
    return render_template('about.html')

@app.route('/contact')
def contact():
    return render_template('contact.html')

@app.route('/development')
def development():
    return render_template('development.html')

@app.route('/login')
def login():
    return render_template('login.html')

@app.route('/subjects/<school_symbol>')
def subjects(school_symbol):
    subjects = query_db("SELECT symbol, name FROM subjects WHERE school = ?", [str(school_symbol)])
    subjects_json = [{'symbol':x['symbol'], 'name':x['name']} for x in subjects]
    return json.dumps(subjects_json)

@app.route('/courses/<subject_symbol>')
def courses(subject_symbol):
    term_name = query_db("SELECT MAX(id), name FROM terms")[0]['name']
    vals = [term_name, subject_symbol]
    courses = query_db("SELECT name, subject "
                       "FROM courses WHERE term = ? AND subject = ?",
                       vals)
    courses_json = [{'name':x['name'],
                     'subject':x['subject']} for x in courses]
    return json.dumps(courses_json)

@app.route('/sections/<course_name>')
def sections(course_name):
    sections = query_db("SELECT id, catalog_num, title, dow, start_time, end_time, instructor, section, course, room, overview, requirements FROM sections WHERE course = ?", [course_name])
    sections_json = [
                        {'id':x['id'],
                         'catalog_num':x['catalog_num'],
                         'title':x['title'],
                         'dow':convertDOWToDays(x['dow']),
                         'start_time':x['start_time'],
                         'end_time':x['end_time'],
                         'instructor':x['instructor'],
                         'section':x['section'],
                         'course':x['course'],
                         'room':x['room'],
                         'overview':x['overview'],
                         'requirements':x['requirements']
                        } for x in sections
                    ]
    return json.dumps(sections_json)

@app.route('/section/<int:section_id>')
def section(section_id):
    section = query_db("SELECT id, "
                       "catalog_num, "
                       "title, "
                       "dow, "
                       "start_time, "
                       "end_time, "
                       "instructor, "
                       "section, "
                       "course, " 
                       "room, " 
                       "overview, " 
                       "requirements " 
                       "FROM sections WHERE id = ?",
                       [int(section_id)])[0]
    section_json = [
                        {'id':section['id'],
                         'catalog_num':section['catalog_num'],
                         'title':section['title'],
                         'dow':section['dow'],
                         'start_time':section['start_time'],
                         'end_time':section['end_time'],
                         'instructor':section['instructor'],
                         'section':section['section'],
                         'course':section['course'],
                         'room':section['room'],
                         'overview':section['overview'],
                         'requirements':section['requirements']
                        }
                    ]
    return json.dumps(section_json)

@app.route('/descriptions/<int:section_id>')
def descriptions(section_id):
    descriptions = query_db("SELECT name, description FROM descriptions WHERE id=?", [section_id])
    desc_dict = {}
    for description in descriptions:
        desc_dict[description['name']] = description['description']
    return json.dumps(desc_dict)

@app.route('/components/<int:section_id>')
def components(section_id):
    components = query_db("SELECT component, dow, start_time, end_time, section, room FROM components WHERE id=?", [section_id])
    comp_dict = {}
    for i in range(len(components)):
        comp_dict['comp' + str(i)] = components[i]['component'] + " " + convertDOWToDays(components[i]['dow'])+ " " + components[i]['start_time'] + "-" + components[i]['end_time'] + " Section " + components[i]['section'] + " " + components[i]['room']
    return json.dumps(comp_dict)

@app.route('/component/<full_name>/section/<int:section_id>')
def component(full_name, section_id):
    all_comps = query_db("SELECT component, dow, start_time, end_time, section, room FROM components")
    section = query_db("SELECT course FROM sections WHERE id = ?", [int(section_id)])[0]
    comp_dict = {}
    for comp in all_comps:
        if comp['component'] + " " + convertDOWToDays(comp['dow'])+ " " + comp['start_time'] + "-" + comp['end_time'] + " Section " + comp['section'] + " " + comp['room'] == full_name:
            comp_dict['component'] = comp['component']
            comp_dict['dow'] = comp['dow']
            comp_dict['start_time'] = comp['start_time']
            comp_dict['end_time'] = comp['end_time']
            comp_dict['section'] = comp['section']
            comp_dict['room'] = comp['room']
            comp_dict['course'] = section['course']
            return json.dumps(comp_dict)

@app.route('/all_sections')
def all_sections():
    sections_list = []
    sections = query_db("SELECT id, catalog_num, title, dow, "
                        "start_time, end_time, instructor, section, course "
                        "FROM sections"
                        )
    for section in sections:
        # Account for unscheduled courses
        meeting_stry = ''
        if section['dow'] != '[]': meeting_str = convertDOWToDays(section['dow'])

        section_time  = ""
        if section['start_time'] != 'None':
            section_time = section['start_time'] + "-" + section['end_time']

        sections_list.append(
                                {'value':section['title'],
                                 'desc':meeting_str + " " + section_time,
                                 'label':"<b>" + section['course'] + "</b>",
                                 'id':section['id'],
                                 'catalog_num':section['catalog_num'],
                                 'title':section['title'],
                                 'dow':section['dow'],
                                 'start_time':section['start_time'],
                                 'end_time':section['end_time'],
                                 'instructor':section['instructor'],
                                 'section':section['section'],
                                 'course':section['course']
                                }
                            )
    return json.dumps(sections_list)

if __name__ == '__main__':
    app.run()
