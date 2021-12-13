/*
 * Copyright 2016, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {useEffect, useState} from 'react';
import { connect } from 'react-redux';
import { map, forEach, filter, includes } from 'lodash';
import { createStructuredSelector } from 'reselect';
import messageNotifier from '@js/reducers/messagenotifier';

import epics from '@js/epics/messagenotifier';
import { persistNotifications, initialize } from '@js/actions/messagenotifier';
import {show} from '@mapstore/actions/notifications';
import {createPlugin}  from '@mapstore/utils/PluginsUtils';
import ConfigUtils from '@mapstore//utils/ConfigUtils';

import {
    locationSelector,
    persistentNotificationsSelector,
    notificationsSelector,
    persistentNotificationsState
} from "@js/selector/cantieri";
import assign from "object-assign";

/**
 * Plugin to display messages during maintenance
 * @name MessageNotifier
 * @memberof plugins
 * @static
 * @example
 * {name: "MessageNotifier"}
 */
const MessageNotifier = ({ location, pluginCfg,
    persistentNotifications, notifications, persist,
    initialize: initializeConfig, initialized, showNotification  }) => {
    const miscSettings = ConfigUtils.getConfigProp('miscSettings');
    const messages = pluginCfg.messages ?? miscSettings?.messageNotifier?.messages ?? [];
    const enabled = pluginCfg.enabled ?? miscSettings?.messageNotifier?.enabled ?? false;
    const initialDelay = pluginCfg.initialDelay ?? miscSettings?.messageNotifier?.initialDelay ?? 500;

    const [processedEntities, setProcessedEntities] = useState([]);
    useEffect(() => {
        const mapped = map(messages, (el, idx) => {
            return assign({}, el, {uid: el.uid ?? "messageNotifier_" + idx, level: el.level ?? 'info'});
        });
        if (enabled) {
            if (mapped.length) {
                setProcessedEntities(mapped);
            }
            if (!initialized) {
                initializeConfig();
                persist(map(mapped, m => m.uid));
            }
        }
    }, []);
    useEffect(() => {
        const persistent = filter(processedEntities, (el) => includes(persistentNotifications, el.uid));
        forEach(persistent, (entity) => {
            if (filter(notifications, (el) => el.uid === entity.uid).length === 0) {
                // @todo: Use smarter way to wait while page is fully loaded
                setTimeout(function() {
                    showNotification({
                        ...entity,
                        persistent: true
                    }, entity.level);
                }, initialDelay);
            }
        });
    }, [processedEntities, location.pathname, location.hash]);
    return false;
};

export default createPlugin('MessageNotifier', {
    component: connect(createStructuredSelector({
        location: locationSelector,
        persistentNotifications: persistentNotificationsSelector,
        notifications: notificationsSelector,
        initialized: persistentNotificationsState
    }),
    {
        showNotification: show,
        persist: persistNotifications,
        initialize
    }
    )(MessageNotifier),
    reducers: {
        messageNotifier
    },
    epics
});
