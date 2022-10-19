import { LightningElement, track } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import LightningAlert from 'lightning/alert';
import insertLeaveDate from '@salesforce/apex/DatePickerController.insertLeaveDate';
import getDateForLeave from '@salesforce/apex/DatepickerDataController.getDateForLeave';
import LightningConfirm from 'lightning/confirm';
import showChooseTypeModal from 'c/showChooseTypeModal';
export default class ShowAllCalendar extends LightningElement {
    @track
    startDate;
    @track
    endDate;
    @track
    range;
    @track
    isValidDate = true;
    isValidLeaveDate = true;   

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
        let diffTime = Math.abs(new Date(endDate).getTime() - new Date(startDate).getTime());
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    validDate = (startDate, endDate) => {
        return new Date(endDate) >= new Date(startDate);
    };

    showErrorToast() {
        const evt = new ShowToastEvent({
            title: 'Input Error',
            message: 'End date must be greater than the Start date',
            variant: 'error'
        });
        this.dispatchEvent(evt);
    }

    async handleAlertClick() {
        await LightningAlert.open({
            message: this.startDate && this.endDate ? 'The date difference of two days is: ' + this.range : 'Please select both date!',
            theme: this.startDate && this.endDate ? 'success' : 'error', // a green theme intended for success states
            label: this.startDate && this.endDate ? 'Answer' : 'Error!' // this is the header text
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

    checkIfLeaveDateIsValid() {
        getDateForLeave().then((res) => {
            let lstDateForLeave = JSON.parse(JSON.stringify(res));
            lstDateForLeave.forEach((element) => {
                const tmpStartDate = element.Start_Date__c;
                const tmpEndDate = element.End_Date__c;
                let dtStartDate = new Date(parseFloat(tmpStartDate.slice(0, 4)), parseFloat(tmpStartDate.slice(5, 7)) - 1, parseFloat(tmpStartDate.slice(8, 10)), 0, 0, 0, 0);
                let dtEndDate = new Date(parseFloat(tmpEndDate.slice(0, 4)), parseFloat(tmpEndDate.slice(5, 7)) - 1, parseFloat(tmpEndDate.slice(8, 10)), 0, 0, 0, 0);
                if (!((dtStartDate < this.startDate && dtEndDate < this.startDate) || (dtStartDate > this.endDate && dtEndDate > this.endDate))) {
                    this.isValidLeaveDate = false;
                }else{
                    this.isValidLeaveDate = true;
                }
            });
        });
        return this.isValidLeaveDate;
    }

    showLeaveInvalidToast() {
        const evt = new ShowToastEvent({
            title: 'Input Error',
            message: 'The selected date range must not duplicate the date selected before!',
            variant: 'error'
        });
        this.dispatchEvent(evt);
    }

    // date formatter
    formatDate(inputDate) {
        const dateFormat = new Intl.DateTimeFormat({
            year: 'numeric',
            month: 'numeric',
            date: 'numeric'
        });
        const [{ value: month }, , { value: date }, , { value: year }] = dateFormat.formatToParts(inputDate);
        let formatDate = `${year}-${month}-${date}`;
        return formatDate;
    }

    async handleConfirmButton() {
        const startDateToBeConfirmed = this.formatDate(this.startDate);
        const endDateToBeConfirmed = this.formatDate(this.endDate);
        if (this.startDate && this.endDate) {
            const boolIfConfirmed = await LightningConfirm.open({
                message: 'Please check the start date: ' + startDateToBeConfirmed + ' and the end date: ' + endDateToBeConfirmed,
                variant: 'confirm',
                label: 'Confirming...',
                // setting theme would have no effect
                theme: 'warning'
            });
            //Confirm has been closed
            //result is true if OK was clicked
            if (boolIfConfirmed) {
                showChooseTypeModal
                    .open({
                        optionsToChooseLeaveType: [
                            { id: 1, label: 'For Leave' },
                            { id: 2, label: 'For Business Trip' }
                        ]
                    })
                    .then((result) => {
                        if (this.checkIfLeaveDateIsValid()) {
                            insertLeaveDate({ startDate: this.startDate, endDate: this.endDate, typeIndex: result });
                        } else {
                            this.showLeaveInvalidToast();
                        }
                    })
                    .catch((err) => {
                        console.log(err);
                    });
            }
        } else {
            await LightningAlert.open({
                message: 'Please select both dates!',
                theme: 'error',
                label: 'Error!' // this is the header text
            });
        }
        //and false if cancel was clicked
    }
}