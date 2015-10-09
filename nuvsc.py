import sqlite3
from flask import Flask, render_template, url_for, g

import json
from nuapiclient import NorthwesternAPIClient
import nuapiclient_key as api_key


def convertDaysToDOW(course):
    meeting_days = str(course['meeting_days'])
    if meeting_days == None:
        return []
    days = [meeting_days[x:x + 2] for x in range(0, 
        len(meeting_days), 2)]
    dow_list = []
    for day in days:
        if day == 'Mo': dow_list.append(1)
        elif day == 'Tu': dow_list.append(2)
        elif day == 'We': dow_list.append(3)
        elif day == 'Th': dow_list.append(4)
        elif day == 'Fr': dow_list.append(5)
    return dow_list
    

DATABASE = 'cache.db'

app = Flask(__name__)
app.config.from_object(__name__)

client = NorthwesternAPIClient(api_key.NUAPICLIENT_KEY)


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

    update_terms()
    term_id = query_db("SELECT MAX(id) FROM terms")[0]['id']
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
    # Get a list of old course ids that are already in db
    old_names = [x['name'] for x in query_db("SELECT name FROM courses ORDER BY id ASC")]
    # Get a list of new courses from the northwestern api
    new_courses = []
    # Make sure we are getting courses for every subject and the most recent term
    update_subjects()
    subject_symbols = query_db("SELECT symbol FROM subjects")

    update_terms()
    term_id = query_db("SELECT MAX(id) FROM terms")[0]['id']

    for subj_symb in subject_symbols:
        courses = client.courses(term = term_id, subject = str(subj_symb[0]))
        for course in courses:
            new_courses.append({'name':str(new_course['subject']) + " " + str(new_course['catalog_num']) + " " + str(new_course['title']),
                                'term':course['term'],
                                'subject':course['subject']})

    # new_courses is now filled
    # Sort new courses list
    new_names = sorted([x['name'] for x in new_courses])
    # Compare new and old lists
    # If they're not the same, add the new courses to old
    if new_names != old_names:
        for new_course in new_courses:
            if new_course['id'] not in old_ids:
                    vals = [new_course['name'], str(new_course['term']), str(new_course['subject'])]
                    db = get_db()
                    db.execute("INSERT INTO courses VALUES (?, ?, ?)", vals)
                    db.commit()

def update_sections():
    update_courses()
    #TODO


@app.route('/')
def index():
    terms = query_db("SELECT id, name FROM terms ORDER BY id DESC")
    schools = query_db("SELECT symbol, name FROM schools")
    #TODO: update_courses()
    return render_template('index.html', terms = terms, schools = schools)

@app.route('/courses/<term_id>/<subject_symbol>')
def courses(term_id, subject_symbol):
    term_name = str(query_db("SELECT name FROM terms WHERE id = ?",
                             [int(term_id)],
                             True)[0])
    vals = [term_name, subject_symbol]
    all_courses = query_db("SELECT id, "
                                  "title, "
                                  "term, "
                                  "subject, "
                                  "catalog_num, "
                                  "meeting_days, "
                                  "start_time, "
                                  "end_time "
                                  "FROM courses WHERE term = ? AND subject = ?",
                            vals)
    all_courses_json = [{'id':x['id'],
                         'title':x['title'],
                         'subject':x['subject'],
                         'catalog_num':x['catalog_num'],
                         'meeting_days':x['meeting_days'],
                         'start_time':x['start_time'],
                         'end_time':x['end_time']} for x in all_courses]
    return json.dumps(all_courses_json)

@app.route('/course/<int:course_id>')
def course(course_id):
    course = query_db("SELECT id, "
                             "title, "
                             "term, "
                             "subject, "
                             "catalog_num, "
                             "meeting_days, "
                             "start_time, "
                             "end_time "
                             "FROM courses WHERE id = ?",
                      [int(course_id)],
                      True)
    course_json = [{'id':course['id'],
                    'title':course['title'],
                    'subject':course['subject'],
                    'catalog_num':course['catalog_num'],
                    'meeting_days':course['meeting_days'],
                    'start_time':course['start_time'],
                    'end_time':course['end_time']}]
    return json.dumps(course_json, indent = 4)

@app.route('/dept/<school_symbol>')
def dept(school_symbol):
    subjects = query_db("SELECT symbol, name FROM subjects WHERE school = ?", [str(school_symbol)])
    subjects_json = [{'symbol':x['symbol'], 'name':x['name']} for x in subjects]
    return json.dumps(subjects_json)

@app.route('/all_courses')
def all_courses():
    courses_list = []
    courses = query_db("SELECT id, title, term, subject, catalog_num, "
                       "meeting_days, start_time, end_time, instructor, section "
                       "FROM courses")
    for course in courses:
        # Account for unscheduled courses
        meeting_str = ""
        if course['meeting_days'] != '[]':
            meeting_days = course['meeting_days'][1:len(course['meeting_days']) - 1].split(",")
            for day in meeting_days:
                if day == '1' or day == ' 1': meeting_str += "M"
                elif day == '2' or day == ' 2': meeting_str += "Tu"
                elif day == '3' or day == ' 3': meeting_str += "W"
                elif day == '4' or day == ' 4': meeting_str += "Th"
                elif day == '5' or day == ' 5': meeting_str += "F"

        course_time = ""
        if course['start_time'] != 'None':
            course_time = course['start_time'] + "-" + course['end_time']

        courses_list.append({'value':course['title'],
                             'desc':meeting_str + " " + course_time,
                             'label':"<b>" + course['subject']+ " " + course['catalog_num'] + " " + course['title'] + "</b>",
                             'id':course['id'],
                             'subject':course['subject'],
                             'catalog_num':course['catalog_num'],
                             'title':course['title'],
                             'start_time':course['start_time'],
                             'end_time':course['end_time'],
                             'dow_list':course['meeting_days'],
                             'instructor':course['instructor'],
                             'section':course['section']})
    return json.dumps(courses_list)

if __name__ == '__main__':
    app.run(debug = True)
