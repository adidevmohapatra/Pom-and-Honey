'use strict'

const { default: async } = require('async');
// Import important Node modules
const cookieParser = require('cookie-parser');
const express = require('express');
const fetch = require('node-fetch');
const session = require('express-session');

module.exports = function(app, home, db) {
	app.use(cookieParser()); // Give express the ability to read user cookies.
	app.use(express.json()); // Give express the ability to parse POST requests.
    app.use(session({secret: "Shh, its a secret!"}));
    app.set('view engine', 'ejs');

    app.use(function(req, res, next) {
	    // Completely disable caching.
		res.set('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
		next();
	});

    app.get("/", function(req, res){
        console.log(req.session);
        if (req.session.email) {
            // User is logged in.
            res.redirect("/home");
            return;
        }
        res.redirect("/customer");
    });

    /* BEGIN GET REQUESTS */
    app.get("/time", function(req, res){
        // Simple GET request: return the current time.
        res.send("The time is : " + new Date());
    });

    app.get("/manager/summary", async function(req, res){
        if (!req.session.manager) {
            res.redirect("/nopermission");
            return;
        }
        const date = new Date();
        let day = date.getDate();
        let month = date.getMonth() + 1;
        let year = date.getFullYear();
        let dbDate = year+"-"+month+"-"+day

		let results = await db.sendQuery("SELECT SUM(total) FROM orders");
		let salesNum = results.rows[0].sum;

        let results2 = await db.sendQuery("SELECT SUM(total) FROM orders WHERE date > (date '" + dbDate + "' - integer '7')");
        let weekSales = results2.rows[0].sum;

        let order_data = await db.sendQuery("SELECT * FROM item where quantity < minquantity");

        res.render("manager/summary.ejs", {sales:salesNum, week:weekSales, restock:order_data.rows});
    });

    app.get("/manager/orders", async function(req, res){
        // Find the 100 most recent orders
        if (!req.session.manager) {
            res.redirect("/nopermission");
            return;
        }
        let quantifier = "";
        if(req.query.s && req.query.e){
            quantifier = " WHERE date BETWEEN '" + req.query.s + "' AND '" + req.query.e + "'";
        }
        else if(req.query.s){
            quantifier = " WHERE date >= '" + req.query.s + "'";
        }
        else if(req.query.e){
            quantifier = " WHERE date <= '" + req.query.e + "'";
        }
        let cmd = "SELECT id, date, total FROM orders" + quantifier + " ORDER BY date DESC LIMIT 100";
        // console.log(cmd);
		let results = await db.sendQuery(cmd);
        res.render("manager/orders.ejs", {orders:results.rows});

    });


    app.get("/manager/items", async function(req, res){
        if (!req.session.manager) {
            res.redirect("/nopermission");
            return;
        }
        let results = await db.sendQuery("SELECT id, name, quantity, units FROM item ORDER BY id ASC");
        let results2 = await db.sendQuery("SELECT id, name, price FROM productdef");
        res.render("manager/items.ejs", {items:results.rows,productdef:results2.rows});
    });

    app.get("/server", async (req, res) => {
        //console.log("in server sign in");
        if (!req.session.server) {
            res.redirect("/nopermission");
            return;
        }
        let items = await db.sendQuery("SELECT id, name, categoryid FROM item ORDER BY categoryid");
        let categories = await db.sendQuery("SELECT id, name, description, color FROM category");
		let productDefs = await db.sendQuery("SELECT id, name, optionalItemList, optionalPortionList, price FROM productdef");

        res.render("server.ejs", {items:items.rows, productDefs:productDefs.rows, categories:categories.rows});
    })

    app.get("/customer", async (req, res) => {
        let items = await db.sendQuery("SELECT id, name, categoryid from item");
		let productDefs = await db.sendQuery("SELECT id, name, optionalItemList, optionalPortionList, price FROM productdef");
        let categories = await db.sendQuery("SELECT id, name, description, color FROM category");

        res.render("customer.ejs", {items:items.rows, productDefs:productDefs.rows, categories:categories.rows, user:req.session})
    })

    app.get("/nopermission", (req, res) => {
        res.render("nopermission.ejs");
    });

    app.get("/home", (req, res) => {
        if(req.session.email){
            res.render("home.ejs", {user:req.session});
        }
        else{
            res.redirect("/");
        }
    });

    app.post("/item", async function(req, res){
        res.status(400);
        let id = req.body.id;
        let amount = parseFloat(req.body.amount);
        if(isNaN(amount)){
            return res.send("Invalid amount.");
        }
        let results = await db.sendQuery("UPDATE item SET quantity = quantity+" + amount + " WHERE id = " + id + " RETURNING quantity");
        res.status(200);
        res.send("" + results.rows[0].quantity);
    });

    app.post("/order", async function(req, res){
        res.status(400);
        await db.addOrderToDatabase(req.body);
        res.send(200);
    });
    app.post("/customerOrder", async function(req, res){
        res.status(400);
        req.body.discount = 0;
        await db.addOrderToDatabase(req.body);
        res.send(200);
    });
    app.get("/logout", function(req, res) {
        req.session.email = undefined;
        req.session.name = "";
        req.session.server = false;
        req.session.manager = false;
        res.redirect("/");
    });


    app.post("/login", async function(req, res) {
        res.status(400);
        //console.log("in login");
        req.session.email = "";
        req.session.name = "";
        req.session.server = false;
        req.session.manager = false;
        //console.log(req.body);
        var token = req.body.token;
        const {OAuth2Client} = require('google-auth-library');
        const client = new OAuth2Client("1001480195333-8c7osehemrrpbkpl72ptme7n69s8h3up.apps.googleusercontent.com");
        async function verify() {
            const ticket = await client.verifyIdToken({
                idToken: token,
                audience: "1001480195333-8c7osehemrrpbkpl72ptme7n69s8h3up.apps.googleusercontent.com",  // Specify the CLIENT_ID of the app that accesses the backend
                // Or, if multiple clients access the backend:
                //[CLIENT_ID_1, CLIENT_ID_2, CLIENT_ID_3]
            });
            const payload = ticket.getPayload();
            const userid = payload['sub'];
            // If request specified a G Suite domain:
            // const domain = payload['hd']
            req.session.email = payload.email;
            req.session.name = payload.name;
        }
        await verify().catch(console.error);
        req.session.server = false;
        req.session.manager = false;
        let permissions = await db.sendQuery("SELECT isserver, ismanager FROM email WHERE email='" + req.session.email + "'");
        if (permissions.rowCount != 0) { // if you're in the database
            if (permissions.rows[0].isserver) { // if you're in the database but not a manager
                req.session.server = true;
            }
            if (permissions.rows[0].ismanager) { // if you're in the database but not a manager
                req.session.manager = true;
            }
        }
        console.log(req.session);
        res.send(200);
    });
};
