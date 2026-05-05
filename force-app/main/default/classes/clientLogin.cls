public without sharing class clientLogin {
    
    @AuraEnabled
    public static List<String> clientLogin(Account clientLoginDetails) {
        String email = clientLoginDetails.Email__c;
        String password = clientLoginDetails.Password__c;
        
        // 1. Query the database using ONLY the Email__c field.
        List<Account> clients = [SELECT Id, Password__c FROM Account WHERE Email__c = :email WITH SECURITY_ENFORCED LIMIT 1];
        
        // 2. Check if we actually found a client with that email
        if (!clients.isEmpty()) {
            
            // 3. Compare the database password with the user's input password
            if (clients[0].Password__c == password) {
                List <String> clientData = new List <String> {'success',clients[0].Id};
                return clientData;
            }
        }        
        return new List<String>{'failure'};
    }
}