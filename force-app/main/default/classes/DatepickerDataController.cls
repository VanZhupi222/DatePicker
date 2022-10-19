global with sharing class DatepickerDataController {
    @AuraEnabled(cacheable=true)
    public static List<Date_For_Leave__c> getDateForLeave() {
        List<Date_For_Leave__c> dateForLeave = new List<Date_For_Leave__c>();
        try {
            dateForLeave = [
                SELECT Type__c, Start_Date__c, End_Date__c, Actual_Range__c, Workday_Range__c, Date_of_Application__c, Applicant__c 
                FROM Date_For_Leave__c 
                LIMIT 10];
        } 
        catch (Exception e) {
            System.debug(e);
        }
        return dateForLeave;
    }
}