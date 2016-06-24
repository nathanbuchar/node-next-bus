'use strict';

const request = require('request');
const parser = require('pixl-xml');

/**
 * NextBus web services API wrapper.
 *
 * @see https://www.nextbus.com
 * @see https://www.nextbus.com/xmlFeedDocs/NextBusXMLFeed.pdf
 */
class NextBus {

  /**
   * Gets all transit agencies supported by NextBus web services.
   *
   * @returns {Promise}
   */
  getAgencies() {
    return new Promise((resolve, reject) => {
      request.get(NextBus.WEB_SERVICES_URI, {
        qs: {
          [NextBus.Attr.COMMAND]: NextBus.Commands.AGENCY_LIST
        }
      }, (err, httpResponse, body) => {
        if (err) return reject(err);

        if (httpResponse.statusCode === 200) {
          const doc = parser.parse(body);
          const agencies = doc.agency;

          resolve(agencies);
        } else {
          reject('Something went wrong');
        }
      });
    });
  }

  /**
   * Gets all routes for the chosen transit agency.
   *
   * @param {Object} options
   * @param {string} options.agency
   * @returns {Promise}
   */
  getRoutes(options) {
    return new Promise((resolve, reject) => {
      request.get(NextBus.WEB_SERVICES_URI, {
        qs: {
          [NextBus.Attr.COMMAND]: NextBus.Commands.ROUTE_LIST,
          [NextBus.Attr.AGENCY]: options.agency
        }
      }, (err, httpResponse, body) => {
        if (err) return reject(err);

        if (httpResponse.statusCode === 200) {
          const doc = parser.parse(body);
          const routes = doc.route;

          resolve(routes);
        } else {
          reject('Something went wrong');
        }
      });
    });
  }

  /**
   * Gets all routes for the chosen transit agency.
   *
   * @param {Object} options
   * @param {string} options.agency
   * @param {string} options.route
   * @returns {Promise}
   */
  getRouteInfo(options) {
    return new Promise((resolve, reject) => {
      request.get(NextBus.WEB_SERVICES_URI, {
        qs: {
          [NextBus.Attr.COMMAND]: NextBus.Commands.ROUTE_INFO,
          [NextBus.Attr.AGENCY]: options.agency,
          [NextBus.Attr.ROUTE]: options.route
        }
      }, (err, httpResponse, body) => {
        if (err) return reject(err);

        if (httpResponse.statusCode === 200) {
          const doc = parser.parse(body);
          const info = doc.route;

          resolve(info);
        } else {
          reject('Something went wrong');
        }
      });
    });
  }

  /**
   * Gets all route stops for the chosen route.
   *
   * @param {Object} options
   * @param {string} options.agency
   * @param {string} options.route
   * @returns {Promise}
   */
  getRouteStops(options) {
    return new Promise((resolve, reject) => {
      this.getRouteInfo(options).then(info => {
        resolve(info.stop);
      }, reject);
    });
  }

  /**
   * Gets all route stops for the chosen route.
   *
   * @param {Object} options
   * @param {string} options.agency
   * @param {string} options.route
   * @param {string} options.direction
   * @returns {Promise}
   */
  getRouteStopsByDirection(options) {
    return new Promise((resolve, reject) => {
      this.getRouteInfo(options).then(info => {
        let direction;
        let stops;

        // Find the direction whose tag is equal to the desired direction.
        for (let i = 0, len = info.direction.length; i < len; i++) {
          if (info.direction[i].tag === options.direction) {
            direction = info.direction[i];
            break;
          }
        }

        // Direction does not exist.
        if (!direction) {
          reject('Direction not found');
          return;
        }

        // Get information for all routes within the chosen direction. For each
        // stop within the chosen direction, we find the stop in the master
        // list that has the same stop tag.
        stops = direction.stop.map(stop => {
          for (let i = 0, len = info.stop.length; i < len; i++) {
            if (info.stop[i].tag === stop.tag) {
              return info.stop[i];
            }
          }
        });

        resolve(stops);
      }, reject);
    });
  }

  /**
   * Gets all route directions for the chosen route.
   *
   * @param {Object} options
   * @param {string} options.agency
   * @param {string} options.route
   * @returns {Promise}
   */
  getRouteDirections(options) {
    return new Promise((resolve, reject) => {
      this.getRouteInfo(options).then(info => {
        resolve(info.direction);
      }, reject);
    });
  }

  /**
   * Gets all routes for the chosen transit agency.
   *
   * @param {Object} options
   * @param {string} options.agency
   * @param {string} options.route
   * @param {string} options.stop
   * @returns {Promise}
   */
  getRouteStopPredictions(options) {
    return new Promise((resolve, reject) => {
      request.get(NextBus.WEB_SERVICES_URI, {
        qs: {
          [NextBus.Attr.COMMAND]: NextBus.Commands.ROUTE_PREDICTIONS,
          [NextBus.Attr.AGENCY]: options.agency,
          [NextBus.Attr.ROUTE]: options.route,
          [NextBus.Attr.STOP]: options.stop
        }
      }, (err, httpResponse, body) => {
        if (err) return reject(err);

        if (httpResponse.statusCode === 200) {
          const doc = parser.parse(body);

          // Predictions may not exist if there are none en route.
          if (doc.predictions && doc.predictions.direction) {
            resolve(doc.predictions.direction.prediction);
          } else {
            resolve([]);
          }
        } else {
          reject('Something went wrong');
        }
      });
    });
  }
}

/**
 * The NextBus web services public xml feed URI.
 *
 * @type {string}
 * @readonly
 */
NextBus.WEB_SERVICES_URI = 'http://webservices.nextbus.com/service/publicXMLFeed';

/**
 * NextBus web service commands library.
 *
 * @enum {string}
 * @readonly
 */
NextBus.Commands = {
  AGENCY_LIST: 'agencyList',
  ROUTE_LIST: 'routeList',
  ROUTE_INFO: 'routeConfig',
  ROUTE_PREDICTIONS: 'predictions',
  ROUTE_PREDICTIONS_FOR_MULTIPLE_STOPS: 'predictionsForMultiStops',
  ROUTE_SCHEDULE: 'schedule',
  ROUTE_MESSAGES: 'messages',
  VEHICLE_LOCATIONS: 'vehicleLocations'
};

/**
 * NextBus web service attribtues library.
 *
 * @enum {string}
 * @readonly
 */
NextBus.Attr = {
  COMMAND: 'command',
  AGENCY: 'a',
  ROUTE: 'r',
  STOP: 's'
};

/**
 * The NextBus instance.
 *
 * @type {NextBus}
 * @readonly
 */
NextBus.Instance = new NextBus();

module.exports = NextBus.Instance;
