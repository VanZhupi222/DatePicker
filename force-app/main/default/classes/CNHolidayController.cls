public with sharing class CNHolidayController {
    /**
     * @param String strYear
     * @return Map<String, Object> mapHoliday
     */
    
    @AuraEnabled(cacheable=true)
    public static Map<String, Object> getHolidayList(String strYear) {
        Http http = new Http();
        HttpRequest request = new HttpRequest();
        request.setEndpoint('https://api.apihubs.cn/holiday/get?field=date,holiday&year=' + strYear + '&holiday_recess=1&cn=1&size=31');
        request.setMethod('GET');
        HttpResponse response = http.send(request);
        // If the request is successful, parse the JSON response.
        try {
            if (response.getStatusCode() == 200) {
                // Deserialize the JSON string into collections of primitive data types.
                Map<String, Object> results = (Map<String, Object>) JSON.deserializeUntyped(response.getBody().replace('date','dateT'));
                // Cast the values in the 'data' key as another map
                Map<String, Object> mapHoliday = (Map<String, Object>) results.get('data');
                return mapHoliday;
            } 
            else {
                return new Map<String, Object>();
            }
        } 
        catch (exception e) {
            system.debug('There is an error:' + e);
            Map<String, Object> errorHolidayResult = new Map<String, Object>();
            errorHolidayResult.put('holidayResultError', null);
            return errorHolidayResult;
        }
    }
}