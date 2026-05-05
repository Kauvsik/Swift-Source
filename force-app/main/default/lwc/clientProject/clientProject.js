import { LightningElement, api, wire, track } from 'lwc';
import getProjects from '@salesforce/apex/clientProject.getProjects';
import getVendorNames from '@salesforce/apex/clientProject.getVendorNames';
import approveBestBid from '@salesforce/apex/bidSelection.approveBestBid';
import { refreshApex } from '@salesforce/apex';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

const columns = [
    { label: 'Project Name', fieldName: 'Name' },
    { label: 'Status', fieldName: 'Status__c' },
    { label: 'Budget', fieldName: 'Budget__c', type: 'currency' },
    {
        type: 'button',
        typeAttributes: {
            label: 'View Bids',
            name: 'view_bids',
            variant: 'brand',
            disabled: { fieldName: 'disableViewBids' }
        }
    }
];

export default class ClientProject extends LightningElement {
    @api accountId;

    columns = columns;
    data = [];
    wiredResult;
    isLoading = false;

    @track showBidModal = false;
    @track selectedProject = null;
    @track vendorNames = {};

    @wire(getProjects, { accountId: '$accountId' })
    wiredProjects(result) {
        this.wiredResult = result;

        if (result.data) {
            console.log('Projects loaded:', result.data);
            
            // Collect all unique vendor IDs from all 3 bid types
            const vendorIds = new Set();
            result.data.forEach(p => {
                if (p.Best_Price_Bid__r?.Vendor__c) {
                    vendorIds.add(p.Best_Price_Bid__r.Vendor__c);
                }
                if (p.Fastest_Delivery_Bid__r?.Vendor__c) {
                    vendorIds.add(p.Fastest_Delivery_Bid__r.Vendor__c);
                }
                if (p.Best_Overall_Bid__r?.Vendor__c) {
                    vendorIds.add(p.Best_Overall_Bid__r.Vendor__c);
                }
            });

            // Fetch vendor names if we have any vendor IDs
            if (vendorIds.size > 0) {
                getVendorNames({ vendorIds: Array.from(vendorIds) })
                    .then(names => {
                        this.vendorNames = names || {};
                    })
                    .catch(error => {
                        console.error('Error fetching vendor names:', error);
                        this.vendorNames = {};
                    });
            }

            // Map data for table display
            this.data = result.data.map(p => ({
                Id: p.Id,
                Name: p.Name,
                Status__c: p.Status__c,
                Budget__c: p.Budget__c,
                fullProject: p,
                // Disable "View Bids" button if not pending approval
                disableViewBids: p.Status__c !== 'Pending Client Approval'
            }));
        } 
        else if (result.error) {
            console.error('Error loading projects:', result.error);
            this.showToast('Error', 'Failed to load projects', 'error');
        }
    }

    handleRowAction(event) {
        const actionName = event.detail.action.name;
        const row = event.detail.row;

        if (actionName === 'view_bids') {
            this.selectedProject = row.fullProject;
            this.showBidModal = true;
        }
    }

    closeBidModal() {
        this.showBidModal = false;
        this.selectedProject = null;
    }

    // ====================================
    // GETTERS FOR BEST PRICE BID
    // ====================================
    
    get hasBestPrice() {
        return this.selectedProject?.Best_Price_Bid__c != null;
    }

    get bestPriceVendor() {
        const vendorId = this.selectedProject?.Best_Price_Bid__r?.Vendor__c;
        if (!vendorId) return 'N/A';
        return this.vendorNames[vendorId] || 'Vendor ' + vendorId.substring(0, 6);
    }

    get bestPrice() {
        return this.selectedProject?.Best_Price_Bid__r?.Quote_Price__c || 0;
    }

    get bestPriceDays() {
        return this.selectedProject?.Best_Price_Bid__r?.Estimated_Day__c || 0;
    }

    // ====================================
    // GETTERS FOR FASTEST DELIVERY BID
    // ====================================
    
    get hasFastestDelivery() {
        return this.selectedProject?.Fastest_Delivery_Bid__c != null;
    }

    get fastestVendor() {
        const vendorId = this.selectedProject?.Fastest_Delivery_Bid__r?.Vendor__c;
        if (!vendorId) return 'N/A';
        return this.vendorNames[vendorId] || 'Vendor ' + vendorId.substring(0, 6);
    }

    get fastestPrice() {
        return this.selectedProject?.Fastest_Delivery_Bid__r?.Quote_Price__c || 0;
    }

    get fastestDays() {
        return this.selectedProject?.Fastest_Delivery_Bid__r?.Estimated_Day__c || 0;
    }

    // ====================================
    // GETTERS FOR BEST OVERALL BID
    // ====================================
    
    get hasBestOverall() {
        return this.selectedProject?.Best_Overall_Bid__c != null;
    }

    get bestOverallVendor() {
        const vendorId = this.selectedProject?.Best_Overall_Bid__r?.Vendor__c;
        if (!vendorId) return 'N/A';
        return this.vendorNames[vendorId] || 'Vendor ' + vendorId.substring(0, 6);
    }

    get bestOverallPrice() {
        return this.selectedProject?.Best_Overall_Bid__r?.Quote_Price__c || 0;
    }

    get bestOverallDays() {
        return this.selectedProject?.Best_Overall_Bid__r?.Estimated_Day__c || 0;
    }

    // ====================================
    // CHECK IF ANY BIDS EXIST
    // ====================================
    
    get hasAnyBids() {
        return this.hasBestPrice || this.hasFastestDelivery || this.hasBestOverall;
    }

    // ====================================
    // APPROVAL HANDLERS
    // ====================================

    async approvePriceBid() {
        await this.handleApprove('price', 'Lowest Price');
    }

    async approveDeliveryBid() {
        await this.handleApprove('delivery', 'Fastest Delivery');
    }

    async approveOverallBid() {
        await this.handleApprove('overall', 'Best Overall');
    }

    async handleApprove(bidType, bidLabel) {
        if (this.isLoading) return;

        this.isLoading = true;

        try {
            console.log('Approving bid type:', bidType, 'for project:', this.selectedProject.Id);
            
            const result = await approveBestBid({ 
                projectId: this.selectedProject.Id,
                bidType: bidType
            });
            
            console.log('Approval result:', result);
            
            this.showToast('Success', `${bidLabel} bid approved successfully`, 'success');
            
            this.closeBidModal();
            
            // Refresh the project list
            await refreshApex(this.wiredResult);
            
        } catch (error) {
            console.error('Approval error:', error);
            
            let errorMessage = 'An error occurred during approval';
            
            if (error.body) {
                if (error.body.message) {
                    errorMessage = error.body.message;
                } else if (error.body.pageErrors && error.body.pageErrors.length > 0) {
                    errorMessage = error.body.pageErrors[0].message;
                }
            } else if (error.message) {
                errorMessage = error.message;
            }
            
            this.showToast('Error', errorMessage, 'error');
        } finally {
            this.isLoading = false;
        }
    }

    showToast(title, message, variant) {
        this.dispatchEvent(
            new ShowToastEvent({
                title: title,
                message: message,
                variant: variant
            })
        );
    }

    goBack() {
        this.dispatchEvent(new CustomEvent('navigate', {
            detail: {
                page: 'dashboard',
                accountId: this.accountId
            },
            bubbles: true,
            composed: true
        }));
    }

    newProject() {
        this.dispatchEvent(new CustomEvent('navigate', {
            detail: {
                page: 'newproject',
                accountId: this.accountId
            },
            bubbles: true,
            composed: true
        }));
    }
}