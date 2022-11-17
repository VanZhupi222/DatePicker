import { api } from 'lwc';
import LightningModal from 'lightning/modal';

export default class ShowChooseTypeModal extends LightningModal {

    @api
    optionsToChooseLeaveType = [];

    handleOptionChoose(e) {
        const { target } = e;
        const { id } = target.dataset;
        this.close(id);
    }
}