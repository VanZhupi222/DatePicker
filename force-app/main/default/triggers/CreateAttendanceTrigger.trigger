trigger CreateAttendanceTrigger on Account (after insert) {
    try{
        List<Account> newAccountList = [SELECT Id, Name FROM Account WHERE Id in :Trigger.New];
        List<Attendance__c> newAttendanceList = new List<Attendance__c>();
        for (Account a : newAccountList) {
            Attendance__c attendance = new Attendance__c (
                Name = 'Attendance of ' + a.Name,
                Attendance_Number__c = 0,
                Account__c = a.Id
            );
            newAttendanceList.add(attendance);
        }
        Insert newAttendanceList;
    }
    catch(Exception e){
        System.Debug('CreateAttendanceTrigger Error' + e);
    }     
}