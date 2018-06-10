# working_style_artifact
Web Application for identifying organizational working style in event log files

Note: project is running under python version 3.6

To run the application you need to:
1. Git clone it from this repo to your local machine.
  To do it, you need to enter terminal on your machine, go to folder where you want to have this project,
  and write 'git clone https://github.com/dimatkachuk/working_style_artifact.git'

2. Start server
Server part can be launched using app.py file.
Next steps is two different ways to run it. I recommend first one, as it is more easy.
2a. If you use some IDE (PyCharm, etc) you can open project with it and just run python script app.py.
    But project will not start if you don't have Flusk, you should do 'pip3 install Flask' first. It can
    be done via terminal on your machine. Just run this command.

2b. If you don't have IDE, project can be run from Python Shell.
    Firstly you need to open your terminal window on your machine and do following commands:
    2.b.1. Enter folder with cloned project (see 1).
    2.b.2. Enter 'pip3 install Flask' command. (if you dont have Flask yet).
    2.b.3. Enter 'FLASK_APP=app.py flask run' command.

3. Port configuration.
   No matter how you run application (see 2), after launch it will write you in console (terminal), next line:
        * Serving Flask app "app"
        * Running on http://127.0.0.1:5000/ (Press CTRL+C to quit)
   From this. we can understand that our application is running on the local host http://127.0.0.1:5000/.
   This one local host is default for such apps, but considering configuration of your machine, it can happen
   you will have another port.
   If you have the same port, as stated above you can skip this step and goto step 4.
   Otherwise, you will need to change line of code.
   Go to Client folder of this project, next to scripts folder and open log_file_input.js file with editor of
   your choice. first line of code will be:
        * const host = 'http://127.0.0.1:5000/';
   Only thing you need to do, is to insert your own host and save.

4. Run Client Application
   Only thing you need to do lastly is to enter Client folder and just open 'index.html' with any browser of your choice.
