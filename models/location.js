
const mongoose = require('mongoose')
const Schema = mongoose.Schema

var locationSchema = new Schema({
  _id: String,
  name: String,
  asciiname: String,
  alternatenames: String,
  latitude: String,
  longitude: String,
  loc: {
    'type': {
      type: String, enum: 'Point', default: 'Point'
    },
    coordinates: {
      type: [Number], default: [0, 0]
    }
  },
  feature_class: String,
  feature_code: String,
  country_code: String,
  cc2: String,
  admin1_code: String,
  admin2_code: String,
  admin3_code: String,
  admin4_code: String,
  population: String,
  elevation: String,
  dem: String,
  timezone: String,
  modification_date: String
})

locationSchema.index({loc: '2dsphere'})

module.exports = mongoose.model('Location', locationSchema)
