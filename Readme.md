[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](http://standardjs.com/)

# Create database of locations 🌎 🌍 🌏

## Overview
This script will create a database in `Mongo` with locations using this [data](http://download.geonames.org/export/dump)
By default this script doesn't save all locations (also include mountains, lakes, hotels ...), just save the areas that can be considered a settlement. That info is [here](http://www.geonames.org/export/codes.html).

### Before start
Install dependencies

```
npm install
```

### Running the script
To run the script, run:

```
  node app [options] <...>

  Options:

    -V, --version            output the version number
    -c, --countries <items>  list of ISO country code (ISO 3166-1 alpha-2) comma separated (without spaces)
    -a, --allCountries       All available countries
    -C, --codes <items>      list of location codes. By default this script just save the areas that can be considered a settlement
    -A, --allCodes           All available location codes
    -m, --mongo [value]      Mongo host, by default mongodb://localhost:27017/world-locations
    -h, --help               output usage information
```

List of valid ISO 3166-1 alpha-2 codes [here](https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2#CX)
