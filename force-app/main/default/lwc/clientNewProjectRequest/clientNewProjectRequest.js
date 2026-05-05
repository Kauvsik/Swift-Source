import { LightningElement, api, wire } from 'lwc';
import { getObjectInfo, getPicklistValues } from 'lightning/uiObjectInfoApi';
import Toast from 'lightning/toast';
import createProject from '@salesforce/apex/clientProjectController.createProject';
import PROJECT_OBJECT from '@salesforce/schema/Project__c';
import CATEGORY_FIELD from '@salesforce/schema/Project__c.Category__c';

export default class ClientNewProjectRequest extends LightningElement {
    @api accountId;

    categoryOptions = [];

    @wire(getObjectInfo, { objectApiName: PROJECT_OBJECT })
    projectMetadata;

    @wire(getPicklistValues, {
        recordTypeId: '$projectMetadata.data.defaultRecordTypeId',
        fieldApiName: CATEGORY_FIELD
    })
    wiredCategoryPicklist({ error, data }) {
        if (data) {
            this.categoryOptions = data.values.map(item => ({
                label: item.label,
                value: item.value
            }));
        } else if (error) {
            console.error('Error fetching category picklist:', error);
            // Fallback to default values if wire fails
            this.categoryOptions = [
                { label: 'Web Development', value: 'Web Development' },
                { label: 'Mobile Development', value: 'Mobile Development' },
                { label: 'AI/ML', value: 'AI/ML' },
                { label: 'Cloud Services', value: 'Cloud Services' },
                { label: 'Data Analytics', value: 'Data Analytics' },
                { label: 'Consulting', value: 'Consulting' },
                { label: 'Design', value: 'Design' },
                { label: 'Testing', value: 'Testing' },
                { label: 'Other', value: 'Other' }
            ];
        }
    }

    handleBack() {
        this.dispatchEvent(new CustomEvent('navigate', {
            detail: {
                page: 'dashboard',
                accountId: this.accountId
            },
            bubbles: true,
            composed: true
        }));
    }

    getValue(dataId) {
        const el = this.template.querySelector(`[data-id="${dataId}"]`);
        return el ? el.value : '';
    }

    handleSubmit() {
        // Get form values
        const projectName = this.getValue('projectName');
        const projectDescription = this.getValue('projectDescription');
        const budget = this.getValue('budget');
        const dueDate = this.getValue('dueDate');
        const category = this.getValue('category');

        // Validate required fields
        if (!projectName) {
            this.showToast('Error', 'Project Name is required', 'error');
            return;
        }

        // Create project object with field mapping
        const projectData = {
            Name: projectName,
            Project_Description__c: projectDescription,
            Budget__c: budget ? parseFloat(budget) : null,
            Due_Date__c: dueDate,
            Category__c: category,
            Account__c: this.accountId,
            Status__c: 'Pending Verification',
            Verification_Status__c: 'Pending Approval'
        };

        console.log('Project Data:', projectData);

        // Call Apex to create project
        createProject({ projectData: projectData })
            .then(result => {
                if (result) {
                    this.showToast('Success', 'Project request submitted successfully!', 'success');
                    
                    // Navigate back to dashboard after submission
                    this.dispatchEvent(new CustomEvent('navigate', {
                        detail: {
                            page: 'dashboard',
                            accountId: this.accountId
                        },
                        bubbles: true,
                        composed: true
                    }));
                } else {
                    this.showToast('Error', result, 'error');
                }
            })
            .catch(error => {
                console.error('Error creating project:', error);
                this.showToast('Error', 'An error occurred while creating the project. Please try again.', 'error');
            });
    }

    showToast(title, message, variant) {
        Toast.show({
            label: title,
            message: message,
            variant: variant
        });
    }
}