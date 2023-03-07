#!/usr/bin/env node
'use strict';

import { Command } from 'commander';
import { MigrationManager } from '../lib/esm/index.mjs';

const program = new Command();
const manager = new MigrationManager();

program
  .version('1.0.0');

program
  .command('init')
  .description('Initialize migrations')
  .action(() => {
    manager.init();
  });

program
  .command('migrate')
  .description('Run migrations. It requires an argument that signalizes if there should be migration up or down.')
  .argument('<direction>', 'If there should be migration up or down')
  .action((direction) => {
    if(!['up', 'down'].includes(direction)) {
      console.error('Unknown directions. Direction should be up or down!');
    }
    manager.migrate(direction);
  });

program
  .command('create')
  .description('Create new migration')
  .argument('<name>', 'Name of the migration')
  .action((name) => {
    manager.generate(name);
  });

program.parse();