import { describe, it, expect, beforeEach } from 'vitest';

// Mock implementation for testing Clarity contracts
// In a real environment, you would use actual Clarity testing tools

// Mock principal addresses
const ADMIN = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';
const INVENTOR1 = 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG';
const INVENTOR2 = 'ST2JHG361ZXG51QTKY2NQCVBPPRRE2KZB1HR05NNC';

// Mock contract state
let state = {
  admin: ADMIN,
  inventors: new Map(),
};

// Mock contract functions
const inventorVerification = {
  registerInventor: (caller, name, credentials) => {
    if (state.inventors.has(caller)) {
      return { type: 'err', value: 1 };
    }
    
    state.inventors.set(caller, {
      name,
      credentials,
      'verification-date': 123, // Mock block height
      'is-verified': false
    });
    
    return { type: 'ok', value: true };
  },
  
  verifyInventor: (caller, inventorId) => {
    if (caller !== state.admin) {
      return { type: 'err', value: 403 };
    }
    
    if (!state.inventors.has(inventorId)) {
      return { type: 'err', value: 404 };
    }
    
    const inventor = state.inventors.get(inventorId);
    inventor['is-verified'] = true;
    state.inventors.set(inventorId, inventor);
    
    return { type: 'ok', value: true };
  },
  
  isInventor: (address) => {
    return state.inventors.has(address);
  },
  
  isVerifiedInventor: (address) => {
    if (!state.inventors.has(address)) {
      return false;
    }
    return state.inventors.get(address)['is-verified'];
  },
  
  transferAdmin: (caller, newAdmin) => {
    if (caller !== state.admin) {
      return { type: 'err', value: 403 };
    }
    
    state.admin = newAdmin;
    return { type: 'ok', value: true };
  }
};

describe('Inventor Verification Contract', () => {
  beforeEach(() => {
    // Reset state before each test
    state = {
      admin: ADMIN,
      inventors: new Map(),
    };
  });
  
  it('should allow an inventor to register', () => {
    const result = inventorVerification.registerInventor(
        INVENTOR1,
        'John Doe',
        'PhD in Computer Science, 10 years experience'
    );
    
    expect(result.type).toBe('ok');
    expect(state.inventors.has(INVENTOR1)).toBe(true);
    expect(state.inventors.get(INVENTOR1)['is-verified']).toBe(false);
  });
  
  it('should not allow duplicate registration', () => {
    inventorVerification.registerInventor(
        INVENTOR1,
        'John Doe',
        'PhD in Computer Science'
    );
    
    const result = inventorVerification.registerInventor(
        INVENTOR1,
        'John Doe Again',
        'Different credentials'
    );
    
    expect(result.type).toBe('err');
    expect(result.value).toBe(1);
  });
  
  it('should allow admin to verify an inventor', () => {
    inventorVerification.registerInventor(
        INVENTOR1,
        'John Doe',
        'PhD in Computer Science'
    );
    
    const result = inventorVerification.verifyInventor(ADMIN, INVENTOR1);
    
    expect(result.type).toBe('ok');
    expect(state.inventors.get(INVENTOR1)['is-verified']).toBe(true);
  });
  
  it('should not allow non-admin to verify an inventor', () => {
    inventorVerification.registerInventor(
        INVENTOR1,
        'John Doe',
        'PhD in Computer Science'
    );
    
    const result = inventorVerification.verifyInventor(INVENTOR2, INVENTOR1);
    
    expect(result.type).toBe('err');
    expect(result.value).toBe(403);
    expect(state.inventors.get(INVENTOR1)['is-verified']).toBe(false);
  });
  
  it('should correctly identify verified inventors', () => {
    inventorVerification.registerInventor(
        INVENTOR1,
        'John Doe',
        'PhD in Computer Science'
    );
    
    expect(inventorVerification.isInventor(INVENTOR1)).toBe(true);
    expect(inventorVerification.isVerifiedInventor(INVENTOR1)).toBe(false);
    
    inventorVerification.verifyInventor(ADMIN, INVENTOR1);
    
    expect(inventorVerification.isVerifiedInventor(INVENTOR1)).toBe(true);
    expect(inventorVerification.isVerifiedInventor(INVENTOR2)).toBe(false);
  });
  
  it('should allow admin transfer', () => {
    const result = inventorVerification.transferAdmin(ADMIN, INVENTOR1);
    
    expect(result.type).toBe('ok');
    expect(state.admin).toBe(INVENTOR1);
  });
});
