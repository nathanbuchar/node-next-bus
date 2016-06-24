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
      const command = NextBus.Commands.AGENCY_LIST;

      request.get(NextBus.WEB_SERVICES_URI, {
        qs: {
          [NextBus.Attr.COMMAND]: command,
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
      const command = NextBus.Commands.ROUTE_LIST;

      request.get(NextBus.WEB_SERVICES_URI, {
        qs: {
          [NextBus.Attr.COMMAND]: command,
          [NextBus.Attr.AGENCY]: options.agency
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
      const command = NextBus.Commands.ROUTE_INFO;

      request.get(NextBus.WEB_SERVICES_URI, {
        qs: {
          [NextBus.Attr.COMMAND]: command,
          [NextBus.Attr.AGENCY]: options.agency,
          [NextBus.Attr.ROUTE]: options.route,
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

        // Get the direction.
        for (let i = 0, len = info.direction.length; i < len; i++) {
          if (info.direction[i].tag === options.direction) {
            direction = info.direction[i];
            break;
          }
        }

        // Direction not valid.
        if (!direction) {
          reject('Direction invalid')
          return;
        }

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
      const command = NextBus.Commands.ROUTE_PREDICTIONS;

      request.get(NextBus.WEB_SERVICES_URI, {
        qs: {
          [NextBus.Attr.COMMAND]: command,
          [NextBus.Attr.AGENCY]: options.agency,
          [NextBus.Attr.ROUTE]: options.route,
          [NextBus.Attr.STOP]: options.stop
        }
      }, (err, httpResponse, body) => {
        if (httpResponse.statusCode === 200) {
          const doc = parser.parse(body);
          const predictions = doc.predictions.direction;

          resolve(predictions);
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
   * @param {string} options.stop
   * @param {string} options.direction
   * @returns {Promise}
   */
  getRouteStopPredictionsByDirection(options) {
    return new Promise((resolve, reject) => {
      const command = NextBus.Commands.ROUTE_PREDICTIONS;

      request.get(NextBus.WEB_SERVICES_URI, {
        qs: {
          [NextBus.Attr.COMMAND]: command,
          [NextBus.Attr.AGENCY]: options.agency,
          [NextBus.Attr.ROUTE]: options.route,
          [NextBus.Attr.STOP]: options.stop
        }
      }, (err, httpResponse, body) => {
        if (httpResponse.statusCode === 200) {
          const doc = parser.parse(body);

          // No predictions for either direction.
          if (!doc.predictions.direction) {
            resolve([])
            return;
          }

          const predictions = [];

          if (Array.isArray(doc.predictions.direction)) {
            doc.predictions.direction.forEach(direction => {
              const dPredictions = direction.prediction;

              if (Array.isArray(dPredictions)) {
                dPredictions.forEach(dPrediction => {
                  if (dPrediction.dirTag === options.direction) {
                    predictions.push(dPrediction);
                  }
                });
              } else {
                if (dPredictions.dirTag === options.direction) {
                  predictions.push(dPredictions);
                }
              }
            });
          } else {
            const dPredictions = doc.predictions.direction.prediction;

            if (Array.isArray(dPredictions)) {
              dPredictions.forEach(dPrediction => {
                if (dPrediction.dirTag === options.direction) {
                  predictions.push(dPrediction);
                }
              });
            } else {
              if (dPredictions.dirTag === options.direction) {
                predictions.push(dPredictions);
              }
            }
          }

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
