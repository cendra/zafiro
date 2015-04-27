'use strict';

// Development specific configuration
// ==================================
module.exports = {
  	auth: {
		loginUrl: "/yuli/login",
		returnParam: "returnUrl",
		rest: "http://localhost:8089/api/login"
	},
	logout: {
		rest: "http://localhost:8089/api/logout"
	},
	user: {
		info: {
			rest: "http://localhost:8089/api/account/:id:"
		},
		roles: {
			rest: "http://localhost:8089/api/account/:id:/roles"
		}
	},
	oauth: {
		authorizationPath: "/oidc/authorization",
		tokenPath: "/oidc/token",
		clientID: "123123123",
		clientSecret: "321321321",
		site: "http://localhost:8089"
	},
	organization: {
		image: "/assets/images/unc.png"
	}
};
