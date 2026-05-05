import { LightningElement, api, wire } from 'lwc';
import getAccountName from '@salesforce/apex/ClientDashboardController.getAccountName';
import getProjects from '@salesforce/apex/clientProject.getProjects';

export default class ClientDashboard extends LightningElement {

    @api accountId;

    accountName = 'Client';
    projects = [];
    error;

    // 🔥 Fetch account name
    connectedCallback() {
        if (this.accountId) {
            this.fetchAccountName();
        }
    }

    fetchAccountName() {
        getAccountName({ accountId: this.accountId })
            .then(result => {
                this.accountName = result || 'Client';
            })
            .catch(error => {
                console.error('Error fetching account:', error);
                this.accountName = 'Client';
            });
    }

    // 🔥 Fetch projects (for stats)
    @wire(getProjects, { accountId: '$accountId' })
    wiredProjects({ data, error }) {
        if (data) {
            this.projects = data;
            this.error = undefined;
        } else if (error) {
            console.error('Error loading projects:', error);
            this.projects = [];
            this.error = error;
        }
    }

    // -----------------------------------------------------

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
                accountId: this.accountId
            },
            bubbles: true,
            composed: true
        }));
    }

    handleNavigateToNewProject() {
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