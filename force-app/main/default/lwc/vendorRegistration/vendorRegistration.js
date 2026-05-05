import { LightningElement, wire } from 'lwc';
import { getObjectInfo, getPicklistValuesByRecordType } from 'lightning/uiObjectInfoApi';
import VENDOR_OBJECT from '@salesforce/schema/Vendor__c';
import Toast from 'lightning/toast';
import vendorRegistration from '@salesforce/apex/vendorRegistrationHandler.vendorRegister';
import checkExistEmail from '@salesforce/apex/vendorRegistrationHandler.checkExistEmail';

export default class VendorRegistration extends LightningElement {
    
    handleNavigateToLogin() {
        this.dispatchEvent(new CustomEvent('navigate', {
            detail: { page: 'login' },
            bubbles: true,
            composed: true
        }));
    }

    handleRegister() {
        const vendorDetails = {
            Name: this.getValue('companyName'),
            Email__c: this.getValue('email'),
            Password__c: this.getValue('password'),
            Phone__c: this.getValue('phone'),
            Registration_Number__c: this.getValue('registrationNumber'),
            Address__c: this.getValue('address'),
            Bio__c: this.getValue('companyDescription'),
            Website__c: this.getValue('website'),
            Expertise__c: this.value.join(';')
        }

        const vendorContactDetails = {
            FirstName: this.getValue('contactPersonFirstName'),
            LastName: this.getValue('contactPersonLastName'),
            Phone: this.getValue('contactPersonPhone'),
            Email: this.getValue('contactPersonEmail'),
            Department: this.getValue('contactPersonDepartment'),
            Title: this.getValue('contactPersonRole')
        }
        
        checkExistEmail({ vendorRec: vendorDetails }).then((result) => {
            if (result) {
                this.showToast1('Error', 'Email already exists', 'error');
            }
            else {
                vendorRegistration({ vendorRec: vendorDetails, vendorCon: vendorContactDetails}).then((result) => {
                    this.showToast1('Success', result, 'success');
                    // Navigate to login after successful registration
                    this.dispatchEvent(new CustomEvent('navigate', {
                        detail: { page: 'login' },
                        bubbles: true,
                        composed: true
                    }));
                }).catch((err) => {
                    console.log('FULL ERROR:', JSON.stringify(err));
                    console.log('MESSAGE:', err?.body?.message);
                });
            }
        }).catch((err) => {
            console.log('Checkemail Error:', err);
        });
    }

    getValue(dataId) {
        const el = this.template.querySelector(`[data-id="${dataId}"]`);
        return el ? el.value : '';
    }

    value = [];
    expertiseOptions = [];

    @wire(getObjectInfo, { objectApiName: VENDOR_OBJECT})
    objectInfo;

    @wire(getPicklistValuesByRecordType, {
        objectApiName: VENDOR_OBJECT,
        recordTypeId: '$objectInfo.data.defaultRecordTypeId'
    })
    picklistHandler({ data, error }) {
        if (data) {
            this.expertiseOptions = data.picklistFieldValues?.Expertise__c?.values || [];
        } else if (error) {
            console.error('Picklist error:', error);
        }
    }

    handleChange(event) {
        this.value = event.detail.value;
    }

    showToast1(title, message, variant) {
        Toast.show({
            label: title,
            message: message,
            variant: variant
        });
    }
}