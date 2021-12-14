GeoPortale - Comune di Genova
==========
Build status
------------

Master: ![Build Status](https://github.com/geosolutions-it/MapStore2-c040/actions/workflows/test.yml/badge.svg?branch=master)

Production: ![Build Status](https://github.com/geosolutions-it/MapStore2-c040/actions/workflows/test.yml/badge.svg?branch=production)

Quick Start
------------

Clone the repository with the --recursive option to automatically clone submodules:

`git clone --recursive git@github.com:geosolutions-it/MapStore2-C040.git`

Install NodeJS, if needed, from [here](https://nodejs.org/en/download/).

Start the development application locally:

`npm install`

`npm start`

The application runs at `http://localhost:8081` afterwards.

To create a deployable package:

- Download the [keystore key](http://demo.geo-solutions.it/share/comunege/private/sirac/keystore/encryptAuthResponse_Rijndael_256_PBEWithSHAAnd128BitRC4_100.key) in web/src/main/webapp/keystore
- Edit the web/ldap.properties file with the correct LDAP credentials
- `build.sh`

Read more on the [wiki](git@github.com:geosolutions-it/MapStore2-C040.git/wiki).


Maintenance notifications
------------
It's possible to define list of messages that will be shown to user as persistent notifications.
These notifications are visible globally across the app unless user close them explicitly.

List of messages can be modified by changing plugin configuration in "miscSettings" at localConfig.json:

```json5
{
  "projectionDefs": [],
  "miscSettings": {
    "messageNotifier": {
      "enabled": false, // notifications will appear if it is set to true
      "initialDelay": 1000, // delay before messages get rendered on the page
      "messages": [
        {
          "title": "Notification",
          "message": "Notification message",
          "autoDismiss": 0, // message will be permanent until user close it explicitly
          "position": "tc", // Position: "tl", "tc", "tr", "bl", "bc", "br"
          "level": "warning" // "success", "info", "warning", "error"
        },
        {
          "title": "Notification 2",
          "message": "One more message to show",
          "autoDismiss": 0,
          "position": "tc",
          "level": "info"
        }
      ]
    }
  },
  initalState: {}
}
```

