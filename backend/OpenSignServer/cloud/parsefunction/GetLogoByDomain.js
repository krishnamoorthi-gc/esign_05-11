import { appName } from '../../Utils.js';

// `GetLogoByDomain` is used to get logo by domain as well as check any tenant exist or not in db
export default async function GetLogoByDomain(request) {
  // Use provided domain or fallback to server URL hostname
  const domain =
    request.params.domain ||
    (process.env.SERVER_URL ? new URL(process.env.SERVER_URL).hostname : 'localhost');
  try {
    const tenantCreditsQuery = new Parse.Query('partners_Tenant');
    tenantCreditsQuery.equalTo('Domain', domain);
    const res = await tenantCreditsQuery.first({ useMasterKey: true });
    if (res) {
      const updateRes = JSON.parse(JSON.stringify(res));
      // Check if admin exists for this specific tenant
      const extClsQuery = new Parse.Query('contracts_Users');
      extClsQuery.equalTo('UserRole', 'contracts_Admin');
      extClsQuery.equalTo('TenantId', res); // Only check within this tenant
      extClsQuery.notEqualTo('IsDisabled', true);
      const extAdminRes = await extClsQuery.first({ useMasterKey: true });

      return {
        logo: updateRes?.Logo,
        appname: appName,
        user: extAdminRes ? 'exist' : 'not_exist', // Only mark as exist if admin exists for this tenant
      };
    } else {
      // No tenant for this domain
      return { logo: '', appname: appName, user: 'not_exist' };
    }
  } catch (err) {
    const code = err.code || 400;
    const msg = err.message || 'Something went wrong.';
    throw new Parse.Error(code, msg);
  }
}
