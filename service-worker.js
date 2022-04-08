/*
 *  Document   : push_service.json
 *  Author     : Xiaoning Zhang
 *  Description: Web Push Notification service worker.
 *
 */

(function() {

  'use strict';

  self.addEventListener('push', function(event) {
    // console.log('Received a push message', event);

    var title = 'AdvancedCare Notification';
    var body = 'We have received a document that is waiting for review.';
    var icon = 'assets/img/favicons/favicon-192x192.png';
    var tag = 'miqare-notification-tag';

    // alert('We have received a document that is waiting for review.');

    event.waitUntil(
      self.registration.showNotification(title, {
        body: body,
        icon: icon,
        tag: tag
      })
    );
  });

  self.addEventListener('notificationclick', function(event) {
    console.log('On notification click: ', event.notification.tag);
    // Android doesn’t close the notification when you click on it
    // See: http://crbug.com/463146
    event.notification.close();

    // This looks to see if the current is already open and
    // focuses if it is
    event.waitUntil(clients.matchAll({
      type: 'window'
    }).then(function(clientList) {
      for (var i = 0; i < clientList.length; i++) {
        var client = clientList[i];
        if (client.url === '/#/tasks' && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/#/tasks');
      }
    }));
  });

})();
