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
          command: NextBus.Commands.AGENCY_LIST
        }
      }, (err, httpResponse, body) => {
        if (httpResponse.statusCode === 200) {
          const doc = parser.parse(body);
          const agencies = doc.agency;

          resolve(agencies);
        } else {
          reject(err);
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
          command: NextBus.Commands.ROUTE_LIST,
          a: options.agency
        }
      }, (err, httpResponse, body) => {
        if (httpResponse.statusCode === 200) {
          const doc = parser.parse(body);
          const routes = doc.route;

          resolve(routes);
        } else {
          reject(err);
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
          command: NextBus.Commands.ROUTE_INFO,
          a: options.agency,
          r: options.route
        }
      }, (err, httpResponse, body) => {
        if (httpResponse.statusCode === 200) {
          const doc = parser.parse(body);
          const info = doc.route;

          resolve(info);
        } else {
          reject(err);
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
  getRouteStops(options) {
    return new Promise((resolve, reject) => {
      this.getRouteInfo(options).then(info => {
        resolve(info.stop);
      }, reject);
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
  getRouteStopPredictions(options) {
    return new Promise((resolve, reject) => {
      request.get(NextBus.WEB_SERVICES_URI, {
        qs: {
          command: NextBus.Commands.ROUTE_PREDICTIONS,
          a: options.agency,
          r: options.route,
          s: options.stop
        }
      }, (err, httpResponse, body) => {
        if (httpResponse.statusCode === 200) {
          const doc = parser.parse(body);
          const predictions = doc.predictions.direction.prediction;

          resolve(predictions);
        } else {
          reject(err);
        }
      });
    });
  }
}

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
 * The NextBus web services public xml feed URI.
 *
 * @type {string}
 * @readonly
 */
NextBus.WEB_SERVICES_URI = 'http://webservices.nextbus.com/service/publicXMLFeed';

/**
 * The NextBus instance.
 *
 * @type {NextBus}
 * @readonly
 */
NextBus.Instance = new NextBus();

module.exports = NextBus.Instance;
