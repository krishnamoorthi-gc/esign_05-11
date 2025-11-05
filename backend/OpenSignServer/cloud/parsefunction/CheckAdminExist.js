// `CheckAdminExist` is used to check is admin with org exist or not in db
export default async function CheckAdminExist(request) {
  const domain =
    request.params.domain ||
    (process.env.SERVER_URL ? new URL(process.env.SERVER_URL).hostname : 'localhost');
  try {
    let extAdminRes;
    const extClsQuery = new Parse.Query('contracts_Users');
    extClsQuery.equalTo('UserRole', 'contracts_Admin');
    extClsQuery.notEqualTo('IsDisabled', true);

    // Always check for admin within the specific domain
    // First get the tenant for this domain
    const tenantQuery = new Parse.Query('partners_Tenant');
    tenantQuery.equalTo('Domain', domain);
    const tenant = await tenantQuery.first({ useMasterKey: true });

    if (tenant) {
      // Check if admin exists for this specific tenant
      extClsQuery.equalTo('TenantId', tenant);
      extAdminRes = await extClsQuery.first({ useMasterKey: true });

      if (extAdminRes && extAdminRes.get('OrganizationId')) {
        return 'exist';
      } else {
        return 'not_exist';
      }
    } else {
      // No tenant for this domain, so no admin
      return 'not_exist';
    }
  } catch (err) {
    console.log('err in isAdminExist', err);
    const code = err?.code || 400;
    const msg = err?.message || 'something went wrong.';
    throw new Parse.Error(code, msg);
  }
}
