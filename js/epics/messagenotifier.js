/*
 * Copyright 2017, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
*/
import Rx from 'rxjs';

import { ceaseNotification, persistNotification } from '../actions/messagenotifier';
import { SHOW_NOTIFICATION, HIDE_NOTIFICATION } from "@mapstore/actions/notifications";
import { size, filter, get } from 'lodash';

/**
 * Persist notification that is marked as persistent.
 * @param {external:Observable} action$ manages `SHOW_NOTIFICATION`.
 * @memberof epics.messagenotifier
 * @return {external:Observable}
 */
export const makeNotificationPersistent = action$ =>
    action$.ofType(SHOW_NOTIFICATION)
        .switchMap((notification) => Rx.Observable.of(notification.persistent ? persistNotification(notification.uid) : false));

/**
 * Cease notification that is marked as persistent.
 * @param {external:Observable} action$ manages `HIDE_NOTIFICATION`.
 * @memberof epics.messagenotifier
 * @return {external:Observable}
 */
export const ceaseNotificationPersistence = (action$, store) =>
    action$.ofType(HIDE_NOTIFICATION)
        .switchMap(({uid}) => {
            const messageNotifierState = store.getState().messageNotifier
            const isPersistent = size(filter(get(messageNotifierState, 'persistentNotifications', []), (el) => el === uid))
            return Rx.Observable.of(isPersistent ? ceaseNotification(uid) : false);
        });

/**
 * Epics for notifications
 * @name epics.notifications
 * @type {Object}
 */

export default {
    makeNotificationPersistent,
    ceaseNotificationPersistence
};
