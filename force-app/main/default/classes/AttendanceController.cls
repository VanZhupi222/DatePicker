
public with sharing class AttendanceController {
    /**
    * @param recordId
    * @return Boolean
    * @Description update attendance record
    */
    @AuraEnabled
    public static Boolean updateAttendance(String recordId) {
    Attendance__c attendance = [SELECT Attendance_Number__c, Last_Attendance_Date__c FROM Attendance__c WHERE Id =: recordId];

    // 判断是否已经打卡
    if (attendance.Last_Attendance_Date__c == Date.today()) {
        return false;
    }
    // 更新打卡次数
    attendance.Attendance_Number__c++;
    attendance.Last_Attendance_Date__c = Date.today();

    // 更新数据库
    try {
        update attendance;
    } catch (DmlException e) {
        return false;
    }
    
    return true;
}
}