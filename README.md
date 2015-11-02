# Serif: A Visual Shopping Cart for Northwestern University

What is it?
------------------------------
Serif is a web application designed to be the ultimate preparation tool for student schedule preparation at Northwestern. Originally constructed to combat CAESAR's inability to view the shopping cart in a weekly view, Serif is continually being developed to add more features that will help the student experience.

Serif is not intended to replace CAESAR - the enrollment of courses still must be done in CAESAR itself, not to mention the myriad of other functionality that CAESAR contains that is not related to scheduling (billing, emergency contact, etc). However, Serif should compliment and greatly ease the use of CAESAR for course enrollment, as it will allow students to find courses quickly and easily, create and compare multiple schedules, and more.

If there is a feature that you would like to see added to Serif, or a functionality that you wish were different somehow, please send a note through the feedback form. This will help Serif become a better service for the students.

The application is written in python (serverside) and javascript (clientside). The <a href='http://flask.pocoo.org/'>flask</a> api is used alongside <a href='http://getbootstrap.com/'>bootstrap</a> among other common packages such as jQuery UI. The data is taken from the <a href='http://developer.asg.northwestern.edu/'>Northwestern Course Data API</a> and is saved to a postgresql database.

Instructions
------------------------------
To run a local version of Serif, clone this repository. The python dependencies you'll need are: flask, <a href='https://github.com/northwesternapis/python-client'>nuapiclient</a>, and sqlite3. They can all be installed through pip. The clientside dependencies are: <a href='http://fullcalendar.io/'>fullcalendar</a>, jQuery UI, jQuery, and bootstrap. I recommend installing <a href='https://virtualenv.pypa.io/en/latest/'>virtualenv</a> and installing your pip dependencies that way.

Latest Version
------------------------------
Beta - 2.5
CHANGELOG:
<ul>
    <li>Added Favicon</li>
    <li>Bug Fix: Changed empty room text from "0" to "" (empty string)</li>
    <li>Added an incoming features list on the development page</li>
    <li>Bug Fix: Searching for a class that has components no longer only shows one component</li>
    <li>Added Acknowledgements under the About page</li>
    <li>Added ToS and Privacy Policy pages</li>
</ul>

Author and Contact
------------------------------
Joon Park<br>
Junior, Northwestern University Class of '18<br>
B.A. Physics and B.M. Music Composition<br>
JoonPark2017@u.northwestern.edu<br>
<a href='http://joonparkmusic.com'>joonparkmusic.com</a>
