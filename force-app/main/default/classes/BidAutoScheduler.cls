global class BidAutoScheduler implements Schedulable {

    global void execute(SchedulableContext sc) {

        List<Project__c> projects = [
            SELECT Id, Bid_Deadline__c, Status__c
            FROM Project__c
            WHERE Bid_Deadline__c != NULL
            AND Bid_Deadline__c <= :System.now()
        ];

        for (Project__c p : projects) {
            bidSelection.assignBestBid(p.Id);
        }
    }
}