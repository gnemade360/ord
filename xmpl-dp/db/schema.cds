namespace sap.cds.demo;

@ODM.root                     : true
@ODM.entityName               : 'Cinema'
@ODM.oid                      : 'id'
@title                        : 'Cinema Title'
@ORD.schema: 'sap.entertainment.venue.v1'
@ORD.lineage: {
  source: 'External Venue API',
  transformations: ['geocode', 'normalize']
}
entity Cinema {
    key id : UUID;
    name: String(50);
    location: String(100);
}

@ObjectModel.compositionRoot  : true
@EntityRelationship.entityType: 'customer.sample:Movie'
@title                        : 'Movie Details'
@ORD.schema: 'sap.entertainment.content.v1'
entity Movie {
    key id : UUID;
    title: String(100);
    genre: String(50);
    duration: Integer;
    shows: Composition of many Show on shows.movie = $self;

}


@EntityRelationship.entityType: 'customer.sample:Show'
@title                        : 'Show Details'
entity Show {
    key id : UUID;
    movie: Association to one Movie not null;
    specialEvent: Boolean;
    location: Association to one Cinema not null;
}