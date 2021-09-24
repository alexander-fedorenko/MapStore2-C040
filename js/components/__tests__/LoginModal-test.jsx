/**
 * Copyright 2015-2016, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import expect from 'expect';
import React from 'react';
import ReactDOM from 'react-dom';
import LoginModal from '../LoginModal';

describe("Test the login modal", () => {
    beforeEach((done) => {
        document.body.innerHTML = '<div id="container"></div>';
        setTimeout(done);
    });

    afterEach((done) => {
        ReactDOM.unmountComponentAtNode(document.getElementById("container"));
        document.body.innerHTML = '';
        setTimeout(done);
    });

    it('creates component with defaults', () => {
        const cmp = ReactDOM.render(<LoginModal options={{animation: false}}/>, document.getElementById("container"));
        expect(cmp).toExist();
    });

    it('creates component with only SPID login', () => {
        const cmp = ReactDOM.render(<LoginModal options={{animation: false}} show />, document.getElementById("container"));
        expect(cmp).toExist();
        let inputs = document.getElementsByTagName("input"); // No Mapstore login fields
        expect(inputs.length).toBe(0);
    });

    it('creates component with spidLogin', () => {
        const cmp = ReactDOM.render(<LoginModal options={{animation: false}} show loginError={{status: 0}}/>, document.getElementById("container"));
        expect(cmp).toExist();
        let buttons = document.getElementsByTagName('button');
        expect(buttons.length).toBe(2); // SPID login button, close button and X button
    });
});
