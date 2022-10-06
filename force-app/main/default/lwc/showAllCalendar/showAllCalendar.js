import { LightningElement, track } from "lwc";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import LightningAlert from "lightning/alert";
export default class ShowAllCalendar extends LightningElement {
  @track
  startDate;
  @track
  endDate;
  @track
  range;
  @track
  isValidDate = true;

  startDateChangeHandler(evt) {
    this.startDate = evt.detail;
    if (this.startDate && this.endDate) {
      this.checkIfChangeIsValid();
    }
    if (!this.isValidDate) {
      this.showErrorToast();
    }
  }

  endDateChangeHandler(evt) {
    this.endDate = evt.detail;
    if (this.startDate && this.endDate) {
      this.checkIfChangeIsValid();
    }
    if (!this.isValidDate) {
      this.showErrorToast();
    }
  }

  diff(startDate, endDate) {
    let diffTime = Math.abs(
      new Date(endDate).getTime() - new Date(startDate).getTime()
    );
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  validDate = (startDate, endDate) => {
    return new Date(endDate) >= new Date(startDate);
  };

  showErrorToast() {
    const evt = new ShowToastEvent({
      title: "Input Error",
      message: "End date must be greater than the Start date",
      variant: "error"
    });
    this.dispatchEvent(evt);
  }

  async handleAlertClick() {
    await LightningAlert.open({
      message:
        this.startDate && this.endDate
          ? "The date difference of two days is: " + this.range
          : "Please select both date!",
      theme: this.startDate && this.endDate ? "success" : "error", // a green theme intended for success states
      label: this.startDate && this.endDate ? "Answer" : "Error!" // this is the header text
    });
  }

  checkIfChangeIsValid() {
    if (this.validDate(this.startDate, this.endDate) === true) {
      this.range = this.diff(this.startDate, this.endDate);
      this.isValidDate = true;
    } else {
      this.isValidDate = false;
    }
  }
}
