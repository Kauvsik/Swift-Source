public without sharing class vendorLogin {
    
    @AuraEnabled
    public static List<String> vendorLogin(Vendor__c vendorLoginDetails) {
        String email = vendorLoginDetails.Email__c;
        String password = vendorLoginDetails.Password__c;
        
        // 1. Query the database using ONLY the Email__c field.
        List<Vendor__c> vendors = [SELECT Id, Password__c FROM Vendor__c WHERE Email__c = :email WITH SECURITY_ENFORCED LIMIT 1];
        
        // 2. Check if we actually found a vendor with that email
        if (!vendors.isEmpty()) {
            
            // 3. Compare the database password with the user's input password
            if (vendors[0].Password__c == password) {
                List<String> vendorData = new List<String>{'success', vendors[0].Id};
                return vendorData;
            }
        }        
        return new List<String>{'failure'};
    }
}