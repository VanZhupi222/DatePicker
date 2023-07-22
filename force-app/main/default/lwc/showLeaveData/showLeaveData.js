import { LightningElement, track, wire } from 'lwc';
import getDateForLeave from '@salesforce/apex/DatePickerController.getDateForLeave';
import showDatepickerModal from 'c/showDatepickerModal';
import currentUser from '@salesforce/user/Id';
import deleteLeaveDate from '@salesforce/apex/DatePickerController.deleteLeaveDate';
import LightningConfirm from 'lightning/confirm';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { subscribe, MessageContext } from 'lightning/messageService';
import For_Leave_Updated_CHANNEL from '@salesforce/messageChannel/For_Leave_Updated__c';

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
        { index: 6, label: 'Applicant' },
        { index: 7, label: 'Operation' }
    ];
    oldRecordId;
    subscription = null;

    // connect with other component through LMS(Lightning Message Service) Channel
    @wire(MessageContext)
    messageContext;
    subscribeToMessageChannel() {
        this.subscription = subscribe(this.messageContext, For_Leave_Updated_CHANNEL, (message) => this.handleMessage(message));
    }
    handleMessage(message) {
        this.lstDateForLeave = message.list;
    }

    // call APEX class to query exist leave date.
    useDateForLeave() {
        getDateForLeave()
            .then((res) => {
                let dateForLeaveList = JSON.parse(JSON.stringify(res));
                let i = 0;
                // iterate list
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
                this.lstDateForLeave = dateForLeaveList;
            })
            .catch((err) => {
                console.log('err3');
                console.log(err);
            });
        //this.refreshRecord();
    }

    handleEditButton(event) {
        const lstIndex = event.target.dataset.id;
        this.oldRecordId = this.lstDateForLeave[lstIndex].Id;
        if (currentUser === this.lstDateForLeave[lstIndex].Applicant_ID__c) {
            showDatepickerModal
                .open({
                    dateNeedToBeUpdated: { oldRecordId: this.oldRecordId }
                })
                .then(() => {})
                .catch((err) => {
                    console.log(err);
                });
        }
    }

    async handleDeleteButton(event) {
        const lstIndex = event.target.dataset.id;
        this.oldRecordId = this.lstDateForLeave[lstIndex].Id;
        if (currentUser === this.lstDateForLeave[lstIndex].Applicant_ID__c) {
            const boolIfConfirmed = await LightningConfirm.open({
                message: 'Please note that you are trying to delete a record, Confirm?',
                variant: 'confirm',
                label: 'Confirming...',
                // setting theme would have no effect
                theme: 'error'
            });
            if (boolIfConfirmed) {
                deleteLeaveDate({ oldRecordId: this.oldRecordId, currentUerId: currentUser })
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
                        this.lstDateForLeave = dateForLeaveList;
                    })
                    .catch((err) => {
                        console.log(err);
                    });
                this.showSuccessfulToast();
            }
        }
    }

    async showSuccessfulToast() {
        const evt = await ShowToastEvent({
            title: 'Deletion Completed',
            message: 'The record has been deleted successfully.',
            variant: 'success'
        });
        this.dispatchEvent(evt);
    }

    connectedCallback() {
        if (!this.lstDateForLeave[0]) {
            this.useDateForLeave();
        }
        this.subscribeToMessageChannel();
    }
}