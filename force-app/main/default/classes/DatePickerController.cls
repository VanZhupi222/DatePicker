public with sharing class DatePickerController {
    @AuraEnabled
    public static void insertLeaveDate(Date startDate, Date endDate, Integer typeIndex) {
        Date_For_Leave__c tmpLeaveDate = new Date_For_Leave__c();
        switch on typeIndex {
            when 1 {
                tmpLeaveDate.Type__c = '请假';
            }
            when 2 {
                tmpLeaveDate.Type__c = '出差';
            }
            when else {
                tmpLeaveDate.Type__c = 'error';
            }
        }
        tmpLeaveDate.Start_Date__c = startDate;
        tmpLeaveDate.End_Date__c = endDate;
        tmpLeaveDate.Actual_Range__c = startDate.daysBetween(endDate) + 1;
        tmpLeaveDate.Applicant__c = 'Shijie Fan';
        tmpLeaveDate.Date_of_Application__c = System.now().format('yyyy-MM-dd h:mm a');
        // get day of start date(weekday)
        Datetime tmpstartDate = (DateTime) startDate;
        String dayOfStartDate = tmpstartDate.format('EEEE');
        // get holiday map from CNHolidayController
        Map<String, Object> mapHoliday = CNHolidayController.getHolidayList('2022');
        List<Object> lstHoliday = (List<Object>) mapHoliday.get('list');
        // holiday count
        Integer intCount = 0;
        // calculate holiday
        for (Integer i = 0; i < lstHoliday.size(); i++) {
            Map<String, Object> map2 = new Map<String, Object>();
            map2 = (Map<String, Object>) lstHoliday[i];
            // get year, month, date
            Integer tmpYear = Integer.valueof((map2.get('dateT') + '').substring(0, 4));
            Integer tmpMonth = Integer.valueof((map2.get('dateT') + '').substring(4, 6));
            Integer tmpDay = Integer.valueof((map2.get('dateT') + '').substring(6, 8));
            // generate the holiday Date
            Date tmpDate = date.newInstance(tmpYear, tmpMonth, tmpDay);
            Datetime tmpDateTime = (DateTime) tmpDate;
            // to get week day of the date
            String weekDay = tmpDateTime.format('EEEE');
            if (startDate <= tmpDate && endDate >= tmpDate) {
                intCount++;
                // check if it is both holiday and weekend
                if (weekDay.equals('Sunday') || weekDay.equals('Saturday')) {
                    intCount--;
                }
            }
        }
        // calculate weekend
        if (tmpLeaveDate.Actual_Range__c >= 6) {
            // 6~10 -2, 11~15 -4, ...
            intCount += (Integer) ((2 * ((tmpLeaveDate.Actual_Range__c - 1) / 5).round(System.RoundingMode.FLOOR)));
        } else if (tmpLeaveDate.Actual_Range__c == 4 && dayOfStartDate.equals('Friday')) {
            // Tue Wed Thu Fri || Mon Tue Wed Thu
            intCount += 2;
        } else if (tmpLeaveDate.Actual_Range__c == 5 && (!dayOfStartDate.equals('Monday'))) {
            // Mon Tue Wed Thu Fri
            intCount += 2;
        }
        tmpLeaveDate.Workday_Range__c = tmpLeaveDate.Actual_Range__c - intCount;
        try {
            insert tmpLeaveDate;
        } catch (Exception e) {
            System.debug(e);
        }
    }
}