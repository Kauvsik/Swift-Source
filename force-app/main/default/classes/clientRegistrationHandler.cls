public without sharing  class clientRegistrationHandler {

	@AuraEnabled
	public static String clientRegister(Account clientRec, Contact clientCon) {
		try{
			insert clientRec;
			clientCon.AccountId = clientRec.Id;
			insert clientCon;
			System.debug(clientRec);
			return 'success';
		}
		catch (Exception e) {
			System.debug('ERROR: ' + e.getMessage());
			throw new AuraHandledException(e.getMessage());
		}	

	}

	@AuraEnabled
	public static Boolean checkExistEmail(Account clientRec) {
		return [SELECT Id FROM Account WHERE Email__c = :clientRec.Email__c].size() > 0;
	}
}