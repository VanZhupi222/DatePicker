import { api, LightningElement, track } from 'lwc';
import getHolidayList from '@salesforce/apex/CNHolidayController.getHolidayList';
import getDisabledDate from '@salesforce/apex/DisabledDateController.getDisabledDate';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

export default class ShowCalendar extends LightningElement {
    @track
    currentMonth = 0;
    @track
    currentYear;
    @track
    outputDays = [];
    @track
    actualTimeZone;
    @track
    showDate;
    @track
    showMonth;
    @track
    holiday;
    @track
    iconLeft = '<<';
    @track
    iconRight = '>>';
    @track
    prevMonthTitle = 'Previous Month';
    @track
    nextMonthTitle = 'Next Month';
    @track
    requiredIcon = '*';
    @track
    dayOfTheWeekCol = [
        { value: 'Sunday', label: 'Sun', index: 0 },
        { value: 'Monday', label: 'Mon', index: 1 },
        { value: 'Tuesday', label: 'Tue', index: 2 },
        { value: 'Wednesday', label: 'Wed', index: 3 },
        { value: 'Thursday', label: 'Thu', index: 4 },
        { value: 'Friday', label: 'Fri', index: 5 },
        { value: 'Saturday', label: 'Sat', index: 6 }
    ];
    holidayYearArray = [];
    holidayMonthArray = [];
    holidayDateArray = [];
    arrHoliday = [];
    holidayLength;
    ready = false; // rendering controller
    endDate;
    startDate;
    disabledFullDateArray = [];
    disabledYearArray = [];
    disabledMonthArray = [];
    disabledDateArray = [];
    disabledDateLength;
    today;
    dateToChose;
    dateTableClass = 'slds-col slds-size_1-of-7 slds-grid slds-grid_vertical slds-align_absolute-center slds-text-heading_small';

    // getter to return start date
    @api
    get dateToStart() {
        return this.startDate;
    }
    set dateToStart(value) {
        this.startDate = value;
    }

    // getter to return end date
    @api
    get dateToEnd() {
        return this.endDate;
    }
    set dateToEnd(value) {
        this.endDate = value;
    }

    // getter to return start date
    @api
    get dateStartOrEnd() {
        if (this.startDate) {
            return 'End Date';
        } else if (this.endDate) {
            return 'Start Date';
        }
        return 'Date Picker';
    }

    //to judge if it is a leap year
    isLeap(year) {
        return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
    }

    // get date number in a specific month
    getDays(year, month) {
        const feb = this.isLeap(year) ? 29 : 28; // if it's leap year, feb = 29, if not, 28
        const daysPerMonth = [31, feb, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
        return daysPerMonth[month];
    }

    // set month name
    monthName = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    //get date amount in next/last month
    getNextMonthOrLastMonthDays(year, month, type) {
        if (type === 'last') {
            const lastMonth = month === 0 ? 11 : month - 1;
            const lastYear = lastMonth === 11 ? year - 1 : year;
            return {
                year: lastYear,
                month: lastMonth,
                days: this.getDays(lastYear, lastMonth)
            };
        }

        const nextMonth = month === 11 ? 0 : month + 1;
        const nextYear = nextMonth === 0 ? year + 1 : year;

        return {
            year: nextYear,
            month: nextMonth,
            days: this.getDays(nextYear, nextMonth)
        };
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
    
    // key function, generate the calendar
    generateCalendar() {
        // date number in current month
        const currentMonthDays = this.getDays(this.currentYear, this.currentMonth);
        // get tail of last month and head of next month to fill in the blank of the calendar
        const { year: lastMonthYear, month: lastMonth, days: lastMonthDays } = this.getNextMonthOrLastMonthDays(this.currentYear, this.currentMonth, 'last');
        const { year: nextMonthYear, month: nextMonth } = this.getNextMonthOrLastMonthDays(this.currentYear, this.currentMonth, 'next');

        // what week day is the first date.
        const weekIndex = this.getWeekIndex(this.currentYear, this.currentMonth);

        // illustrate calendar
        let calendarTable = [];
        // current month date counter
        let count = 0;
        // next month date counter
        let countN = 0;
        // previous month date counter
        let countP = lastMonthDays - weekIndex;
        // current month start column controller
        let k = 0;
        // disabled date controller
        let disabled;
        // isEndDate conditional rendering
        let isEndDate;
        // row number controller
        for (let i = 0; i < 6; i++) {
            let itemList = [];
            if (i === 0) {
                for (k = 1; k <= weekIndex; k++) {
                    // create previous month date
                    countP++;
                    // create date of the day
                    let prevDate = new Date(lastMonthYear, lastMonth, countP, 0, 0, 0, 0);
                    // to check if the day is today, if true change background color to 1,
                    // if false change font color to 2
                    let classChange = this.dayDiff(prevDate, new Date()) === 0 ? 'classToday' : 'classPreviousMonth';
                    //let style = this.dayDiff(prevDate, new Date()) === 0 ? 'background-color: rgb(0, 255, 229)' : 'color: #909699';
                    if (this.dateToChose) {
                        classChange = this.dayDiff(prevDate, this.dateToChose) === 0 ? 'classDateToBeSelected' : this.dayDiff(prevDate, new Date()) === 0 ? 'classToday' : 'classPreviousMonth';
                        // style =
                        //     this.dayDiff(prevDate, this.dateToChose) === 0
                        //         ? 'background-color: #f0fbff'
                        //         : this.dayDiff(prevDate, new Date()) === 0
                        //         ? 'background-color: rgb(0, 255, 229)'
                        //         : 'color: #909699';
                    }
                    let holidayName = this.dayDiff(prevDate, new Date()) === 0 ? 'today' : '';
                    // to check if the day is holiday, if true change font color to red
                    for (let x = 0; x < this.holidayLength; x++) {
                        if (this.currentYear === this.getHolidayYear()[x] && countP === this.getHolidayDate()[x] && lastMonth === this.getHolidayMonth()[x]) {
                            classChange = 'classHoliday';
                            //style = 'color: red';
                            holidayName = this.holiday[x].holiday_cn;
                            break;
                        }
                    }
                    // If this.endDate exist, date after endDate become grey(in Start Date table).
                    if (this.endDate) {
                        classChange = this.day2GreaterThan1(prevDate, this.endDate) ? classChange : 'classDisabledDate';
                        //style = this.day2GreaterThan1(prevDate, this.endDate) ? style : 'background-color: #909699';
                        disabled = this.day2GreaterThan1(prevDate, this.endDate) ? false : true;
                    }

                    // If this.startDate exist, date before startDate become grey(in End Date table).
                    if (this.startDate) {
                        classChange = this.day2GreaterThan1(this.startDate, prevDate) ? classChange : 'classDisabledDate';
                        //style = this.day2GreaterThan1(this.startDate, prevDate) ? style : 'background-color: #909699';
                        disabled = this.day2GreaterThan1(this.startDate, prevDate) ? false : true;
                    }

                    // Set date to be disabled by custom settings from APEX
                    for (let x = 0; x < this.disabledDateLength; x++) {
                        if (this.currentYear === this.disabledYearArray[x] && countP === this.disabledDateArray[x] && lastMonth === this.disabledMonthArray[x]) {
                            classChange = 'classDisabledDate';
                            //style = 'background-color: #909699;border-radius: 0px';
                            break;
                        }
                    }

                    if (prevDate.getDay() === 0 || prevDate.getDay() === 6) {
                        classChange += 'ClassWeekend';
                    }

                    // push properties into itemList
                    itemList.push({
                        value: countP + '',
                        type: '',
                        label: countP + '',
                        index: countP + '',
                        status: 'prevMonth',
                        //style: style,
                        holidayName: holidayName,
                        dateString: prevDate.toString(),
                        disabled: disabled,
                        classChange: this.dateTableClass + ' ' + classChange
                    });
                }
                k--;
            } else {
                k = 0;
            }
            // from k'th column to print whole calendar
            for (let j = 0; j < 7 - k; j++) {
                count++;
                let nextDate = new Date(nextMonthYear, nextMonth, countN + 1, 0, 0, 0, 0);
                // to check if the day is today, if true change background color to 1,
                // if false change font color to 2
                let classChange = this.dayDiff(nextDate, new Date()) === 0 ? 'classToday' : 'classNextMonth';
                //let style = this.dayDiff(nextDate, new Date()) === 0 ? 'background-color: rgb(0, 255, 229)' : 'color: #909699';
                // If a date is selected, first check if the day is selected,
                // then check if the day is today;
                if (this.dateToChose) {
                    classChange = this.dayDiff(nextDate, this.dateToChose) === 0 ? 'classDateToBeSelected' : this.dayDiff(nextDate, new Date()) === 0 ? 'classToday' : 'classNextMonth';
                    // style =
                    //     this.dayDiff(nextDate, this.dateToChose) === 0
                    //         ? 'background-color: #f0fbff'
                    //         : this.dayDiff(nextDate, new Date()) === 0
                    //         ? 'background-color: rgb(0, 255, 229)'
                    //         : 'color: #909699';
                }
                // set title of the day
                let holidayName = this.dayDiff(nextDate, new Date()) === 0 ? 'today' : '';
                // traverse the holidayArray to check if the day is holiday,
                // if so change color to red;
                for (let x = 0; x < this.holidayLength; x++) {
                    if (this.currentYear === this.getHolidayYear()[x] && countN + 1 === this.getHolidayDate()[x] && nextMonth === this.getHolidayMonth()[x]) {
                        classChange = 'classHoliday';
                        //style = 'color: red';
                        holidayName = this.holiday[x].holiday_cn;
                        break;
                    }
                }
                // If this.endDate exist, date after endDate become grey(in Start Date table).
                if (this.endDate) {
                    classChange = this.day2GreaterThan1(nextDate, this.endDate) ? classChange : 'classDisabledDate';
                    //style = this.day2GreaterThan1(nextDate, this.endDate) ? style : 'background-color: #909699';
                    disabled = this.day2GreaterThan1(nextDate, this.endDate) ? false : true;
                }
                // If this.startDate exist, date before startDate become grey(in End Date table).
                if (this.startDate) {
                    classChange = this.day2GreaterThan1(this.startDate, nextDate) ? classChange : 'classDisabledDate';
                    //style = this.day2GreaterThan1(this.startDate, nextDate) ? style : 'background-color: #909699';
                    disabled = this.day2GreaterThan1(this.startDate, nextDate) ? false : true;
                }
                // Set date to be disabled by custom settings from APEX
                for (let x = 0; x < this.disabledDateLength; x++) {
                    if (this.currentYear === this.disabledYearArray[x] && countN + 1 === this.disabledDateArray[x] && nextMonth === this.disabledMonthArray[x]) {
                        classChange = 'classDisabledDate';
                        // style = 'background-color: #909699;border-radius: 0px';
                        break;
                    }
                }

                if (nextDate.getDay() === 0 || nextDate.getDay() === 6) {
                    classChange += 'ClassWeekend';
                }

                // next month
                if (count > currentMonthDays) {
                    countN++;
                    // push properties into itemList
                    itemList.push({
                        value: countN + '',
                        type: '',
                        label: countN + '',
                        index: countN + '',
                        status: 'nextMonth',
                        //style: style,
                        holidayName: holidayName,
                        dateString: nextDate.toString(),
                        disabled: disabled,
                        classChange: this.dateTableClass + ' ' + classChange
                    });
                }
                // current month
                else {
                    // create date of the day
                    let date = new Date(this.currentYear, this.currentMonth, count, 0, 0, 0, 0);
                    // to check if the day is today, if true change background color to 1,
                    // if false change font color to 2
                    classChange = this.dayDiff(nextDate, new Date()) === 0 ? 'classToday' : 'classCurrentMonth';
                    //style = this.dayDiff(date, new Date()) === 0 ? 'background-color: rgb(0, 255, 229)' : '';
                    // If a date is selected, first check if the day is selected,
                    // then check if the day is today;
                    if (this.dateToChose) {
                        classChange = this.dayDiff(date, this.dateToChose) === 0 ? 'classDateToBeSelected' : this.dayDiff(date, new Date()) === 0 ? 'classToday' : 'classCurrentMonth';
                        //style = this.dayDiff(date, this.dateToChose) === 0 ? 'background-color: #f0fbff' : this.dayDiff(date, new Date()) === 0 ? 'background-color: rgb(0, 255, 229)' : '';
                    }
                    // set title of the day
                    holidayName = this.dayDiff(date, new Date()) === 0 ? 'today' : '';
                    // traverse the holidayArray to check if the day is holiday,
                    // if so change color to red;
                    for (let x = 0; x < this.holidayLength; x++) {
                        if (this.currentYear === this.getHolidayYear()[x] && count === this.getHolidayDate()[x] && this.currentMonth === this.getHolidayMonth()[x]) {
                            classChange = 'classHoliday';
                            //style = 'color: red';
                            holidayName = this.holiday[x].holiday_cn;
                            break;
                        }
                    }
                    // If this.endDate exist, date after endDate become grey(in Start Date table).
                    if (this.endDate) {
                        classChange = this.day2GreaterThan1(date, this.endDate) ? classChange : 'classDisabledDate';
                        //style = this.day2GreaterThan1(date, this.endDate) ? style : 'background-color: #909699';
                        disabled = this.day2GreaterThan1(date, this.endDate) ? false : true;
                    }
                    // If this.startDate exist, date before startDate become grey(in End Date table).
                    if (this.startDate) {
                        classChange = this.day2GreaterThan1(this.startDate, date) ? classChange : 'classDisabledDate';
                        //style = this.day2GreaterThan1(this.startDate, date) ? style : 'background-color: #909699';
                        disabled = this.day2GreaterThan1(this.startDate, date) ? false : true;
                    }
                    // Set date to be disabled by custom settings from APEX
                    for (let x = 0; x < this.disabledDateLength; x++) {
                        if (this.currentYear === this.disabledYearArray[x] && count === this.disabledDateArray[x] && this.currentMonth === this.disabledMonthArray[x]) {
                            classChange = 'classDisabledDate';
                            //style = 'background-color: #909699;border-radius: 0px;';
                            break;
                        }
                    }

                    if (date.getDay() === 0 || date.getDay() === 6) {
                        classChange += 'ClassWeekend';
                    }

                    // push properties into itemList
                    itemList.push({
                        value: count + '',
                        type: '',
                        label: count + '',
                        index: count,
                        status: 'currentMonth',
                        //style: style,
                        holidayName: holidayName,
                        dateString: date.toString(),
                        disabled: disabled,
                        classChange: this.dateTableClass + ' ' + classChange
                    });
                }
            }
            if (this.startDate) {
                isEndDate = true;
            } else if (this.endDate) {
                isEndDate = false;
            }
            calendarTable.push({
                items: itemList,
                weekStart: itemList[0].dateString,
                weekIndex: i,
                events: [],
                isEndDate: isEndDate
            });
        }
        // set show month
        let monthIndex = this.currentMonth;
        this.showMonth = this.monthName[monthIndex];
        this.outputDays = calendarTable;
    }

    // create an add-day function
    addDays = (date, daysToAdd) => {
        const d = new Date(Number(date));
        d.setDate(date.getDate() + daysToAdd);
        return d;
    };

    // create an add-month function
    addMonth = (date, monthToAdd) => {
        const d = new Date(Number(date));
        d.setMonth(date.getMonth() + monthToAdd);
        return d;
    };

    refreshCalendar() {
        this.outputDays = [];
        this.useHolidayList();
        this.generateCalendar();
    }

    // handle click previous month
    clickPreviousButton() {
        this.currentMonth--;
        if (this.currentMonth < 0) {
            this.currentYear--;
            this.currentMonth = 11;
            this.ready = false;
        }
        this.refreshCalendar();
    }

    // handle click today button
    todayClickHandler() {
        this.ready = false;
        this.setBasicDate();
        this.refreshCalendar();
        this.showDate = this.formatDate(this.today);
    }

    // handle click next month
    clickNextButton() {
        this.currentMonth++;
        if (this.currentMonth > 11) {
            this.currentYear++;
            this.currentMonth = 0;
            this.ready = false;
        }
        this.refreshCalendar();
    }

    // set all basic data
    setBasicDate() {
        this.today = new Date();
        this.currentYear = this.today.getFullYear();
        this.currentMonth = this.today.getMonth();
        this.dayNow = this.today.getDate();
        this.yearOrigin = this.currentYear;
        this.monthOrigin = this.currentMonth;
        this.dayOrigin = this.dayNow;
        this.actualTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    }

    getWeekIndex(year, month) {
        let tmpDate = new Date(year, month, 1);
        return tmpDate.getDay();
    }

    // calculate difference between two days
    dayDiff(d1, d2) {
        const endDate = Date.UTC(d2.getFullYear(), d2.getMonth(), d2.getDate()),
            startDate = Date.UTC(d1.getFullYear(), d1.getMonth(), d1.getDate());
        return (endDate - startDate) / 86400000;
    }

    // return a boolean to judge if d2 is greater than d1
    day2GreaterThan1(d1, d2) {
        return new Date(d2) >= new Date(d1);
    }

    // click input and display the datepicker
    inputClickHandler() {
        this.refreshCalendar();
        this.template.querySelector('[name="datePicker"]').style.display = '';
    }

    // show date when clicking the calendar grid
    datePickHandler(evt) {
        let tmpDate = new Date(evt.currentTarget.dataset.datestring);
        this.dateToChose = tmpDate;
        // if this.endDate exist, set input box some words(Start Date table)
        if (this.endDate) {
            this.showDate = this.day2GreaterThan1(tmpDate, this.endDate) ? this.formatDate(tmpDate) : 'Please select a new date';
        }
        // set showDate in input box(Start Date table)
        else {
            this.showDate = this.formatDate(tmpDate);
        }
        // if this.startDate exist, set input box some words(End Date table)
        if (this.startDate) {
            this.showDate = this.day2GreaterThan1(this.startDate, tmpDate) ? this.formatDate(tmpDate) : 'Please select a new date';
        }
        // set showDate in input box(Start Date table)
        else {
            this.showDate = this.formatDate(tmpDate);
        }
        // ***connect with parent component***
        // set an start-date event to parent component
        this.dispatchEvent(
            new CustomEvent('showstartdate', {
                detail: tmpDate,
                name: 'startDate'
            })
        );
        // set an end-date event to parent component
        this.dispatchEvent(
            new CustomEvent('showenddate', {
                detail: tmpDate,
                name: 'endDate'
            })
        );
        // traverse the disabledFullDateArray to check if the selected day is disabled
        // if so, pop-up a toast error
        for (let i = 0; i < this.disabledDateLength; i++) {
            if (this.dayDiff(tmpDate, this.disabledFullDateArray[i]) === 0) {
                this.showErrorToast();
                this.showDate = 'Please select a new date';
            }
        }
        // traverse the arrHoliday to check if the selected day is holiday
        // if so, pop-up a toast error
        for (let i = 0; i < this.holidayLength; i++) {
            if (this.dayDiff(tmpDate, this.arrHoliday[i]) === 0) {
                this.showErrorToast();
                this.showDate = 'Please select a new date';
            }
        }
        // check if target date is weekend, if so, pop-up a toast error
        if (tmpDate.getDay() === 0 || tmpDate.getDay() === 6){
            this.showErrorToast();
            this.showDate = 'Please select a new date';
        }
        // close the calendar table
        this.template.querySelector('[name="datePicker"]').style.display = 'none';
    }

    // refresh currentYear when select element from drop down year window
    selectorChangeHandler(evt) {
        let tmpYear = evt.target.value;
        this.currentYear = parseFloat(tmpYear);
        this.refreshCalendar();
    }

    // handle reset button
    handleResetClick() {
        this.showDate = null;
        this.endDate = null;
        this.startDate = null;
        // ***connect with parent component***
        this.dispatchEvent(
            new CustomEvent('showstartdate', {
                detail: this.startDate,
                name: 'startDate'
            })
        );
        this.dispatchEvent(
            new CustomEvent('showenddate', {
                detail: this.endDate,
                name: 'endDate'
            })
        );
        this.setBasicDate();
        this.template.querySelector('[name="datePicker"]').style.display = 'none';
    }

    // getter to get options in drop down year window
    get options() {
        let lstOption = [];
        for (let i = this.today.getFullYear() - 100; i < this.today.getFullYear() + 50; i++) {
            if (i === this.currentYear) {
                lstOption.push({ label: i, value: i, selected: true });
            } else {
                lstOption.push({ label: i, value: i, selected: false });
            }
        }
        return lstOption;
    }

    // put holiday year in an array
    getHolidayYear() {
        for (let i = 0; i < this.holidayLength; i++) {
            this.holidayYearArray[i] = this.holiday[i].holidayYear;
        }
        return this.holidayYearArray;
    }

    // put holiday month in an array
    getHolidayMonth() {
        for (let i = 0; i < this.holidayLength; i++) {
            this.holidayMonthArray[i] = this.holiday[i].holidayMonth - 1;
        }
        return this.holidayMonthArray;
    }

    // put holiday date in an array
    getHolidayDate() {
        for (let i = 0; i < this.holidayLength; i++) {
            this.holidayDateArray[i] = this.holiday[i].holidayDate;
        }
        return this.holidayDateArray;
    }

    // call APEX class to get holidays
    useHolidayList() {
        getHolidayList({ strYear: this.currentYear + '' })
            .then((res) => {
                let holidayList = JSON.parse(JSON.stringify(res)).list;
                this.holidayLength = holidayList.length;
                holidayList.forEach((element) => {
                    element.holidayYear = parseFloat(element.dateT.toString().slice(0, 4));
                    element.holidayMonth = parseFloat(element.dateT.toString().slice(4, 6));
                    element.holidayDate = parseFloat(element.dateT.toString().slice(-2));
                    let holidayDay = new Date(element.holidayYear, element.holidayMonth - 1, element.holidayDate, 0, 0, 0, 0);
                    this.arrHoliday.push(holidayDay);
                });
                this.holiday = holidayList;
            })
            .catch((err) => {
                console.log('err1');
                console.log(err);
            });
    }

    useDisabledDateList() {
        getDisabledDate()
            .then((res) => {
                let disabledDateList = JSON.parse(JSON.stringify(res));
                disabledDateList.forEach((element) => {
                    // get disabled date data
                    let disabledStartYear = element.Start_Date__c.slice(0, 4);
                    let disabledStartMonth = element.Start_Date__c.slice(5, 7) - 1;
                    let disabledStartDay = element.Start_Date__c.slice(8, 10);
                    let disabledEndYear = element.End_Date__c.slice(0, 4);
                    let disabledEndMonth = element.End_Date__c.slice(5, 7) - 1;
                    let disabledEndDay = element.End_Date__c.slice(8, 10);
                    // set disabled date
                    let disabledStartDate = new Date(disabledStartYear, disabledStartMonth, disabledStartDay, 0, 0, 0, 0);
                    let disabledEndDate = new Date(disabledEndYear, disabledEndMonth, disabledEndDay, 0, 0, 0, 0);
                    // to judge if input is correct, if so, return right answer, if not, return the other one.
                    element.disabledStartDate = disabledStartDate <= disabledEndDate ? disabledStartDate : disabledEndDate;
                    element.disabledEndDate = disabledEndDate >= disabledStartDate ? disabledEndDate : disabledStartDate;
                    // set loop controller
                    let disabledDayDiff = this.dayDiff(element.disabledStartDate, element.disabledEndDate);
                    if (element.disabledStartDate < element.disabledEndDate) {
                        // push disabled dates into specific array
                        for (let i = 0; i <= disabledDayDiff; i++) {
                            this.disabledFullDateArray.push(this.addDays(element.disabledStartDate, i));
                            this.disabledYearArray.push(this.addDays(element.disabledStartDate, i).getFullYear());
                            this.disabledMonthArray.push(this.addDays(element.disabledStartDate, i).getMonth());
                            this.disabledDateArray.push(this.addDays(element.disabledStartDate, i).getDate());
                        }
                    } else {
                        // disabledStartDate = disabledEndDate
                        this.disabledFullDateArray.push(element.disabledStartDate);
                        this.disabledYearArray.push(element.disabledStartDate.getFullYear());
                        this.disabledMonthArray.push(element.disabledStartDate.getMonth());
                        this.disabledDateArray.push(element.disabledStartDate.getDate());
                    }
                });
                this.disabledDateLength = this.disabledFullDateArray.length;
            })
            .catch((err) => {
                console.log('err2');
                console.log(err);
            });
    }

    // error toast method
    showErrorToast() {
        const evt = new ShowToastEvent({
            title: 'Input Error',
            message: 'This date cannot be selected',
            variant: 'error'
        });
        this.dispatchEvent(evt);
    }

    renderedCallback() {
        // ready is rendering controller
        if (!this.ready) {
            const yearSelector = this.template.querySelector('[name="yearSelector"]');
            yearSelector.selectedIndex = [...yearSelector.options].findIndex((option) => option.value === this.currentYear + '');
        }
        this.ready = true;
    }

    connectedCallback() {
        this.setBasicDate();
        this.useHolidayList();
        this.showDate = this.showDate ? this.showDate : null;
        this.generateCalendar();
        this.useDisabledDateList();
    }
}