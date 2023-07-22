public class ClearAttendanceNumBatch implements Database.Batchable<sObject>, Database.Stateful {
    // instance member to retain state across transactions
    public Integer recordsProcessed = 0;
    public Database.QueryLocator start(Database.BatchableContext bc) {
        return Database.getQueryLocator(
            'SELECT Id, Name, Attendance_Number__c ' +
            'FROM Attendance__c ' +
            'Where Attendance_Number__c != null'
        ); 
    }
    public void execute(Database.BatchableContext bc, List<Attendance__c> scope){
        // process each batch of records
        List<Attendance__c> attendances = new List<Attendance__c>();
        for (Attendance__c attendance : scope) {
            attendance.Attendance_Number__c = 0;
            // add attendance to list to be updated
            attendances.add(attendance);
            // increment the instance member counter
            recordsProcessed ++;
        }
        update attendances;
    }
    public void finish(Database.BatchableContext bc){
        System.debug(recordsProcessed + ' records processed. Shijie!');
    }
}