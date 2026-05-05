public without sharing class vendorAssignedController {
    
    @AuraEnabled(cacheable=true)
    public static List<Project_Assignment__c> getAssignedProjects(Id vendorId) {
        try {
            // Validate vendorId
            if (vendorId == null) {
                throw new AuraHandledException('Vendor ID is required');
            }

            // Query with null safety
            List<Project_Assignment__c> assignments = [
                SELECT Id,
                       Project__r.Name,
                       Project__r.Budget__c,
                       Bid__r.Quote_Price__c,
                       Bid__r.Estimated_Day__c,
                       Start_Date__c,
                       Expected_End_Date__c,
                       Status__c
                FROM Project_Assignment__c
                WHERE Vendor__c = :vendorId
                ORDER BY CreatedDate DESC
            ];

            System.debug('Found ' + assignments.size() + ' assignments for vendor: ' + vendorId);
            return assignments;

        } catch (Exception e) {
            System.debug('Error in getAssignedProjects: ' + e.getMessage());
            throw new AuraHandledException('Failed to fetch assigned projects: ' + e.getMessage());
        }
    }
}