'use strict';

const sprintf = require('sprintf-js').sprintf;
const path = require('path');
const Joi = require('@hapi/joi');
const { Broadcast: B, EventUtil } = require('whispermud-core');
const DU = require('../lib/DisplayUtil');
const { capitalize: cap } = require('../lib/StringUtil');
const { defaultAttributes } = require('../lib/Constants');
const { back } = require('../lib/OlcOptions');

module.exports = () => {
  return {
    event: state => (player, inputConfig) => {
      const socket = player.socket;
      const say = EventUtil.genSay(socket);
      const write = EventUtil.genWrite(socket);
      const fileName = path.basename(__filename, '.js');

      let { eventStack, menuMap, def, none } = inputConfig;
      inputConfig.fileName = fileName;

      const { } = menuMap.get(fileName);

      if (!def.metadata.stats) { def.metadata.stats = {} }

      const options = [];

      options.push({
        key: '',
        display: `<b><yellow>Stats:</yellow></b>`
      });

      const statsArr = Object.keys(def.metadata.stats || {});
      statsArr.forEach((attr, i) => {

        const statValue = def.metadata.stats[attr];
        options.push({
          display: cap(attr),
          displayValues: statValue,
          key: (i + 1).toString(),
          onSelect: (choice) => {
            menuMap.set('input-text', {
              text: statValue + ` (-1 will delete stat)`,
              schema: Joi.number().integer().min(-1).max(9999).required(),
              displayProperty: choice.display,
              onExit: choice.onExit,
            });
            eventStack.push(fileName);
            player.socket.emit('input-text', player, inputConfig);
          },
          onExit: (optionConfig) => {
            const inputStatValue = parseInt(optionConfig.text);
            if (inputStatValue === -1) {
              delete def.metadata.stats[attr];
              return;
            }
            def.metadata.stats[attr] = inputStatValue;
          }
        });
      });

      const stats = def.metadata.stats || {};
      options.push({
        display: 'Add Stats',
        displayValues: '',
        key: '+',
        bottomMenu: true,
        onSelect: (choice) => {
          menuMap.set('toggleable', {
            current: new Set([...Object.keys(stats)]),
            selections: new Set([...defaultAttributes]),
            displayProperty: choice.display,
            columns: 4,
            minWidth: 5,
            onExit: choice.onExit,
          });
          eventStack.push(fileName);
          player.socket.emit('toggleable', player, inputConfig);
        },
        onExit: (optionConfig) => {
          [...optionConfig.current].forEach(attr => {
            def.metadata.stats[attr] = def.metadata.stats[attr] || 0;
          });
          console.log(optionConfig.current);
        }
      });

      options.push(back(player, inputConfig));

      // Show the Menu
      DU.showMenu(player, inputConfig, options);

    }
  };

};
