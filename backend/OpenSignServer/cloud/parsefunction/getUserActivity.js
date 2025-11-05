export default async function getUserActivity(request) {
  if (!request?.user) {
    throw new Parse.Error(Parse.Error.INVALID_SESSION_TOKEN, 'User is not authenticated.');
  }

  // Check if the requesting user is a super admin
  const requestingUserQuery = new Parse.Query('contracts_Users');
  requestingUserQuery.equalTo('UserId', {
    __type: 'Pointer',
    className: '_User',
    objectId: request.user.id,
  });
  const requestingUser = await requestingUserQuery.first({ useMasterKey: true });
  
  if (!requestingUser || requestingUser.get('UserRole') !== 'contracts_Admin') {
    throw new Parse.Error(Parse.Error.OPERATION_FORBIDDEN, 'Only super admins can access user activity data.');
  }

  const targetUserId = request.params.userId;
  if (!targetUserId) {
    throw new Parse.Error(Parse.Error.INVALID_QUERY, 'User ID is required.');
  }

  try {
    // Fetch user details
    const userQuery = new Parse.Query('contracts_Users');
    userQuery.include('TenantId');
    userQuery.include('OrganizationId');
    userQuery.include('TeamIds');
    const user = await userQuery.get(targetUserId, { useMasterKey: true });
    const userDetails = user.toJSON();

    // Fetch recent documents (limit to 20)
    const documentQuery = new Parse.Query('contracts_Document');
    documentQuery.equalTo('ExtUserPtr', {
      __type: 'Pointer',
      className: 'contracts_Users',
      objectId: targetUserId
    });
    documentQuery.descending('createdAt');
    documentQuery.limit(20);
    const documents = await documentQuery.find({ useMasterKey: true });
    const userDocuments = documents.map(doc => doc.toJSON());

    // Fetch recent templates (limit to 20)
    const templateQuery = new Parse.Query('contracts_Template');
    templateQuery.equalTo('ExtUserPtr', {
      __type: 'Pointer',
      className: 'contracts_Users',
      objectId: targetUserId
    });
    templateQuery.descending('createdAt');
    templateQuery.limit(20);
    const templates = await templateQuery.find({ useMasterKey: true });
    const userTemplates = templates.map(template => template.toJSON());

    return {
      userDetails,
      userDocuments,
      userTemplates
    };
  } catch (error) {
    console.error('Error in getUserActivity:', error);
    throw new Parse.Error(Parse.Error.INTERNAL_SERVER_ERROR, 'Failed to fetch user activity data.');
  }
}