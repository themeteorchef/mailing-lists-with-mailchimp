Template.registerHelper( 'currentRoute', function(route){
  return Session.equals('currentRoute', route) ? 'active' : '';
});

Template.registerHelper( 'count', function( array ) {
  return array ? array.length : 0;
});
