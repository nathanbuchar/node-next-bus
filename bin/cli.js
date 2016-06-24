#!/usr/bin/env node

'use strict';

const inquirer = require('inquirer');
const yargs = require('yargs');

const nextBus = require('../');

const argvAgency = yargs.argv.a || yargs.argv.agency;
const argvRoute = yargs.argv.r || yargs.argv.route;
const argvStop = yargs.argv.s || yargs.argv.stop;
const argvDirection = yargs.argv.d || yargs.argv.direction;

inquirer.prompt([
  {
    name: 'agency',
    message: 'Choose a transit agency',
    type: 'list',
    when: !argvAgency,
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
    when: !argvRoute,
    choices(answers) {
      return new Promise((resolve, reject) => {
        nextBus.getRoutes({
          agency: answers.agency || argvAgency
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
    when: !argvDirection,
    choices(answers) {
      return new Promise((resolve, reject) => {
        nextBus.getRouteDirections({
          agency: answers.agency || argvAgency,
          route: answers.route || argvRoute
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
    when: !argvStop,
    choices(answers) {
      return new Promise((resolve, reject) => {
        nextBus.getRouteStopsByDirection({
          agency: answers.agency || argvAgency,
          route: answers.route || argvRoute,
          direction: answers.direction || argvDirection
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
  nextBus.getRouteStopPredictions({
    agency: answers.agency || argvAgency,
    route: answers.route || argvRoute,
    stop: answers.stop || argvStop
  }).then(data => {
    const predictions = data.map(d => d.minutes);

    if (predictions.length) {
      console.log('Minutes remaining: ' + predictions.join(', '));
    } else {
      console.log('None in transit');
    }
  });
});
