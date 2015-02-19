'use strict';

// Development specific configuration
// ==================================
module.exports = {
  // MongoDB connection options
  	auth: {
		loginUrl: "/yuli/login",
		returnParam: "returnUrl",
		rest: {
			post: "http://localhost:9001/yuli/login"
		}
	},
	oauth: {
		url: "",
		client_key: "",
		client_secret: ""
	}
};
