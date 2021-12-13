/*
 * Copyright 2016, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {useEffect, useState} from 'react';
import { connect } from 'react-redux';
import { map, forEach, includes, filter } from 'lodash';
import messageNotifier from '@js/reducers/messagenotifier';
import epics from '@js/epics/messagenotifier';


import {show} from '@mapstore/actions/notifications';
import {createPlugin}  from '@mapstore/utils/PluginsUtils';
import { createStructuredSelector } from 'reselect';
import {locationSelector, persistentNotificationsSelector} from "@js/selector/cantieri";
import assign from "object-assign";

/**
 * Plugin to display messages during maintenance
 * @name MessageNotifier
 * @memberof plugins
 * @static
 * @example
 * {name: "MessageNotifier"}
 */
const MessageNotifier = ({ location, persistentNotifications, showNotification, pluginCfg: {
    messages = [],
    enabled = false,
    initialDelay = 500
} }) => {
    const [notifications, setNotifications] = useState([]);
    useEffect(() => {
        if (messages.length && enabled) {
            const mapped = map(messages, (el, idx) => {
                return assign({}, el, {uid: el.uid ?? Date.now() + idx, level: el.level ?? 'info'});
            });
            setNotifications(mapped);
        }
    }, []);
    useEffect(() => {
        forEach(notifications, (notification) => {
            // @todo: Use smarter way to wait while page is fully loaded
            setTimeout(function() {
                showNotification({
                    ...notification,
                    persistent: true
                }, notification.level);
            }, initialDelay);
        });
    }, [notifications]);

    useEffect(() => {
        // Respawn notifications that were persistent by setting persistency flag
        const persistent = filter(notifications, (el) => includes(persistentNotifications, el.uid));
        if (persistent.length) {
            setNotifications(persistent);
        }
    }, [location.pathname, location.hash]);

    return false;
};

export default createPlugin('MessageNotifier', {
    component: connect(createStructuredSelector({
        location: locationSelector,
        persistentNotifications: persistentNotificationsSelector
    }),
    {
        showNotification: show
    }
    )(MessageNotifier),
    reducers: {
        messageNotifier
    },
    epics
});
