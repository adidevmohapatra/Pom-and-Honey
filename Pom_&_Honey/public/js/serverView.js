/* global productDefs, server */

var discount = 0;

let buttons = document.querySelectorAll("[selectable=true]");
for(let button of buttons) {
    button.addEventListener("click", function() {
        button.classList.toggle("selected");
        let itemId = button.getAttribute("itemId");
        // If button represents an item, update product data to reflect this.
        if(itemId) {
            itemId = parseInt(itemId);
            let product = products[selectedProductId];
            if(product) {
                if(button.classList.contains("selected")) {
                    product.selectedItems.add(itemId);
                }
                else {
                    product.selectedItems.remove(itemId);
                }
            }
        }
    });
}

var products = {}; // Used to store product data.
var currentProductId = 0; // Used to track new products.
var selectedProductId = -1; // Used to track the selected product.

/**
 * Update the price in the shopping cart
 * This function is called when the user changes the quantity of an item
 * in the shopping cart.
 */
function updatePrice(){
    let price = 0;
    for(let i in products){
        price += products[i].price;
    }
    document.querySelector("#subtotal").innerText = price.toFixed(2);
    document.querySelector("#curDiscount").innerText = discount;
    document.querySelector("#total").innerText = (price * 1.0825 * (100-discount)/100).toFixed(2);
}


/**
 * used to find the correct product when a server button clicks on a product
 * @param {int} id 
 * @returns the productDef list
 */
function getProductDef(id){
    let productDef;
    for(let def of productDefs){
        if(def.id == id){
            productDef = def;
            break;
        }
    }
    return productDef;
}

/**
 * resets all button
 * basically set the style.display  to none
 */
function resetAllButtons(){
    let buttons = document.querySelectorAll("#all-items button");
    for(let button of buttons){
        button.style.display = "none";
        button.classList.remove("selected");
    }
    selectedProductId = -1;
}

/**
 * displays all items that that specific product would have 
 * i.e a Gryo would contain rice as one of its item
 * but the extra protein wouldn't have rice as its item
 * @param {string} productDefId 
 * @param {array} selectedItems 
 */
function loadItemsForProductDef(productDefId, selectedItems) {
    let productDef = getProductDef(productDefId);
    let buttons = document.querySelectorAll("#all-items button");
    for(let button of buttons){
        let itemId = button.getAttribute("itemId");
        if(itemId){
            itemId = parseInt(itemId);
            if(productDef.optionalitemlist.includes(itemId)){
                console.log("  itemId: " + itemId)
                button.style.display = "block";
                if(selectedItems.has(itemId)){
                    button.classList.add("selected");
                } else {
                    button.classList.remove("selected");
                }
            } else {
                button.style.display = "none";
            }
        }
    }
    document.querySelector("#remove_product_button").style.display = "block";
}

/**
 * this thing adds the receipt area div, text, buttons, edits, and deletes
 */
function loadNewProduct(productDefId){
    let productDef = getProductDef(productDefId);
    // Add a new button with a reference to the product.
    let receiptButton = document.createElement("button");
    let thisProductId = currentProductId; // Copy the variable in a local context.

    receiptButton.innerText = productDef.name + ": $" + productDef.price;
    receiptButton.id = "product_button_" + thisProductId;

    receiptButton.addEventListener("click", function(){
        loadExistingProduct(thisProductId);
    });

    document.querySelector("#receipt").appendChild(receiptButton);
    let newProduct = {
        productDef: productDefId,
        price: productDef.price,
        selectedItems: new Set()
    };
    products[thisProductId] = newProduct;

    console.log("newProduct productDef :: " + newProduct.productDef)
    console.log("newProduct price :: " + newProduct.price)
    console.log("newProduct selectItems :: " + newProduct.selectedItems)

    loadExistingProduct(thisProductId);
    updatePrice();
    currentProductId += 1;
}

/**
 * when a product is clicked the function will find the correct
 * product items for that specific product, i.e what a bowl would contain
 * @param {int} id 
 */
function loadExistingProduct(id){
    selectedProductId = id;
    let product = products[id];  // local "newProduct"
    loadItemsForProductDef(product.productDef, product.selectedItems);
}

/**
 * Remove the selected product from the shopping cart, and update the total cost
 */
function removeSelectedProduct(){
    console.log("Removing product " + selectedProductId);
    let button = document.querySelector("#product_button_" + selectedProductId);
    console.log(button);
    button.parentNode.removeChild(button); // delete the button
    delete products[selectedProductId];
    resetAllButtons();
    updatePrice();
}


/**
 * discount for the final order on the server view
 * the server will manually add the discount
 */
function addDiscount() {
    discount = document.getElementById("discount").value;
    if(discount > 100){
        discount = 100;
    }
    else if(discount < 0){
        discount = 0;
    }
    console.log("Discount:" + discount);
    let price = 0;
        for(let i in products){
            price += products[i].price;
        }
        document.querySelector("#subtotal").innerText = price.toFixed(2);
        document.querySelector("#curDiscount").innerText = discount;
        document.querySelector("#total").innerText = (price * 1.0825 * (100-discount)/100).toFixed(2);
}

/**
 * used to place order by the server view
 * communicate with the 
 * post to "/order"
 */
function finalizeOrder() {
    // Hints:
    // start with the products object
    const date = new Date();
	let day = date.getDate();
    let month = date.getMonth() + 1;
    let year = date.getFullYear();
    let dbDate = year+"-"+month+"-"+day
    let orderDate = month+"/"+day+"/"+year

    let productList = []


    // putting values into a list
    console.log("here" + products);
    let values = Object.values(products)
    for (let value in values) {
		let newProduct = {"id": values[value].productDef, "selectedItems": Array.from(values[value].selectedItems)}
        productList.push(newProduct)
    }

	// the object that will pass into addOrderToDatabase
    let finalOrder = {
        "discount": discount,
		"productList": productList,
	}

	console.log(finalOrder)


    // use server.POST (import /js/server.js)
    server.POST("/order", finalOrder, (response) => {
        window.location.reload();
    }, (error) => {
		alert(error);
    })

}

/**
 * The Google Translate API
 * Used for translating to any language available on Google Translate
 */
function googleTranslateElementInit() {
    new google.translate.TranslateElement(
        {pageLanguage: 'en'}, 'google_translate_id'
    )
}