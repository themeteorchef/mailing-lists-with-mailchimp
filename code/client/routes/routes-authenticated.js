Router.route('subscribers', {
  path: '/subscribers',
  template: 'subscribers',
  onBeforeAction: function(){
    Session.set( 'currentRoute', 'subscribers' );
    this.next();
  }
});
