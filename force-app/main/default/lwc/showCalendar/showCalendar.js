import { api, LightningElement, track } from "lwc";
import getHolidayList from "@salesforce/apex/CNHolidayController.getHolidayList";
import getDisabledDate from "@salesforce/apex/DisabledDateController.getDisabledDate";

export default class ShowCalendar extends LightningElement {
  @track
  columns = [
    {
      label: "SUN",
      fieldName: "sun"
    },
    {
      label: "MON",
      fieldName: "mon"
    },
    {
      label: "TUE",
      fieldName: "tue"
    },
    {
      label: "WED",
      fieldName: "wed"
    },
    {
      label: "THU",
      fieldName: "thu"
    },
    {
      label: "FRI",
      fieldName: "fri"
    },
    {
      label: "SAT",
      fieldName: "sat"
    }
  ];
  @track
  currentMonth = 0;
  monthLabel = [
    {
      value: 0,
      label: "January"
    },
    {
      value: 1,
      label: "February"
    },
    {
      value: 2,
      label: "March"
    },
    {
      value: 3,
      label: "April"
    },
    {
      value: 4,
      label: "May"
    },
    {
      value: 5,
      label: "June"
    },
    {
      value: 6,
      label: "July"
    },
    {
      value: 7,
      label: "August"
    },
    {
      value: 8,
      label: "September"
    },
    {
      value: 9,
      label: "October"
    },
    {
      value: 10,
      label: "November"
    },
    {
      value: 11,
      label: "December"
    }
  ];
  @track
  currentYear;
  @track
  today;
  @track
  outputDays = [];
  @track
  actualTimeZone;
  @track
  showDate;
  dateToChose;
  @track
  showMonth;
  @track
  optionsYear;
  @track
  holiday;
  @track
  disabledDate;
  holidayYearArray = [];
  holidayMonthArray = [];
  holidayDateArray = [];
  holidayLength;
  ready = false; // rendering controller
  endDate;
  startDate;
  disabledFullDateArray = [];
  disabledYearArray = [];
  disabledMonthArray = [];
  disabledDateArray = [];
  @api
  get dateToStart() {
    return this.startDate;
  }
  set dateToStart(value) {
    this.startDate = value;
  }

  @api
  get dateToEnd() {
    return this.endDate;
  }
  set dateToEnd(value) {
    this.endDate = value;
  }

  @api
  get dateStartOrEnd() {
    if (this.startDate) {
      return "End Date";
    }
    return "Start Date";
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
  monthName = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December"
  ];

  //get date amount in next/last month
  getNextMonthOrLastMonthDays(year, month, type) {
    //const month = new Date(date).getMonth();
    //const year = new Date(date).getFullYear();
    if (type === "last") {
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

  // key function, generate the calendar
  generateCalendar() {
    // date number in current month
    const currentMonthDays = this.getDays(this.currentYear, this.currentMonth);
    // get tail in last month and head in next month to fill in the blank of the calendar
    const {
      year: lastMonthYear,
      month: lastMonth,
      days: lastMonthDays
    } = this.getNextMonthOrLastMonthDays(
      this.currentYear,
      this.currentMonth,
      "last"
    );
    const { year: nextMonthYear, month: nextMonth } =
      this.getNextMonthOrLastMonthDays(
        this.currentYear,
        this.currentMonth,
        "next"
      );

    // what week day is the first date.
    const weekIndex = this.getWeekIndex(this.currentYear, this.currentMonth);

    // illustrate calendar
    let calendarTable = [];
    // current month date controller
    let count = 0;
    // next month date controller
    let countN = 0;
    // previous month date controller
    let countP = lastMonthDays - weekIndex;
    let k = 0;
    let disabled;
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
          let style =
            this.dayDiff(prevDate, new Date()) === 0
              ? "background-color: rgb(0, 255, 229)"
              : "color: #909699";
          if (this.dateToChose) {
            style =
              this.dayDiff(prevDate, this.dateToChose) === 0
                ? "background-color: #f0fbff"
                : this.dayDiff(prevDate, new Date()) === 0
                ? "background-color: rgb(0, 255, 229)"
                : "color: #909699";
          }
          let holidayName =
            this.dayDiff(prevDate, new Date()) === 0 ? "today" : "";
          // to check if the day is holiday, if true change font color to red
          for (let x = 0; x < this.holidayLength; x++) {
            if (
              this.currentYear === this.getHolidayYear()[x] &&
              countP === this.getHolidayDate()[x] &&
              lastMonth === this.getHolidayMonth()[x]
            ) {
              style = "color: red";
              holidayName = this.holiday[x].holiday_cn;
              break;
            }
          }
          if (this.endDate) {
            style = this.day2GreaterThan1(prevDate, this.endDate)
              ? style
              : "background-color: #909699";
            disabled = this.day2GreaterThan1(prevDate, this.endDate)
              ? false
              : true;
          }

          if (this.startDate) {
            style = this.day2GreaterThan1(this.startDate, prevDate)
              ? style
              : "background-color: #909699";
            disabled = this.day2GreaterThan1(this.startDate, prevDate)
              ? false
              : true;
          }
          // push properties into itemList
          itemList.push({
            value: countP + "",
            type: "",
            label: countP + "",
            index: countP + "",
            status: "prevMonth",
            style: style,
            holidayName: holidayName,
            dateString: prevDate.toString(),
            disabled: disabled
          });
        }
        k--;
      } else {
        k = 0;
      }
      for (let j = 0; j < 7 - k; j++) {
        count++;
        let nextDate = new Date(
          nextMonthYear,
          nextMonth,
          countN + 1,
          0,
          0,
          0,
          0
        );
        let style =
          this.dayDiff(nextDate, new Date()) === 0
            ? "background-color: rgb(0, 255, 229)"
            : "color: #909699";
        if (this.dateToChose) {
          style =
            this.dayDiff(nextDate, this.dateToChose) === 0
              ? "background-color: #f0fbff"
              : this.dayDiff(nextDate, new Date()) === 0
              ? "background-color: rgb(0, 255, 229)"
              : "color: #909699";
        }
        let holidayName =
          this.dayDiff(nextDate, new Date()) === 0 ? "today" : "";
        for (let x = 0; x < this.holidayLength; x++) {
          if (
            this.currentYear === this.getHolidayYear()[x] &&
            countN + 1 === this.getHolidayDate()[x] &&
            nextMonth === this.getHolidayMonth()[x]
          ) {
            style = "color: red";
            holidayName = this.holiday[x].holiday_cn;
            break;
          }
        }
        if (this.endDate) {
          style = this.day2GreaterThan1(nextDate, this.endDate)
            ? style
            : "background-color: #909699";
          disabled = this.day2GreaterThan1(nextDate, this.endDate)
            ? false
            : true;
        }
        if (this.startDate) {
          style = this.day2GreaterThan1(this.startDate, nextDate)
            ? style
            : "background-color: #909699";
          disabled = this.day2GreaterThan1(this.startDate, nextDate)
            ? false
            : true;
        }
        if (count > currentMonthDays) {
          countN++;
          itemList.push({
            value: countN + "",
            type: "",
            label: countN + "",
            index: countN + "",
            status: "nextMonth",
            style: style,
            holidayName: holidayName,
            dateString: nextDate.toString(),
            disabled: disabled
          });
        } else {
          let date = new Date(
            this.currentYear,
            this.currentMonth,
            count,
            0,
            0,
            0,
            0
          );
          style =
            this.dayDiff(date, new Date()) === 0
              ? "background-color: rgb(0, 255, 229)"
              : "";
          if (this.dateToChose) {
            style =
              this.dayDiff(date, this.dateToChose) === 0
                ? "background-color: #f0fbff"
                : this.dayDiff(date, new Date()) === 0
                ? "background-color: rgb(0, 255, 229)"
                : "";
          }
          holidayName = this.dayDiff(date, new Date()) === 0 ? "today" : "";
          for (let x = 0; x < this.holidayLength; x++) {
            if (
              this.currentYear === this.getHolidayYear()[x] &&
              count === this.getHolidayDate()[x] &&
              this.currentMonth === this.getHolidayMonth()[x]
            ) {
              style = "color: red";
              holidayName = this.holiday[x].holiday_cn;
              break;
            }
          }
          if (this.endDate) {
            style = this.day2GreaterThan1(date, this.endDate)
              ? style
              : "background-color: #909699";
            disabled = this.day2GreaterThan1(date, this.endDate) ? false : true;
          }
          if (this.startDate) {
            style = this.day2GreaterThan1(this.startDate, date)
              ? style
              : "background-color: #909699";
            disabled = this.day2GreaterThan1(this.startDate, date)
              ? false
              : true;
          }
          itemList.push({
            value: count + "",
            type: "",
            label: count + "",
            index: count,
            status: "currentMonth",
            style: style,
            holidayName: holidayName,
            dateString: date.toString(),
            disabled: disabled
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

  // calculate range between two days
  dayDiff(d1, d2) {
    const endDate = Date.UTC(d2.getFullYear(), d2.getMonth(), d2.getDate()),
      startDate = Date.UTC(d1.getFullYear(), d1.getMonth(), d1.getDate());
    return (endDate - startDate) / 86400000;
  }

  day2GreaterThan1(d1, d2) {
    return new Date(d2) >= new Date(d1);
  }

  inputClickHandler() {
    this.refreshCalendar();
    this.template.querySelector('[name="datePicker"]').style.display = "";
  }

  // show date when clicking the calendar grid
  datePickHandler(evt) {
    let tmpDate = new Date(evt.currentTarget.dataset.datestring);
    this.dateToChose = tmpDate;
    if (this.endDate) {
      this.showDate = this.day2GreaterThan1(tmpDate, this.endDate)
        ? tmpDate.toString().slice(4, 15)
        : "Please select a new date";
    } else {
      this.showDate = tmpDate.toString().slice(4, 15);
    }
    if (this.startDate) {
      this.showDate = this.day2GreaterThan1(this.startDate, tmpDate)
        ? tmpDate.toString().slice(4, 15)
        : "Please select a new date";
    } else {
      this.showDate = tmpDate.toString().slice(4, 15);
    }
    this.dispatchEvent(
      new CustomEvent("showstartdate", {
        detail: tmpDate,
        name: "startDate"
      })
    );

    this.dispatchEvent(
      new CustomEvent("showenddate", {
        detail: tmpDate,
        name: "endDate"
      })
    );
    this.template.querySelector('[name="datePicker"]').style.display = "none";
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
    this.setBasicDate();
    this.refreshCalendar();
  }

  // getter to get options in drop down year window
  get Options() {
    let lstOption = [];
    for (
      let i = this.today.getFullYear() - 100;
      i < this.today.getFullYear() + 50;
      i++
    ) {
      if (i === this.currentYear) {
        lstOption.push({ label: i, value: i, selected: true });
      } else {
        lstOption.push({ label: i, value: i, selected: false });
      }
    }
    return lstOption;
  }

  getHolidayYear() {
    for (let i = 0; i < this.holidayLength; i++) {
      this.holidayYearArray[i] = this.holiday[i].holidayYear;
    }
    return this.holidayYearArray;
  }

  getHolidayMonth() {
    for (let i = 0; i < this.holidayLength; i++) {
      this.holidayMonthArray[i] = this.holiday[i].holidayMonth - 1;
    }
    return this.holidayMonthArray;
  }

  getHolidayDate() {
    for (let i = 0; i < this.holidayLength; i++) {
      this.holidayDateArray[i] = this.holiday[i].holidayDate;
    }
    return this.holidayDateArray;
  }

  // call APEX class to get holidays
  useHolidayList() {
    getHolidayList({ year: this.currentYear + "" })
      .then((res) => {
        let holidayList = JSON.parse(JSON.stringify(res));
        this.holidayLength = holidayList.length;
        holidayList.forEach((element) => {
          element.holidayYear = parseFloat(element.date.toString().slice(0, 4));
          element.holidayMonth = parseFloat(
            element.date.toString().slice(4, 6)
          );
          element.holidayDate = parseFloat(element.date.toString().slice(-2));
        });
        this.holiday = holidayList;
      })
      .catch((err) => {
        console.log("err1");
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
          let disabledStartDate = new Date(
            disabledStartYear,
            disabledStartMonth,
            disabledStartDay,
            0,
            0,
            0,
            0
          );
          let disabledEndDate = new Date(
            disabledEndYear,
            disabledEndMonth,
            disabledEndDay,
            0,
            0,
            0,
            0
          );
          // to judge if input is correct, if so, return right answer, if not, return the other one.
          element.disabledStartDate =
            disabledStartDate <= disabledEndDate
              ? disabledStartDate
              : disabledEndDate;
          element.disabledEndDate =
            disabledEndDate >= disabledStartDate
              ? disabledEndDate
              : disabledStartDate;
          let disabledDayDiff = this.dayDiff(
            element.disabledStartDate,
            element.disabledEndDate
          );
          this.disabledFullDateArray.push(element.disabledStartDate);
          if (element.disabledStartDate < element.disabledEndDate) {
            for (let i = 1; i <= disabledDayDiff; i++) {
              this.disabledFullDateArray.push(
                this.addDays(element.disabledStartDate, i)
              );
              this.disabledYearArray.push(
                this.addDays(element.disabledStartDate, i).getFullYear()
              );
              this.disabledMonthArray.push(
                this.addDays(element.disabledStartDate, i).getMonth()
              );
              this.disabledDateArray.push(
                this.addDays(element.disabledStartDate, i).getDate()
              );
            }
          } else {
            // disabledStartDate = disabledEndDate
            this.disabledFullDateArray.push(element.disabledStartDate);
            this.disabledYearArray.push(
              element.disabledStartDate.getFullYear()
            );
            this.disabledMonthArray.push(element.disabledStartDate.getMonth());
            this.disabledDateArray.push(element.disabledStartDate.getDate());
          }
        });
        console.log(this.disabledFullDateArray);
      })
      .catch((err) => {
        console.log("err2");
        console.log(err);
      });
  }

  renderedCallback() {
    if (!this.ready) {
      const yearSelector = this.template.querySelector('[name="yearSelector"]');
      yearSelector.selectedIndex = [...yearSelector.options].findIndex(
        (option) => option.value === this.currentYear + ""
      );
    }
    this.ready = true;
  }

  connectedCallback() {
    this.setBasicDate();
    this.useHolidayList();
    this.showDate = this.showDate ? this.showDate : null;
    //   : this.today.toString().slice(4, 15);
    this.generateCalendar();
    this.useDisabledDateList();
  }
}
