/*
 * Copyright 2017, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
    CEASE_NOTIFICATION, PERSIST_NOTIFICATIONS, PERSIST_NOTIFICATION, INITIALIZE
} from '../actions/messagenotifier';
import assign  from 'object-assign';
import { filter, union } from 'lodash';

function messageNotifier(state = {
    persistentNotifications: [],
    initialized: false
}, action) {
    switch (action.type) {
    case PERSIST_NOTIFICATION: {
        const isPersistent = filter(state.persistentNotifications, (el) => el.uid === action.uid).length > 0;
        return assign(
            {},
            state,
            { persistentNotifications: isPersistent ? [...state.persistentNotifications] : [...state.persistentNotifications, action] }
        );
    }
    case PERSIST_NOTIFICATIONS: {
        return assign(
            {},
            state,
            { persistentNotifications: union(state.persistentNotifications, action.uids) }
        );
    }
    case INITIALIZE: {
        return assign(
            {},
            state,
            { initialized: true }
        );
    }
    case CEASE_NOTIFICATION: {
        return assign({}, state, { persistentNotifications: filter(state.persistentNotifications, (el) => el !== action.uid) } );
    }
    default:
        return state;
    }
}

export default messageNotifier;
