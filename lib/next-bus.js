'use strict';

const got = require('got');
const parser = require('pixl-xml');

/**
 * Helper function that ensures that the given parameter is an array.
 *
 * @param {*} a
 * @returns {Array}
 */
function ensureArray(a) {
  return Array.isArray(a) ? a : [a];
}

/**
 * NextBus web services API wrapper.
 *
 * @see https://www.nextbus.com
 * @see https://www.nextbus.com/xmlFeedDocs/NextBusXMLFeed.pdf
 */
class NextBus {

  /**
   * Makes a web services request to the NextBus api with the given set of
   * options.
   *
   * @param {Object} options
   * @returns {Promise}
   * @private
   */
  _makeWebServicesRequest(query) {
    return got.get(NextBus.BASE_WEB_SERVICES_URI, { query });
  }

  /**
   * Returns a function that will handle all API responses by first checking
   * if the response returned an OK status code, then parsing the XML data into
   * an object literal.
   *
   * @param {Function} resolve
   * @param {Function} reject
   * @returns {Function}
   * @private
   */
  _createApiResponseHandler(resolve, reject) {
    return response => {
      if (response.statusCode === 200) {
        const doc = parser.parse(response.body);

        resolve(doc);
      } else {
        reject('Something went wrong');
      }
    };
  }

  /**
   * Makes a NextBus web services request to obtain the agency list.
   *
   * @returns {Promise}
   * @private
   */
  _makeAgencyListRequest() {
    return new Promise((resolve, reject) => {
      const handler = this._createApiResponseHandler(resolve, reject);

      this._makeWebServicesRequest({
        [NextBus.Attr.COMMAND]: NextBus.Commands.AGENCY_LIST
      }).then(handler, reject);
    });
  }

  /**
   * Makes a NextBus web services request to obtain the route list for the
   * given agency.
   *
   * @param {Object} params
   * @param {string} params.a
   * @returns {Promise}
   * @private
   */
  _makeRouteListRequest(params={}) {
    return new Promise((resolve, reject) => {
      const handler = this._createApiResponseHandler(resolve, reject);

      this._makeWebServicesRequest(Object.assign({
        [NextBus.Attr.COMMAND]: NextBus.Commands.ROUTE_LIST
      }, params)).then(handler, reject);
    });
  }

  /**
   * Makes a NextBus web services request to obtain information about a given
   * route.
   *
   * @param {Object} params
   * @param {string} params.a
   * @param {string} params.r
   * @returns {Promise}
   * @private
   */
  _makeRouteInfoRequest(params={}) {
    return new Promise((resolve, reject) => {
      const handler = this._createApiResponseHandler(resolve, reject);

      this._makeWebServicesRequest(Object.assign({
        [NextBus.Attr.COMMAND]: NextBus.Commands.ROUTE_INFO
      }, params)).then(handler, reject);
    });
  }

  /**
   * Makes a NextBus web services request to obtain stop predictions for the
   * given stop..
   *
   * @param {Object} params
   * @param {string} params.a
   * @param {string} params.r
   * @returns {Promise}
   * @private
   */
  _makeStopPredictionsRequest(params={}) {
    return new Promise((resolve, reject) => {
      const handler = this._createApiResponseHandler(resolve, reject);

      this._makeWebServicesRequest(Object.assign({
        [NextBus.Attr.COMMAND]: NextBus.Commands.STOP_PREDICTIONS
      }, params)).then(handler, reject);
    });
  }

  /**
   * Gets a list of all transit agencies supported by the NextBus API.
   *
   * @returns {Promise}
   */
  getAgencies() {
    return new Promise((resolve, reject) => {
      this._makeAgencyListRequest().then(data => {
        let agencies = [];

        if (data.agency) {
          agencies = ensureArray(data.agency);
        }

        resolve(agencies);
      }, reject);
    });
  }

  /**
   * Gets all routes for the chosen transit agency.
   *
   * @param {Object} options
   * @param {string} options.agency - The agency id.
   * @returns {Promise}
   */
  getRoutes(options) {
    return new Promise((resolve, reject) => {
      this._makeRouteListRequest({
        [NextBus.Attr.AGENCY]: options.agency
      }).then(data => {
        let routes = [];

        if (data.route) {
          routes = ensureArray(data.route);
        }

        resolve(routes);
      }, reject);
    });
  }

  /**
   * Gets all information for the given route.
   *
   * @param {Object} options
   * @param {string} options.agency
   * @param {string} options.route
   * @returns {Promise}
   */
  getRoute(options) {
    return new Promise((resolve, reject) => {
      this._makeRouteInfoRequest({
        [NextBus.Attr.AGENCY]: options.agency,
        [NextBus.Attr.ROUTE]: options.route
      }).then(data => {
        const route = data.route;

        // Create "stops" property
        route.stops = [];

        if (route.stops) {
          route.stops = ensureArray(route.stop);
        }

        // Create "directions" property
        route.directions = [];

        if (route.directions) {
          route.directions = ensureArray(route.direction);
        }

        // Create "paths" property
        route.paths = [];

        if (route.paths) {
          route.paths = ensureArray(route.path);
        }

        delete route.stop;
        delete route.direction;
        delete route.path;

        resolve(route);
      }, reject);
    });
  }

  /**
   * Gets all stops for the chosen route.
   *
   * @param {Object} options
   * @param {string} options.agency
   * @param {string} options.route
   * @returns {Promise}
   */
  getStops(options) {
    return new Promise((resolve, reject) => {
      this.getRoute(options).then(info => {
        resolve(info.stops);
      }, reject);
    });
  }

  /**
   * Gets all directions for the chosen route.
   *
   * @param {Object} options
   * @param {string} options.agency
   * @param {string} options.route
   * @returns {Promise}
   */
  getDirections(options) {
    return new Promise((resolve, reject) => {
      this.getRoute(options).then(info => {
        resolve(info.directions);
      }, reject);
    });
  }

  /**
   * Gets all paths for the chosen route.
   *
   * @param {Object} options
   * @param {string} options.agency
   * @param {string} options.route
   * @returns {Promise}
   */
  getPaths(options) {
    return new Promise((resolve, reject) => {
      this.getRoute(options).then(info => {
        resolve(info.paths);
      }, reject);
    });
  }

  /**
   * Gets all stops for a given route for the given direction.
   *
   * @param {Object} options
   * @param {string} options.agency
   * @param {string} options.route
   * @param {string} options.direction
   * @returns {Promise}
   */
  getStopsByDirection(options) {
    return new Promise((resolve, reject) => {
      this.getRoute(options).then(info => {
        let direction;
        let stops;

        // Find the direction whose tag is equal to the chosen tag.
        for (let i = 0, len = info.directions.length; i < len; i++) {
          let d = info.directions[i];

          if (d.tag === options.direction) {
            direction = d;
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
          for (let i = 0, len = info.stops.length; i < len; i++) {
            let s = info.stops[i];

            if (s.tag === stop.tag) {
              return s;
            }
          }
        });

        resolve(stops);
      }, reject);
    });
  }

  /**
   * Gets all stop predictions for the chosen transit stop.
   *
   * @param {Object} options
   * @param {string} options.agency
   * @param {string} options.route
   * @param {string} options.stop
   * @returns {Promise}
   */
  getStopPredictions(options) {
    return new Promise((resolve, reject) => {
      this._makeStopPredictionsRequest({
        [NextBus.Attr.AGENCY]: options.agency,
        [NextBus.Attr.ROUTE]: options.route,
        [NextBus.Attr.STOP]: options.stop
      }).then(data => {
        let predictions = [];

        try {
          predictions = ensureArray(data.predictions.direction.prediction);
        } catch (err) {
          predictions = [];
        }

        resolve(predictions);
      }, reject);
    });
  }
}

/**
 * The NextBus web services public xml feed URI.
 *
 * @type {string}
 * @readonly
 */
NextBus.BASE_WEB_SERVICES_URI = 'http://webservices.nextbus.com/service/publicXMLFeed';

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
  STOP_PREDICTIONS: 'predictions',
  STOP_PREDICTIONS_FOR_MULTIPLE_STOPS: 'predictionsForMultiStops',
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
