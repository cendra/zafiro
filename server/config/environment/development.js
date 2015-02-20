'use strict';

// Development specific configuration
// ==================================
module.exports = {
  // MongoDB connection options
  	auth: {
		loginUrl: "/yuli/login",
		returnParam: "returnUrl",
		rest: "http://localhost:8089/api/login"
	},
	user: {
		info: {
			rest: "http://localhost:8089/api/account"
		},
		roles: {
			rest: "http://localhost:8089/api/roles"
		}
	},
	oauth: {
		authorizationPath: "/oidc/authorization",
		tokenPath: "/oidc/token",
		clientID: "123123123",
		clientSecret: "321321321",
		site: "http://localhost:8089"
	}
};
