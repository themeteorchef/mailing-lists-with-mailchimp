### Getting started
To get started, we need to add a few packages to our application that will help us to manage our mailing list.

<p class="block-header">Terminal</p>

```bash
meteor add miro:mailchimp
```
This package will give us access to the [Node MailChimp libray](https://github.com/gomfunkel/node-mailchimp). We'll use this to interact with the MailChimp API for things like adding and removing subscribers from our list, and grabbing our current list of subscribers. **Note**: as of writing, this package only supports [version 2.0 of the MailChimp API](https://apidocs.mailchimp.com/api/2.0/), not the latest [version 3.0](https://kb.mailchimp.com/api/). This is due to a lack of support for version 3.0 of the API in the Node MailChimp dependency.

<p class="block-header">Terminal</p>

```bash
meteor add reactive-var
```
We'll use this package to help us in fetching the current list of subscribers to our mailing list from MailChimp for display in an admin interface.

<p class="block-header">Terminal</p>

```bash
meteor add fortawesome:fontawesome
```
We'll use this package to give us access to a "remove" icon that we can use when managing our mailing list.

<div class="note">
  <h3>Additional Packages <i class="fa fa-warning"></i></h3>
  <p>This recipe relies on several other packages that come as part of <a href="https://github.com/themeteorchef/base">Base</a>, the boilerplate kit used here on The Meteor Chef. The packages listed above are merely recipe-specific additions to the packages that are included by default in the kit. Make sure to reference the <a href="https://github.com/themeteorchef/base#packages-included">Packages Included list</a> for Base to ensure you have fulfilled all of the dependencies.</p>
</div>

With these in place, we're ready to get started! First up is creating a signup form where visitors can enter their email. Let's jump in.

### Signup form
In order to actually get people on to our mailing list, we need a way for them to sign up. To do this, we're going to keep things simple and add a quick signup form to our home page. Let's take a look at the template and then review the logic to see how people are added to our list.

<p class="block-header">/client/templates/public/index.html</p>

```markup
<template name="index">
  <div class="jumbotron text-center">
    <img width="250" src="https://images.unsplash.com/1/apple-gear-looking-pretty.jpg" alt="Startup Starter Kit">
    <h2>Stealth</h2>
    <p>We're a new startup that's going to revolutionize how you do stuff. Seriously. Remember email? This is like that but better. Join our mailing list to get more details when we launch!</p>
    <form id="mailing-list" class="form-inline">
      <div class="form-group">
        <label hidden for="emailAddress">Email</label>
        <input type="email" name="emailAddress" class="form-control" id="emailAddress" placeholder="awesome.person@gmail.com">
      </div>
      <button type="submit" class="btn btn-success">Sign Me Up!</button>
      <label class="error-message"></label>
    </form>
  </div>
</template>
```
Very simple. Like any good landing page or a startup, we have an ambiguous photo of a laptop next to a cup of coffee, our company name, and a quick description of what we're working on. Just beneath that is the part we want to focus on. Here, we have the form we'll use for actually signing up users. Notice we have two parts here: an input for taking an email address and a submit button to sign users up. 

With this in place, we can add a bit of logic to get it working. Let's hop over to our JavaScript file for this template and see how it works.

<p class="block-header">/client/templates/public/index.js</p>

```javascript
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
    success: function( error ) {
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
```
In order to prevent getting bad email addresses to the server, here, we're adding a bit of client-side validation to our form. To get it working, we first make sure to capture the `submit` event on our form and call `event.preventDefault()` on it. Why do we need this? Two reasons: first, it ensures that the normal browser submit action doesn't get called, and two, guarantees that our validation logic will "take over" and handle the form submission for us. Neat!

Up above in our call to `Template.index.onRendered` we have two distinct things going on. First, we give all of the code in our `onRendered` function access to the current template instance by assigning `this` equal to a variable `template`. We'll see why we're doing this in just a few lines.

Next, we're attaching the `validate` method given to us from the `themeteorchef:jquery-validation` package (we have access to this package via [Base](https://github.com/themeteorchef/base#packages-included), the starter kit used for our recipe) to our form via its `id` attribute `#mailing-list`. Making sense so far? Inside of our call to `validate`, we pass four things: the validation rules for each field, the error messages that should be displayed for each rule, a custom function for controlling where our errors are displayed, what happens to errors on success, and a final function for handling the form submission like we explained above.

The first two steps `rules` and `messages` should be pretty clear, but what is that `errorPlacement` thing? This is pretty cool. By default, our validation library automatically appends error messages beneath the form field where the error is occuring. Normally this is okay, but for our purposes, it ends up breaking our layout. To get around this, we can add the `errorPlacement` method, passing some functions to call when an error occurs. 

Here, we're grabbing the empty `.error-message` element that we added in our template earlier and injecting whatever error text we get into it. To access the error, notice that we're accessing the first element in the `error` array passed as an argument to us by the validation library and then accessing its `innerText` property. Huh? We have to do this here because technically our form could have several errors, meaning that array would have multiple error objects in it. Because we only have one field, we can safely access the first `0` object in the array without fear.

Just after this, we see another method being added `success` that does the exact same thing as our `errorPlacement` method. What gives? This is essentially doing the inverse of what happens when our validation _passes_. This may be potentially confusing, but we still access our error state to figure out if this field has passed validation. The difference, here, is that inside of our `success` method, we expect our error message to be `null` or empty, meaning the error does not exist. A quick demo of this in action:

<figure>
  <img src="https://cl.ly/image/0f383a2P190X/validation-errors.gif" alt="Demo of validation working.">
  <figcaption>Demo of validation working.</figcaption>
</figure>

Making some sense? So, when our error exists, it's set in our `.error-message` element and when it doesn't, it's set to a blank string (making it disappear). Cool! Now we get to the interesting part: adding subscribers to MailChimp! Before we walk through how this works, we need to make sure we have a valid MailChimp account set up. 

### Getting a MailChimp account and API key
Before we jump into working with MailChimp, we need to make sure that we have two things: a MailChimp account and an API key. First, head over to [MailChimp's signup page](https://login.mailchimp.com/signup?) and create your account.

![MailChimp signup page](https://cl.ly/image/0o3z1m1J0n2P/Image%202015-09-08%20at%2010.02.49%20AM.png)

Once you're signed up and your account is confirmed, we need to generate an API key. This is what we'll use to confirm our identity with MailChimp when sending requests from our application. To get your API key, head to the [API keys portion of your account page](https://admin.mailchimp.com/account/api/). Scroll down a little bit until you see the "Your API keys" block and click on the "Create A Key" button.

![Your API keys list in MailChimp](https://s3.amazonaws.com/f.cl.ly/items/2e0E2O0o22011N0y1D3U/Image%202015-09-08%20at%2010.06.05%20AM.png)

MailChimp will automatically create a key for you. For good measure, make sure to add a label to your key so you know what it's being used for.

<div class="note">
  <h3>Development and Production Keys <i class="fa fa-warning"></i></h3>
  <p>It's best to generate two API keys here: one for development (testing) and another for production. Using separate keys for these environments gives us a little bit of added security and also helps us to avoid performing tests on something that's potentially visible to the public. We'll see how to make use of both coming up.</p>
</div>

Keep that keys page open for a second as we'll make use of your API key(s) in a little bit. Before we do, we need to do one last thing: create a mailing list. To do this, we need to head over to the [lists section of the MailChimp dashboard](https://admin.mailchimp.com/lists/) and create a new list.

![Creating a new list in MailChimp](https://cl.ly/image/3t1H1B161621/Image%202015-09-08%20at%2010.37.45%20AM.png)

Once our list is set up, we need to get the List ID. To do this, click on the name of the list and then from its dashboard, select the "List Name and Defaults" option from the "Settings" dropdown. Once you're there, you should see the ID for your list displayed off to the right.

![Finding our List ID on MailChimp](https://s3.amazonaws.com/f.cl.ly/items/0o0N2d1e1k1W2n0k031C/Image%202015-09-07%20at%201.48.15%20PM.png)

Cool! Now that we have access to our API key(s) and our List ID, let's chat about how we're going to make use of them in our application.

#### Adding our API keys and list ID to a settings file
For simplicity and security sake, we're going to use [a settings.json file](https://themeteorchef.com/snippets/making-use-of-settings-json) to store our API key(s) and list ID. By using a settings file, we can get access to any JSON data stored in that file within our app. This is important because it gives us one source of truth for our API key and list ID and helps us to avoid storing sensitive information in our application code. 

Instead, with a settings file we simply make a reference to information in that file. This means we can change our keys and any code referencing them will automatically update. Before we get too far ahead of ourselves, let's see how it works.

<p class="block-header">settings-development.json</p>

```javascript
{
  "public": {},
  "private": {
    "MailChimp": {
      "apiKey": "MailChimp API key goes here.",
      "listId": "MailChimp List ID goes here."
    }
  }
}
```

Pretty simple. Notice that this file is named `settings-development.json`. This implies that we have multiple settings files. If we're going to deploy our application into production, we want to have another file called `settings-production.json`. There are two differences between these files: unlike our `settings-development.json` file, we do _not_ want to commit our `settings-production.json` file to source control (for [security reasons](https://themeteorchef.com/snippets/making-use-of-settings-json/#tmc-settingsjson-in-development-vs-production)). Additionally, our `settings-production.json` file should contain the _production_ keys and information for our application. This is where creating two separate API keys like we described above comes into play.

<div class="note info">
  <h3>Further Reading on settings.json<i class="fa fa-info"></i></h3>
  <p>If you're curious about how settings.json works and the different ways it can be used in development vs. production, check out <a href="http://themeteorchef.com/snippets/making-use-of-settings-json">this snippet on Making Use of Settings.json</a></p>
</div>

In our settings file, we've added a `private` object containing another object `MailChimp` with two keys: `apiKey` and `listId`. I bet you can guess what goes here! Grab the API key and List ID you created for development purposes earlier and paste them into their respective spots here. Now, we'll have full access to our API key(s) and List ID from _within_ our application! **Note**: because we've stored our MailChimp information inside of the `private` object in our `settings-development.json` file, we expect this information to only be visible on the _server-side_ of our application (this is good as we don't want this exposed on the client).

All set? Okay! Let's hop back to the logic for our sign up form to see how we're adding new subscribers to our mailing list.

### Adding subscribers
Back in our template logic, let's take a look at the `submitHandler` portion of our validation. This is what will control what happens when our user clicks the "Sign Me Up!" button.

<p class="block-header">/client/templates/public/index.js</p>

```javascript
Template.index.onRendered( function() {
  var template = this;

  $( "#mailing-list" ).validate({
    [...]
    submitHandler: function() {
      handleSubscriber({
        email: template.find( "[name='emailAddress']" ).value,
        action: 'subscribe'
      });
    }
  });
});
```

So, when our `submitHandler` function is called, we're actually calling another function `handleSubscriber` and passing two things: the user's email address as retrieved from the current template instance, and an action `'subscribe'`. What the heck is this thing? Well, as we'll learn shortly, MailChimp's process for adding and removing subscribers from our mailing list is practically identical. So identical that we'd more or less be duplicating code just to perform one function or the other (subscribing vs. unsubscribing). To make our code a little tidier and easier to reason about, we've created a little helper function called `handleSubscriber` to streamline the process. Let's take a peek.

<p class="block-header">/client/modules/handle-subscriber.js</p>

```javascript
handleSubscriber = function( subscriber ) {
  Meteor.call( "handleSubscriber", subscriber, function( error, response ) {
	// Handle error or response here.
  });
};
```

First, notice that all we're really doing here is making a call to a server-side method `handleSubscriber` and passing the `subscriber` argument (the object we passed with the `email` and `action` properties) to it. For clarity sake, we've omitted how we're handling the error and success states now. Before we show those, let's hop up to the server to see how our `handleSubscriber` method is taking shape. This will help us to better understand how we're handling the error and success states in a few.

#### The handleSubscriber method
This is where we start to have some fun and interact with the MailChimp API. Let's spit out how our file is setup and then step through it.

<p class="block-header">/server/methods/mailchimp.js</p>

```javascript
var settings = Meteor.settings.private.MailChimp,
    chimp    = new MailChimp( settings.apiKey, { version: '2.0' } ),
    listId   = settings.listId;

Meteor.methods({
  [...]
  handleSubscriber: function( subscriber ) {
    check( subscriber, {
      email: String,
      action: String
    });

    try {
      var subscribe = chimp.call( 'lists', subscriber.action, {
        id: listId,
        email: {
          email: subscriber.email
        }
      });

      return subscribe;
    } catch( exception ) {
      return exception;
    }
  }
});
```
Interesting! First, we set up a handful of variables. The first one, `settings` is assigned to the value of `Meteor.settings.private.MailChimp`. Can you guess what this is doing? This is pulling in the contents of our `MailChimp` object from the `private` object in our `settings-<environment>.json` file! That `Meteor.settings` part tells Meteor to look at the value of the `METEOR_SETTINGS` environment variable which we set to the value of our `settings-<environment>.json` file [when Meteor starts up](https://themeteorchef.com/snippets/making-use-of-settings-json/#tmc-using-settingsjson).

Once we have this, we create another variable `chimp` and assign it to a new instance of the `MailChimp` API (we get this from the `miro:mailchimp` package we installed earlier). Notice that here, we pass our API key as `settings.apiKey` as we want to pull this value from our `settings` variable containing the contents of our `MailChimp` object in our settings file. We also pass an object containing a single key `version` here, with the value set to `2.0`, the latest version of the MailChimp API that this package supports.

Finally, we assign the `listId` variable equal to our Mailing List's ID we grabbed from MailChimp earlier. With these in place, next, we define our actual method for `handleSubscriber`.

We start by [using the check package](https://themeteorchef.com/snippets/using-the-check-package/) to validate our `subscriber` argument and then attempt to make a call to the MailChimp API. Pay attention to the syntax here. Notice that we use the `.call()` method on our `chimp` variable which is equal to the instance of the MailChimp API we defined up top. Next, we pass three arguments to the call: the "section" of the API we want to access, the "method" from that section we'd like to call, and then any parameters to fulfill that request.

Because we want to add a new subscriber to our list, we first past the `"lists"` group, followed by the value of `subscriber.action`. Remember that earlier, we passed this along via our `handleSubscriber` function on the client as `'subscribe'`. This will make sense later, but we make this a variable as this exact same call will be performed for _unsubscribing_ a user. By defining our call in this way, we can make use of the same method, passing the _type_ of call we want to make on the MailChimp API as a variable. Neat!

Finally, we pass an object containing two top-level properties: `id`, which is set equal to the `listId` we want to add subscribers to (from our settings file) and then an `email` object which contains another value `email` pointining to the email address entered into the input field in our template. Now, when our method is called, our user will get subscribed to our list!

Keep in mind, we haven't set it here but there's another parameter that we can set on our options object called `double_optin`. This setting allows us to control whether or not our user will get a "confirmation" email before being subscribed to our list. By default this is set to `true` and it's recommended that you leave it as so (we haven't set it here so MailChimp will just default to this on its own). Why should we leave this as-is?

> [The double_optin setting is an] optional flag to control whether a double opt-in confirmation message is sent, defaults to true. **Abusing this may cause your account to be suspended**.
>
> &mdash; via [MailChimp API documentation](https://apidocs.mailchimp.com/api/2.0/lists/subscribe.php)

You're allowed to change this, but beware the risk that MailChimp can suspend your account if they think you're abusing it. To stay on the safe side, it's best to make sure our users get this email so we can focus on more important things.

#### No callback?
You may have noticed that when we made the call to MailChimp using the `chimp.call()` method we didn't provide a callback. This is a convenience given to us by the `miro:mailchimp` package. Without a callback, our callback is converted to a [synchronous method call using Meteor.wrapAsync](https://themeteorchef.com/snippets/synchronous-methods/#tmc-using-wrapasync) instead of asynchronous, meaning our method waits until it receives a response before returning. This is handy because it ensures we get a response (either negative or positive) back from MailChimp before completing our method call. Sweet!

As we can guess, then, inside of our `try/catch` block, we're returning one of two things: a success message from MailChimp or an error message from MailChimp. Because our call is synchronous, we can expect to get that value back on the client. How do we handle it?

#### Adding a callback to our handleSubscriber method call
Back on the client, we pull our `handleSubscriber` function back in, updating it with the contents of our callback for handling error and success states from MailChimp.

<p class="block-header">/client/modules/handle-subscriber.js</p>

```javascript
handleSubscriber = function( subscriber ) {
  Meteor.call( "handleSubscriber", subscriber, function( error, response ) {
    if ( error ) {
      Bert.alert( error.reason, "warning" );
    } else {
      if ( response.complete || response.euid ) {
        var subscribeMessage   = "Please confirm your email to complete your subscription!",
            unsubscribeMessage = subscriber.email + " successfully unsubscribed!",
            message            = subscriber.action === "subscribe" ? subscribeMessage : unsubscribeMessage;

        Bert.alert( message, "success" );
      } else {
        Bert.alert( response.message, "warning" );
      }
    }
  });
};
```
Woah! A few considerations here. First, if we get an error from _Meteor_, we go ahead and handle it, alerting the error message to the user. Next, we have to get a bit tricky. Recall that our call to MailChimp is synchronous and being returned as the `response` value in our method call's callback. Because the response we get back from MailChimp might be an error, we need to account for this. In our `else` statement, we check for one of two values on our response object `response.complete` or `response.euid`. 

As we'll see in a bit, when we _remove_ a subscriber, MailChimp will send back an object containing a single property `complete` set to `true` or `false`. When we _add_ a subscriber, MailChimp will send back an object containing a handful of fields describing the subscriber as they're stored on MailChimp. For our purposes, we look at the `euid` property on this response which is equal to the "email unique ID" from MailChimp. Its only utility for us is to confirm that the user was successfully added to our list. If the response contains this value, we can be certain that they were.

Finally, if our response contains _neither_ of these values, we assume there was an error and alert that back to the user (e.g. this would fire if we passed MailChimp a bad email address). What's neat about this is that because our method on the server is being handled synchronously, we can get error messages back from MailChimp for free without any hoop jumping! This equates to us having validation on both the client _and_ the server. Swish.

With all of this in place, we can reuse this `handleSubscriber` method to _unsubscribe_ users, too. Before we take a look at that, though, let's talk about how we can actually see a list of subscribers for our mailing list _without_ visiting MailChimp.

### Listing subscribers
Because our list of subscribers lives on MailChimp (not locally in our database), we need a way to retrieve a list of our current subscribers that doesn't involve storing anything in the database. How do we do that?

#### Subscribers template
We've [already set up a route](https://github.com/themeteorchef/mailing-lists-with-mailchimp/blob/master/code/client/routes/routes-authenticated.js) at `http://localhost:3000/subscribers` that is accessible when you login as the user `admin@admin.com` with the password `password`. Here, we want to get a list of our current subscribers displayed. Let's take a look at the markup and then discuss how it's wired up.

<p class="block-header">/client/templates/authenticated/subscribers.html</p>

```markup
<template name="subscribers">
  <h4 class="page-header">Subscribers <span class="badge">{{count subscribers}}</span></h4>
  <ul class="list-group">
    {{#each subscribers}}
      <li class="list-group-item clearfix">{{email}} <i class="pull-right fa fa-remove remove-subscriber"></i></li>
    {{else}}
      <p class="alert alert-warning">No subscribers yet.</p>
    {{/each}}
  </ul>
</template>
```
Easy peasy. Two things to pay attention to. First, we use a simple `{{#each}}` loop which iterates over a helper called `subscribers` that we'll set up in a little bit. Just above that, we also make another call to this `subscribers` helper, but we pass it to a template helper called `count`. What's that? This is just for show and completely optional, but this allows us to pass an array value and get back the numeric value for how many items are _in_ that array. So it's clear:

<p class="block-header">/client/helpers/template.js</p>

```javascript
Template.registerHelper( 'count', function( array ) {
  return array ? array.length : 0;
});
```

Make sense? We take the passed array and grab the `length` property on it and return it to our template. Really simple, but adds a nice bit of UX flair to our template! Okay, so now we need to wire this up so we actually get our list of users as well as our count. How do we do it?

<p class="block-header">/client/templates/authenticated/subscribers.js</p>

```javascript
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
```

Hold up! What the heck is this? This, friend, is where we get down right _crafty_. Here, we make use of the `reactive-var` package we added at the beginning onf the recipe. [ReactiveVar](https://themeteorchef.com/snippets/reactive-dict-reactive-vars-and-session-variables/#tmc-reactive-variables) allows us to achieve something similar to `Session` variables but at a _local_ level. Here, we make use of this in an interesting way. Because our mailing list data lives on MailChimp, we need a way to "fetch" this data each time we load up our subscribers list.

Because this isn't reactive like a database query might be, we need a way to make a call to fetch data from MailChimp and when that data is available, pipe it into our template. Using ReactiveVar, we can do this in combination with a method call. Notice that in our `onCreated` callback (meaning, when our `subscribers` template is created), we do two things: first, we set `this` (representing the current template instance) to a variable called `self`. 

Next, we create a new ReactiveVar and assign it _to our template instance_ as a value called `subscribers`. This ensures that for each instance of this template, a value called subscribers is accessible throughout our template logic. We assign this using `self.subscribers` which is the same as saying `this.subscribers` but makes it a little more clear what we're working with. Next, we take a similar approach to define a function called `getSubscribers`. 

This is simply a wrapper function around a `Meteor.call` to a server-side method called `getSubscribers`. Real quick, let's hop over to the server to see how this works before we talk about setting the data on our template.

#### Fetching subscribers from MailChimp
To get the current state of our mailing list, we need to make another call to MailChimp's API, passing the ID of the list we want to get data from.

<p class="block-header">/server/methods/mailchimp.js</p>

```javascript
var settings = Meteor.settings.private.MailChimp,
    chimp    = new MailChimp( settings.apiKey, { version: '2.0' } ),
    listId   = settings.listId;

Meteor.methods({
  getSubscribers: function() {
    try {
      var subscribers = chimp.call( 'lists', 'members', {
        id: listId,
        status: 'subscribed'
      });

      subscribers = _.map( subscribers.data, function( subscriber ) {
        return { email: subscriber.email };
      });

      return subscribers;
    } catch( exception ) {
      return exception;
    }
  },
  [...]
});
```
Some of this should look familiar. We can see our variables declared from earlier at the top and a new method being added `getSubscribers` that we're trying to call from the client when our subscribers list loads up. Our call to MailChimp is for the `lists` resource and the `members` method associated with that resource. In our options, we pass an `id` parameter which is equal to the `listId` we fetch from our `settings.json` file and then we pass another parameter `status` which tells MailChimp we want all of the members of this mailing list that are currently subscribed.

Just like we did earlier, we set this call up to be synchronous, meaning we wait for data to be returned before we continue returning from our method. But wait...what's this call to `_.map()` about? Ah! This is a matter of efficiency. In our interface, we only need/want to list the email addresses of each of our subscribers, nothing else. When we get a successful response back from MailChimp, they send us back a bunch of information in the form of individual objects for each subscriber in an array called `data`. 

Here, then, we use map to say "for each of the objects in the `subscribers.data` array, return a single object with a parameter called `email` equal to the currently looped user's email address. `_.map()` then (which we get from the [Underscore](https://underscorejs.org/#map) library that's baked into both Meteor and [Base](https://github.com/themeteorchef/base#packages-included)) returns an array with objects containing the single email field for each subscriber. Cool!

Once we have this filtered array, we simply return it to the client. Let's hop back over to there now to see how this gets to the template.

#### Wiring up subscribers to the template
Now that we're getting data back from MailChimp, all we have to do is pipe it into our template. Let's take a peek.

<p class="block-header"></p>

```javascript
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
```

Okay! So, let's look at the callback of our call to `getSubscribers`. If there's an error we display it to the client but if we get back a valid response, we call the `set` method on `self.subscribers`, passing the response from the server (our filtered array of subscribers). Notice, `self.subscribers.set( response )` is saying "set our ReactiveVar assigned to `self.subscribers` equal to the list of subscribers we received from MailChimp."

Once this is set, down in the helpers for our `subscribers` template we add a helper called `subscribers` (remember, this is tied to our `{{#each subscribers}}` block and our `{{count subscribers}}` helper). Inside, we call to `Template.instance().subscribers.get();`. Because we've set our ReactiveVar on our _template instance_, inside of our helper we can get access to it at `Template.instance()`. Then, we point to the variable associated with our reactive var `subscribers`, calling its `get()` method to _retrieve_ its current value.

Because we're using a ReactiveVar, this is now _reactive_. So, whenever the value of our ReactiveVar changes, our template will update. This helps us deal with the potential for a slow response from MailChimp because this value will simply change when the data is available and set in the callback of our call to `getSubscribers` with `self.subscribers.set( response )`.

Let that one sink in. It's pretty wild! Once this is setup, we should see something on screen like this:

<figure>
  <img src="http://cl.ly/image/41270q1W2N0k/subscribers-list.gif" alt="List of subscribers loading from MailChimp.">
  <figcaption>List of subscribers loading from MailChimp.</figcaption>
</figure>

Notice that there _is_ a little bit of a delay in our list data being fetched from MailChimp. If we wanted, we could add [a little bit of polish](https://themeteorchef.com/snippets/loading-patterns/#tmc-smooth-loading-using-the-onready-callback) to this like we might if we were working with publications and subscriptions. Either way, it works! Whenever we load up our page now, we'll get the latest subscribers to our mailing list. Pretty neat.

One last thing to try out: removing subscribers. Notice that in our example (and our template) we have a red "X" icon being added to each subscriber in our list. Let's wire that up so it actually removes a subscriber from our list.

### Removing subscribers
Thanks to our earlier work, this will be quick as lightning. In the logic for our subscribers template:

<p class="block-header">/client/templates/authenticated/subscribers.js</p>

```javascript
[...]

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
```
See how this is working? Whenever we click on that red "X" icon, we confirm that the user wants to delete this subscriber and then call to our `handleSubscriber` function. Inside, we pass `this.email` as the email (which is equal to the item in the list where the click originated from) and then we pass `'unsubscribe'` as the action. Remember that earlier when we defined our method `handleSubscriber`, we grabbed this `action` value to call the corresponding method in the MailChimp API. So here, instead of `'subscribe'` we pass `'unsubscribe'`.

Notice, too, that after we pass our settings object, we're adding _another_ argument, our template instance. Why is that? Recall that our call to MailChimp's API for fetching our subscribers is _not_ reactive. In order to "fake" reactivity, we want to be able to "refresh" our list of subscribers after we've removed one. To do this, then, we can access our `getSubscribers` function we defined on our template earlier! Let's update our `handleSubscriber` function to see how this works.

<p class="block-header">/client/modules/handle-subscriber.js</p>

```javascript
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
```
Just two things to add. First, we add our `template` argument to our function up at the top. Next, down in our `if ( response.complete || response.euid ) {}` block, we add a line `if ( template ) { template.getSubscribers(); }`. See what this is doing? If we've been given a template instance to work with, we call the `getSubscribers` method defined on it. This, then, calls to MailChimp and says "after you've performed the action I told you to perform, give me the latest list of users." In this case we're saying "once you've unsubscribed this user, refresh the list to show the changes."

How cool is that? Now whenever we remove a subscriber, we'll "fake" reactivity by fetching the list from MailChimp which will have one less user than before. Awesome! Here's the result:

<figure>
  <img src="https://cl.ly/image/3v192t1u1X2o/removing-a-user.gif" alt="Removing a user from MailChimp and refreshing our list.">
  <figcaption>Removing a user from MailChimp and refreshing our list.</figcaption>
</figure>

_Muy bueno_. That's it folks! We now have a simple signup and mailing list all stored and retrieved on MailChimp. The cool part is that we have access to MailChimp's entire API so the sky is the limit from here in terms of how we want to interact with the service.