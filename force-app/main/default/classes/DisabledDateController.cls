public with sharing class DisabledDateController {
    @AuraEnabled(cacheable=true)
    public static List<Disabled_Date__c> getDisabledDate() {
        List<Disabled_Date__c> disabledDate = new List<Disabled_Date__c>();
        Map<String, Disabled_Date__c> disabledDateMap = Disabled_Date__c.getAll();
        Disabled_Date__c disabledRange1 = disabledDateMap.get('Mid autumn festival');
        disabledDate.add(disabledRange1);
        return disabledDate;
    }
}