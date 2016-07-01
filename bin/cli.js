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
        nextBus.getAgencies().then(agencies => {
          resolve(
            agencies.map(agency => {
              return {
                name: `${agency.title} (${agency.tag})`,
                value: agency.tag
              };
            })
          );
        });
      }).catch(err => {
        console.log(err);
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
        }).then(routes => {
          resolve(
            routes.map(route => {
              return {
                name: `${route.title} (${route.tag})`,
                value: route.tag
              };
            })
          );
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
        nextBus.getDirections({
          agency: answers.agency || argvAgency,
          route: answers.route || argvRoute
        }).then(directions => {
          resolve(
            directions.map(direction => {
              return {
                name: `${direction.title} (${direction.tag})`,
                value: direction.tag
              };
            })
          );
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
        nextBus.getStopsByDirection({
          agency: answers.agency || argvAgency,
          route: answers.route || argvRoute,
          direction: answers.direction || argvDirection
        }).then(stops => {
          resolve(
            stops.map(stop => {
              return {
                name: `${stop.title} (${stop.tag})`,
                value: stop.tag
              };
            })
          );
        });
      });
    }
  }
]).then(answers => {
  nextBus.getStopPredictions({
    agency: answers.agency || argvAgency,
    route: answers.route || argvRoute,
    stop: answers.stop || argvStop
  }).then(predictions => {
    const minutes = predictions.map(p => p.minutes);

    if (predictions.length) {
      console.log('Minutes remaining: ' + minutes.join(', '));
    } else {
      console.log('None in transit');
    }
  });
});
