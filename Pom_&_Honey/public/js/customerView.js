/* global productDefs */

var discount = 0;
var products = {}; // Used to store product data.
var currentProductId = 0; // Used to track new products.
var selectedProductId = -1; // Used to track the selected product.

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
					// product.selectedItems.remove(itemId);
				}
			}
		}
	});
}


/**
 * this thing adds the receipt area div, text, buttons, edits, and deletes
 */
function loadNewProduct(productDefId) {
	productDef = getProductDef(productDefId);

	// edit button
	let editBtn = document.createElement("button");
	let thisProductId = currentProductId; // Copy the variable in a local context.
	editBtn.id = "product_button_" + thisProductId;
	editBtn.innerText = "Edit";
	newProduct = {
		productDef: productDefId,
		price: productDef.price,
		selectedItems: new Set()
	};


	products[thisProductId] = newProduct;
	editBtn.addEventListener("click", function() {
	loadExistingProduct(thisProductId);

		// for edit button at checkout
		if (productDefId == 6) {
			changeScreen('checkout'); 
			changeScreen('extras-screen')
		} else if (productDefId == 5) {
			// protein area
			changeScreen('checkout'); 
			changeScreen('protein-screen')
			proteinAreaBtn(productDefId)

		} else if (productDefId == 4) {

		} else if (productDefId == 3) {
			changeScreen('checkout'); 
			changeScreen('extras-screen')

		} else if (productDefId == 2) {
			changeScreen('checkout'); 
			changeScreen('rice-screen');
			proteinAreaBtn(productDefId)
		} else if (productDefId == 1) {
			changeScreen('checkout'); 
			changeScreen('rice-screen');
			proteinAreaBtn(productDefId)
		} else {
			changeScreen('checkout');
			changeScreen('rice-screen');
		}
	});

	// receipt div
	let receiptArea = document.createElement("div");
	receiptArea.id = "receipt" + thisProductId
	receiptArea.style.border = '3px solid';
	receiptArea.style.borderColor = 'purple';
	receiptArea.style.margin = '10px';
	receiptArea.style.borderRadius = '5px';

	// text for div
	let orderInfo = document.createElement("p")
	orderInfo.innerText = productDef.name + ": $" + productDef.price;

	// remove button
	let removeBtn = document.createElement("button");
	removeBtn.innerText = "Remove";
	removeBtn.id = "remove_product_button";
	removeBtn.addEventListener("click", function() {
		loadExistingProduct(thisProductId)
		removeSelectedProduct();
	})

	// 7 is the product id number for fountain drink
	// 4 is the product id number for falafels
	// both do not need a edit button
	if (productDefId === 7 || productDefId === 4) {
		document.querySelector("#receipt").appendChild(receiptArea);
		document.querySelector("#receipt"+thisProductId).appendChild(orderInfo);
		document.querySelector("#receipt"+thisProductId).appendChild(removeBtn);
	} else {
		document.querySelector("#receipt").appendChild(receiptArea);
		document.querySelector("#receipt"+thisProductId).appendChild(orderInfo);
		document.querySelector("#receipt"+thisProductId).appendChild(editBtn);
		document.querySelector("#receipt"+thisProductId).appendChild(removeBtn);
	}
		

	newProduct = {
		productDef: productDefId,
		price: productDef.price,
		selectedItems: new Set()
	};
	products[thisProductId] = newProduct;
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
	product = products[id];
	loadItemsForProductDef(product.productDef, product.selectedItems);
}

/**
 * displays all items that that specific product would have 
 * i.e a Gryo would contain rice as one of its item
 * but the extra protein wouldn't have rice as its'
 * @param {string} productDefId 
 * @param {array} selectedItems 
 */
function loadItemsForProductDef(productDefId, selectedItems) {
	productDef = getProductDef(productDefId);
	let buttons = document.querySelectorAll("#all-items button");
	for (let button of buttons) {
		itemId = button.getAttribute("itemId");
		if (itemId) {
			itemId = parseInt(itemId);
			if (productDef.optionalitemlist.includes(itemId)) {
				button.style.display = "block";
				if (selectedItems.has(itemId)) {
					button.classList.add("selected");
				} else {
					button.classList.remove("selected");
				}
			} else {
				button.style.display = "none";
			}
		}
	}
}

/**
 * Update the price in the shopping cart
 * This function is called when the user changes the quantity of an item
 * in the shopping cart.
 */
function updatePrice() {
	let price = 0;
	for(let i in products) {
		price += products[i].price;
	}
	document.querySelector("#subtotal").innerText = price.toFixed(2);
  	document.querySelector("#total").innerText = (price * 1.0825 * (100-discount)/100).toFixed(2);
}


/**
 * Remove the selected product from the shopping cart, and update the total cost
 */
function removeSelectedProduct() {
	let button = document.querySelector("#product_button_" + selectedProductId);

	delete products[selectedProductId];
	const parentID = event.target.parentElement.id
	const receiptDiv = document.getElementById(parentID);
	receiptDiv.remove()

	resetAllButtons();
	updatePrice();
}

/**
 * resets all button
 * basically set the style.display  to none
 */
function resetAllButtons() {
	let buttons = document.querySelectorAll("#all-items button");
	for(let button of buttons){
	button.style.display = "none";
	button.classList.remove("selected");
	}
	selectedProductId = -2;
}


/**
 * used to place order by the customer
 * communicate with the 
 * post to "/customerOrder"
 */
function finalizeOrder() {
	let productList = []

  	// putting values into a list
	let values = Object.values(products)
	for (let value in values) {
		let newProduct = {"id": values[value].productDef, "selectedItems": Array.from(values[value].selectedItems)}
		productList.push(newProduct)
	}

	// the object that will pass into addOrderToDatabase
	let finalOrder = {
		"discount": 0,
		"productList": productList,
	}

	// use server.POST (import /js/server.js)
	server.POST("/customerOrder", finalOrder, (response) => {
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

/**
 * change pages for the customer once the customer clicks prev, next, a product, or checkout
 * @param {int} id 
 * @returns the display style, if none then to block and block then to none
 */
function changeScreen(id) {
	var x = document.getElementById(id);
	if (x.style.display === "none") {
		return x.style.display = "block";
	}
	return x.style.display = "none";
}

/**
 * remove all btn in protein area so new buttons can be placed
 * only used in proteinAreaBtn()
 * @param {string} protein_area 
 */
function removeProteinAreaBtn(protein_area) {
	var buttons = protein_area.querySelectorAll('button');
	for(var i=0; i<buttons.length; i++){
		protein_area.removeChild(buttons[i]);
	}
}

/**
 * depending on which prodcut select will determine which button protein screen area will have
 * @param {int} id 
 */
function proteinAreaBtn(id) {

	let protein_area = document.querySelector("#protein-area")
	let protein_button1 = document.createElement("button");
	let protein_button2 = document.createElement("button");
	if (id == 5) {
		protein_button1.innerText = 'Checkout'
		protein_button1.addEventListener("click", function() {
			changeScreen('protein-screen')
			changeScreen('checkout')
			removeProteinAreaBtn(protein_area)
		})
		protein_area.append(protein_button1)
	} else {
		protein_button1.innerText = 'Next ⮞'
		protein_button2.innerText = '⮜ previous'

		removeProteinAreaBtn(protein_area)
		protein_button1.addEventListener("click", function() {
			changeScreen('protein-screen')
			changeScreen('toppings-screen')
			removeProteinAreaBtn(protein_area)
		})
		protein_button2.addEventListener("click", function() {
			changeScreen('protein-screen')
			changeScreen('rice-screen')
			removeProteinAreaBtn(protein_area)
		})
		protein_area.append(protein_button2)
		protein_area.append(protein_button1)
	}
}

/**
 * change screen based on the product the customer picked
 * @param {int} id 
 */
function changeScreenProduct(id) {
	if (id === 7) { 
		changeScreen('order-screen')
		changeScreen('checkout')
	} else if (id == 6) {
		changeScreen('order-screen')
		changeScreen('extras-screen')
	} else if (id == 5) {
		changeScreen('order-screen')
		changeScreen('protein-screen')
		proteinAreaBtn(id)

	} else if (id == 4) {
		changeScreen('order-screen')
		changeScreen('checkout')
	} else if (id == 3) {
		changeScreen('order-screen')
		changeScreen('extras-screen')

		let extras_area = document.querySelector("#extras-button")
		let protein_button1 = document.createElement("button");

		var buttons = extras_area.querySelectorAll('button');
		for(var i=0; i<buttons.length; i++){
			extras_area.removeChild(buttons[i]);
		}
		protein_button1.innerText = 'Checkout ⮞'
		protein_button1.addEventListener("click", function() {
			changeScreen('extras-screen')
			changeScreen('checkout')
		})
		extras_area.append(protein_button1)

	} else if (id == 2) {
		changeScreen('order-screen')
		changeScreen('rice-screen')
		proteinAreaBtn(id)
	} else if (id == 1) {
		changeScreen('order-screen')
		changeScreen('rice-screen')
		proteinAreaBtn(id)
	} else {
		changeScreen('order-screen')
		changeScreen('checkout')
	}
}

/**
 * used to find the correct product when a customer clicks on a product
 * @param {int} id 
 * @returns the productDef list
 */
const getProductDef = (id) => {
	let productDef;
	for(let def of productDefs){
		if(def.id == id){
			productDef = def;
			break;
		}
	}
	return productDef;
}
