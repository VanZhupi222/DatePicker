import { LightningElement, track } from "lwc";

export default class RangeSelector extends LightningElement {
  today = new Date();
  @track startDate;
  @track endDate;
  @track range;
  //@track disabledDate;
  connectedCallback() {
    // choose date and set the default value
    this.startDate = this.startDate
      ? this.startDate
      : this.today.toJSON().slice(0, 10);
    this.endDate = this.endDate
      ? this.endDate
      : this.addDays(this.today, 1).toJSON().slice(0, 10);
  }

  // create an add-day function
  addDays = (sd, days) => {
    const d = new Date(Number(sd));
    d.setDate(sd.getDate() + days);
    return d;
  };

  // range calculation
  diff = (startDate, endDate) => {
    let diffTime = Math.abs(
      new Date(endDate).getTime() - new Date(startDate).getTime()
    );
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // return a boolean type to test if the value is valid
  validDate = (startDate, endDate) => {
    return new Date(endDate) >= new Date(startDate);
  };

  // validDate2 = (startDate, endDate) => {
  //   let ed = new Date(endDate);
  //   let sd = new Date(startDate);
  //   let test = sd.getDay();
  //   console.log(test);
  //   return !(sd.getDay() === 0 || ed.getDay() === 0);
  // };

  // event handler
  handleDateChange = (event) => {
    let fieldName = event.target.name;

    if (fieldName === "startDate") this.startDate = event.target.value;
    if (fieldName === "endDate") this.endDate = event.target.value;

    if (this.validDate(this.startDate, this.endDate) === true) {
      this.range = this.diff(this.startDate, this.endDate);
      let inputField = this.template.querySelector("." + fieldName);
      inputField.setCustomValidity("");
      inputField.reportValidity();
    } else {
      let inputField = this.template.querySelector("." + fieldName);
      inputField.setCustomValidity(
        "End date must be greater than the Start date"
      );
      inputField.reportValidity();
    }
  };

  handleResetAll() {
    this.template.querySelectorAll("lightning-input").forEach((element) => {
      if (element.type === "checkbox" || element.type === "checkbox-button") {
        element.checked = false;
      } else {
        element.value = null;
        // this.disabledDate = false;
      }
    });
  }

  get disabledDate() {
    let sd = new Date(this.startDate);
    let ed = new Date(this.endDate);
    return (
      sd.getDay() === 0 ||
      sd.getDay() === 6 ||
      ed.getDay() === 0 ||
      ed.getDay() === 6
    );
  }
}
