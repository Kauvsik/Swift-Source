import { LightningElement, wire, api } from 'lwc';
import { getObjectInfo, getPicklistValuesByRecordType } from 'lightning/uiObjectInfoApi';
import ACCOUNT_OBJECT from '@salesforce/schema/Account';


//------- Tost for LWR (Experiance Cloud) ----------------
import Toast from 'lightning/toast';
import clientRegister from '@salesforce/apex/clientRegistrationHandler.clientRegister';
import checkExistEmail from '@salesforce/apex/clientRegistrationHandler.checkExistEmail';
export default class ClientRegistration extends LightningElement {

    //---------- Component Handler---------------------
    
    handleNavigateToLogin() {
        this.dispatchEvent(new CustomEvent('navigate', {
            detail: { page: 'login' },
            bubbles: true,
            composed: true
        }));
    }

    //-------------------------------------------------//

    handleRegister() {    
        const clientDetails = {
            Name: this.getValue('companyName'),
            Email__c: this.getValue('email'),
            Password__c: this.getValue('password'),
            Phone: this.getValue('phone'),
            Industry: this.value,
            RegistrationNumber__c: this.getValue('registrationNumber'),
            BillingAddress: this.getValue('address'),
            Description: this.getValue('companyDescription'),
            Website: this.getValue('website'),
        }

        const clientDetailsContact = {
            FirstName: this.getValue('contactPersonFirstName'),
            LastName: this.getValue('contactPersonLastName'),
            Phone: this.getValue('contactPersonPhone'),
            Email: this.getValue('contactPersonEmail'),
            Department: this.getValue('contactPersonDepartment'),
            Title: this.getValue('contactPersonRole')
        }

        //------- Existing Email Id check ---------------------------------
        checkExistEmail({ clientRec: clientDetails }).then((result) => {
            if (result) {
                 this.showToast1('Error', 'Email already exists', 'error');
                 console.log('Email Already Exist');
            }
            else {
                //------------ Register Client -----------------------------

                clientRegister({ clientRec: clientDetails, clientCon: clientDetailsContact  }).then((result) => {
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
            console.log('Checkemail Error : ', err);
        });
    }
    
    //--------------- Send Blank Value for Undefiend Fields --------------------
    getValue(dataId) {
        const el = this.template.querySelector(`[data-id="${dataId}"]`);
        return el ? el.value : '';
    }


    //--------------------------------industry picklist option--------------------------
    value = '';
    industryOptions = [];

    @wire(getObjectInfo, { objectApiName: ACCOUNT_OBJECT })
    objectInfo;

    @wire(getPicklistValuesByRecordType, {
        objectApiName: ACCOUNT_OBJECT,
        recordTypeId: '$objectInfo.data.defaultRecordTypeId'
    })
    picklistHandler({ data, error }) {
        if (data) {
            this.industryOptions = data.picklistFieldValues.Industry.values;
        } else if (error) {
            console.error(error);
        }
    }
    handleChange(event) {
        this.value = event.detail.value;
    }
    //-----------------------------------------------------------------------------------


    //------- Toast method Salesforce App page & Home page -------------------------

    showToast(title, message, variant) {
        this.dispatchEvent(
            new ShowToastEvent({
                title: title,
                message: message,
                variant: variant
            })
        );
    }

    //---------------------------------------------------------------------------


    //------- Toast method for LWR (Experiance Cloud)-------------------------

    showToast1(title, message, variant) {
        Toast.show({
            label: title,
            message: message,
            variant: variant
        });
    }

    //------------------------------------------------------------------------

}