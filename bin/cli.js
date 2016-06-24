#!/usr/bin/env node

'use strict';

const inquirer = require('inquirer');

const nextBus = require('../');

inquirer.prompt([
  {
    name: 'agency',
    message: 'Choose a transit agency',
    type: 'list',
    choices() {
      return new Promise((resolve, reject) => {
        nextBus.getAgencies().then(data => {
          const agencies = data.map(agency => {
            return {
              name: `${agency.title} (${agency.tag})`,
              value: agency.tag
            };
          });

          resolve(agencies);
        });
      });
    }
  },
  {
    name: 'route',
    message: 'Choose a route',
    type: 'list',
    choices(answers) {
      return new Promise((resolve, reject) => {
        nextBus.getRoutes({
          agency: answers.agency
        }).then(data => {
          const routes = data.map(route => {
            return {
              name: route.title,
              value: route.tag
            };
          });

          resolve(routes);
        });
      });
    }
  },
  {
    name: 'direction',
    message: 'Choose a direction',
    type: 'list',
    choices(answers) {
      return new Promise((resolve, reject) => {
        nextBus.getRouteDirections({
          agency: answers.agency,
          route: answers.route
        }).then(data => {
          const directions = data.map(direction => {
            return {
              name: direction.title,
              value: direction.tag
            };
          });

          resolve(directions);
        });
      });
    }
  },
  {
    name: 'stop',
    message: 'Choose a stop',
    type: 'list',
    choices(answers) {
      return new Promise((resolve, reject) => {
        nextBus.getRouteStopsByDirection({
          agency: answers.agency,
          route: answers.route,
          direction: answers.direction
        }).then(data => {
          const stops = data.map(stop => {
            return {
              name: stop.title,
              value: stop.tag
            };
          });

          resolve(stops);
        });
      });
    }
  }
]).then(answers => {
  nextBus.getRouteStopPredictionsByDirection({
    agency: answers.agency,
    route: answers.route,
    stop: answers.stop,
    direction: answers.direction
  }).then(data => {
    const predictions = data.map(d => d.minutes);

    if (predictions.length) {
      console.log('Minutes remaining: ' + predictions.join(', '));
    } else {
      console.log('None in transit');
    }
  });
});
