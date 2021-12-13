/*
 * Copyright 2017, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

export const PERSIST_NOTIFICATION = "MESSAGENOTIFIER::PERSIST_NOTIFICATION";
export const CEASE_NOTIFICATION = "MESSAGENOTIFIER::CEASE_NOTIFICATION";

/**
 * Adds notification into list of persistent notifications
 * @memberof actions.messagenotifier
 * @param {object} uid Unique message identifier
 * @return {action} of type `PERSIST_NOTIFICATION`
 */
export function persistNotification(uid) {
    return {
        type: PERSIST_NOTIFICATION,
        uid
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


export default {
    PERSIST_NOTIFICATION, persistNotification,
    CEASE_NOTIFICATION, ceaseNotification
};
