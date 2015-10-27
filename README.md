Front End
---------------------
Factories:

	* Account Number
	* 
		* Variables:
		* 
			* activeToken 

		* Methods:
		* 
			* generateToken(username, password)
			* getActiveToken()


Back End
---------------------

Use hat to generate api token on login request (api token is used by webapp to access folders).

JS Files:

	* Accounts
	* 
		* Methods:
		* 
			* getAccounts
			* getAccountById
			* createAccount
			* removeAccount
			* accountById


	* DB
	* 
		* Exports DatabaseURL
		* Exports connection (mongojs.connect())

	* Server
	* 
		* Contains all routes



Mongodb Architecture
---------------------
//Account
/*
	The top level data holding contact and business information
*/
{
	first: "John",
	last: "Spaceman", 
	email: "johnthemerc@spacemail.*",
	_id: ObjectId("52e088410fbc90bad8000002")
}
