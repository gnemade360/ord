using { cuid, managed, sap.common.CodeList } from '@sap/cds/common';

namespace sap.capire.incidents;

/**
 * Customers using products sold by our company.
 * Customers can create support Incidents.
 */
@ORD.schema: 'sap.customer.v1'
@ORD.lineage: {
  source: 'SAP S/4HANA',
  transformations: ['cleanse', 'enrich', 'validate']
}
entity Customers : managed {
  key ID         : String;
  firstName      : String;
  lastName       : String;
  @ORD.tag: ['public']
  name           : String = firstName ||' '|| lastName;
  @ORD.tag: ['PII', 'sensitive', 'GDPR-relevant']
  email          : EMailAddress;
  phone          : PhoneNumber;
  @ORD.tag: ['PII', 'encrypted']
  creditCardNo   : String(16) @assert.format: '^[1-9]\d{15}$';
  addresses      : Composition of many Addresses on addresses.customer = $self;
  incidents      : Association to many Incidents on incidents.customer = $self;
}

@ORD.schema: 'sap.address.v1'
entity Addresses : cuid, managed {
  customer       : Association to Customers;
  city           : String;
  postCode       : String;
  streetAddress  : String;
}


/**
 * Incidents created by Customers.
 */
@ORD.schema: 'sap.incident.v1'
entity Incidents : cuid, managed {
  customer       : Association to Customers;
  title          : String @title: 'Title';
  urgency        : Association to Urgency default 'M';
  status         : Association to Status default 'N';
}

entity Status : CodeList {
  key code    : String enum {
    new        = 'N';
    assigned   = 'A';
    in_process = 'I';
    on_hold    = 'H';
    resolved   = 'R';
    closed     = 'C';
  };
  criticality : Integer;
}

entity Urgency : CodeList {
  key code : String enum {
    high   = 'H';
    medium = 'M';
    low    = 'L';
  };
}

type EMailAddress : String;
type PhoneNumber  : String;