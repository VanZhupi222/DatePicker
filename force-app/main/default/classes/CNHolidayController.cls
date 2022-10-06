public with sharing class CNHolidayController {
  @AuraEnabled(cacheable=true)
  public static List<Object> getHolidayList(string year) {
    system.debug('enter');
    // system.debug(year);
    Http http = new Http();
    HttpRequest request = new HttpRequest();
    request.setEndpoint(
      'https://api.apihubs.cn/holiday/get?field=date,holiday&year=' +
      year +
      '&holiday_recess=1&cn=1&size=31'
    );
    request.setMethod('GET');
    HttpResponse response = http.send(request);
    // If the request is successful, parse the JSON response.
    try {
      if (response.getStatusCode() == 200) {
        // Deserialize the JSON string into collections of primitive data types.
        Map<String, Object> results = (Map<String, Object>) JSON.deserializeUntyped(
          response.getBody()
        );
        // Cast the values in the 'animals' key as a list
        Map<String, Object> tmpHoliday = (Map<String, Object>) results.get(
          'data'
        );
        List<Object> holidayList = (List<Object>) tmpHoliday.get('list');
        return holidayList;
      } else {
        return new List<Object>();
      }
    } catch (exception e) {
      system.debug('There is an error:' + e);
      return null;
    }
  }
}
