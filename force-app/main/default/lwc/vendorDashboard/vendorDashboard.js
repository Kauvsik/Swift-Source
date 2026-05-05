import { LightningElement, api } from 'lwc';
import getVendorName from '@salesforce/apex/VendorDashboardController.getVendorName';
import getVendorBids from '@salesforce/apex/VendorDashboardController.getVendorBids';

export default class VendorDashboard extends LightningElement {

    @api vendorId;
    vendorName = 'Vendor';
    bids = [];

    connectedCallback() {
        console.log('Dashboard vendorId:', this.vendorId);

        if (this.vendorId) {
            this.fetchVendorName();
            this.fetchVendorBids();
        }
    }

    // ✅ Fetch Vendor Name
    fetchVendorName() {
        getVendorName({ vendorId: this.vendorId })
            .then(result => {
                this.vendorName = result || 'Vendor';
            })
            .catch(error => {
                console.error('Error fetching vendor:', error);
                this.vendorName = 'Vendor';
            });
    }

    // ✅ Fetch Vendor Bids (IMPORTANT)
    fetchVendorBids() {
        getVendorBids({ vendorId: this.vendorId })
            .then(result => {
                console.log('Vendor Bids:', result);
                this.bids = result || [];
            })
            .catch(error => {
                console.error('Error fetching bids:', error);
                this.bids = [];
            });
    }

    // ---------------- NAVIGATION ----------------

    handleLogout() {
        this.dispatchEvent(new CustomEvent('navigate', {
            detail: { page: 'login' },
            bubbles: true,
            composed: true
        }));
    }

    handleNavigateToProject() {
        this.dispatchEvent(new CustomEvent('navigate', {
            detail: {
                page: 'project',
                vendorId: this.vendorId
            },
            bubbles: true,
            composed: true
        }));
    }

    handleNavigateToAssignedProjects() {
        this.dispatchEvent(new CustomEvent("navigate", {
            detail: {
                page: "assignedProjects",
                vendorId: this.vendorId
            },
            bubbles: true,
            composed: true
        }));
    }
}