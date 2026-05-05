public without sharing class bidSelection {

    @AuraEnabled
    public static void assignBestBid(Id projectId) {

        if (projectId == null) return;

        Project__c project = [
            SELECT Id, Account__c, Status__c,
                   Best_Price_Bid__c, Fastest_Delivery_Bid__c, Best_Overall_Bid__c
            FROM Project__c
            WHERE Id = :projectId
            LIMIT 1
        ];

        // Only run in correct state
        if (project.Status__c != 'Bidding In-Progress') return;

        List<Bid__c> bids = [
            SELECT Id, Vendor__c, Quote_Price__c, Estimated_Day__c, Status__c,
                   Score__c, Recommendation_Label__c, Recommendation_Reason__c
            FROM Bid__c
            WHERE Project__c = :projectId
            AND Status__c != 'Withdrawn'
            AND Quote_Price__c != NULL
            AND Estimated_Day__c != NULL
        ];

        if (bids.isEmpty()) return;

        Decimal minPrice, maxPrice, minDays, maxDays;

        // 🔥 FIND MIN/MAX
        for (Bid__c b : bids) {
            if (minPrice == null) {
                minPrice = maxPrice = b.Quote_Price__c;
                minDays = maxDays = b.Estimated_Day__c;
                continue;
            }

            minPrice = Math.min(minPrice, b.Quote_Price__c);
            maxPrice = Math.max(maxPrice, b.Quote_Price__c);
            minDays = Math.min(minDays, b.Estimated_Day__c);
            maxDays = Math.max(maxDays, b.Estimated_Day__c);
        }

        Bid__c bestPriceBid;
        Bid__c fastestBid;
        Bid__c bestOverallBid;

        Decimal bestOverallScore = -1;

        // 🔥 SCORING LOOP
        for (Bid__c b : bids) {

            Decimal priceScore = (maxPrice == minPrice) ? 1 :
                (maxPrice - b.Quote_Price__c) / (maxPrice - minPrice);

            Decimal timeScore = (maxDays == minDays) ? 1 :
                (maxDays - b.Estimated_Day__c) / (maxDays - minDays);

            // ⚖️ Balanced scoring (slight bias to price)
            Decimal overallScore = ((0.6 * priceScore) + (0.4 * timeScore)) * 100;

            // 🔥 AI LABEL LOGIC
            String label = '';
            String reason = '';

            if (overallScore >= 85) {
                label = '🏆 AI Recommended';
                reason = 'Best balance of cost and delivery';
            } 
            else if (priceScore >= 0.95) {
                label = '💰 Budget Friendly';
                reason = 'Lowest cost option';
            } 
            else if (timeScore >= 0.95) {
                label = '⚡ Fast Delivery';
                reason = 'Quickest turnaround time';
            }

            // Assign AI fields
            b.Score__c = overallScore;
            b.Recommendation_Label__c = label;
            b.Recommendation_Reason__c = reason;

            // 🔥 TRACK BESTS

            if (bestPriceBid == null || b.Quote_Price__c < bestPriceBid.Quote_Price__c) {
                bestPriceBid = b;
            }

            if (fastestBid == null || b.Estimated_Day__c < fastestBid.Estimated_Day__c) {
                fastestBid = b;
            }

            if (overallScore > bestOverallScore) {
                bestOverallScore = overallScore;
                bestOverallBid = b;
            }
        }

        // 🔥 UPDATE PROJECT
        project.Best_Price_Bid__c = bestPriceBid?.Id;
        project.Fastest_Delivery_Bid__c = fastestBid?.Id;
        project.Best_Overall_Bid__c = bestOverallBid?.Id;
        project.Status__c = 'Pending Client Approval';

        update project;

        // 🔥 UPDATE ALL BIDS (AI tags + scores)
        update bids;
    }


    // ======================================
    // 🔥 APPROVAL METHOD (UNCHANGED CORE)
    // ======================================
    @AuraEnabled(cacheable=false)
    public static String approveBestBid(Id projectId, String bidType) {

        try {
            if (projectId == null || String.isBlank(bidType)) {
                throw new AuraHandledException('Project ID and bid type are required');
            }

            Project__c project = [
                SELECT Id, Best_Price_Bid__c, Fastest_Delivery_Bid__c, 
                       Best_Overall_Bid__c, Account__c, Status__c, Is_Approved__c
                FROM Project__c
                WHERE Id = :projectId
                LIMIT 1
            ];

            if (project.Is_Approved__c == true || project.Status__c == 'Vendor Assigned') {
                return 'Already Approved';
            }

            if (project.Status__c != 'Pending Client Approval') {
                throw new AuraHandledException(
                    'Project not ready for approval. Current status: ' + project.Status__c
                );
            }

            Id selectedBidId;

            if (bidType == 'price') {
                selectedBidId = project.Best_Price_Bid__c;
            } else if (bidType == 'delivery') {
                selectedBidId = project.Fastest_Delivery_Bid__c;
            } else if (bidType == 'overall') {
                selectedBidId = project.Best_Overall_Bid__c;
            } else {
                throw new AuraHandledException('Invalid bid type: ' + bidType);
            }

            if (selectedBidId == null) {
                throw new AuraHandledException('No bid found for selected type');
            }

            Bid__c selectedBid = [
                SELECT Id, Vendor__c, Quote_Price__c, Estimated_Day__c
                FROM Bid__c
                WHERE Id = :selectedBidId
                LIMIT 1
            ];

            List<Project_Assignment__c> existing = [
                SELECT Id FROM Project_Assignment__c
                WHERE Project__c = :project.Id
                LIMIT 1
            ];

            if (existing.isEmpty()) {
                insert new Project_Assignment__c(
                    Project__c = project.Id,
                    Vendor__c = selectedBid.Vendor__c,
                    Bid__c = selectedBid.Id,
                    Winning_Bid__c = selectedBid.Id,
                    Status__c = 'Assigned',
                    Account__c = project.Account__c,
                    Project_Value__c = selectedBid.Quote_Price__c,
                    Start_Date__c = Date.today(),
                    Expected_End_Date__c = Date.today()
                        .addDays(Integer.valueOf(selectedBid.Estimated_Day__c))
                );
            }

            project.Status__c = 'Vendor Assigned';
            project.Is_Approved__c = true;
            update project;

            List<Bid__c> allBids = [
                SELECT Id, Status__c, Is_Winner__c
                FROM Bid__c
                WHERE Project__c = :project.Id
            ];

            for (Bid__c b : allBids) {
                if (b.Status__c == 'Withdrawn') continue;

                b.Is_Winner__c = (b.Id == selectedBid.Id);
                b.Status__c = (b.Id == selectedBid.Id) ? 'Accepted' : 'Rejected';
            }

            update allBids;

            return 'Success';

        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }
}