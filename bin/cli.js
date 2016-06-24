#!/usr/bin/env node

'use strict';

const inquirer = require('inquirer');

const nextBus = require('../');

nextBus.getRoutes({
  agency: 'sf-muni'
}).then(routes => {
  console.log(routes);
});
