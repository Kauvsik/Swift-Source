public without sharing class clientProjectController {
    
    @AuraEnabled
    public static Id createProject(Project__c projectData) {
        try {
            if (String.isBlank(projectData.Name)) {
                throw new AuraHandledException('Project Name is required');
            }

            if (projectData.Account__c == null) {
                throw new AuraHandledException('Account is required');
            }

            if (projectData.Status__c == null) {
                projectData.Status__c = 'Pending Verification';
            }

            insert projectData;
            return projectData.Id;

        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }
}