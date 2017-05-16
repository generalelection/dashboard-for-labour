'use strict';

/**
 * Dashboard for Labour
 *
 * @file profiles.js
 * @description
 * @module System
 * @author Lighten
 *
 */

const Logging = require('./logging');
const Rhizome = require('rhizome-api-js');
const Queue = require('./api-queue');

/* ************************************************************
 *
 * CONSTANTS
 *
 **************************************************************/
const Constants = {
  INTERVAL: 5 * 60 * 1000
};

/* ************************************************************
 *
 * PROFILES
 *
 **************************************************************/
class Profiles {
  init(app) {
    this.__checkUserProfiles();
  }

  __checkUserProfiles() {
    Logging.log('Checking user profile images');
    let t = [];

    const __updateUser = (uid, username, updates) => {
      return () => {
        Logging.log(`Update user profile image url: ${username}`);
        return Rhizome.User.update(uid, updates)
          .then(Logging.Promise.logDebug('Updated User:'))
          .catch(Logging.Promise.logError());
      };
    };

    Rhizome.User.getAll()
      .then(users => {
        Logging.logDebug(`Got ${users.length} Users`);
        const twitter = users.map(u => u.auth.find(a => a.app === 'twitter')).filter(t => t);
        Queue.Manager.exec({
          app: Queue.Constants.App.TWITTER,
          method: 'GET',
          api: 'users/lookup.json',
          params: {
            screen_name: twitter.map(t => t.username).join(','), // eslint-disable-line camelcase
            include_entities: false, // eslint-disable-line camelcase
            skip_statuses: true // eslint-disable-line camelcase
          }
        }).then(response => {
          Logging.log(response.results.map(r => r.profile_image_url));
          setTimeout(() => this.__checkUserProfiles(), Constants.INTERVAL);
        });

        // users.forEach(u => {
        //   let twAuth = u.auth.find(a => a.app === 'twitter')
        //   if (!twAuth) {
        //     return;
        //   }
        //
        //   let updates = [];
        //   if (u.teamName != found.teamName) { // eslint-disable-line eqeqeq
        //     updates.push({
        //       path: 'teamName',
        //       value: found.teamName
        //     });
        //   }
        //   if (u.teamRole !== found.teamRole) {
        //     updates.push({
        //       path: 'teamRole',
        //       value: found.teamRole
        //     });
        //   }
        //
        //   if (updates.length) {
        //     Logging.log(updates);
        //     t.push(__updateUser(u.id, updates));
        //   }
        // });
        //
        // return t.reduce((p, task) => {
        //   return p.then(task());
        // }, Promise.resolve());
      });
  }
}

/* ************************************************************
 *
 * EXPORTS
 *
 **************************************************************/

module.exports = new Profiles();
