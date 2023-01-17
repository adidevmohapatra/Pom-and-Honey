/* global server */

/**
 * Sends a POST request to the server to restock an item
 * @param {int} itemId - The desired id of the item to restock
 */
function restockItem(itemId){
    let amount = document.querySelector("#restock_input_" + itemId).value;
    server.POST("/item", {id: itemId, amount: amount}, function(response){
        document.querySelector("#quantity_" + itemId).innerText = (Math.round(response*100)/100).toLocaleString();
    }, function(error){
        alert(error)
    });
}