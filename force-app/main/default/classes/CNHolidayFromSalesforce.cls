public without sharing class CNHolidayFromSalesforce {
    /**
     * @return Map<String, List<Holiday>> mapCNHoliday
     * @description call custom holiday from salesforce
     */
    @AuraEnabled(cacheable=true)
    public static Map<String, List<Holiday>> getCNHoliday() {
        Map<String, List<Holiday>> mapCNHoliday = new Map<String, List<Holiday>>();
        try {
            // query from Holiday
            List<Holiday> lstHoliday = [SELECT Name, RecurrenceStartDate, RecurrenceEndDateOnly FROM Holiday];
            mapCNHoliday.put('correctDate', lstHoliday);
        } catch (Exception e) {
            System.debug('There is an error:' + e);
            mapCNHoliday.put('incorrectReturn', null);
        }
        return mapCNHoliday;
    }
}