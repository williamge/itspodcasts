#itspodcasts

A website that keeps track of various podcast RSS feeds and consolidates them in one source.

Live site can be found at [http://itspodcasts.herokuapp.com/](http://itspodcasts.herokuapp.com/)

###Directory structure
- *models/* : source for data models shared between the programs
- *scraper/* : application that scrapes the podcast feeds and stores it in the database
- *test/* : test suites and tests
- *web/* : website for displaying the scraped podcast content
- *Gruntfile.js* : Grunt file
- *package.json* :
- *Procfile* : for running various elements of the project in a Procfile-based application


###Running locally
If you really want to run this locally (for development purposes or who knows why) then it should be a simple task:

- Install Node.js
- Run '*npm install*'
- Make sure you have a MongoDB database running 
	- By default the applications will try connecting to localhost, otherwise you can change the environment variable '*MONGO_URL*' to point to the location of your MongoDB instance
- Run '*npm run scraper*' to run the scraper
- Run '*npm run web*' to run the web server

Tests can be run with:

- '*npm test*' to run all tests
- '*npm run test.cov*' to run coverage analysis