const util = require('util')
const fs = require('fs')
const readdir = util.promisify(fs.readdir)
const mkdir = util.promisify(fs.mkdir)
const removeFile = util.promisify(fs.unlink)
const rmdir = require('rimraf')
const readline = require('readline')
const mongoose = require('mongoose')
const ProgressBar = require('progress')
const Location = require('./models/location')
const request = require('request')
const path = require('path')
const unzip = require('unzip2')
const program = require('commander')
const defaultMongoHost = 'mongodb://localhost:27017/world-locations'
const allCodes = Object.keys(require('./data/areas.json'))

const locationCodes = [ 'ADM1', 'ADM2', 'ADM3', 'ADM4', 'ADM5', 'PPL', 'PPLA', 'PPLA2', 'PPLA3', 'PPLA4',
  'PPLC', 'PPLF', 'PPLG', 'PPLL', 'PPLQ', 'PPLR', 'PPLS', 'PPLW', 'PPLX', 'STLMT'
]

const ISO31661 = ['AD', 'AE', 'AF', 'AG', 'AI', 'AL', 'AM', 'AN', 'AO', 'AQ', 'AR', 'AS', 'AT', 'AU', 'AW',
  'AX', 'AZ', 'BA', 'BB', 'BD', 'BE', 'BF', 'BG', 'BH', 'BI', 'BJ', 'BL', 'BM', 'BN', 'BO', 'BQ', 'BR', 'BS', 'BT',
  'BV', 'BW', 'BY', 'BZ', 'CA', 'CC', 'CD', 'CF', 'CG', 'CH', 'CI', 'CK', 'CL', 'CM', 'CN', 'CO', 'CR', 'CS', 'CU',
  'CV', 'CW', 'CX', 'CY', 'CZ', 'DE', 'DJ', 'DK', 'DM', 'DO', 'DZ', 'EC', 'EE', 'EG', 'EH', 'ER', 'ES', 'ET', 'FI',
  'FJ', 'FK', 'FM', 'FO', 'FR', 'GA', 'GB', 'GD', 'GE', 'GF', 'GG', 'GH', 'GI', 'GL', 'GM', 'GN', 'GP', 'GQ', 'GR',
  'GS', 'GT', 'GU', 'GW', 'GY', 'HK', 'HM', 'HN', 'HR', 'HT', 'HU', 'ID', 'IE', 'IL', 'IM', 'IN', 'IO', 'IQ', 'IR',
  'IS', 'IT', 'JE', 'JM', 'JO', 'JP', 'KE', 'KG', 'KH', 'KI', 'KM', 'KN', 'KP', 'KR', 'KW', 'KY', 'KZ', 'LA', 'LB',
  'LC', 'LI', 'LK', 'LR', 'LS', 'LT', 'LU', 'LV', 'LY', 'MA', 'MC', 'MD', 'ME', 'MF', 'MG', 'MH', 'MK', 'ML', 'MM',
  'MN', 'MO', 'MP', 'MQ', 'MR', 'MS', 'MT', 'MU', 'MV', 'MW', 'MX', 'MY', 'MZ', 'NA', 'NC', 'NE', 'NF', 'NG', 'NI',
  'NL', 'NO', 'NP', 'NR', 'NU', 'NZ', 'OM', 'PA', 'PE', 'PF', 'PG', 'PH', 'PK', 'PL', 'PM', 'PN', 'PR', 'PS', 'PT',
  'PW', 'PY', 'QA', 'RE', 'RO', 'RS', 'RU', 'RW', 'SA', 'SB', 'SC', 'SD', 'SE', 'SG', 'SH', 'SI', 'SJ', 'SK', 'SL',
  'SM', 'SN', 'SO', 'SR', 'SS', 'ST', 'SV', 'SX', 'SY', 'SZ', 'TC', 'TD', 'TF', 'TG', 'TH', 'TJ', 'TK', 'TL', 'TM',
  'TN', 'TO', 'TR', 'TT', 'TV', 'TW', 'TZ', 'UA', 'UG', 'UM', 'US', 'UY', 'UZ', 'VA', 'VC', 'VE', 'VG', 'VI', 'VN',
  'VU', 'WF', 'WS', 'XK', 'YE', 'YT', 'YU', 'ZA', 'ZM'
]

mongoose.Promise = Promise

mongoose.connection.on('error', (error) => {
  console.log('ERROR: ' + error)
})

const startMongo = async url => {
  await mongoose.connect(url, {
    autoReconnect: true,
    reconnectTries: 1000000,
    reconnectInterval: 3000
  })
}

const saveLocation = async (values, codes) => {
  let location = {}

  const keys = [
    '_id', 'name', 'asciiname', 'alternatenames', 'latitude', 'longitude', 'feature_class', 'feature_code',
    'country_code', 'cc2', 'admin1_code', 'admin2_code', 'admin3_code', 'admin4_code', 'population', 'elevation',
    'dem', 'timezone', 'modification_date'
  ]

  values.forEach((value, index) => {
    location[keys[index]] = value
  })

  let loc = new Location(location)

  loc.loc = {
    type: 'Point',
    coordinates: [Number(location.longitude), Number(location.latitude)]
  }

  if (codes.indexOf(location.feature_code) > -1) await loc.save()
}

const readFile = async (filePath, codes) => {
  return new Promise((resolve, reject) => {
    const rl = readline.createInterface({
      input: fs.createReadStream(filePath),
      crlfDelay: 1
    })

    rl.on('line', async line => {
      rl.pause()
      line = line.split('\t')

      try {
        await saveLocation(line, codes)
      } catch (error) {
        if (error.code !== 11000) return reject(error)
      }

      rl.resume()
    })

    rl.on('close', () => resolve())
    rl.on('error', error => reject(error))
  })
}

const saveFile = url => {
  return new Promise((resolve, reject) => {
    request(url)
      .pipe(unzip.Extract({ path: path.join(__dirname, 'tmp') }))
      .on('error', error => reject(error))
      .on('finish', () => resolve())
  })
}

const downloadFiles = async countryCodes => {
  console.log(`Donwloading files in ${path.join(__dirname, 'tmp')} ...`)
  countryCodes.filter(code => {
    if (ISO31661.indexOf(code) === -1) console.error(code, 'is not a valid code')
    return ISO31661.indexOf(code) > -1
  })

  let promises = []
  countryCodes.forEach(name => promises.push(saveFile(`http://download.geonames.org/export/dump/${name}.zip`)))

  return new Promise((resolve, reject) => {
    Promise.all(promises)
      .then(() => resolve())
      .catch(error => console.log(error))
  })
}

const main = async ({countries, mongoUrl, codes}) => {
  let tmpFolder = path.join(__dirname, 'tmp')

  codes = codes.filter(code => {
    if (allCodes.indexOf(code) === -1) console.log(code, 'invalid location code')
    return allCodes.indexOf(code) > -1
  })

  try {
    await startMongo(mongoUrl)
  } catch (error) {
    console.error(error)
    process.exit(1)
  }

  try {
    await mkdir(tmpFolder)
    await downloadFiles(countries)
    await removeFile(path.join(__dirname, 'tmp', 'readme.txt'))
    let bar = new ProgressBar(':bar :current/:total :percent', { total: countries.length })
    const files = await readdir(tmpFolder)

    console.log('Filling the database')
    for (let file of files) {
      await readFile(path.join(__dirname, 'tmp', file), codes)
      bar.tick()
    }
  } catch (error) {
    console.error(error)
    console.log('\nTRY AGAIN...')
  }

  rmdir(tmpFolder, () => {
    console.log('End')
    process.exit(0)
  })
}

const list = val => val.toUpperCase().split(',')

program
  .version('0.1.0')
  .usage('[options] <...>')
  .option('-c, --countries <items>', 'list of ISO country code (ISO 3166-1 alpha-2) comma separated (without spaces)', list)
  .option('-a, --allCountries', 'All available countries')
  .option('-C, --codes <items>', 'list of location codes. By default this script just save the areas that can be considered a settlement', list)
  .option('-A, --allCodes', 'All available location codes')
  .option('-m, --mongo [value]', 'Mongo host, by default mongodb://localhost:27017/world-locations')
  .parse(process.argv)

main({
  countries: program.allCountries ? ISO31661 : program.countries || ISO31661,
  mongoUrl: program.mongo || defaultMongoHost,
  codes: program.allCodes ? allCodes : program.codes || locationCodes
})
