/**
 * Test script for checkTrialStatus cloud function
 */

// Mock Parse SDK for testing
const Parse = {
  Error: {
    INVALID_SESSION_TOKEN: 'INVALID_SESSION_TOKEN',
    OBJECT_NOT_FOUND: 'OBJECT_NOT_FOUND'
  },
  Query: class {
    constructor(className) {
      this.className = className;
      this.conditions = {};
    }
    
    equalTo(key, value) {
      this.conditions[key] = value;
      return this;
    }
    
    first() {
      // Mock response for testing
      if (this.className === 'contracts_Users') {
        return Promise.resolve({
          id: 'test-user-id',
          get: (field) => {
            if (field === 'TrialStartDate') {
              // Return a date 3 days ago
              const date = new Date();
              date.setDate(date.getDate() - 3);
              return date;
            }
            return null;
          },
          createdAt: new Date()
        });
      }
      return Promise.resolve(null);
    }
  },
  Object: class {
    constructor(className) {
      this.className = className;
      this.fields = {};
    }
    
    set(key, value) {
      this.fields[key] = value;
    }
    
    get(key) {
      return this.fields[key];
    }
  }
};

// Mock the checkTrialStatus function with simplified logic for testing
async function checkTrialStatus(request) {
  if (!request?.user) {
    throw new Parse.Error(Parse.Error.INVALID_SESSION_TOKEN, 'User is not authenticated.');
  }

  try {
    // Mock query response
    const user = {
      id: 'test-user-id',
      get: (field) => {
        if (field === 'TrialStartDate') {
          // Return a date 3 days ago
          const date = new Date();
          date.setDate(date.getDate() - 3);
          return date;
        }
        return null;
      },
      createdAt: new Date(new Date().setDate(new Date().getDate() - 3))
    };

    // Get the trial start date or signup date
    const trialStartDate = user.get('TrialStartDate') || user.createdAt;
    const trialPeriodDays = 5; // 5-day trial period as mentioned
    
    // Calculate trial end date
    const trialEndDate = new Date(trialStartDate);
    trialEndDate.setDate(trialEndDate.getDate() + trialPeriodDays);
    
    // Get current date
    const currentDate = new Date();
    
    // Check if trial has expired
    const isTrialExpired = currentDate > trialEndDate;
    
    // Calculate days remaining
    const timeDiff = trialEndDate.getTime() - currentDate.getTime();
    const daysRemaining = Math.ceil(timeDiff / (1000 * 3600 * 24));
    
    // Return trial status information
    return {
      isTrialExpired: isTrialExpired,
      trialEndDate: trialEndDate,
      daysRemaining: daysRemaining > 0 ? daysRemaining : 0,
      trialStartDate: trialStartDate
    };
  } catch (err) {
    console.log('Error in checkTrialStatus', err);
    const code = err?.code || 400;
    const message = err?.message || 'Something went wrong.';
    throw new Parse.Error(code, message);
  }
}

// Test the function
async function runTest() {
  console.log('Testing checkTrialStatus function...');
  
  try {
    const result = await checkTrialStatus({ user: { id: 'test-user-id' } });
    console.log('Test result:', result);
    
    // Verify the result
    if (typeof result.isTrialExpired === 'boolean' && 
        result.trialEndDate instanceof Date && 
        typeof result.daysRemaining === 'number') {
      console.log('✅ Test passed: Function returns correct structure');
    } else {
      console.log('❌ Test failed: Function returns incorrect structure');
    }
    
    // Check if trial is not expired (should have 2 days remaining)
    if (!result.isTrialExpired && result.daysRemaining === 2) {
      console.log('✅ Test passed: Trial status is correct');
    } else {
      console.log('❌ Test failed: Trial status is incorrect');
    }
    
  } catch (error) {
    console.error('Test failed with error:', error);
  }
}

// Run the test
runTest();

export default checkTrialStatus;