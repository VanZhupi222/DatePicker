trigger CreateUserTrigger on Account (after insert) {
    try{
        Profile profileId = [SELECT Id FROM Profile WHERE Name = 'Standard User' LIMIT 1];
        List<Account> newAccountList = [SELECT Id, Name, Email__c FROM Account WHERE Id in :Trigger.New];
        List<User> newUserList = new List<User>();
        for (Account a : newAccountList) {
            User newUser = new User();
            String[] Name = a.Name.split(' ');
            newUser.LastName = a.Name;
            newUser.Email = a.Email__c;
            newUser.Username = Name[0]+ '.' + Name[1] + '@shmtu.com';
            newUser.CommunityNickName = a.Name;
            newUser.ProfileID = profileId.Id;
            newUser.Alias = newUser.LastName.length() > 4 ? newUser.LastName.subString(0, 4) : newUser.LastName;
            newUser.LocaleSidKey = 'en_US';
            newUser.LanguageLocaleKey = 'en_US';
            newUser.EmailEncodingKey = 'UTF-8';
            newUser.TimeZoneSidKey = 'GMT';
            newUserList.add(newUser);
        }
        Insert newUserList;
    }
    catch(Exception e){
        System.Debug('CreateUserTrigger error' + e);
    }     
}