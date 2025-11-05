/**
 * Cloud function to create a SignForm document
 * SignForms allow you to collect signatures in documents using a form whose URL can be publicly shared.
 * @param {Object} request - The request object containing document details
 * @returns {Object} - Returns the created document object
 */
export default async function createSignForm(request) {
  if (!request?.user) {
    throw new Parse.Error(Parse.Error.INVALID_SESSION_TOKEN, 'User is not authenticated.');
  }

  const { 
    Name, 
    Description, 
    Note, 
    URL, 
    SendinOrder,
    TimeToCompleteDays,
    IsEnableOTP,
    IsTourEnabled,
    AllowModifications,
    RedirectUrl,
    SignatureType,
    NotifyOnSignatures,
    Bcc
  } = request.params;

  try {
    // Get the current user's extended user info
    const userQuery = new Parse.Query('contracts_Users');
    userQuery.equalTo('UserId', {
      __type: 'Pointer',
      className: '_User',
      objectId: request.user.id,
    });
    
    const user = await userQuery.first({ useMasterKey: true });
    
    if (!user) {
      throw new Parse.Error(Parse.Error.OBJECT_NOT_FOUND, 'User not found.');
    }

    // Create the document object
    const document = new Parse.Object('contracts_Document');
    
    // Set basic document properties
    document.set('Name', Name || 'Untitled SignForm');
    document.set('Description', Description || '');
    document.set('Note', Note || '');
    document.set('URL', URL);
    document.set('SignedUrl', URL);
    document.set('SendinOrder', SendinOrder !== undefined ? SendinOrder : false);
    document.set('TimeToCompleteDays', TimeToCompleteDays || 15);
    document.set('IsEnableOTP', IsEnableOTP || false);
    document.set('IsTourEnabled', IsTourEnabled !== undefined ? IsTourEnabled : true);
    document.set('AllowModifications', AllowModifications || false);
    document.set('Type', 'SignForm'); // Special type to identify SignForm documents
    document.set('IsSignForm', true); // Flag to identify SignForm documents
    
    // Set user references
    document.set('CreatedBy', {
      __type: 'Pointer',
      className: '_User',
      objectId: request.user.id,
    });
    
    document.set('ExtUserPtr', {
      __type: 'Pointer',
      className: 'contracts_Users',
      objectId: user.id,
    });
    
    // Set redirect URL if provided
    if (RedirectUrl) {
      document.set('RedirectUrl', RedirectUrl);
    }
    
    // Set signature type if provided
    if (SignatureType) {
      document.set('SignatureType', SignatureType);
    }
    
    // Set notification preferences
    if (NotifyOnSignatures !== undefined) {
      document.set('NotifyOnSignatures', NotifyOnSignatures);
    }
    
    // Set BCC emails if provided
    if (Bcc && Array.isArray(Bcc) && Bcc.length > 0) {
      document.set('Bcc', Bcc);
    }
    
    // Make the document publicly accessible via a shareable URL
    const acl = new Parse.ACL();
    acl.setPublicReadAccess(true); // Allow public read access for SignForms
    acl.setPublicWriteAccess(false);
    acl.setReadAccess(request.user.id, true);
    acl.setWriteAccess(request.user.id, true);
    document.setACL(acl);
    
    // Save the document
    const savedDocument = await document.save(null, { useMasterKey: true });
    
    return savedDocument;
  } catch (error) {
    console.error('Error creating SignForm:', error);
    throw new Parse.Error(Parse.Error.INTERNAL_SERVER_ERROR, 'Failed to create SignForm.');
  }
}