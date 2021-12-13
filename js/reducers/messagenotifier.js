/*
 * Copyright 2017, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { CEASE_NOTIFICATION, PERSIST_NOTIFICATION
}  from '../actions/messagenotifier';
import assign  from 'object-assign';
import { filter } from 'lodash';

function messageNotifier(state = {
    persistentNotifications: []
}, action) {
    switch (action.type) {
    case PERSIST_NOTIFICATION: {
        return assign({}, state, { persistentNotifications: [...state.persistentNotifications, action.uid] } );
    }
    case CEASE_NOTIFICATION: {
        return assign({}, state, { persistentNotifications: filter(state.persistentNotifications, (el) => el !== action.uid) } );
    }
    default:
        return state;
    }
}

export default messageNotifier;
