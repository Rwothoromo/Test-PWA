
(function() {
  'use strict';

  var initialOutboxEvent = {
    "name": {
      "text": "Another Test Event",
      "html": "Another Test Event"
    },
    "description": {
       "text": "Another test event.",
       "html": "<P>Another test event.<\/P>"
    },
    "id": "26468143931",
    "url": "http://www.eventbrite.com/e/another-test-event-tickets-26468143931",
    "start": {
      "timezone": "Asia/Baghdad",
      "local": "2016-08-05T13:00:00",
      "utc": "2016-08-05T10:00:00Z"
    },
    "end": {
       "timezone": "Asia/Baghdad",
       "local": "2016-08-05T17:00:00",
       "utc": "2016-08-05T14:00:00Z"
    },
    "created": "2016-07-07T16:17:23Z",
    "changed": "2016-07-07T16:17:24Z",
    "capacity": 20,
    "status": "draft",
    "currency": "USD",
    "listed": true,
    "shareable": true,
    "invite_only": false,
    "online_event": false,
    "show_remaining": false,
    "tx_time_limit": 480,
    "hide_start_date": false,
    "hide_end_date": false,
    "locale": "en_US",
    "is_locked": false,
    "privacy_setting": "unlocked",
    "is_series": false,
    "is_series_parent": false,
    "is_reserved_seating": false,
    "logo_id": null,
    "organizer_id": "10964941040",
    "venue_id": "15939230",
    "category_id": "102",
    "subcategory_id": "2004",
    "format_id": "10",
    "resource_uri": "https://www.eventbriteapi.com/v3/events/26468143931/",
    "logo": null
  };

  var app = {
    hasRequestPending: false,
    isLoading: true,
    visibleCards: {},
    outboxEvents: [],
    spinner: document.querySelector('.loader'),
    cardTemplate: document.querySelector('.cardTemplate'),
    container: document.querySelector('.main'),
  };


  /*****************************************************************************
   *
   * Event listeners for UI elements.
   *
   ****************************************************************************/

  document.getElementById('butRefresh').addEventListener('click', function() {
    // Refresh all of the Outbox events.
    app.updateOutboxEvents();
  });


  /*****************************************************************************
   *
   * Methods to update/refresh the UI.
   *
   ****************************************************************************/

  // Updates a Outbox event card with the latest event information. If the card
  // doesn't already exist, it's cloned from the template.
  app.updateOutboxEventCard = function(data) {
    var card = app.visibleCards[data.id];
    if (!card) {
      card = app.cardTemplate.cloneNode(true);
      card.classList.remove('cardTemplate');
      card.querySelector('.id').textContent = data.id;
      card.removeAttribute('hidden');
      app.container.appendChild(card);
      app.visibleCards[data.id] = card;
    }
    card.querySelector('.name').textContent = data.name.text;
    card.querySelector('.description').textContent = data.description.text;
    card.querySelector('.start-time').textContent = data.start.local;
    card.querySelector('.end-time').textContent = data.end.local;
    card.querySelector('.category').classList.add('icon-' + data.category_id);

    if (app.isLoading) {
      app.spinner.setAttribute('hidden', true);
      app.container.removeAttribute('hidden');
      app.isLoading = false;
    }
  };


  /*****************************************************************************
   *
   * Methods for dealing with the model
   *
   ****************************************************************************/

  // Get an outbox event's data and update the card with the data
  app.getOutboxEvents = function(id) {
    var fullUrl = 'https://www.eventbriteapi.com/v3/users/me/owned_events/?order_by=start_asc&status=draft%2Clive%2Cstarted%2Ccanceled&token=DCVJK7YH7KWGIR5WU4LA';
    if ('caches' in window) {
      caches.match(fullUrl).then(function(response) {
        if (response) {
          response.json().then(function(json) {
            // Only update if the XHR is still pending, otherwise the XHR
            // has already returned and provided the latest data.
            if (app.hasRequestPending) {
              console.log('updated from cache');
              json.forEach(function(obEvent) {
                obEvent.id = id;
                app.updateOutboxEventCard(obEvent);
              });
            }
          });
        }
      });
    }
    // Make the XHR to get the data, then update the card
    app.hasRequestPending = true;
    var request = new XMLHttpRequest();
    request.onreadystatechange = function() {
      if (request.readyState === XMLHttpRequest.DONE) {
        if (request.status === 200) {
          var obEvents = JSON.parse(request.response);
          obEvents.events.forEach(function(obEvent) {;
            app.hasRequestPending = false;
            app.updateOutboxEventCard(obEvent);
          });
        }
      }
    };
    var url = new URL('https://www.eventbriteapi.com/v3/users/me/owned_events/');
    var params = {order_by:'start_asc', status:'draft,live,started,canceled', token:'DCVJK7YH7KWGIR5WU4LA'};
    Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
    request.open('GET', url);
    request.send();
  };

  // Iterate all of the Outbox events and attempt to get the latest events data.
  app.updateOutboxEvents = function() {
    app.getOutboxEvents();
  };

  // Save list of Outbox events to localStorage, see note below about localStorage.
  app.saveOutboxEvents = function() {
    var outboxEvents = JSON.stringify(app.outboxEvents);
    // IMPORTANT: See notes about use of localStorage.
    localStorage.outboxEvents = outboxEvents;
  };

  /************************************************************************
   *
   * Code required to start the app
   *
   * NOTE: To simplify things we've used localStorage.
   *   localStorage is a synchronous API and has serious performance
   *   implications. It should not be used in production applications!
   *   Instead, check out IDB (https://www.npmjs.com/package/idb) or
   *   SimpleDB (https://gist.github.com/inexorabletash/c8069c042b734519680c).
   ************************************************************************/

  app.outboxEvents = localStorage.outboxEvents;
  if (app.outboxEvents) {
    app.outboxEvents = JSON.parse(app.outboxEvents);
    app.getOutboxEvents();
  } else {
    app.updateOutboxEventCard(initialOutboxEvent);
    app.outboxEvents = [
      initialOutboxEvent
    ];
    app.saveOutboxEvents();
  }

  if('serviceWorker' in navigator) {
    navigator.serviceWorker
             .register('./service-worker.js')
             .then(function() { console.log('Service Worker Registered'); });
  }
})();
