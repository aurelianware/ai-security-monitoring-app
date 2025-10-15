# EDI X12 837D Dental Claims Generator

Node/TypeScript package for generating X12 005010X224A2 (837D) dental claims.

## Features

- ✅ Minimal but working 837D builder (`build837D`)
- ✅ Covers headers, billing provider, subscriber, claim, and basic service lines (SV3)
- ✅ CLI tool to generate `.837d` files from JSON
- ✅ Full test coverage with vitest

## Installation

```bash
npm install
```

## Build

```bash
npm run build
```

## Usage

### CLI

Generate an 837D file from sample data:

```bash
npm run gen:837d
```

This reads from `sample/claim.json` and outputs to `outbox/CLM0001.837d`.

### Programmatic

```typescript
import { build837D, type ClaimData } from '@aurelianware/edi-x12';

const claimData: ClaimData = {
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
        dateOfService: '2025-10-01'
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

const edi837d = build837D(claimData);
console.log(edi837d);
```

## Testing

```bash
npm test
```

Run tests in watch mode:

```bash
npm run test:watch
```

## Output Format

The generated 837D file follows the X12 005010X224A2 standard with:

- **ISA**: Interchange Control Header
- **GS**: Functional Group Header
- **ST**: Transaction Set Header (837)
- **BHT**: Beginning of Hierarchical Transaction
- **1000A**: Submitter information
- **1000B**: Receiver (payer) information
- **2000A**: Billing provider hierarchical level
- **2010AA**: Billing provider name and address
- **2000B**: Subscriber hierarchical level
- **2010BA**: Subscriber name and demographics
- **2010BB**: Payer name and address
- **2300**: Claim information (CLM, DTP, HI)
- **2400**: Service line information (LX, SV3, DTP)
- **SE**: Transaction Set Trailer
- **GE**: Functional Group Trailer
- **IEA**: Interchange Control Trailer

## Demo Notice

⚠️ **This is a demo implementation** - not production-complete. Future enhancements:

- Complete tooth/surface loops
- PWK/275 attachments support
- Payer-specific profiles
- 999/277/835 response adapters
- SFTP/AS2 transport support
- Enhanced validation

## License

MIT
