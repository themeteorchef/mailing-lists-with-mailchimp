Template.subscribers.onCreated( function() {
  var self = this;
  self.subscribers = new ReactiveVar();

  self.getSubscribers = function() {
    Meteor.call( 'getSubscribers', function( error, response ) {
      if ( error ) {
        Bert.alert( error.reason, "warning" );
      } else {
        self.subscribers.set( response );
      }
    });
  };

  self.getSubscribers();

});

Template.subscribers.helpers({
  subscribers: function() {
    return Template.instance().subscribers.get();
  }
});


Template.subscribers.events({
  'click .remove-subscriber': function( event, template ) {
    if ( confirm( "Are you sure you want to delete this subscriber? This is permanent." ) ) {
      handleSubscriber({
        email: this.email,
        action: 'unsubscribe'
      }, template );
    }
  }
});
