public class UpdateCheckinBatch implements Database.Batchable<sObject>, Database.Stateful {
    // instance member to retain state across transactions
    public Integer recordsProcessed = 0;
    public Database.QueryLocator start(Database.BatchableContext bc) {
        return Database.getQueryLocator(
            'SELECT Id, Name, Email__c, isCheckin__c ' +
            'FROM Account ' +
            'Where isCheckin__c = true'
        ); 
    }
    public void execute(Database.BatchableContext bc, List<Account> scope){
        // process each batch of records
        List<Account> accounts = new List<Account>();
        for (Account account : scope) {
            account.isCheckin__c = false;
            // add contact to list to be updated
            accounts.add(account);
            // increment the instance member counter
            recordsProcessed ++;
            }
        update accounts;
    }
    public void finish(Database.BatchableContext bc){
        System.debug(recordsProcessed + ' records processed. Shijie!');
    }
}