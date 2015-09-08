handleSubscriber = function( subscriber, template ) {
  Meteor.call( "handleSubscriber", subscriber, function( error, response ) {
    if ( error ) {
      Bert.alert( error.reason, "warning" );
    } else {
      if ( response.complete || response.euid ) {
        var subscribeMessage   = "Please confirm your email to complete your subscription!",
            unsubscribeMessage = subscriber.email + " successfully unsubscribed!",
            message            = subscriber.action === "subscribe" ? subscribeMessage : unsubscribeMessage;

        Bert.alert( message, "success" );
        if ( template ) { template.getSubscribers(); }
      } else {
        Bert.alert( response.message, "warning" );
      }
    }
  });
};
