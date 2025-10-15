/**
 * Tests for 837D Builder
 */

import { describe, it, expect } from 'vitest';
import { build837D, type ClaimData } from '../src/builder837D.js';

const sampleClaim: ClaimData = {
  claimId: 'CLM0001',
  billingProvider: {
    npi: '1234567890',
    taxId: '123456789',
    organizationName: 'Dental Practice Inc',
    address: {
      street: '123 Main Street',
      city: 'New York',
      state: 'NY',
      zip: '10001'
    },
    contactName: 'Dr. John Smith',
    phone: '2125551234'
  },
  subscriber: {
    memberId: 'SUB123456',
    firstName: 'Jane',
    lastName: 'Doe',
    dateOfBirth: '1985-03-15',
    gender: 'F',
    address: {
      street: '456 Oak Avenue',
      city: 'New York',
      state: 'NY',
      zip: '10002'
    }
  },
  patient: {
    firstName: 'Jane',
    lastName: 'Doe',
    dateOfBirth: '1985-03-15',
    gender: 'F',
    relationshipToSubscriber: '18'
  },
  claim: {
    claimNumber: 'CLM0001',
    totalCharge: '350.00',
    placeOfService: '11',
    dateOfService: '2025-10-01',
    diagnosisCodes: ['K02.9'],
    serviceLines: [
      {
        procedureCode: 'D0120',
        description: 'Periodic oral evaluation',
        charge: '75.00',
        units: '1',
        dateOfService: '2025-10-01',
        tooth: '',
        surface: ''
      },
      {
        procedureCode: 'D2391',
        description: 'Resin-based composite',
        charge: '150.00',
        units: '1',
        dateOfService: '2025-10-01',
        tooth: '19',
        surface: 'O'
      }
    ]
  },
  payer: {
    payerId: '12345',
    name: 'Delta Dental',
    address: {
      street: '789 Insurance Plaza',
      city: 'Hartford',
      state: 'CT',
      zip: '06103'
    }
  }
};

describe('build837D', () => {
  it('should generate valid 837D transaction', () => {
    const result = build837D(sampleClaim);
    
    expect(result).toBeDefined();
    expect(result.length).toBeGreaterThan(0);
    expect(typeof result).toBe('string');
  });
  
  it('should start with ISA segment', () => {
    const result = build837D(sampleClaim);
    
    expect(result).toMatch(/^ISA\*/);
  });
  
  it('should end with IEA segment', () => {
    const result = build837D(sampleClaim);
    const segments = result.split('\n');
    
    expect(segments[segments.length - 1]).toMatch(/^IEA\*/);
  });
  
  it('should contain required segments', () => {
    const result = build837D(sampleClaim);
    
    // Check for required segments
    expect(result).toContain('ISA*'); // Interchange header
    expect(result).toContain('GS*');  // Functional group header
    expect(result).toContain('ST*');  // Transaction set header
    expect(result).toContain('BHT*'); // Beginning of hierarchical transaction
    expect(result).toContain('NM1*'); // Name segments
    expect(result).toContain('HL*');  // Hierarchical level
    expect(result).toContain('CLM*'); // Claim information
    expect(result).toContain('SV3*'); // Dental service
    expect(result).toContain('SE*');  // Transaction set trailer
    expect(result).toContain('GE*');  // Functional group trailer
    expect(result).toContain('IEA*'); // Interchange trailer
  });
  
  it('should include billing provider information', () => {
    const result = build837D(sampleClaim);
    
    expect(result).toContain('Dental Practice Inc');
    expect(result).toContain('1234567890'); // NPI
    expect(result).toContain('123456789');  // Tax ID
  });
  
  it('should include subscriber information', () => {
    const result = build837D(sampleClaim);
    
    expect(result).toContain('Doe');
    expect(result).toContain('Jane');
    expect(result).toContain('SUB123456'); // Member ID
  });
  
  it('should include payer information', () => {
    const result = build837D(sampleClaim);
    
    expect(result).toContain('Delta Dental');
    expect(result).toContain('12345'); // Payer ID
  });
  
  it('should include claim information', () => {
    const result = build837D(sampleClaim);
    
    expect(result).toContain('CLM0001');  // Claim number
    expect(result).toContain('350.00');   // Total charge
  });
  
  it('should include service lines', () => {
    const result = build837D(sampleClaim);
    
    expect(result).toContain('D0120');  // Procedure code 1
    expect(result).toContain('75.00');  // Charge 1
    expect(result).toContain('D2391');  // Procedure code 2
    expect(result).toContain('150.00'); // Charge 2
  });
  
  it('should include tooth and surface information when provided', () => {
    const result = build837D(sampleClaim);
    
    expect(result).toContain('19'); // Tooth number
    expect(result).toContain('O');  // Surface
  });
  
  it('should format dates correctly (YYYYMMDD)', () => {
    const result = build837D(sampleClaim);
    
    expect(result).toContain('20251001'); // Formatted date
  });
  
  it('should count segments correctly in SE segment', () => {
    const result = build837D(sampleClaim);
    const segments = result.split('\n');
    
    // Find SE segment
    const seSegment = segments.find(s => s.startsWith('SE*'));
    expect(seSegment).toBeDefined();
    
    if (seSegment) {
      const parts = seSegment.split('*');
      const segmentCount = parseInt(parts[1]);
      
      // Count segments between ST and SE (inclusive)
      const stIndex = segments.findIndex(s => s.startsWith('ST*'));
      const seIndex = segments.findIndex(s => s.startsWith('SE*'));
      const actualCount = seIndex - stIndex + 1;
      
      expect(segmentCount).toBe(actualCount);
    }
  });
  
  it('should use correct segment terminators', () => {
    const result = build837D(sampleClaim);
    const segments = result.split('\n');
    
    // All segments (except possibly last) should end with ~
    segments.slice(0, -1).forEach(segment => {
      if (segment.trim()) {
        expect(segment).toMatch(/~$/);
      }
    });
  });
  
  it('should use correct element separator', () => {
    const result = build837D(sampleClaim);
    
    // Check that segments use * as element separator
    expect(result).toContain('ISA*');
    expect(result).toContain('GS*');
    expect(result).toContain('ST*');
  });
  
  it('should handle multiple service lines', () => {
    const result = build837D(sampleClaim);
    const segments = result.split('\n');
    
    // Count LX segments (one per service line)
    const lxSegments = segments.filter(s => s.startsWith('LX*'));
    expect(lxSegments.length).toBe(sampleClaim.claim.serviceLines.length);
  });
});
