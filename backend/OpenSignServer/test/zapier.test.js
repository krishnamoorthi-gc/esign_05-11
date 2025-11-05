/**
 * Test suite for Zapier Integration functionality
 */

import {
  generateZapierKey,
  getZapierKey,
  revokeZapierKey,
} from '../cloud/parsefunction/ZapierController.js';

describe('Zapier Integration Tests', () => {
  let mockRequest;
  let mockUser;
  let mockTenant;

  beforeEach(() => {
    // Mock user object
    mockUser = {
      id: 'user123',
      get: jasmine.createSpy('userGet').and.callFake(key => {
        if (key === 'tenantId') return 'tenant123';
        return null;
      }),
    };

    // Mock tenant object
    mockTenant = {
      id: 'tenant123',
      get: jasmine.createSpy('tenantGet').and.callFake(key => {
        if (key === 'zapierKey') return 'zapier_testkey123';
        if (key === 'zapierKeyUpdatedAt') return new Date();
        return null;
      }),
      set: jasmine.createSpy('tenantSet'),
      unset: jasmine.createSpy('tenantUnset'),
      save: jasmine.createSpy('tenantSave').and.resolveTo({}),
    };

    // Mock request object
    mockRequest = {
      user: mockUser,
    };

    // Mock Parse.Query
    spyOn(Parse, 'Query').and.returnValue({
      equalTo: jasmine.createSpy('equalTo').and.returnValueThis(),
      first: jasmine.createSpy('first').and.resolveTo(mockTenant),
    });

    // Mock Parse.Object
    spyOn(Parse.Object, 'extend').and.returnValue(function () {
      return mockTenant;
    });
  });

  describe('generateZapierKey', () => {
    it('should generate a new Zapier key for a valid user', async () => {
      const result = await generateZapierKey(mockRequest);

      expect(result).toBeDefined();
      expect(result.key).toMatch(/^zapier_[a-f0-9]{64}$/);
      expect(result.updatedAt).toBeDefined();
      expect(mockTenant.set).toHaveBeenCalledWith('zapierKey', jasmine.any(String));
      expect(mockTenant.set).toHaveBeenCalledWith('zapierKeyUpdatedAt', jasmine.any(Date));
      expect(mockTenant.save).toHaveBeenCalledWith(null, { useMasterKey: true });
    });

    it('should throw an error if user is not authenticated', async () => {
      mockRequest.user = null;

      try {
        await generateZapierKey(mockRequest);
        fail('Expected error was not thrown');
      } catch (error) {
        expect(error.code).toBe(Parse.Error.INVALID_SESSION_TOKEN);
        expect(error.message).toBe('User not authenticated');
      }
    });
  });

  describe('getZapierKey', () => {
    it('should return the existing Zapier key for a tenant', async () => {
      const result = await getZapierKey(mockRequest);

      expect(result).toBeDefined();
      expect(result.key).toBe('zapier_testkey123');
      expect(mockTenant.get).toHaveBeenCalledWith('zapierKey');
    });

    it('should return null if no Zapier key exists', async () => {
      mockTenant.get.and.callFake(key => {
        if (key === 'zapierKey') return null;
        return null;
      });

      const result = await getZapierKey(mockRequest);

      expect(result.key).toBeNull();
    });
  });

  describe('revokeZapierKey', () => {
    it('should revoke the existing Zapier key', async () => {
      const result = await revokeZapierKey(mockRequest);

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(mockTenant.unset).toHaveBeenCalledWith('zapierKey');
      expect(mockTenant.unset).toHaveBeenCalledWith('zapierKeyUpdatedAt');
      expect(mockTenant.save).toHaveBeenCalledWith(null, { useMasterKey: true });
    });
  });
});
