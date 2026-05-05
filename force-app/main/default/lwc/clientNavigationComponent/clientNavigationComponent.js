import { LightningElement } from 'lwc';
import validateClientSession from "@salesforce/apex/clientAuthController.validateClientSession";

export default class ClientNavigationComponent extends LightningElement {
  currentPage = "login";
  accountId = "";

  inactivityTimer;
  INACTIVITY_LIMIT = 15 * 60 * 1000;
  SESSION_LIMIT = 2 * 60 * 60 * 1000;

  connectedCallback() {
    const accountId = localStorage.getItem("accountId");
    const isLoggedIn = localStorage.getItem("isClientLoggedIn");
    const savedPage = localStorage.getItem("currentPage");
    const loginTime = localStorage.getItem("loginTime");

    if (loginTime && Date.now() - loginTime > this.SESSION_LIMIT) {
      this.logout();
      return;
    }

    if (isLoggedIn === "true" && accountId) {
      validateClientSession({ accountId })
        .then((isValid) => {
          if (isValid) {
            this.accountId = accountId;
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
    localStorage.removeItem("accountId");
    localStorage.removeItem("isClientLoggedIn");
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

  get isNewProject() {
    return this.currentPage === "newproject";
  }

  handleNavigation(event) {
    this.currentPage = event.detail.page;
    localStorage.setItem("currentPage", this.currentPage);
    if (event.detail.accountId) {
      this.accountId = event.detail.accountId;
    }
  }
}