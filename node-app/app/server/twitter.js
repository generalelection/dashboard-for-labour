'use strict';

/**
 * Dashboard for Labour
 *
 * @file twitter.js
 * @description
 * @module System
 * @author Lighten
 *
 */

const Logging = require('./logging');
// const Config = require('./config');

const Queue = require('./api-queue');

/**
 *
 * @param {object} user - Authenticated user for whom the profile image will be updated
 * @param {Buffer} imgBuffer - Buffer containing image data for the profile
 * @return {boolean} - true if successfully queued the api call
 */
module.exports.updateProfile = (user, imgBuffer) => {
  if (!user) {
    return false;
  }

  Logging.logInfo(`Scheduling Profile Update task for user : ${user.username}.`);

  Queue.Manager.add({
    app: Queue.Constants.App.TWITTER,
    username: user.username,
    method: 'POST',
    api: 'account/update_profile_image.json',
    params: {
      image: imgBuffer.toString('base64'),
      include_entities: false, // eslint-disable-line camelcase
      skip_statuses: true // eslint-disable-line camelcase
    },
    token: user.token,
    tokenSecret: user.tokenSecret
  });

  Logging.logDebug(imgBuffer);

  return true;
};

/**
 *
 * @param {object} user - Authenticated user for whom the media will be uploaded
 * @param {String} tweet - string representing the message
 * @param {Buffer} imgBuffer - Buffer containing image data for the media
 * @return {boolean} - true if successfully queued the api call
 */
module.exports.tweetMedia = (user, tweet, imgBuffer) => {
  if (!user) {
    return false;
  }

  Logging.logInfo(`Tweeting media for user : ${user.username}.`);

  Queue.Manager.exec({
    app: Queue.Constants.App.TWITTER,
    username: user.username,
    method: 'POST',
    api: 'media/upload.json',
    params: {
      media: imgBuffer
    },
    token: user.token,
    tokenSecret: user.tokenSecret
  })
    .then(qi => {
      Logging.logDebug(qi.results.media_id);
      return Queue.Manager.exec({
        app: Queue.Constants.App.TWITTER,
        username: user.username,
        method: 'POST',
        api: 'statuses/update.json',
        params: {
          status: tweet,
          media_ids: qi.results.media_id, // eslint-disable-line camelcase
          include_entities: false, // eslint-disable-line camelcase
          skip_statuses: true // eslint-disable-line camelcase
        },
        token: user.token,
        tokenSecret: user.tokenSecret
      });
    })
    .catch(Logging.Promise.logError());

  return true;
};

/**
 * @param {Object} app - ExpressJS app object
 */
module.exports.init = app => {

};
