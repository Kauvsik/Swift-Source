import { LightningElement, api } from 'lwc';
import Toast from 'lightning/toast';
import clientLogin from '@salesforce/apex/clientLogin.clientLogin';

export default class ClientLogin extends LightningElement {
    
    //---------- Component Handler---------------------
    
    handleNavigateToRegister() {
    this.dispatchEvent(new CustomEvent("navigate", {
        detail: { page: "register" },
        bubbles: true,
        composed: true,
      }),
    );
  }

    handleLogin() {
        const emailField = this.template.querySelector('[data-id="email"]');
        const passwordField = this.template.querySelector('[data-id="password"]');
        
        const email = emailField.value;
        const password = passwordField.value;
        
        // Validate that both fields are filled
        if (!email || !password) {
            this.showToast('Error', 'Please enter both email and password.', 'error');
            return;
        }
        
        // Validate email format
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(email)) {
            this.showToast('Error', 'Please enter a valid email address.', 'error');
            return;
        }
        
        const clientLoginDetails = {
            Email__c: email,
            Password__c: password,
        }
        console.log('Client Login Details : ', clientLoginDetails);
        
        clientLogin({clientLoginDetails: clientLoginDetails}).then(result => {
                    if(result[0] === 'success') {
                        localStorage.setItem("accountId", result[1]);
                        localStorage.setItem("isClientLoggedIn", "true");
                        localStorage.setItem("loginTime", Date.now());
                        this.showToast('Success', 'Login successful!', 'success');

                        // Navigate to dashboard on successful login
                        
                        this.dispatchEvent(new CustomEvent('navigate', {
                            detail: { 
                                page: 'dashboard', 
                                accountId: result[1]
                            },
                            bubbles: true,
                            composed: true
                        }));
                    }
                    else {
                        this.showToast('Error', 'Login failed. Please check your credentials.', 'error');
                    }
                }).catch(error => {
                    console.error('Error during login:', error);
                    this.showToast('Error', 'An error occurred during login. Please try again later.', 'error');
                });
            }

    //------- Toast method Salesforce App page & Home page -------------------------

    showToast(title, message, variant) {
        Toast.show({
            label: title,
            message: message,
            variant: variant
        });
    } 
}