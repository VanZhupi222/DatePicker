import { LightningElement, track, wire } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import LightningAlert from 'lightning/alert';
import insertLeaveDate from '@salesforce/apex/DatePickerController.insertLeaveDate';
//import getDateForLeave from '@salesforce/apex/DatePickerController.getDateForLeave';
import getDateForLeaveSpeUser from '@salesforce/apex/DatePickerController.getDateForLeaveSpeUser';
import getIsCheckIn from '@salesforce/apex/AccountCheckinController.getIsCheckIn';
import updateIsCheckIn from '@salesforce/apex/AccountCheckinController.updateIsCheckIn';
import LightningConfirm from 'lightning/confirm';
import showChooseTypeModal from 'c/showChooseTypeModal';
import currentUser from '@salesforce/user/Id';
import { publish, MessageContext } from 'lightning/messageService';
import For_Leave_Updated_CHANNEL from '@salesforce/messageChannel/For_Leave_Updated__c';
import Close_Calendar_Controller_CHANNEL from '@salesforce/messageChannel/Close_Calendar_Controller__c';

export default class ShowAllCalendar extends LightningElement {
    @track
    checkIn = `Check In`;
    @track
    startDate;
    @track
    endDate;
    @track
    actualRange;
    @track
    workdayRange;
    @track
    isValidDate = true;
    isValidLeaveDate = true;
    @wire(MessageContext)
    messageContext;
    @wire(MessageContext)
    messageClose;
    lstDateForLeave;
    needClose = false;
    isCheckIn;

    // get start date from child component
    startDateChangeHandler(evt) {
        this.startDate = evt.detail;
        if (this.startDate && this.endDate) {
            this.checkIfChangeIsValid();
        }
        if (!this.isValidDate) {
            this.showErrorToast();
        }
    }

    // get end date from child component
    endDateChangeHandler(evt) {
        this.endDate = evt.detail;
        if (this.startDate && this.endDate) {
            this.checkIfChangeIsValid();
        }
        if (!this.isValidDate) {
            this.showErrorToast();
        }
    }

    // function to calculate difference between two days
    diff(startDate, endDate) {
        let diffTime = Math.abs(new Date(endDate).getTime() - new Date(startDate).getTime());
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    // check if day2 > day1
    validDate = (startDate, endDate) => {
        return new Date(endDate) >= new Date(startDate);
    };

    // show toast message when it is called
    showErrorToast() {
        const evt = new ShowToastEvent({
            title: 'Input Error',
            message: 'End date must be greater than the Start date',
            variant: 'error'
        });
        this.dispatchEvent(evt);
    }

    // open a window to show difference between start date and end date when the 'Calculate' button is clicked
    async handleCalculateButton() {
        await LightningAlert.open({
            message:
                this.startDate && this.endDate
                    ? 'The date difference between two days is: ' + this.actualRange + ' and The working day difference between two days is: ' + this.workdayRange
                    : 'Please select both date!',
            theme: this.startDate && this.endDate ? 'success' : 'error', // a green theme intended for success states
            label: this.startDate && this.endDate ? 'Answer' : 'Error!' // this is the header text
        });
    }

    async ifCheckIn() {
        await getIsCheckIn({ userId: currentUser }).then((res) => {
            this.isCheckIn = res;
        })
        .catch((err) => {
            console.error(err);
        });
        console.log(`isCheckIn: ${this.isCheckIn}`);
    }

    async handleCheckInButton() {
        const today = new Date();
        this.ifCheckIn();
        if (!this.isCheckIn) {
            this.checkInOut = `Check In`;
            const checkType = this.calculateCheckinType(today);
            const boolIfConfirmed = await LightningConfirm.open({
                message: `Please check the check-in date: ${this.formatDate(today)} and the check-in Type: ${checkType}`,
                variant: `confirm`,
                label: `Confirming...`,
                theme: `warning`
            });
            if (boolIfConfirmed) {
                console.log('112234')
                updateIsCheckIn({ userId: currentUser, CheckInTime: today});
                await LightningAlert.open({
                    message: `Check-In Successfully!`,
                    theme: `success` ,
                    label: `Check-In`
                });
                this.isCheckIn = true;
            }
        }
        else {
            const evt = new ShowToastEvent({
                title: 'Error',
                message: `You have already checked in today`,
                variant: 'error'
            });
            this.dispatchEvent(evt);
        }
    }

    calculateCheckinType(inputDateTime) {
        const TYPE_LATE_ARRIVAL = `Late Arrival`;
        const TYPE_NORMAL = `Normal`; 
        const today = new Date();
        const morningStandardTime = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 9, 0, 0);
        if (morningStandardTime < inputDateTime) {
            return TYPE_LATE_ARRIVAL;
        }
        else return TYPE_NORMAL;
    }

    calculateCheckoutType(inputDateTime) {
        const TYPE_OVERTIME = `Overtime`;
        const TYPE_NORMAL = `Normal`; 
        const today = new Date();
        // const checkinTime = inputDateTime.toLocaleTimeString()
        const eveningStandardTime = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 17, 0, 0);
        if (eveningStandardTime < inputDateTime) {
            return TYPE_OVERTIME;
        }
        else return TYPE_NORMAL;
    }

    // pass param to showCalendar to close input window;
    closeInputWindow() {
        this.needClose = true;
        const payload = {
            toClose: this.needClose
        };
        publish(this.messageClose, Close_Calendar_Controller_CHANNEL, payload);
        this.needClose = false;
    }

    checkIfChangeIsValid() {
        // check if both start date and end date exist
        if (this.validDate(this.startDate, this.endDate) === true) {
            // call diff to calculate
            this.actualRange = this.diff(this.startDate, this.endDate) + 1;
            this.isValidDate = true;
            let intCount = 0;
            // to calculate workday difference
            if (this.actualRange >= 6) {
                intCount += 2 * Math.floor((this.actualRange - 1) / 5);
            } else if (this.actualRange === 4 && this.startDate.getDay() === 5) {
                intCount += 2;
            } else if (this.actualRange === 5 && this.startDate.getDay() === 1) {
                intCount += 2;
            }
            this.workdayRange = this.actualRange - intCount;
        } else {
            this.isValidDate = false;
        }
    }

    checkIfLeaveDateIsValid() {
        let countInvalidCondition = 0;
        if (!this.lstDateForLeave) {
            // call APEX class
            getDateForLeaveSpeUser({ userId: currentUser }).then((res) => {
                let lstDateForLeave = JSON.parse(JSON.stringify(res));
                lstDateForLeave.forEach((element) => {
                    // get all start date in exist list
                    const tmpStartDate = element.Start_Date__c;
                    // get all end date in exist list
                    const tmpEndDate = element.End_Date__c;
                    // generate every start date
                    let dtStartDate = new Date(parseFloat(tmpStartDate.slice(0, 4)), parseFloat(tmpStartDate.slice(5, 7)) - 1, parseFloat(tmpStartDate.slice(8, 10)), 0, 0, 0, 0);
                    // generate every end date
                    let dtEndDate = new Date(parseFloat(tmpEndDate.slice(0, 4)), parseFloat(tmpEndDate.slice(5, 7)) - 1, parseFloat(tmpEndDate.slice(8, 10)), 0, 0, 0, 0);
                    // Check 1. If current user = applicant 2. If so, check if duplicated 3. If duplicated, invalid
                    if ((!(this.endDate < dtStartDate || this.startDate > dtEndDate))) {
                        countInvalidCondition++;
                    }
                    if (countInvalidCondition !== 0) {
                        this.isValidLeaveDate = false;
                    } else if (countInvalidCondition === 0) {
                        this.isValidLeaveDate = true;
                    }
                });
            });
        } else {
            this.lstDateForLeave.forEach((element) => {
                if (element.classIfCurrentUser === 'currentUserClass') {
                    // get all start date in exist list
                    const tmpStartDate = element.Start_Date__c;
                    // get all end date in exist list
                    const tmpEndDate = element.End_Date__c;
                    // get all applicant Id in exist list
                    const tmpApplicant = element.Applicant_ID__c;
                    // generate every start date
                    let dtStartDate = new Date(parseFloat(tmpStartDate.slice(0, 4)), parseFloat(tmpStartDate.slice(5, 7)) - 1, parseFloat(tmpStartDate.slice(8, 10)), 0, 0, 0, 0);
                    // generate every end date
                    let dtEndDate = new Date(parseFloat(tmpEndDate.slice(0, 4)), parseFloat(tmpEndDate.slice(5, 7)) - 1, parseFloat(tmpEndDate.slice(8, 10)), 0, 0, 0, 0);
                    // Check 1. If current user = applicant 2. If so, check if duplicated 3. If duplicated, invalid
                    if (currentUser !== tmpApplicant || !(this.endDate < dtStartDate || this.startDate > dtEndDate)) {
                        countInvalidCondition++;
                    }
                    if (countInvalidCondition !== 0) {
                        this.isValidLeaveDate = false;
                    } else if (countInvalidCondition === 0) {
                        this.isValidLeaveDate = true;
                    }
                }
            });
        }
    }

    renderedCallback() {
        this.checkIfLeaveDateIsValid();
        this.ifCheckIn();
    }

    // toast message if it is called
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
        const dateFormat = new Intl.DateTimeFormat('zh-cn', {
            year: 'numeric',
            month: 'numeric',
            day: 'numeric'
        });
        const [{ value: year }, , { value: month }, , { value: day }] = dateFormat.formatToParts(inputDate);
        let formatDate = `${year}-${month}-${day}`;
        return formatDate;
    }

    async handleConfirmButton() {
        // get formatted start date
        const startDateToBeConfirmed = this.formatDate(this.startDate);
        // get formatted end date
        const endDateToBeConfirmed = this.formatDate(this.endDate);
        if (this.startDate && this.endDate) {
            // open lightning confirm, if confirmed, return true, if cancel, return false
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
                // if confirmed open modal to choose leave type
                showChooseTypeModal
                    .open({
                        optionsToChooseLeaveType: [
                            { id: 1, label: 'For Leave' },
                            { id: 2, label: 'For Business Trip' }
                        ]
                    })
                    .then((result) => {
                        this.checkIfLeaveDateIsValid();
                        if (this.isValidLeaveDate) {
                            // call APEX method to insert leave date
                            insertLeaveDate({ startDate: this.startDate, endDate: this.endDate, typeIndex: result })
                                .then((res) => {
                                    let dateForLeaveList = JSON.parse(JSON.stringify(res));
                                    let i = 0;
                                    dateForLeaveList.forEach((element) => {
                                        element.index = i;
                                        element.operationEdit = 'Edit';
                                        element.operationDelete = 'Delete';
                                        if (element.Applicant_ID__c !== currentUser) {
                                            element.classIfCurrentUser = 'notCurrentUserClass';
                                        } else {
                                            element.classIfCurrentUser = 'currentUserClass';
                                        }
                                        i++;
                                    });
                                    const payload = {
                                        list: dateForLeaveList
                                    };
                                    publish(this.messageContext, For_Leave_Updated_CHANNEL, payload);
                                    this.lstDateForLeave = dateForLeaveList;
                                })
                                .catch((err) => {
                                    console.log(err);
                                });
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