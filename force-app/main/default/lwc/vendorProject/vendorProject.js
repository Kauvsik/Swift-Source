import { LightningElement, api, wire, track } from 'lwc';
import getProjects from '@salesforce/apex/vendorProject.getProjects';
import submitBid from '@salesforce/apex/vendorBidController.submitBid';
import getVendorBidForProject from '@salesforce/apex/vendorBidController.getVendorBidForProject';
import updateBid from "@salesforce/apex/vendorBidController.updateBid";
import cancelBid from "@salesforce/apex/vendorBidController.cancelBid";
import LightningConfirm from 'lightning/confirm';
import Toast from 'lightning/toast';

export default class VendorProject extends LightningElement {
  @api vendorId;

  @track showBidModal = false;
  @track selectedProject = null;
  @track quotePrice = "";
  @track estimatedDays = "";
  @track proposalMessage = "";
  @track isViewMode = false;
  @track existingBid = null;
  @track isEditMode = false;

  // ✅ TABLE COLUMNS
  columns = [
    { label: "Project Name", fieldName: "Name" },
    { label: "Budget", fieldName: "Budget__c", type: "currency" },
    { label: "Category", fieldName: "Category__c" },
    { label: "Due Date", fieldName: "Due_Date__c", type: "date" },
    { label: "Time Left", fieldName: "remainingTime" },
    {
      type: "button",
      typeAttributes: {
        label: { fieldName: "bidButtonLabel" },
        name: "bid_action",
        variant: { fieldName: "bidButtonVariant" },
        disabled: { fieldName: "bidButtonDisabled" }
      },
    },
  ];

  projectsData = [];
  vendorBids = new Map();

  connectedCallback() {
    this.timer = setInterval(() => {
        this.projectsData = [...this.projectsData];
    }, 60000);
  }

  disconnectedCallback() {
    clearInterval(this.timer);
  }

  // =========================
  // 🔥 FETCH PROJECTS
  // =========================

  @wire(getProjects, { vendorId: "$vendorId" })
  wiredProjects({ error, data }) {
    if (data) {
      this.fetchBidsForProjects(data);
    } else if (error) {
      console.error(error);
    }
  }

  // =========================
  // 🔥 FETCH BIDS + ENHANCE DATA
  // =========================
  async fetchBidsForProjects(projects) {
    try {
        const bidPromises = projects.map((project) =>
            getVendorBidForProject({
                vendorId: this.vendorId,
                projectId: project.Id,
            })
        );

        const bids = await Promise.all(bidPromises);

        // Map bids
        this.vendorBids.clear();
        bids.forEach((bid, index) => {
            if (bid) {
                this.vendorBids.set(projects[index].Id, bid);
            }
        });

        // 🔥 CLEAN + SAFE LOGIC
        this.projectsData = projects.map((project) => {
            const deadline = project.Bid_Deadline__c;
            const hasBid = this.vendorBids.has(project.Id);

            const hasDeadline = !!deadline;
            const isExpired = hasDeadline && this.isDeadlineExpired(project);
            const remaining = hasDeadline
                ? (isExpired ? "Closed" : this.calculateTimeLeft(deadline))
                : "No deadline";

            let label = "Submit Bid";
            let variant = "brand";
            let disabled = false;

            if (hasBid) {
                label = "View Bid";
                variant = "neutral";
                disabled = false;

            } 
            else if (isExpired) {
                label = "Closed";
                variant = "destructive";
                disabled = true;
            }

            return {
                ...project,
                bidButtonLabel: label,
                bidButtonVariant: variant,
                bidButtonDisabled: disabled,
                remainingTime: remaining,
                isExpired,
                hasBid
            };
        });

    } catch (error) {
        console.error("Error fetching bids:", JSON.stringify(error));
    }
}

  get data() {
    return this.projectsData;
  }

  calculateTimeLeft(deadline) {
    if (!deadline) return "No deadline";

    const end = new Date(deadline).getTime();
    const now = new Date().getTime();

    if (end <= now) return "Closed";

    let diff = end - now;

    const hours = Math.floor(diff / (1000 * 60 * 60));
    diff %= (1000 * 60 * 60);

    const minutes = Math.floor(diff / (1000 * 60));

    return `${hours}h ${minutes}m`;
}

  // =========================
  // 🔥 TIME CALCULATION
  // =========================

  getRemainingTime(deadline) {
    if (!deadline) return "";

    const now = new Date();
    const end = new Date(deadline);
    const diff = end - now;

    if (diff <= 0) return "Expired";

    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(mins / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h left`;
    if (hours > 0) return `${hours}h ${mins % 60}m left`;

    return `${mins}m left`;
  }

  get formattedDeadline() {
  if (!this.selectedProject?.Bid_Deadline__c) return "";

  return new Date(this.selectedProject.Bid_Deadline__c).toLocaleString(
    "en-IN",
    {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    }
  );
}

  get isDeadlinePassed() {
    if (!this.selectedProject?.Bid_Deadline__c) 
      return false;
    return new Date() > new Date(this.selectedProject.Bid_Deadline__c);
  }

  get selectedTimeLeft() {
    if (!this.selectedProject?.Bid_Deadline__c) 
      return "";
    return this.calculateTimeLeft(this.selectedProject.Bid_Deadline__c);
  }

  // =========================
  // 🔥 ROW ACTION
  // =========================
  handleRowAction(event) {
    const row = event.detail.row;

    if (this.isDeadlineExpired(row) && !this.vendorBids.has(row.Id)) {
        this.showToast("Info", "Bidding is closed for this project", "info");
        return;
    }

    this.selectedProject = row;
    const existingBid = this.vendorBids.get(row.Id);

    if (existingBid) {
      this.isViewMode = true;
      this.existingBid = existingBid;
      this.quotePrice = existingBid.Quote_Price__c;
      this.estimatedDays = existingBid.Estimated_Day__c;
      this.proposalMessage = existingBid.Proposal_Message__c;
    } else {
      this.isViewMode = false;
      this.existingBid = null;
      this.quotePrice = "";
      this.estimatedDays = "";
      this.proposalMessage = "";
    }

    this.showBidModal = true;
  }

  closeBidModal() {
    this.showBidModal = false;
    this.selectedProject = null;
    this.quotePrice = "";
    this.estimatedDays = "";
    this.proposalMessage = "";
    this.isViewMode = false;
    this.existingBid = null;
    this.isEditMode = false;
  }

  // =========================
  // 🔥 INPUT HANDLERS
  // =========================
  handleQuotePriceChange(e) {
    this.quotePrice = e.target.value;
  }

  handleEstimatedDaysChange(e) {
    this.estimatedDays = e.target.value;
  }

  handleProposalMessageChange(e) {
    this.proposalMessage = e.target.value;
  }

  // =========================
  // 🔥 SUBMIT BID
  // =========================
  handleSubmitBid() {
    if (this.isDeadlinePassed) {
      this.showToast("Error", "Deadline passed", "error");
      return;
    }

    const bidData = {
      Project__c: this.selectedProject.Id,
      Vendor__c: this.vendorId,
      Quote_Price__c: parseFloat(this.quotePrice),
      Estimated_Day__c: parseInt(this.estimatedDays),
      Proposal_Message__c: this.proposalMessage,
    };

    submitBid({ bidData })
      .then((res) => {
        if (res === "Success") {
          this.showToast("Success", "Bid submitted", "success");
          this.closeBidModal();
          return getProjects({ vendorId: this.vendorId });
        }
      })
      .then((data) => {
        if (data) this.fetchBidsForProjects(data);
      });
  }

  // =========================
  // 🔥 UPDATE BID
  // =========================
  enableEditMode() {
    this.isEditMode = true;
  }

  handleUpdateBid() {
    if (this.isDeadlinePassed) {
        this.showToast("Error", "Deadline passed", "error");
        return;
    }

    const updatedBid = {
        Id: this.existingBid.Id,
        Quote_Price__c: parseFloat(this.quotePrice),
        Estimated_Day__c: parseInt(this.estimatedDays),
        Proposal_Message__c: this.proposalMessage,
    };

    // ✅ VALIDATION (correct variables)
    if (updatedBid.Quote_Price__c > this.selectedProject.Budget__c) {
        this.showToast("Error", "Quote price cannot exceed project budget", "error");
        return;
    }

    if (!updatedBid.Quote_Price__c || !updatedBid.Estimated_Day__c) {
        this.showToast("Error", "Fill all required fields", "error");
        return;
    }

    updateBid({ bidData: updatedBid })
        .then((res) => {
            if (res === "Success") {
                this.showToast("Success", "Bid updated", "success");
                this.closeBidModal();
                return getProjects({ vendorId: this.vendorId });
            }
        })
        .then((data) => {
            if (data) this.fetchBidsForProjects(data);
        })
        .catch(error => {
            console.error("Update error:", error);
            this.showToast("Error", "Failed to update bid", "error");
        });
      }

  isDeadlineExpired(project) {
    if (!project?.Bid_Deadline__c) return false;
    return new Date(project.Bid_Deadline__c).getTime() <= new Date().getTime();
  }

  // =========================
  // 🔥 WITHDRAW BID
  // =========================
  async handleWithdrawBid() {
    if (this.isDeadlinePassed) {
      this.showToast("Error", "Deadline passed", "error");
      return;
    }

    const confirm = await LightningConfirm.open({
      message: "Withdraw this bid?",
      label: "Confirm",
    });

    if (!confirm) return;

    cancelBid({ bidId: this.existingBid.Id })
      .then((res) => {
        if (res === "Success") {
          this.showToast("Success", "Bid withdrawn", "success");
          this.closeBidModal();
          return getProjects({ vendorId: this.vendorId });
        }
      })
      .then((data) => {
        if (data) this.fetchBidsForProjects(data);
      });
  }

  // =========================
  // 🔥 UI LOGIC
  // =========================

  get isInputDisabled() {
    const expired = this.isDeadlineExpired(this.selectedProject);

    if (expired) 
      return true;

    return this.isViewMode && !this.isEditMode;
  }

  get canEditBid() {
    if (!this.isViewMode || !this.existingBid) 
      return false;
    if (this.bidStatusLabel === "Withdrawn" || this.isWinner) 
      return false;
    if (this.isDeadlineExpired(this.selectedProject)) 
      return false;

    return true;
  }

get canWithdrawBid() {
    if (!this.isViewMode || !this.existingBid) 
      return false;
    if (this.bidStatusLabel === "Withdrawn" || this.isWinner) 
      return false;
    if (this.isDeadlineExpired(this.selectedProject)) 
      return false;

    return true;
}

  get showSubmitButton() {
    if (!this.selectedProject) return false;

    const expired = this.isDeadlineExpired(this.selectedProject);

    // If expired → NO submit allowed
    if (expired) return false;

    return !this.isViewMode;
}

  get modalTitle() {
    return this.isViewMode
      ? `Your Bid for ${this.selectedProject?.Name}`
      : `Submit Bid for ${this.selectedProject?.Name}`;
  }

  get bidStatusLabel() {
    return this.existingBid?.Status__c || "";
  }

  get bidSubmittedDate() {
    return this.existingBid?.Submitted_At__c
      ? new Date(this.existingBid.Submitted_At__c).toLocaleString()
      : "";
  }

  

  get isWinner() {
    return this.existingBid?.Is_Winner__c || false;
  }

  // =========================
  // 🔥 UTILS
  // =========================
  showToast(title, message, variant) {
    Toast.show({ label: title, message, variant });
  }

  goBack() {
    this.dispatchEvent(new CustomEvent("navigate", {
      detail: { page: "dashboard", vendorId: this.vendorId },
      bubbles: true,
      composed: true,
    }));
  }
}