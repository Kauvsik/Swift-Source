import { LightningElement } from 'lwc';
import Toast from 'lightning/toast';
import vendorLogin from '@salesforce/apex/vendorLogin.vendorLogin';

export default class VendorLogin extends LightningElement {

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
      this.showToast("Error", "Please enter both email and password.", "error");
      return;
    }

    // Validate email format
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      this.showToast("Error", "Please enter a valid email address.", "error");
      return;
    }

    const vendorLoginDetails = {
      Email__c: email,
      Password__c: password,
    };
    console.log("Vendor Login Details:", vendorLoginDetails);

    vendorLogin({ vendorLoginDetails: vendorLoginDetails })
      .then((result) => {
        if (result[0] === "success") {
          localStorage.setItem("vendorId", result[1]);
          localStorage.setItem("isVendorLoggedIn", "true");
          localStorage.setItem("loginTime", Date.now());
          this.showToast("Success", "Login successful!", "success");

          // Navigate to dashboard on successful login

          this.dispatchEvent(
            new CustomEvent("navigate", {
              detail: {
                page: "dashboard",
                vendorId: result[1],
              },
              bubbles: true,
              composed: true,
            }),
          );
        } else {
          this.showToast(
            "Error",
            "Login failed. Please check your credentials.",
            "error",
          );
        }
      })
      .catch((error) => {
        console.error("Error during login:", error);
        this.showToast(
          "Error",
          "An error occurred during login. Please try again later.",
          "error",
        );
      });
  }

  showToast(title, message, variant) {
    Toast.show({
      label: title,
      message: message,
      variant: variant,
    });
  }
}