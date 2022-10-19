import { LightningElement, track } from 'lwc';
import getDateForLeave from '@salesforce/apex/DatepickerDataController.getDateForLeave';

export default class ShowLeaveData extends LightningElement {
    @track
    lstDateForLeave = [];
    @track
    dateForLeaveLabel = [
        { index: 0, label: 'Type' },
        { index: 1, label: 'Start Date' },
        { index: 2, label: 'End Date' },
        { index: 3, label: 'Actual Range' },
        { index: 4, label: 'Workday Range' },
        { index: 5, label: 'Date of Application' },
        { index: 6, label: 'Applicant' }
    ];

    useDateForLeave() {
        getDateForLeave()
            .then((res) => {
                let dateForLeaveList = JSON.parse(JSON.stringify(res));
                this.lstDateForLeave = dateForLeaveList;
            })
            .catch((err) => {
                console.log('err3');
                console.log(err);
            });
    }

    connectedCallback() {
        this.useDateForLeave();
    }
}