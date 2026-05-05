public without sharing class VendorDashboardController {

    @AuraEnabled(cacheable=true)
    public static String getVendorName(Id vendorId) {

        if (vendorId == null) return 'Vendor';

        List<Vendor__c> vendors = [
            SELECT Name 
            FROM Vendor__c 
            WHERE Id = :vendorId 
            LIMIT 1
        ];

        if (vendors.isEmpty()) {
            return 'Vendor';
        }

        return vendors[0].Name;
    }

    @AuraEnabled(cacheable=true)
    public static List<Bid__c> getVendorBids(Id vendorId) {
        return [
            SELECT Id, Quote_Price__c, Estimated_Day__c, Status__c, Is_Winner__c
            FROM Bid__c
            WHERE Vendor__c = :vendorId
            ];
        }
    }