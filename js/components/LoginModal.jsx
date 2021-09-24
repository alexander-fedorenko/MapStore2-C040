/*
 * Copyright 2019, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
*/

import PropTypes  from 'prop-types';
import React  from 'react';
import {Button, Row}  from 'react-bootstrap';

import Modal  from '@mapstore/components/misc/Modal';
import Message  from '@mapstore/components/I18N/Message';
import {getMessageById}  from '@mapstore/utils/LocaleUtils';

import '@mapstore/components/security/css/security.css';

/**
 * A Modal window to show password reset form
 */
class LoginModal extends React.Component {
    static propTypes = {
        // props
        user: PropTypes.object,
        show: PropTypes.bool,
        options: PropTypes.object,

        // CALLBACKS
        onClose: PropTypes.func,
        style: PropTypes.object,
        buttonSize: PropTypes.string
    };

    static contextTypes = {
        messages: PropTypes.object
    };

    static defaultProps = {
        onClose: () => {},
        options: {},
        style: {},
        buttonSize: "large"
    };

    render() {
        return (<Modal {...this.props.options} show={this.props.show} onHide={this.props.onClose}>
            <Modal.Header key="passwordChange" closeButton>
                <Modal.Title><Message msgId="user.login"/></Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Row className="centered">
                    <h3>
                        <Message msgId="login.spid-title"/>
                    </h3>
                </Row>
                <Row className="centered">
                    <Button
                        ref="submitSpid"
                        value={getMessageById(this.context.messages, "user.spidLogin")}
                        bsStyle="primary"
                        bsSize={this.props.buttonSize}
                        className="pull-left"
                        onClick={() => window.location.replace('login')}
                        key="submitSpid">
                        {getMessageById(this.context.messages, "user.spidLogin")}
                    </Button>
                </Row>
            </Modal.Body>
        </Modal>);
    }
}

export default LoginModal;
