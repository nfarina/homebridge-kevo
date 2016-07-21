var request = require('request').defaults({jar: true/*, proxy:"http://localhost:8888", strictSSL:false*/}); // use cookies
var cheerio = require('cheerio');
var Service, Characteristic;

module.exports = function(homebridge) {
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;

  homebridge.registerAccessory("homebridge-kevo", "Kevo", KevoAccessory);
}

var lockOrder = 0;
var lockEventSpacing = 15000;
var lockEventsOccurring = 0;

function KevoAccessory(log, config) {
  this.log = log;
  this.name = config["name"];
  this.username = config["username"];
  this.password = config["password"];
  this.lockId = config["lock_id"];
  this.lockOrder = lockOrder++;

  this.service = new Service.LockMechanism(this.name);
  
  this.service
    .getCharacteristic(Characteristic.LockCurrentState)
    .on('get', this.getState.bind(this));
  
  this.service
    .getCharacteristic(Characteristic.LockTargetState)
    .on('get', this.getState.bind(this));
  this.service
    .getCharacteristic(Characteristic.LockTargetState)
    .on('set', this.setState.bind(this));
  
  this._setup();
}

KevoAccessory.prototype._setup = function() {
  this._login(function(err) {
    if (err) {
      this.log("There was a problem logging into Kevo. Check your username and password.");
      return;
    } 
    else {
      this._checkLockExists(function(err) {});
    }
  }.bind(this));
}

KevoAccessory.prototype._login = function(callback) {
  var url = "https://www.mykevo.com/login";

  var followRedirect = function(response) {
    if (response.headers.location === "https://www.mykevo.com/user/locks") {
      this.log("Already logged in.");
      callback(null);
      return false; // don't follow this redirect, we're done
    }
    
    return true; // ok redirect, sure
  }.bind(this);

  request(url, {followRedirect:followRedirect}, function (err, response, body) {
    if (response.statusCode == 302) return; // we cancelled a redirect above
    
    if (!err && response.statusCode == 200 && response.headers['content-type'].indexOf("text/html") == 0) {

      var form = {
        "user[username]": this.username,
        "user[password]": this.password,
        "commit": "Sign In"
      };
      
      // the response is an HTML login page. Suck out the hidden input fields so we can simulate a form submit
      var $ = cheerio.load(body);
      var action = $('form').attr('action');
      
      $('input[type=hidden]').each(function(i, input) {
        var name = $(input).attr('name');
        var value = $(input).val();
        form[name] = value;
      });
      
      if (!action) {
        this.log("Couldn't find form action.");
        this.log(body);
        callback(err);
        return;
      }
      
      // Submit the login page
      request.post(action, {form:form}, function(err, response, body) {
        // we expect a redirect response
        if (!err && response.statusCode == 302) {
          this.log("Login successful.");
          callback(null);
        }
        else {
          err = err || new Error("Bad status code " + response.statusCode);
          this.log("Error submitting login page: %s", err);
          callback(err);
        }
      }.bind(this));

    }
    else {
      err = err || new Error("Invalid response code " + response.statusCode)
      this.log("Error requesting login page: %s", err);
      callback(err);
    }
  }.bind(this));
}

KevoAccessory.prototype._checkLockExists = function(callback) {
  var url = "https://www.mykevo.com/user/locks";
  
  request(url, function(err, response, body) {
    if (!err && response.statusCode == 200) {
      var $ = cheerio.load(body);
      var seenLockIds = [];
      
      // pull out all elements with "data-lock-id" defined
      $('*[data-lock-id]').each(function(i, elem) {
        var lockId = $(elem).attr('data-lock-id');

        if (this.lockId == null && seenLockIds.indexOf(lockId) < 0) {
          seenLockIds.push(lockId);
        }
        else if (lockId == this.lockId) {
          callback(null);
          return;
        }
      }.bind(this));

      if (this.lockId == null) {
        this.log("No lock ID specified, list of possible lock IDs: ");
        this.log(seenLockIds);
      }
      else {
        err = new Error("Could not locate lock with ID: %s", this.lockId);
        callback(err);
      }
    }
    else {
      err = err || new Error("Invalid status code " + response.statusCode);
      this.log("Error fetching lock: %s", err);
      callback(err);
    }
  }.bind(this));
}

KevoAccessory.prototype._getLockStatus = function(callback) {
  var url = "https://www.mykevo.com/user/remote_locks/command/lock.json";
  var qs = {
    arguments: this.lockId
  };
  request(url, {qs:qs}, function(err, response, body) {

    if (!err && response.statusCode == 200) {
      var json = JSON.parse(body);
      var state = json.bolt_state; // "Unlocked" or "Locked" or maybe "Processing" or "Confirming"
      callback(null, state);
    }
    else {
      err = err || new Error("Invalid status code " + response.statusCode);
      this.log("Error getting lock status: %s", err);
      callback(err);
    }
    
  }.bind(this));
}

KevoAccessory.prototype._setLockStatus = function(status, callback) {
  var url;
  
  if (status === "Locked") {
    url = "https://www.mykevo.com/user/remote_locks/command/remote_lock.json";
  }
  else if (status === "Unlocked") {
    url = "https://www.mykevo.com/user/remote_locks/command/remote_unlock.json";
  }
  else {
    this.log("Invalid lock status %s", status);
    callback(new Error("Invalid lock status"));
    return;
  }
    
  var qs = {
    arguments: this.lockId
  };
  
  request(url, {qs:qs}, function(err, response, body) {

    if (!err && response.statusCode == 200) {
      var json = JSON.parse(body);
      
      if (json.status_code !== 201) {
        callback(new Error("Unexpected status_code " + json.status_code));
        return;
      }
      
      // success!
      callback(null);
    }
    else {
      err = err || new Error("Invalid status code " + response.statusCode);
      this.log("Error setting lock status: %s", err);
      callback(err);
    }
    
  }.bind(this));
}

KevoAccessory.prototype.getState = function(callback, state) {
  if (!this.lockId) {
    this.log("Lock has no ID assigned; can't get current state.");
    return;
  }

  this.log("Getting current state...");
    
  this._login(function(err) {
    if (err) {
      callback(err);
      return;
    }
    
    this._getLockStatus(function(err, status) {

      this.log("Lock status is %s", status);
      if (status === "Locked") {
        callback(null, true); // success, locked
      }
      else if (status === "Unlocked") {
        callback(null, false); // success, unlocked
      }
      else {
        err = new Error("Invalid lock status '"+status+"'");
        this.log("Error getting state: %s", err);
        callback(err);
      }

    }.bind(this));
  }.bind(this));
}
  
KevoAccessory.prototype.setState = function(state, callback) {
  if (!this.lockId) {
    this.log("Lock has no ID assigned; can't set current state");
    return;
  }

  var kevoStatus = (state == Characteristic.LockTargetState.SECURED) ? "Locked" : "Unlocked";

  this._login(function(err) {
    if (err) {
      callback(err);
      return;
    }

    var lockStatusCallback = function(err) {
      if (err) {
        this.log("Error setting state: %s", err);
        callback(err);
        lockEventsOccurring--;
        return;
      }

      // we succeeded, so update the "current" state as well
      var currentState = (state == Characteristic.LockTargetState.SECURED) ?
        Characteristic.LockCurrentState.SECURED : Characteristic.LockCurrentState.UNSECURED;
      this.service
        .setCharacteristic(Characteristic.LockCurrentState, currentState);
      
      // success
      lockEventsOccurring--;
      callback(null);
      
    }.bind(this);

    if (lockEventsOccurring > 0) {
      lockEventsOccurring++;
      setTimeout(function() {
        this.log("Setting status to %s", kevoStatus);
        this._setLockStatus(kevoStatus, lockStatusCallback);
      }.bind(this), this.lockOrder * lockEventSpacing);
    }
    else {
      lockEventsOccurring++;
      this.log("Setting status to %s", kevoStatus);
      this._setLockStatus(kevoStatus, lockStatusCallback);
    }
  
  }.bind(this));

}

KevoAccessory.prototype.getServices = function() {
  return [this.service];
}
