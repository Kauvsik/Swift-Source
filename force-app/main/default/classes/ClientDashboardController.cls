public without sharing class ClientDashboardController {
    
    @AuraEnabled(cacheable=true)
    public static String getAccountName(Id accountId) {
        if (accountId == null) return 'Client';

        Account acc = [
            SELECT Name 
            FROM Account 
            WHERE Id = :accountId 
            LIMIT 1
        ];

        return acc.Name;
    }
}