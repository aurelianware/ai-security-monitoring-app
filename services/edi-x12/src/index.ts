/**
 * EDI X12 005010X224A2 (837D) Dental Claims Package
 * Main entry point
 */

export {
  build837D,
  type ClaimData,
  type BillingProvider,
  type Subscriber,
  type Patient,
  type Claim,
  type ServiceLine,
  type Payer,
  type Address
} from './builder837D.js';
