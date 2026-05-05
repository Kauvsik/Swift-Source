import { LightningElement, api } from 'lwc';

export default class VendorDashboardStats extends LightningElement {

    @api bids; // pass vendor bids

    // Safe array
    get safeBids() {
        return Array.isArray(this.bids) ? this.bids : [];
    }

    // Total bids
    get totalBids() {
        return this.safeBids.length;
    }

    // Pending bids
    get pendingBids() {
        return this.safeBids.filter(
            b => b.Status__c === 'Pending'
        ).length;
    }

    // Won projects
    get wonProjects() {
        return this.safeBids.filter(
            b => b.Is_Winner__c === true
        ).length;
    }

    // Total earnings (only won bids)
    get totalEarnings() {
        return this.safeBids
            .filter(b => b.Is_Winner__c === true)
            .reduce((sum, b) => sum + (b.Quote_Price__c || 0), 0);
    }

    // Avg delivery time (won bids)
    get avgDelivery() {
        const won = this.safeBids.filter(
            b => b.Is_Winner__c === true
        );

        if (!won.length) return 0;

        const totalDays = won.reduce((sum, b) => {
            return sum + (b.Estimated_Day__c || 0);
        }, 0);

        return Math.round(totalDays / won.length);
    }
}