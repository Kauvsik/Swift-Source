import { LightningElement, api } from 'lwc';

export default class ClientDashboardStats extends LightningElement {

    @api projects;

    // ✅ Always safe array
    get safeProjects() {
        return Array.isArray(this.projects) ? this.projects : [];
    }

    // ✅ Total projects
    get totalProjects() {
        return this.safeProjects.length;
    }

    // ✅ Pending approvals (COUNT)
    get pendingApprovals() {
        return this.safeProjects.filter(
            p => p.Status__c === 'Pending Client Approval'
        ).length;
    }

    // ✅ Active projects
    get activeProjects() {
        return this.safeProjects.filter(
            p => p.Status__c === 'Vendor Assigned'
        ).length;
    }

    // ✅ Total budget
    get totalBudget() {
        return this.safeProjects.reduce((sum, p) => {
            return sum + (p.Budget__c || 0);
        }, 0);
    }

    // ✅ Avg delivery time
    get avgDelivery() {
        const assigned = this.safeProjects.filter(
            p => p.Status__c === 'Vendor Assigned'
        );

        if (!assigned.length) return 0;

        const totalDays = assigned.reduce((sum, p) => {
            return sum + (p.Best_Overall_Bid__r?.Estimated_Day__c || 0);
        }, 0);

        return Math.round(totalDays / assigned.length);
    }
}