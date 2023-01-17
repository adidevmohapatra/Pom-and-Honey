/**
 * Manages interaction between the client and server
 */
class server {
	/**
	 * Create a GET request. Will either be successful (status code 200) or an error.
	 * @param {String} path - the path to GET
	 * @param {String|function} success - either a string redirection or a function to run on success
	 * @param {String|function} error - either a string redirection or a function to run on error
	 */
	static GET (path, success, error) {
		var xhr = new XMLHttpRequest();
		xhr.open("GET", path);
		xhr.send();
		xhr.onreadystatechange = function() {
			if (xhr.readyState == XMLHttpRequest.DONE) {
				this.#handleServerResponse(xhr, success, error);
			}
		}.bind(this);
	}
	
	/**
	 * Create a POST request. Will either be successful (status code 200) or an error.
	 * @param {String} path - the path to POST
	 * @param {Object} content - JSON data to send to the server
	 * @param {String|function} success - either a string redirection or a function to run on success
	 * @param {String|function} error - either a string redirection or a function to run on error
	 */
	static POST (post, content, success, error) {
		var xhr = new XMLHttpRequest();
		xhr.open("POST", post, true);
		xhr.setRequestHeader('Content-Type', 'application/json');
		xhr.send(JSON.stringify(content));
		xhr.onreadystatechange = function() {
			if (xhr.readyState == XMLHttpRequest.DONE) {
				this.#handleServerResponse(xhr, success, error);
			}
		}.bind(this);
	}
	
	static #handleServerResponse(xhr, success, error) {
		if (xhr.status == 400) {
			// An general/logical error occurred
			if (typeof error == "string") {
				// Assume the parameter is an ID of an HTML element
				var errorDiv = document.getElementById(error);
				errorDiv.innerText = xhr.response
				errorDiv.style.display = "block";
			}
			else if (typeof error == "function") {
				// If the parameter is a function, execute it
				error(xhr.response);
			}
		}
		else if (xhr.status == 200) {
			// The request was successful
			if (typeof success == "string") {
				// Assume the parameter is a link
				if (window.location.href == xhr.response) {
					window.location.reload();
				}
				else {
					window.location.href = success;
				}
			}
			else if (typeof success == "function") {
				// If the parameter is a function, execute it
				success(xhr.response);
			}
		}
		else {
			// Server Error
			if (typeof error == "string") {
				// Assume the parameter is an ID of an HTML element
				var errorDiv = document.getElementById(error);
				errorDiv.innerText = "An unexpected error occurred.";
				errorDiv.style.display = "block";
			}
			else if (typeof error == "function") {
				// If the parameter is a function, execute it
				error("An unexpected error occurred.");
			}
		}
	}
};