console.log("Starting Server: " + new Date());

require('dotenv').config(); // Set up environment variables

var express = require('express');
var path = require("path")
var app = express();
var server = require('http').createServer(app);
var home = __dirname + "/public/";
var dbConnection = require("./server/dbConnection");


async function start(){
    if (process.env.DEVMODE) {
        // Dev mode assumes there is no reverse proxy, so node must serve static files itself.
        console.log("Server running in developer mode.");
    	app.use(express.static('public'));
    }
    
    
    var db = new dbConnection();
    await db.connect();
    console.log("Database connected successfully");
    
    // Define routes for the express app
    require('./server/routes.js')(app, home, db);
    console.log("routes have been defined...");
    
    server.listen(process.env.PORT);
    console.log("Listening on port " + process.env.PORT);
}

start();