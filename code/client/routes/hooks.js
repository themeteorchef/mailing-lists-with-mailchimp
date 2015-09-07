var checkUserLoggedIn = function(){
  if( !Meteor.loggingIn() && !Meteor.user() ) {
    Router.go('/');
  } else {
    this.next();
  }
};

Router.onBeforeAction(checkUserLoggedIn, {
  except: [
    'index',
    'signup',
    'login',
    'recover-password',
    'reset-password'
  ]
});

var userAuthenticated = function(){
  if( !Meteor.loggingIn() && Meteor.user() ){
    Router.go('/subscribers');
  } else {
    this.next();
  }
};

Router.onBeforeAction(userAuthenticated, {
  only: [
    'index',
    'signup',
    'login',
    'recover-password',
    'reset-password'
  ]
});
