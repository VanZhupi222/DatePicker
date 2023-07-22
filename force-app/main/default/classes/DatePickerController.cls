public with sharing class DatePickerController {
    /**
     * @param startDate, @param endDate, @param typeIndex
     * @return List<Date_For_Leave__c> lstDateForLeave
     * @description insert a record with some parameters
     */
    @AuraEnabled
    public static List<Date_For_Leave__c> insertLeaveDate(Date startDate, Date endDate, Integer typeIndex) {
        // create Date_For_Leave__c class
        Date_For_Leave__c tmpLeaveDate = new Date_For_Leave__c();
        // set leave type
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
        // get current user's timezone
        TimeZone timeZone = UserInfo.getTimeZone();
        // get now
        DateTime now = Datetime.now();
        // transfer Date type parameter into DateTime(UTC)
        DateTime tmpStartDayTime = startDate;
        DateTime tmpEndDayTime = endDate;
        // transfer UTC into local timezone
        tmpStartDayTime = tmpStartDayTime.addSeconds(timeZone.getOffset(now) / 1000);
        tmpEndDayTime = tmpEndDayTime.addSeconds(timeZone.getOffset(now) / 1000);
        // transfer local timezone DateTime type into Date type
        tmpLeaveDate.Start_Date__c = Date.newInstance(tmpStartDayTime.year(), tmpStartDayTime.month(), tmpStartDayTime.day());
        tmpLeaveDate.End_Date__c = Date.newInstance(tmpEndDayTime.year(), tmpEndDayTime.month(), tmpEndDayTime.day());
        // calculate actual range between start date and end date
        tmpLeaveDate.Actual_Range__c = startDate.daysBetween(endDate) + 1;
        // get current user name to be applicant.
        tmpLeaveDate.Applicant__c = UserInfo.getName();
        // get current user Id to save as applicant Id.
        tmpLeaveDate.Applicant_ID__c = UserInfo.getUserId();
        // format transition
        tmpLeaveDate.Date_of_Application__c = String.ValueofGmt(now.addSeconds((timeZone.getOffset(now) / 1000)));
        // get day of start date(weekday)
        Datetime tmpstartDate = (DateTime) startDate;
        String dayOfStartDate = tmpstartDate.format('EEEE');
        // holiday count
        Integer intCount = 0;
        // get holiday from class CNHolidayFromSalesforce
        List<Holiday> newHoliday = CNHolidayFromSalesforce.getCNHoliday().get('correctDate');
        // iterate newHoliday to calculate holiday count.
        for (Holiday holiday : newHoliday) {
            if (holiday.RecurrenceEndDateOnly == null) {
                intCount++;
            }
            for (Integer i = 0; i <= holiday.RecurrenceStartDate.daysBetween(holiday.RecurrenceEndDateOnly); i++) {
                Date tmpDate = holiday.RecurrenceStartDate.addDays(i);
                Datetime tmpDateTime = (DateTime) tmpDate;
                String weekDay = tmpDateTime.format('EEEE');
                if (startDate <= tmpDate && endDate >= tmpDate) {
                    intCount++;
                    // check if it is both holiday and weekend
                    if (weekDay.equals('Sunday') || weekDay.equals('Saturday')) {
                        intCount--;
                    }
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
        // calculate workday range by subtract holiday and weekend count. 
        tmpLeaveDate.Workday_Range__c = tmpLeaveDate.Actual_Range__c - intCount;
        try {
            insert tmpLeaveDate;
            List<Date_For_Leave__c> lstDateForLeave = getDateForLeave();
            return lstDateForLeave;
        } catch (Exception e) {
            System.debug(e);
            return null;
        }
    }

    /**
     * @param oldRecordId @param newTypeIndex @param newStartDate @param newEndDate @param currentUerId
     * @return List<Date_For_Leave__c> lstDateForLeave
     * @description update a record with new param from Object: Date_For_Leave__c which match a certain Id
     */
    @AuraEnabled
    public static List<Date_For_Leave__c> updateLeaveDate(String oldRecordId, Integer newTypeIndex, Date newStartDate, Date newEndDate, String currentUerId) {
        // create Date_For_Leave__c class
        Date_For_Leave__c dateForLeave = new Date_For_Leave__c();
        // get date for leave before update
        try {
            dateForLeave = [
                SELECT Id, Type__c, Start_Date__c, End_Date__c, Actual_Range__c, Workday_Range__c, Date_of_Application__c, Applicant__c, Applicant_ID__c
                FROM Date_For_Leave__c
                WHERE Id = :oldRecordId AND Applicant_ID__c = :currentUerId
                LIMIT 50
            ];
        } catch (Exception e) {
            System.debug(e);
        }
        // set leave type
        switch on newTypeIndex {
            when 1 {
                dateForLeave.Type__c = '请假';
            }
            when 2 {
                dateForLeave.Type__c = '出差';
            }
            when else {
                dateForLeave.Type__c = 'error';
            }
        }
        // get current user's timezone
        TimeZone timeZone = UserInfo.getTimeZone();
        // get now
        DateTime now = Datetime.now();
        // transfer Date type parameter into DateTime(UTC)
        DateTime tmpStartDayTime = newStartDate;
        DateTime tmpEndDayTime = newEndDate;
        // transfer UTC into local timezone
        tmpStartDayTime = tmpStartDayTime.addSeconds(timeZone.getOffset(now) / 1000);
        tmpEndDayTime   = tmpEndDayTime.addSeconds(timeZone.getOffset(now) / 1000);
        // transfer local timezone DateTime type into Date type
        dateForLeave.Start_Date__c = Date.newInstance(tmpStartDayTime.year(), tmpStartDayTime.month(), tmpStartDayTime.day());
        dateForLeave.End_Date__c   = Date.newInstance(tmpEndDayTime.year(), tmpEndDayTime.month(), tmpEndDayTime.day());
        // calculate actual range between start date and end date
        dateForLeave.Actual_Range__c = newStartDate.daysBetween(newEndDate) + 1;
        // get current user name to be applicant.
        dateForLeave.Applicant__c    = UserInfo.getName();
        // get current user Id to save as applicant Id.
        dateForLeave.Applicant_ID__c = UserInfo.getUserId();
        // get day of start date(weekday)
        Datetime tmpstartDate = (DateTime) newStartDate;
        String dayOfStartDate = tmpstartDate.format('EEEE');
        // holiday count
        Integer intCount = 0;
        // get holiday from class CNHolidayFromSalesforce
        List<Holiday> newHoliday = CNHolidayFromSalesforce.getCNHoliday().get('correctDate');
        // iterate newHoliday to calculate holiday count.
        for (Holiday holiday : newHoliday) {
            if(holiday.RecurrenceEndDateOnly == null){
                intCount++;
            }
            for (Integer i = 0; i <= holiday.RecurrenceStartDate.daysBetween(holiday.RecurrenceEndDateOnly); i++) {
                Date tmpDate = holiday.RecurrenceStartDate.addDays(i);
                Datetime tmpDateTime = (DateTime) tmpDate;
                String weekDay = tmpDateTime.format('EEEE');
                if (newStartDate <= tmpDate && newEndDate >= tmpDate) {
                    intCount++;
                    // check if it is both holiday and weekend
                    if (weekDay.equals('Sunday') || weekDay.equals('Saturday')) {
                        intCount--;
                    }
                }
            }
        }
        // calculate weekend
        if (dateForLeave.Actual_Range__c >= 6) {
            // 6~10 -2, 11~15 -4, ...
            intCount += (Integer) ((2 * ((dateForLeave.Actual_Range__c - 1) / 5).round(System.RoundingMode.FLOOR)));
        } else if (dateForLeave.Actual_Range__c == 4 && dayOfStartDate.equals('Friday')) {
            // Tue Wed Thu Fri || Mon Tue Wed Thu
            intCount += 2;
        } else if (dateForLeave.Actual_Range__c == 5 && (!dayOfStartDate.equals('Monday'))) {
            // Mon Tue Wed Thu Fri
            intCount += 2;
        }
        // calculate workday range by subtract holiday and weekend count. 
        dateForLeave.Workday_Range__c = dateForLeave.Actual_Range__c - intCount;
        try {
            update dateForLeave;
            List<Date_For_Leave__c> lstDateForLeave = getDateForLeave();
            return lstDateForLeave;
        } 
        catch (Exception e) {
            System.debug(e);
            return null;
        }
    }

    /**
     * @param oldRecordId @param currentUserId
     * @return List<Date_For_Leave__c>
     * @Description delete record from Object: Date_For_Leave__c which match a certain Id
     */
    @AuraEnabled
    public static List<Date_For_Leave__c> deleteLeaveDate(String oldRecordId, String currentUerId){
        Date_For_Leave__c dateForLeave = new Date_For_Leave__c();
        try {
            dateForLeave = [
                SELECT Id, Type__c, Start_Date__c, End_Date__c, Actual_Range__c, Workday_Range__c, Date_of_Application__c, Applicant__c, Applicant_ID__c
                FROM Date_For_Leave__c
                WHERE Id = :oldRecordId AND Applicant_ID__c = :currentUerId
                LIMIT 50
            ];
            delete dateForLeave;
            List<Date_For_Leave__c> lstDateForLeave = getDateForLeave();
            return lstDateForLeave;
        } catch (Exception e) {
            System.debug(e);
            return null;
        }
    }

    /**
     * @return List<Date_For_Leave__c>
     * @Description get all for leave dates from Object: Date_For_Leave__c
     */
    @AuraEnabled(cacheable=true)
    public static List<Date_For_Leave__c> getDateForLeave() {
        List<Date_For_Leave__c> dateForLeave = new List<Date_For_Leave__c>();
        try {
            dateForLeave = [
                SELECT Id, Type__c, Start_Date__c, End_Date__c, Actual_Range__c, Workday_Range__c, Date_of_Application__c, Applicant__c, Applicant_ID__c 
                FROM Date_For_Leave__c 
                ORDER BY Date_of_Application__c
                LIMIT 50];
        } 
        catch (Exception e) {
            System.debug(e);
        }
        return dateForLeave;
    }

    /**
     * @param userId
     * @return List<Date_For_Leave__c> dateForLeave
     * @Description get all for leave dates from Object: Date_For_Leave__c
     */
    @AuraEnabled(cacheable=true)
    public static List<Date_For_Leave__c> getDateForLeaveSpeUser(String userId) {
        List<Date_For_Leave__c> dateForLeave = new List<Date_For_Leave__c>();
        try {
            dateForLeave = [
                SELECT Id, Type__c, Start_Date__c, End_Date__c, Actual_Range__c, Workday_Range__c, Date_of_Application__c, Applicant__c, Applicant_ID__c 
                FROM Date_For_Leave__c 
                WHERE Applicant_ID__c = :userId
                ORDER BY Date_of_Application__c
                LIMIT 50];
        }
        catch (Exception e) {
            System.debug(e);
        }
        return dateForLeave;
    }
}