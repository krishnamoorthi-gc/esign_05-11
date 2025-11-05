/**
 * Zapier Integration Controller
 * Handle CRUD operations for Zapier integration keys
 */

import crypto from 'crypto';

// Generate a new Zapier integration key
export async function generateZapierKey(request) {
  try {
    const user = request.user;
    if (!user) {
      throw new Parse.Error(
        Parse.Error.INVALID_SESSION_TOKEN,
        'User not authenticated. Please log in and try again.'
      );
    }

    // First, we need to get the user's extended information which contains the TenantId pointer
    const userQuery = new Parse.Query('contracts_Users');
    userQuery.equalTo('UserId', {
      __type: 'Pointer',
      className: '_User',
      objectId: user.id,
    });
    userQuery.include('TenantId');

    const extUser = await userQuery.first({ useMasterKey: true });
    if (!extUser) {
      throw new Parse.Error(
        Parse.Error.OBJECT_NOT_FOUND,
        'User information not found. Please contact support.'
      );
    }

    const tenant = extUser.get('TenantId');
    if (!tenant || !tenant.id) {
      throw new Parse.Error(
        Parse.Error.OBJECT_NOT_FOUND,
        'User tenant information not found. Please contact support.'
      );
    }

    const tenantId = tenant.id;

    // Generate a unique API key
    const key = `zapier_${crypto.randomBytes(32).toString('hex')}`;

    // Save the key to the user's tenant
    const query = new Parse.Query('partners_Tenant');
    query.equalTo('objectId', tenantId);

    const tenantObj = await query.first({ useMasterKey: true });
    if (!tenantObj) {
      throw new Parse.Error(
        Parse.Error.OBJECT_NOT_FOUND,
        'Tenant record not found. Please contact support.'
      );
    }

    // Set the Zapier key for this tenant
    tenantObj.set('zapierKey', key);
    tenantObj.set('zapierKeyUpdatedAt', new Date());

    await tenantObj.save(null, { useMasterKey: true });

    return {
      key: key,
      updatedAt: new Date(),
    };
  } catch (error) {
    console.error('Error generating Zapier key:', error);
    // Re-throw the error with a more user-friendly message while preserving the original error code
    if (error.code) {
      throw new Parse.Error(
        error.code,
        error.message || 'Failed to generate Zapier key. Please try again later.'
      );
    } else {
      throw new Parse.Error(
        Parse.Error.INTERNAL_SERVER_ERROR,
        'Failed to generate Zapier key. Please try again later.'
      );
    }
  }
}

// Get the current Zapier integration key
export async function getZapierKey(request) {
  try {
    const user = request.user;
    if (!user) {
      throw new Parse.Error(
        Parse.Error.INVALID_SESSION_TOKEN,
        'User not authenticated. Please log in and try again.'
      );
    }

    // First, we need to get the user's extended information which contains the TenantId pointer
    const userQuery = new Parse.Query('contracts_Users');
    userQuery.equalTo('UserId', {
      __type: 'Pointer',
      className: '_User',
      objectId: user.id,
    });
    userQuery.include('TenantId');

    const extUser = await userQuery.first({ useMasterKey: true });
    if (!extUser) {
      throw new Parse.Error(
        Parse.Error.OBJECT_NOT_FOUND,
        'User information not found. Please contact support.'
      );
    }

    const tenant = extUser.get('TenantId');
    if (!tenant || !tenant.id) {
      throw new Parse.Error(
        Parse.Error.OBJECT_NOT_FOUND,
        'User tenant information not found. Please contact support.'
      );
    }

    const tenantId = tenant.id;

    // Get the tenant
    const query = new Parse.Query('partners_Tenant');
    query.equalTo('objectId', tenantId);

    const tenantObj = await query.first({ useMasterKey: true });
    if (!tenantObj) {
      throw new Parse.Error(
        Parse.Error.OBJECT_NOT_FOUND,
        'Tenant record not found. Please contact support.'
      );
    }

    const key = tenantObj.get('zapierKey');

    if (!key) {
      return { key: null };
    }

    return {
      key: key,
      updatedAt: tenantObj.get('zapierKeyUpdatedAt'),
    };
  } catch (error) {
    console.error('Error fetching Zapier key:', error);
    // Re-throw the error with a more user-friendly message while preserving the original error code
    if (error.code) {
      throw new Parse.Error(
        error.code,
        error.message || 'Failed to fetch Zapier key. Please try again later.'
      );
    } else {
      throw new Parse.Error(
        Parse.Error.INTERNAL_SERVER_ERROR,
        'Failed to fetch Zapier key. Please try again later.'
      );
    }
  }
}

// Revoke the current Zapier integration key
export async function revokeZapierKey(request) {
  try {
    const user = request.user;
    if (!user) {
      throw new Parse.Error(
        Parse.Error.INVALID_SESSION_TOKEN,
        'User not authenticated. Please log in and try again.'
      );
    }

    // First, we need to get the user's extended information which contains the TenantId pointer
    const userQuery = new Parse.Query('contracts_Users');
    userQuery.equalTo('UserId', {
      __type: 'Pointer',
      className: '_User',
      objectId: user.id,
    });
    userQuery.include('TenantId');

    const extUser = await userQuery.first({ useMasterKey: true });
    if (!extUser) {
      throw new Parse.Error(
        Parse.Error.OBJECT_NOT_FOUND,
        'User information not found. Please contact support.'
      );
    }

    const tenant = extUser.get('TenantId');
    if (!tenant || !tenant.id) {
      throw new Parse.Error(
        Parse.Error.OBJECT_NOT_FOUND,
        'User tenant information not found. Please contact support.'
      );
    }

    const tenantId = tenant.id;

    // Get the tenant
    const query = new Parse.Query('partners_Tenant');
    query.equalTo('objectId', tenantId);

    const tenantObj = await query.first({ useMasterKey: true });
    if (!tenantObj) {
      throw new Parse.Error(
        Parse.Error.OBJECT_NOT_FOUND,
        'Tenant record not found. Please contact support.'
      );
    }

    // Remove the Zapier key
    tenantObj.unset('zapierKey');
    tenantObj.unset('zapierKeyUpdatedAt');

    await tenantObj.save(null, { useMasterKey: true });

    return { success: true, message: 'Zapier key revoked successfully' };
  } catch (error) {
    console.error('Error revoking Zapier key:', error);
    // Re-throw the error with a more user-friendly message while preserving the original error code
    if (error.code) {
      throw new Parse.Error(
        error.code,
        error.message || 'Failed to revoke Zapier key. Please try again later.'
      );
    } else {
      throw new Parse.Error(
        Parse.Error.INTERNAL_SERVER_ERROR,
        'Failed to revoke Zapier key. Please try again later.'
      );
    }
  }
}

// Validate a Zapier key for API requests
export async function validateZapierKey(apiKey) {
  try {
    if (!apiKey || !apiKey.startsWith('zapier_')) {
      return false;
    }

    const query = new Parse.Query('partners_Tenant');
    query.equalTo('zapierKey', apiKey);

    const tenant = await query.first({ useMasterKey: true });

    return !!tenant;
  } catch (error) {
    console.error('Error validating Zapier key:', error);
    return false;
  }
}

export default {
  generateZapierKey,
  getZapierKey,
  revokeZapierKey,
  validateZapierKey,
};
