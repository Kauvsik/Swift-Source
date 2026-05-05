import { LightningElement, api, wire, track } from 'lwc';
import getAssignedProjects from '@salesforce/apex/vendorAssignedController.getAssignedProjects';

export default class VendorAssignedProject extends LightningElement {
    @api vendorId;
    @track projects = [];
    @track error;
    @track isLoading = true;

    columns = [
        { label: "Project Name", fieldName: "projectName" },
        { label: "Budget", fieldName: "budget", type: "currency" },
        { label: "Your Quote", fieldName: "quote", type: "currency" },
        { label: "Estimated Days", fieldName: "days", type: "number" },
        { label: "Start Date", fieldName: "startDate", type: "date" },
        { label: "End Date", fieldName: "endDate", type: "date" },
        { label: "Status", fieldName: "status" }
    ];

    // The wire service automatically reacts when vendorId changes
    @wire(getAssignedProjects, { vendorId:'$vendorId' })
    wiredProjects({ error, data }) {
        this.isLoading = true;
        
        if (data) {
            console.log("Fetched projects:", data);
            this.projects = data.map(item => ({
                Id: item.Id,
                projectName: item.Project__r?.Name || 'N/A',
                budget: item.Project__r?.Budget__c || 0,
                quote: item.Bid__r?.Quote_Price__c || 0,
                days: item.Bid__r?.Estimated_Day__c || 0,
                startDate: item.Start_Date__c,
                endDate: item.Expected_End_Date__c,
                status: item.Status__c
            }));
            this.error = undefined;
            this.isLoading = false;
        } else if (error) {
            console.error("Error loading assigned projects:", error);
            this.error = error;
            this.projects = [];
            this.isLoading = false;
        }
    }

    get hasProjects() {
        return this.projects && this.projects.length > 0;
    }

    goBack() {
        this.dispatchEvent(new CustomEvent("navigate", {
            detail: {
                page: "dashboard",
                vendorId: this.vendorId
            },
            bubbles: true,
            composed: true
        }));
    }
}