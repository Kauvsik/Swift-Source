public without sharing class vendorBidController {
    
    @AuraEnabled
    public static String submitBid(Bid__c bidData) {
        try {
            // Validate required fields
            if (bidData.Project__c == null) {
                return 'Error: Project is required';
            }
            if (bidData.Vendor__c == null) {
                return 'Error: Vendor is required';
            }
            if (bidData.Quote_Price__c == null || bidData.Quote_Price__c <= 0) {
                return 'Error: Quote Price must be greater than 0';
            }
            if (bidData.Estimated_Day__c == null || bidData.Estimated_Day__c <= 0) {
                return 'Error: Estimated Days must be greater than 0';
            }
            
            // Set default values
            bidData.Submitted_At__c = System.now();
            bidData.Status__c = 'Submitted';
            bidData.Is_Winner__c = false;
            
            // Insert the bid record
            insert bidData;
            
            return 'Success';
        } catch (DmlException e) {
            return 'Error: ' + e.getMessage();
        } catch (Exception e) {
            return 'Error: ' + e.getMessage();
        }
    }
    
    @AuraEnabled(cacheable=true)
    public static List<Bid__c> getVendorBids(Id vendorId) {
        try {
            return [
                SELECT Id, Name, Project__c, Project__r.Name, Quote_Price__c, 
                       Estimated_Day__c, Status__c, Submitted_At__c, Is_Winner__c,
                       Proposal_Message__c
                FROM Bid__c
                WHERE Vendor__c = :vendorId
                ORDER BY Submitted_At__c DESC
            ];
        } catch (Exception e) {
            return new List<Bid__c>();
        }
    }
    
    @AuraEnabled
    public static Bid__c getVendorBidForProject(Id vendorId, Id projectId) {
        try {
            List<Bid__c> bids = [
                SELECT Id, Name, Quote_Price__c, Estimated_Day__c, 
                       Status__c, Submitted_At__c, Is_Winner__c, Proposal_Message__c
                FROM Bid__c
                WHERE Vendor__c = :vendorId AND Project__c = :projectId
                LIMIT 1
            ];
            
            return bids.isEmpty() ? null : bids[0];
        } catch (Exception e) {
            return null;
        }
    }

    @AuraEnabled
    public static String cancelBid(Id bidId) {
        try {
            Bid__c bid = [
                SELECT Id, Status__c 
                FROM Bid__c 
                WHERE Id = :bidId 
                LIMIT 1
            ];

            if (bid.Status__c == 'Withdrawn') {
                return 'Error: Bid already Withdrawn';
            }
            bid.Status__c = 'Withdrawn';
            update bid;
            return 'Success';
        } 
        catch (Exception e) {
            return 'Error: ' + e.getMessage();
        }
    }

    @AuraEnabled
    public static String updateBid(Bid__c bidData) {
        try {
            Bid__c existing = [
                SELECT Id, Is_Winner__c, Status__c 
                FROM Bid__c 
                WHERE Id = :bidData.Id 
                LIMIT 1
            ];
            
            if (existing.Is_Winner__c) {
            return 'Error: Cannot edit a winning bid';
        }

        if (existing.Status__c == 'Withdrawn') {
            return 'Error: Cannot edit a withdrawn bid';
        }

        update bidData;
        return 'Success';
    } 
    catch (Exception e) {
        return 'Error: ' + e.getMessage();
    }
}
}