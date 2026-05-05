public without sharing class clientAuthController {

    @AuraEnabled(cacheable=true)
    public static Boolean validateClientSession(Id accountId) {

        if (accountId == null) return false;

        List<Account> clients = [
            SELECT Id 
            FROM Account 
            WHERE Id = :accountId 
            LIMIT 1
        ];

        return !clients.isEmpty();
    }
}