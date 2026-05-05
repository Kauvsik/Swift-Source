import { LightningElement } from 'lwc';
import validateVendorSession from "@salesforce/apex/vendorAuthController.validateVendorSession";

export default class VendorNavigationComponent extends LightningElement {
  currentPage = "login";
  vendorId = "";

  inactivityTimer;
  INACTIVITY_LIMIT = 15 * 60 * 1000;
  SESSION_LIMIT = 2 * 60 * 60 * 1000;

  connectedCallback() {
    const vendorId = localStorage.getItem("vendorId");
    const isLoggedIn = localStorage.getItem("isVendorLoggedIn");
    const savedPage = localStorage.getItem("currentPage");
    const loginTime = localStorage.getItem("loginTime");

    if (loginTime && Date.now() - loginTime > this.SESSION_LIMIT) {
      this.logout();
      return;
    }

    if (isLoggedIn === "true" && vendorId) {
      validateVendorSession({ vendorId: vendorId })
        .then((isValid) => {
          if (isValid) {
            this.vendorId = vendorId;
            this.currentPage = savedPage ? savedPage : "dashboard";
            this.startInactivityTimer();
            this.registerActivityListeners();
          } else {
            this.logout();
          }
        })
        .catch(() => {
          this.logout();
        });
    }
  }

  registerActivityListeners() {
    window.addEventListener("click", this.resetTimer.bind(this));
    window.addEventListener("keydown", this.resetTimer.bind(this));
    window.addEventListener("mousemove", this.resetTimer.bind(this));
  }

  startInactivityTimer() {
    this.clearTimer();
    this.inactivityTimer = setTimeout(() => {
      this.logout();
      alert("Logged out due to inactivity"); // optional UX
    }, this.INACTIVITY_LIMIT);
  }

  resetTimer() {
    this.startInactivityTimer();
  }

  clearTimer() {
    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer);
    }
  }

  logout() {
    localStorage.removeItem("vendorId");
    localStorage.removeItem("isVendorLoggedIn");
    localStorage.removeItem("currentPage");
    this.currentPage = "login";
  }

  get isLogin() {
    return this.currentPage === "login";
  }

  get isRegister() {
    return this.currentPage === "register";
  }

  get isDashboard() {
    return this.currentPage === "dashboard";
  }

  get isProject() {
    return this.currentPage === "project";
  }

  get isAssignedProjects() {
    return this.currentPage === "assignedProjects";
  }

  handleNavigation(event) {
    this.currentPage = event.detail.page;
    localStorage.setItem("currentPage", this.currentPage);
    if (event.detail.vendorId) {
      this.vendorId = event.detail.vendorId;
    }
  }
}