public without sharing class vendorRegistrationHandler {
    
	@AuraEnabled
	public static String vendorRegister(Vendor__c vendorRec, Contact vendorCon) {
		try{
			insert vendorRec;
			vendorCon.Vendor__c = vendorRec.Id;
			insert vendorCon;
			System.debug(vendorRec);
			return 'success';
		}
		catch (Exception e) {
			System.debug('ERROR: ' + e.getMessage());
			throw new AuraHandledException(e.getMessage());
		}		
	}

	@AuraEnabled
	public static Boolean checkExistEmail(Vendor__c vendorRec) {
		return [SELECT Id FROM Vendor__c WHERE Email__c = :vendorRec.Email__c].size() > 0;
	}

}