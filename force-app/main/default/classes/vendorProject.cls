public without sharing class vendorProject {

    @AuraEnabled(cacheable=true)
    public static List<Project__c> getProjects(Id vendorId){
        try {
            // First verify the vendor is verified
            List<Vendor__c> vendors = [
                SELECT Id, Verification_Status__c 
                FROM Vendor__c 
                WHERE Id = :vendorId 
                LIMIT 1
            ];
            
            // If vendor not found, return empty list
            if (vendors.isEmpty()) {
                System.debug('Vendor not found with ID: ' + vendorId);
                return new List<Project__c>();
            }
            
            // Check if vendor is verified
            if (vendors[0].Verification_Status__c != 'Verified') {
                System.debug('Vendor is not verified. Status: ' + vendors[0].Verification_Status__c);
                return new List<Project__c>();
            }
            
            // Return all verified projects for verified vendors
            return [
                SELECT Id, Name, Status__c, Verification_Status__c, Budget__c, Category__c, Bid_Deadline__c,
                       Due_Date__c, Project_Description__c, Vendor__c,
                       Account__c, Account__r.Name
                FROM Project__c
                WHERE Verification_Status__c = 'Verified'
                ORDER BY CreatedDate DESC
            ];
            
        } catch (Exception e) {
            System.debug('Error in getProjects: ' + e.getMessage());
            // If there's an error (e.g., field doesn't exist), return empty list
            return new List<Project__c>();
        }
    }
}