/*
 * Copyright 2017, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

export const PERSIST_NOTIFICATION = "MESSAGENOTIFIER::PERSIST_NOTIFICATION";
export const PERSIST_NOTIFICATIONS = "MESSAGENOTIFIER::PERSIST_NOTIFICATIONS";
export const CEASE_NOTIFICATION = "MESSAGENOTIFIER::CEASE_NOTIFICATION";
export const INITIALIZE = "MESSAGENOTIFIER::INITIALIZE";

/**
 * Adds notification into list of persistent notifications
 * @memberof actions.messagenotifier
 * @param {string} uid Unique message identifier
 * @return {action} of type `PERSIST_NOTIFICATION`
 */
export function persistNotification(uid) {
    return {
        type: PERSIST_NOTIFICATION,
        uid
    };
}

/**
 * Adds notifications into list of persistent notifications
 * @memberof actions.messagenotifier
 * @param {array} uids Unique message identifier
 * @return {action} of type `PERSIST_NOTIFICATION`
 */
export function persistNotifications(uids) {
    return {
        type: PERSIST_NOTIFICATIONS,
        uids
    };
}
/**
 * Remove notification from the list of persistent notifications
 * @memberof actions.messagenotifier
 * @return {action} of type `CEASE_NOTIFICATION`
 */
export function ceaseNotification(uid) {
    return {
        type: CEASE_NOTIFICATION,
        uid
    };
}

/**
 * Set initialized flag to true.
 * @memberof actions.messagenotifier
 * @return {action} of type `INITIALIZE`
 */
export function initialize() {
    return {
        type: INITIALIZE
    };
}


export default {
    PERSIST_NOTIFICATION, persistNotification,
    PERSIST_NOTIFICATIONS, persistNotifications,
    CEASE_NOTIFICATION, ceaseNotification,
    INITIALIZE, initialize
};
