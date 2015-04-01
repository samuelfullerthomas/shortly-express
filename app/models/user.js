var db = require('../config');
var link = require('./link');
var bcrypt = require('bcrypt-nodejs');
var Promise = require('bluebird');

var User = db.Model.extend({
    tableName: 'users',
    hasTimestamps: false,
    defaults: {},
    urls: function() {
      return this.hasMany(link);
    },
    initialize: function(){
      this.on('creating', function(model, attrs, options){
        var passwordVariable = model.get('password')
        var salt = '$2a$10$MbTyuQ8x/vKcLCXdI71I2.';
        var hash = bcrypt.hashSync(passwordVariable, salt);
        model.set('password', hash);
          
      });
    }
    
});

module.exports = User;