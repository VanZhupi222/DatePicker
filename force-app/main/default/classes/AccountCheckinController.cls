public with sharing class AccountCheckinController {
    @AuraEnabled
    public static void updateIsCheckIn(String userId, Datetime CheckInTime) {
        try{
            User selectedUser = [SELECT Id, LastName FROM User WHERE Id = :userId];
            String name = selectedUser.LastName;
            Attendance__c selectedAttendance = [SELECT Id, Name, Attendance_Number__c, Account__r.Name, Account__r.isCheckin__c FROM Attendance__c WHERE Account__r.Name = :name];
            Account selectedAccount = [SELECT Id, Name, Email__c, isCheckin__c FROM Account WHERE Id = :selectedAttendance.Account__c];
            selectedAccount.isCheckin__c = True;
            selectedAttendance.Attendance_Number__c ++;
            selectedAttendance.Check_in_Time_Today__c = CheckInTime;
            Update selectedAttendance;
            Update selectedAccount;
        }
        catch(Exception e) {
            System.Debug('error: '+ e);
            throw new AuraHandledException(e.getMessage());
        }
    }

    @AuraEnabled
    public static Boolean getIsCheckIn(String userId) {
        try {
            User selectedUser = [SELECT Id, LastName FROM User WHERE Id = :userId];
            String name = selectedUser.LastName;
            Attendance__c selectedAttendance = [SELECT Id, Name, Attendance_Number__c, Account__r.Name, Account__r.isCheckin__c FROM Attendance__c WHERE Account__r.Name = :name];
            return selectedAttendance.Account__r.isCheckin__c;
        } 
        catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }
}