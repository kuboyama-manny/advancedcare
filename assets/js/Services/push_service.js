/*
 *  Document   : push_service.json
 *  Author     : Xiaoning Zhang
 *  Description: Web Push Notification service.
 *
 */

 App.service('PushService', function ($http, $window, $location, APIService) {

  var API_KEY = 'AIzaSyCRnM1pMOtMRN7338cjtGzQvqFkTkI3yWY';
  var GCM_ENDPOINT = 'https://android.googleapis.com/gcm/send';

  // This method handles the removal of subscriptionId
  // in Chrome 44 by concatenating the subscription Id
  // to the subscription endpoint
  var endpointWorkaround = function(pushSubscription) {
    // Make sure we only mess with GCM
    if (pushSubscription.endpoint.indexOf('https://android.googleapis.com/gcm/send') !== 0) {
      return pushSubscription.endpoint;
    }

    var mergedEndpoint = pushSubscription.endpoint;
    // Chrome 42 + 43 will not have the subscriptionId attached
    // to the endpoint.
    if (pushSubscription.subscriptionId &&
      pushSubscription.endpoint.indexOf(pushSubscription.subscriptionId) === -1) {
      // Handle version 42 where you have separate subId and Endpoint
      mergedEndpoint = pushSubscription.endpoint + '/' +
        pushSubscription.subscriptionId;
    }
    return mergedEndpoint;
  };

  var sendSubscriptionToServer = function(subscription) {
    // For compatibly of Chrome 43, get the endpoint via
    // endpointWorkaround(subscription)

    var mergedEndpoint = endpointWorkaround(subscription);

    // The curl command to trigger a push message straight from GCM
    if (mergedEndpoint.indexOf(GCM_ENDPOINT) !== 0) {
      console.log('This browser isn\'t currently ' +
        'supported for this demo');
      return;
    }

    var endpointSections = mergedEndpoint.split('/');
    var subscriptionId = endpointSections[endpointSections.length - 1];

    APIService.post('/sign/device', {"type": "web", "token": subscriptionId}
        ).then(function (response) {
          console.log("/sign/device. response =>", response);
    });
  };

  var subscribe = function() {
    navigator.serviceWorker.ready.then(function(serviceWorkerRegistration) {
      serviceWorkerRegistration.pushManager.subscribe({userVisibleOnly: true})
        .then(function(subscription) {
          console.log("generate subscription done:", subscription);
          // The subscription was successful
          return sendSubscriptionToServer(subscription);
        })
        .catch(function(e) {
          if (Notification.permission === 'denied') {
            // The user denied the notification permission which
            // means we failed to subscribe and the user will need
            // to manually change the notification permission to
            // subscribe to push messages
            console.log('Permission for Notifications was denied');
          } else {
            // A problem occurred with the subscription, this can
            // often be down to an issue or lack of the gcm_sender_id
            // and / or gcm_user_visible_only
            console.log('Unable to subscribe to push.', e);
            // pushButton.disabled = false;
            // pushButton.textContent = 'Enable Push Messages';
          }
        });
    });
  };

  // Once the service worker is registered set the initial state
  var initialiseState = function() {
    // Are Notifications supported in the service worker?
    if (!('showNotification' in ServiceWorkerRegistration.prototype)) {
      console.log('Notifications aren\'t supported.');
      return;
    }

    // Check the current Notification permission.
    // If its denied, it's a permanent block until the
    // user changes the permission
    if (Notification.permission === 'denied') {
      console.log('The user has blocked notifications.');
      return;
    }

    // Check if push messaging is supported
    if (!('PushManager' in window)) {
      console.log('Push messaging isn\'t supported.');
      return;
    }

    // We need the service worker registration to check for a subscription
    navigator.serviceWorker.ready.then(function(serviceWorkerRegistration) {
      // Do we already have a push message subscription?
      serviceWorkerRegistration.pushManager.getSubscription()
        .then(function(subscription) {
          console.log("check subscription:", subscription);
          if (!subscription) {
            subscribe();
          }
          else {
            // Keep server in sync with the latest subscription
            sendSubscriptionToServer(subscription);
          }
        })
        .catch(function(err) {
          console.log('Error during getSubscription()', err);
        });
    });
  };

  // register serviceWorker.
  this.register = function() {
    // Check that service workers are supported, if so, progressively
    // enhance and add push messaging support, otherwise continue without it.
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./service-worker.js')
      .then(initialiseState);
      $window.localStorage.pushServiceRegistered = true;
    } else {
      console.log('Service workers aren\'t supported in this browser.');
      $window.localStorage.pushServiceRegistered = false;
    }
  }

});
