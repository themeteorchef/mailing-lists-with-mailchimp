Template.index.onRendered( function() {

  var template = this;

  $( "#mailing-list" ).validate({
    rules: {
      emailAddress: {
        email: true,
        required : true
      }
    },
    messages: {
      emailAddress: {
        email: "Please use a valid email address!",
        required: "An email address is required."
      }
    },
    errorPlacement: function( error, element ) {
      $( ".error-message" ).text( error[0].innerText );
    },
    submitHandler: function() {
      handleSubscriber({
        email: template.find( "[name='emailAddress']" ).value,
        action: 'subscribe'
      });
    }
  });
});

Template.index.events({
  'submit form': function( event ) {
    event.preventDefault();
  }
});
