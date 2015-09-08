### Getting started
To get started, we need to add a couple of packages to our application that will help us to manage our mailing list.

<p class="block-header">Terminal</p>

```bash
meteor add miro:mailchimp
```
This package will give us access to the [Node MailChimp libray](https://github.com/gomfunkel/node-mailchimp). We'll use this to interact with the MailChimp API for things like adding and removing subscribers from our list, and grabbing our current list of subscribers. **Note**: as of writing, this package only supports version 2.0 of the MailChimp API, not the latest version 3.0. This is due to a lack of support for version 3.0 of the API in the Node MailChimp dependency.

<p class="block-header">Terminal</p>

```bash
meteor add reactive-var
```
We'll use this package to help us in fetching the current list of subscribers to our mailing list from MailChimp for display in an admin interface.

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

Up above in our call to `Template.index.onRendered` we have to distinct things going on. First, we give all of the code in our `onRendered` function access to the current template instance by assigning `this` equal to a variable `template`. We'll see why we're doing this in just a few lines.

Next, we're attaching the `validate` method given to us from the `themeteorchef:jquery-validation` package (we have access to this package via [Base](https://github.com/themeteorchef/base), the starter kit used for our recipe) to our form via its `id` attribute `#mailing-list`. Making sense so far? Inside of our call to `validate`, we pass four things: the validation rules for each field, the error messages that should be displayed for each rule, a custom function for controlling where our errors are displayed, what happens to errors on success, and a final function for handling the form submission like we explained above.

The first two steps `rules` and `messages` should be pretty clear, but what is that `errorPlacement` thing? This is pretty cool. By default, our validation library automatically appends error messages beneath the form field where the error is occuring. Normally this is okay, but for our purposes, it ends up breaking our layout. To get around this, we can add the `errorPlacement` method, passing some functions to call when an error occurs. 

Here, we're grabbing the empty `.error-message` element that we added in our template earlier and injecting whatever error text we get into it. To access the error, notice that we're accessing the first element in the `error` array passed as an argument to us by the validation library and then accessing its `innerText` property. Huh? We have to do this here because technically our form could have several errors, meaning that array would have multiple error objects in it. Because we only have one field, we can safely access the first `0` object in the array without fear.

Just after this, we see another method being added `success` that does the exact same thing as our `errorPlacement` method. What gives? This is essentially doing the inverse of what happens when our validation _passes_. This may be potentially confusing, but we still access our error state to figure out if this field has passed validation. The difference, here, is that inside of our `success` method, we expect our error message to be `null` or empty, meaning the error does not exist. A quick demo of this in action:

<figure>
  <img src="http://cl.ly/image/0f383a2P190X/validation-errors.gif" alt="Demo of validation working.">
  <figcaption>Demo of validation working.</figcaption>
</figure>

Making some sense? So, when our error exists, it's set in our `.error-message` element and when it doesn't, it's set to a blank string (making it disappear). Cool! Now we get to the interesting part: adding subscribers to MailChimp! Before we walk through how this works, we need to make sure we have a valid MailChimp account set up. 

### Getting a MailChimp account and API key
Before we jump into working with MailChimp, we need to make sure that we have two things: a MailChimp account and an API key. First, head over to [MailChimp's signup page](https://login.mailchimp.com/signup?) and create your account.

![MailChimp signup page](http://cl.ly/image/0o3z1m1J0n2P/Image%202015-09-08%20at%2010.02.49%20AM.png)

Once you're signed up and your account is confirmed, we need to generate an API key. This is what we'll use to talk to confirm our identity with MailChimp when sending requests from our application. To get your API key, head to the [API keys portion of your account page](https://admin.mailchimp.com/account/api/). Scroll down a little bit until you see the "Your API keys" block and click on the "Create A Key" button.

![Your API keys list in MailChimp](https://s3.amazonaws.com/f.cl.ly/items/2e0E2O0o22011N0y1D3U/Image%202015-09-08%20at%2010.06.05%20AM.png)

MailChimp will automatically create a key for you. For good measure, make sure to add a label to your key so you know what it's being used for.

<div class="note">
  <h3>Development and Production Keys <i class="fa fa-warning"></i></h3>
  <p>It's best to generate two API keys here: one for development (testing) and another for production. Using separate keys for these environments gives us a little bit of added security and also helps us to avoid performing tests on something that's potentially visible to the public. We'll see how to make use of both coming up.</p>
</div>

Keep that keys page open for a second as we'll make use of your API key(s) in a little bit. Before we do, we need to do one last thing: create a mailing list. To do this, we need to head over to the [lists section of the MailChimp dashboard](https://admin.mailchimp.com/lists/) and create a new list.

![Creating a new list in MailChimp](http://cl.ly/image/3t1H1B161621/Image%202015-09-08%20at%2010.37.45%20AM.png)

Once our list is set up, we need to get the List ID. To do this, click on the name of the list and then from its dashboard, select the "List Name and Defaults" option from the "Settings" dropdown. Once you're there, you should see the ID for your list displayed off to the right.

![Finding our List ID on MailChimp](https://s3.amazonaws.com/f.cl.ly/items/0o0N2d1e1k1W2n0k031C/Image%202015-09-07%20at%201.48.15%20PM.png)

Cool! Now that we have access to our API key(s) and our List ID, let's chat about how we're going to make use of them in our application.

#### Adding our API keys and list ID to a settings file
For simplicity and security sake, we're going to use [a settings.json file](themeteorchef.com/snippets/making-use-of-settings-json) to store our API key(s) and list ID. By using a settings file, we can get access to any JSON data stored in that file within our app. This is important because it gives us one source of truth for our API key and list ID and helps us to avoid storing sensitive information in our application code. 

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

Pretty simple. Notice that this file is named `settings-development.json`. This implies that we have multiple settings files. If we're going to deploy our application into production, we want to have another file called `settings-production.json`. There are two differences between these files: unlike our `settings-development.json` file, we do _not_ want to commit our `settings-production.json` file to source control (for [security reasons](http://themeteorchef.com/snippets/making-use-of-settings-json/#tmc-settingsjson-in-development-vs-production)). Additionally, our `settings-production.json` file should contain the _production_ keys and information for our application. This is where creating two separate API keys like we described above comes into play.

<div class="note info">
  <h3>Further Reading on settings.json<i class="fa fa-info"></i></h3>
  <p>If you're curious about how settings.json works and the different ways it can be used in development vs. production, check out <a href="http://themeteorchef.com/snippets/making-use-of-settings-json">this Meteor Chef snippet on Making Use of Settings.json</a></p>
</div>

In our settings file, we've added a `private` object containing another object `MailChimp` with two keys: `apiKey` and `listId`. I bet you can guess what goes here! Grab the API key and List ID you created for development purposes earlier and paste them into their respective spots here. Now, we'll have full access to our API key(s) and List ID from _within_ our application! **Note**: because we've stored our MailChimp information inside of the `private` object in our `settings-development.json` file, we expect this information to only be visible on the _server-side_ of our application (this is good as we don't want this exposed on the client).

All set? Okay! Let's hop back to the logic for our setup form to see how we're adding new subscribers to our mailing list.

### Adding subscribers
Back in our template logic, let's take a look at the `submitHandler` portion of our validation. This is what will control what happens when our user clicks the "Sign Me Up!" button.

<p class="block-header"></p>

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
Interesting! First, we set up a handful of variables. The first one, `settings` is assigned to the value of `Meteor.settings.private.MailChimp`. Can you guess what this is doing? This is pulling in the contents of our `MailChimp` object from the `private` object in our `settings-<environment>.json` file! That `Meteor.settings` part tells Meteor to look at the value of the `METEOR_SETTINGS` environment variable which we set to the value of our `settings-<environment>.json` file [when Meteor starts up](http://themeteorchef.com/snippets/making-use-of-settings-json/#tmc-using-settingsjson).

Once we have this, we create another variable `chimp` and assign it to a new instance of the `MailChimp` API (we get this from the `miro:mailchimp` package we installed earlier). Notice that here, we pass our API key as `settings.apiKey` as we want to pull this value from our `settings` variable containing the contents of our `MailChimp` object in our settings file. We also pass an object containing a single key `version` here, with the value set to `2.0`, the latest version of the MailChimp API that this package supports.

Finally, we assign the `listId` variable equal to our Mailing List's ID we grabbed from MailChimp earlier. With these in place, next, we define our actual method for `handleSubscriber`.

We start by [using the check package](http://themeteorchef.com/snippets/using-the-check-package/) to validate our `subscriber` argument and then attempt to make a call to the MailChimp API. Pay attention to the syntax here. Notice that we use the `.call()` method on our `chimp` variable which is equal to the instance of the MailChimp API we defined up top. Next, we pass three arguments to the call: the "section" of the API we want to access, the "method" from that section we'd like to call, and then any parameters to fulfill that request.

Because we want to add a new subscriber to our list, we first past the `"lists"` group, followed by the value of `subscriber.action`. Remember that earlier, we passed this along via our `handleSubscriber` function on the client as `'subscribe'`. This will make sense later, but we make this a variable as this exact same call will be performed for _unsubscribing_ a user. By defining our call in this way, we can make use of the same method, passing the _type_ of call we want to make on the MailChimp API as a variable. Neat!

Finally, we pass an object containing two top-level properties: `id`, which is set equal to the `listId` we want to add subscribers to (from our settings file) and then an `email` object which contains another value `email` pointining to the email address entered into the 


### Listing subscribers
### Removing subscribers