import serif as s
from sqlalchemy import desc

term_id = s.Term.query.order_by(desc(s.Term.term_id))[0].term_id

s.update_terms()
print "Updated Terms"
s.update_schools()
print "Updated Schools"
s.update_subjects(term_id)
print "Updated Subjects"
s.update_courses(term_id)
print "Updated Courses"
s.update_sections(term_id)
print "Updated Sections"
s.update_descriptions(term_id)
print "Updated Descriptions"
s.update_components(term_id)
print "Updated Components"
