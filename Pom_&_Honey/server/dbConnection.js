'use strict'
const {Client} = require('pg');
const async = require('async');

/**
 * Manages the connection between the server and the SQL database.
 */
class dbConnection{
    #client;
    constructor(){
        this.#client = new Client();
    }
    /**
     * Connect to the database.
     */
    async connect(){
        await this.#client.connect();
    }
    
    /**
     * Send a query to the database and return the result
     * @param {String} cmd - the command to use
     */
    async sendQuery(cmd){
        return await this.#client.query(cmd);
    }
    
    /**
     * add an order to the database.
     * @param {Object} order - an object describing an order with the following format:
     *  order = {
            discount: Number,
            productList:[{
                id:Number,
                selectedItems:[Number]
            }]
        }
     */
    async addOrderToDatabase(order){
        let orderId = await this.findNewId("orders");
        console.log("New Order ID: " + orderId);
        let subtotal = 0;
        for (let product of order.productList) {
            let cmd = "SELECT * FROM productdef WHERE id=" + product.id;
            let productDef = await this.sendQuery(cmd);
            productDef = productDef.rows[0];
            subtotal += productDef.price;
            // Generate the necessary product data
            let itemList = productDef.baseitemlist.concat(product.selectedItems);
            let selectedItemPortions = [];
            for (let item of product.selectedItems) {
                let i = productDef.optionalitemlist.indexOf(item);
                if(i == -1){
                    // Invalid optional item
                    console.log(productDef.name + " has invalid optional item: " + item);
                    return 400;
                }
                let size = productDef.optionalportionlist[i];
                selectedItemPortions.push(size);
            }
            let portionList = productDef.baseportionlist.concat(selectedItemPortions);
            console.log("New Product Info: ");
            console.log(" - instance of: ");
            console.log(productDef);
            console.log(" - items: ");
            console.log(itemList);
            console.log(" - portions: ");
            console.log(portionList);

            // Change the item quantities in the database as needed
            for(let i=0;i<itemList.length;i++){
                await this.sendQuery("UPDATE item SET quantity = quantity-" + portionList[i] + " WHERE id = " + itemList[i]);
            }
            // Add the product data to the database
            cmd = "";
            cmd += "'" + productDef.name + "', ";
            cmd += (productDef.price + ", ");
            cmd += "'{" + itemList.toString() + "}', ";
            cmd += "'{" + portionList.toString() + "}', ";
            cmd += "'" + this.getSQLDate() + "',";
            cmd += orderId;
            let full = "INSERT INTO products VALUES (" + cmd + ")";
            console.log(full);
            await this.sendQuery(full);
        }

       // Apply discounts and then tax.
       let total = subtotal * (100 - order.discount)/100 * 1.0825;

       let cmd = "";
       cmd += orderId + ", ";
       cmd += order.discount + ", ";
       cmd += subtotal + ", ";
       cmd += total + ", ";
       cmd += "'" + this.getSQLDate() + "'";

       let full = "INSERT INTO orders VALUES (" + cmd + ")";
       this.sendQuery(full);
       return 200;
    }
    
    /**
     * Returns the next available id in a table (equivalent to the maximum current id plus one)
     * @param {String} table - the SQL table to search through
     */
    async findNewId(table){
        // Returns the ID of the new product when done.
        let id = 0;
            let r = await this.sendQuery("SELECT MAX(id) FROM " + table);
            id = r.rows[0].max+1;
        return Promise.resolve(id);
    }

    /**
     * Returns the current date in SQL format
     * @returns {String} today's date string, useful for SQL queries
     */
    getSQLDate() {
        const date = new Date();
        let day = date.getDate();
        let month = date.getMonth() + 1;
        let year = date.getFullYear();
        let dbDate = year+"-"+month+"-"+day
        return dbDate;
    }
}

module.exports = dbConnection;
