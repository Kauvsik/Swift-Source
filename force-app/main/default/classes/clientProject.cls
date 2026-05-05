public without sharing class clientProject {

    @AuraEnabled(cacheable=true)
    public static List<Project__c> getProjects(Id accountId){
        return [
            SELECT Id, Name, Status__c, Verification_Status__c, Budget__c, Category__c,
                   Due_Date__c, Project_Description__c, Account__c, Is_Approved__c,
                   
                   Best_Price_Bid__c,
                   Best_Price_Bid__r.Quote_Price__c,
                   Best_Price_Bid__r.Estimated_Day__c,
                   Best_Price_Bid__r.Vendor__c,
                   
                   Fastest_Delivery_Bid__c,
                   Fastest_Delivery_Bid__r.Quote_Price__c,
                   Fastest_Delivery_Bid__r.Estimated_Day__c,
                   Fastest_Delivery_Bid__r.Vendor__c,
                   
                   Best_Overall_Bid__c,
                   Best_Overall_Bid__r.Quote_Price__c,
                   Best_Overall_Bid__r.Estimated_Day__c,
                   Best_Overall_Bid__r.Vendor__c
                   
            FROM Project__c
            WHERE Account__c = :accountId
            ORDER BY CreatedDate DESC
        ];
    }
    
    @AuraEnabled
    public static Map<Id, String> getVendorNames(List<Id> vendorIds) {
        Map<Id, String> vendorNameMap = new Map<Id, String>();
        
        if (vendorIds == null || vendorIds.isEmpty()) {
            return vendorNameMap;
        }
        
        List<Vendor__c> vendors = [
            SELECT Id, Name, Email__c
            FROM Vendor__c
            WHERE Id IN :vendorIds
        ];
        
        for (Vendor__c v : vendors) {
            // Use Name field (or Email as fallback)
            vendorNameMap.put(v.Id, String.isNotBlank(v.Name) ? v.Name : v.Email__c);
        }
        
        return vendorNameMap;
    }
}