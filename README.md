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
