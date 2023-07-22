trigger AutoResetPasswordTrigger on User (after insert) {
    try{
        List<User> newUsers = [SELECT Id, LastName, Email FROM User WHERE Id in :Trigger.New];
        for (User tempUser : newUsers) {
            // resetPassword(Id userId, Boolean sendUserEmail)
            System.resetPassword(tempUser.Id, True);
        }
    }
    catch(Exception e) {
        System.Debug('AutoResetPasswordTriggerError ' + e);
    }
}
