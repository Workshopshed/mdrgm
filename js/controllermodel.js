/**
 * Created by user on 07/11/2015.
 */

function mdrgmModel() {
    self = this;
    self.clientID = ko.observable("mdrgm" + parseInt(Math.random() * 100, 10));
    self.log = ko.observableArray();
    self.machines = ko.observableArray();
    self.status = { name : self.clientID, status : "ready" };

  //Buttons
  self.connect = function() {
    self.client.connect({onSuccess:self.onConnect});}
  self.disconnect = function () {
      self.setstatus("disconnected", true);
      self.client.disconnect();
      self.log.push("Disconnected");
      self.machines.removeAll();
  }

  self.ready = function () {
      self.setstatus("ready", true);
      self.client.send(message);
  }

  self.setstatus = function (status, retained) {
      self.status.status = status;
      message = new Paho.MQTT.Message(ko.toJSON(self.status));
      message.retained = retained;
      message.destinationName = self.qStatus;
      self.client.send(message);
  }

  self.run = function() {
    message = new Paho.MQTT.Message("Run");
    message.destinationName = self.qRun;
    self.client.send(message);
  }

  // Create a client instance
  self.client = new Paho.MQTT.Client("ws://iot.eclipse.org/ws", self.clientID());

// set callback handlers
  self.client.onConnectionLost = function (responseObject) {
    // called when the client loses its connection
      if (responseObject.errorCode !== 0) {
        self.log.push("onConnectionLost:"+responseObject.errorMessage);
      }
  };

  function arrayObjectIndexOf(myArray, searchTerm, property) {
      for (var i = 0, len = myArray.length; i < len; i++) {
          if (myArray[i][property] === searchTerm) return i;
      }
      return -1;
  }

  self.client.onMessageArrived = function (message) {
      self.log.push(message.destinationName);
      self.log.push(message.payloadString);

      if (message.destinationName.indexOf("/Status") > -1) {
          try {
              var status = jQuery.parseJSON(message.payloadString);
              if (status.status == "ready") {
                  if (arrayObjectIndexOf(self.machines(),status.name,"name") == -1) {
                    //Todo: Add run button here.


                      self.machines.push(status);
                  }
              }
              if (status.status == "disconnected") {
                  self.machines.remove(function (item) { return item.name == status.name });
              }
          }
          catch (err) {
              self.log.push(err.message);
          }
      }
      else {
          //self.log.push(message.destinationName);
          //self.log.push(message.payloadString);
          console.log("onMessageArrived:" + message.payloadString);
      }
  };

// called when the client connects
  self.onConnect = function() {
    // Once a connection has been made, make a subscription and send a message.
    self.log.push("Connected");
    // Note that a machine would just connect to run and a monitor would just connect to status.
    self.client.subscribe("E14_TM_Q/+/Status");
    self.client.subscribe("E14_TM_Q/+/Run");
  }

}

ko.applyBindings(new mdrgmModel());
