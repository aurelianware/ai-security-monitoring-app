/**
 * EDI X12 005010X224A2 (837D) Dental Claims Builder
 * Minimal but working implementation for generating 837D transactions
 */

export interface Address {
  street: string;
  city: string;
  state: string;
  zip: string;
}

export interface BillingProvider {
  npi: string;
  taxId: string;
  organizationName: string;
  address: Address;
  contactName: string;
  phone: string;
}

export interface Subscriber {
  memberId: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  address: Address;
}

export interface Patient {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  relationshipToSubscriber: string;
}

export interface ServiceLine {
  procedureCode: string;
  description: string;
  charge: string;
  units: string;
  dateOfService: string;
  tooth?: string;
  surface?: string;
}

export interface Claim {
  claimNumber: string;
  totalCharge: string;
  placeOfService: string;
  dateOfService: string;
  diagnosisCodes: string[];
  serviceLines: ServiceLine[];
}

export interface Payer {
  payerId: string;
  name: string;
  address: Address;
}

export interface ClaimData {
  claimId: string;
  billingProvider: BillingProvider;
  subscriber: Subscriber;
  patient: Patient;
  claim: Claim;
  payer: Payer;
}

const SEGMENT_TERMINATOR = '~';
const ELEMENT_SEPARATOR = '*';
const SUBELEMENT_SEPARATOR = ':';

/**
 * Format date from YYYY-MM-DD to YYYYMMDD
 */
function formatDate(dateStr: string): string {
  return dateStr.replace(/-/g, '');
}

/**
 * Build ISA (Interchange Control Header)
 */
function buildISA(interchangeControlNumber: string): string {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, '').slice(2); // YYMMDD
  const time = now.toTimeString().slice(0, 5).replace(':', ''); // HHMM
  
  return [
    'ISA',
    '00', '          ', // Authorization info
    '00', '          ', // Security info
    'ZZ', 'SENDER123     ', // Sender ID
    'ZZ', 'RECEIVER123   ', // Receiver ID
    date, time,
    '^', '00501', // Standards
    interchangeControlNumber.padStart(9, '0'),
    '0', 'P', ':'
  ].join(ELEMENT_SEPARATOR) + SEGMENT_TERMINATOR;
}

/**
 * Build GS (Functional Group Header)
 */
function buildGS(groupControlNumber: string): string {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD
  const time = now.toTimeString().slice(0, 5).replace(':', ''); // HHMM
  
  return [
    'GS',
    'HC', // Functional ID for Health Care Claim
    'SENDER123',
    'RECEIVER123',
    date, time,
    groupControlNumber,
    'X',
    '005010X224A2'
  ].join(ELEMENT_SEPARATOR) + SEGMENT_TERMINATOR;
}

/**
 * Build ST (Transaction Set Header)
 */
function buildST(transactionControlNumber: string): string {
  return [
    'ST',
    '837', // Transaction Set ID for Health Care Claim
    transactionControlNumber.padStart(4, '0'),
    '005010X224A2'
  ].join(ELEMENT_SEPARATOR) + SEGMENT_TERMINATOR;
}

/**
 * Build BHT (Beginning of Hierarchical Transaction)
 */
function buildBHT(): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const time = new Date().toTimeString().slice(0, 8).replace(/:/g, '');
  
  return [
    'BHT',
    '0019', // Structure code
    '00', // Transaction purpose
    'CLM001', // Reference ID
    date,
    time,
    'CH' // Claim type - chargeable
  ].join(ELEMENT_SEPARATOR) + SEGMENT_TERMINATOR;
}

/**
 * Build NM1 (Individual or Organizational Name)
 */
function buildNM1(
  entityType: string,
  entityCode: string,
  lastName: string,
  firstName: string = '',
  idQualifier: string = '',
  idCode: string = ''
): string {
  const elements = ['NM1', entityType, entityCode, lastName];
  
  if (firstName) elements.push(firstName);
  else elements.push('');
  
  elements.push('', ''); // Middle name and suffix
  elements.push(''); // Name prefix
  
  if (idQualifier) elements.push(idQualifier);
  if (idCode) elements.push(idCode);
  
  return elements.join(ELEMENT_SEPARATOR) + SEGMENT_TERMINATOR;
}

/**
 * Build N3 (Address Information)
 */
function buildN3(street: string): string {
  return ['N3', street].join(ELEMENT_SEPARATOR) + SEGMENT_TERMINATOR;
}

/**
 * Build N4 (Geographic Location)
 */
function buildN4(city: string, state: string, zip: string): string {
  return ['N4', city, state, zip].join(ELEMENT_SEPARATOR) + SEGMENT_TERMINATOR;
}

/**
 * Build REF (Reference Information)
 */
function buildREF(qualifier: string, value: string): string {
  return ['REF', qualifier, value].join(ELEMENT_SEPARATOR) + SEGMENT_TERMINATOR;
}

/**
 * Build PER (Administrative Communications Contact)
 */
function buildPER(contactName: string, phone: string): string {
  return [
    'PER',
    'IC', // Information contact
    contactName,
    'TE', // Telephone
    phone
  ].join(ELEMENT_SEPARATOR) + SEGMENT_TERMINATOR;
}

/**
 * Build HL (Hierarchical Level)
 */
function buildHL(
  hierarchicalId: string,
  parentId: string,
  levelCode: string,
  childCode: string = '1'
): string {
  return [
    'HL',
    hierarchicalId,
    parentId || '',
    levelCode,
    childCode
  ].join(ELEMENT_SEPARATOR) + SEGMENT_TERMINATOR;
}

/**
 * Build PRV (Provider Information)
 */
function buildPRV(providerCode: string, referenceQualifier: string, providerTaxonomy: string): string {
  return [
    'PRV',
    providerCode,
    referenceQualifier,
    providerTaxonomy
  ].join(ELEMENT_SEPARATOR) + SEGMENT_TERMINATOR;
}

/**
 * Build SBR (Subscriber Information)
 */
function buildSBR(payerResponsibility: string, relationshipCode: string): string {
  return [
    'SBR',
    payerResponsibility, // P = Primary
    relationshipCode, // 18 = Self
    '', '', '', '', '', '', // Claim filing indicator code through insurance type
    ''
  ].join(ELEMENT_SEPARATOR) + SEGMENT_TERMINATOR;
}

/**
 * Build DMG (Demographic Information)
 */
function buildDMG(dateOfBirth: string, gender: string): string {
  return [
    'DMG',
    'D8', // Date format qualifier
    formatDate(dateOfBirth),
    gender
  ].join(ELEMENT_SEPARATOR) + SEGMENT_TERMINATOR;
}

/**
 * Build CLM (Claim Information)
 */
function buildCLM(claimNumber: string, totalCharge: string, placeOfService: string): string {
  return [
    'CLM',
    claimNumber,
    totalCharge,
    '', '', '',
    placeOfService + SUBELEMENT_SEPARATOR + 'B' + SUBELEMENT_SEPARATOR + '1', // Place of service
    '', '', '',
    'Y', // Assignment or plan participation code
    'Y', // Benefits assignment certification indicator
    '', '', '', '', '', '', '',
    'A' // Patient signature source code
  ].join(ELEMENT_SEPARATOR) + SEGMENT_TERMINATOR;
}

/**
 * Build DTP (Date or Time or Period)
 */
function buildDTP(qualifier: string, formatQualifier: string, date: string): string {
  return [
    'DTP',
    qualifier,
    formatQualifier,
    formatDate(date)
  ].join(ELEMENT_SEPARATOR) + SEGMENT_TERMINATOR;
}

/**
 * Build HI (Health Care Diagnosis Code)
 */
function buildHI(diagnosisCodes: string[]): string {
  const elements = ['HI'];
  
  diagnosisCodes.forEach((code, index) => {
    const qualifier = index === 0 ? 'ABK' : 'ABF';
    elements.push(qualifier + SUBELEMENT_SEPARATOR + code);
  });
  
  return elements.join(ELEMENT_SEPARATOR) + SEGMENT_TERMINATOR;
}

/**
 * Build LX (Service Line Number)
 */
function buildLX(lineNumber: string): string {
  return ['LX', lineNumber].join(ELEMENT_SEPARATOR) + SEGMENT_TERMINATOR;
}

/**
 * Build SV3 (Dental Service)
 */
function buildSV3(
  procedureCode: string,
  charge: string,
  placeOfService: string,
  procedureCount: string,
  tooth: string = '',
  surface: string = ''
): string {
  const composite = [
    'AD', // Product/Service ID Qualifier
    procedureCode
  ];
  
  if (tooth) {
    composite.push(tooth);
  }
  
  if (surface) {
    composite.push('', '', surface); // Empty fields before surface
  }
  
  return [
    'SV3',
    composite.join(SUBELEMENT_SEPARATOR),
    charge,
    placeOfService,
    '', '',
    procedureCount
  ].join(ELEMENT_SEPARATOR) + SEGMENT_TERMINATOR;
}

/**
 * Build SE (Transaction Set Trailer)
 */
function buildSE(segmentCount: number, transactionControlNumber: string): string {
  return [
    'SE',
    segmentCount.toString(),
    transactionControlNumber.padStart(4, '0')
  ].join(ELEMENT_SEPARATOR) + SEGMENT_TERMINATOR;
}

/**
 * Build GE (Functional Group Trailer)
 */
function buildGE(transactionCount: number, groupControlNumber: string): string {
  return [
    'GE',
    transactionCount.toString(),
    groupControlNumber
  ].join(ELEMENT_SEPARATOR) + SEGMENT_TERMINATOR;
}

/**
 * Build IEA (Interchange Control Trailer)
 */
function buildIEA(groupCount: number, interchangeControlNumber: string): string {
  return [
    'IEA',
    groupCount.toString(),
    interchangeControlNumber.padStart(9, '0')
  ].join(ELEMENT_SEPARATOR) + SEGMENT_TERMINATOR;
}

/**
 * Main function to build 837D transaction
 */
export function build837D(claimData: ClaimData): string {
  const segments: string[] = [];
  const interchangeControlNumber = '000000001';
  const groupControlNumber = '1';
  const transactionControlNumber = '0001';
  
  // ISA - Interchange Control Header
  segments.push(buildISA(interchangeControlNumber));
  
  // GS - Functional Group Header
  segments.push(buildGS(groupControlNumber));
  
  // ST - Transaction Set Header
  segments.push(buildST(transactionControlNumber));
  
  // BHT - Beginning of Hierarchical Transaction
  segments.push(buildBHT());
  
  // 1000A - Submitter
  segments.push(buildNM1('41', '2', claimData.billingProvider.organizationName, '', 'XX', '123456789'));
  segments.push(buildPER(claimData.billingProvider.contactName, claimData.billingProvider.phone));
  
  // 1000B - Receiver
  segments.push(buildNM1('40', '2', claimData.payer.name, '', '46', claimData.payer.payerId));
  
  // 2000A - Billing Provider Hierarchical Level
  segments.push(buildHL('1', '', '20', '1')); // 20 = Information source
  segments.push(buildPRV('BI', 'PXC', '1223G0001X')); // Billing provider taxonomy
  
  // 2010AA - Billing Provider Name
  segments.push(buildNM1('85', '2', claimData.billingProvider.organizationName, '', 'XX', claimData.billingProvider.npi));
  segments.push(buildN3(claimData.billingProvider.address.street));
  segments.push(buildN4(
    claimData.billingProvider.address.city,
    claimData.billingProvider.address.state,
    claimData.billingProvider.address.zip
  ));
  segments.push(buildREF('EI', claimData.billingProvider.taxId));
  
  // 2000B - Subscriber Hierarchical Level
  segments.push(buildHL('2', '1', '22', '0')); // 22 = Subscriber
  segments.push(buildSBR('P', claimData.patient.relationshipToSubscriber));
  
  // 2010BA - Subscriber Name
  segments.push(buildNM1(
    'IL',
    '1',
    claimData.subscriber.lastName,
    claimData.subscriber.firstName,
    'MI',
    claimData.subscriber.memberId
  ));
  segments.push(buildN3(claimData.subscriber.address.street));
  segments.push(buildN4(
    claimData.subscriber.address.city,
    claimData.subscriber.address.state,
    claimData.subscriber.address.zip
  ));
  segments.push(buildDMG(claimData.subscriber.dateOfBirth, claimData.subscriber.gender));
  
  // 2010BB - Payer Name
  segments.push(buildNM1('PR', '2', claimData.payer.name, '', 'PI', claimData.payer.payerId));
  segments.push(buildN3(claimData.payer.address.street));
  segments.push(buildN4(
    claimData.payer.address.city,
    claimData.payer.address.state,
    claimData.payer.address.zip
  ));
  
  // 2300 - Claim Information
  segments.push(buildCLM(
    claimData.claim.claimNumber,
    claimData.claim.totalCharge,
    claimData.claim.placeOfService
  ));
  segments.push(buildDTP('472', 'D8', claimData.claim.dateOfService)); // Service date
  segments.push(buildHI(claimData.claim.diagnosisCodes));
  
  // 2400 - Service Line Information
  claimData.claim.serviceLines.forEach((line, index) => {
    segments.push(buildLX((index + 1).toString()));
    segments.push(buildSV3(
      line.procedureCode,
      line.charge,
      claimData.claim.placeOfService,
      line.units,
      line.tooth,
      line.surface
    ));
    segments.push(buildDTP('472', 'D8', line.dateOfService));
  });
  
  // SE - Transaction Set Trailer (count includes SE itself)
  const segmentCount = segments.length - 2 + 1; // Exclude ISA, GS, add 1 for SE
  segments.push(buildSE(segmentCount, transactionControlNumber));
  
  // GE - Functional Group Trailer
  segments.push(buildGE(1, groupControlNumber));
  
  // IEA - Interchange Control Trailer
  segments.push(buildIEA(1, interchangeControlNumber));
  
  return segments.join('\n');
}
