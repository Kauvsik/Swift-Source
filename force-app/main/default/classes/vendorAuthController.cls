public without sharing class vendorAuthController {

    @AuraEnabled(cacheable=true)
    public static Boolean validateVendorSession(Id vendorId) {

        if (vendorId == null) return false;

        List<Vendor__c> vendors = [
            SELECT Id 
            FROM Vendor__c 
            WHERE Id = :vendorId 
            LIMIT 1
        ];

        return !vendors.isEmpty();
    }
}