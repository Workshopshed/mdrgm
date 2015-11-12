/**
 * Created by user on 07/11/2015.
 */

function mdrgmModel() {
    self = this;
    self.clientID = ko.observable("mdrgmController" + parseInt(Math.random() * 100, 10));
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

  self.setstatus = function (status, retained) {
      self.status.status = status;
  }

  self.run = function(machine) {
    message = new Paho.MQTT.Message("Run");
    message.destinationName = machine.qRun;
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

              try {
                  //Split destinaiton into parts.
                  var parts = message.destinationName.split("/");
                  if (parts.length == 3) 
                  {
                      var clientID = parts[1];

                      //Todo: Make the machine "obserbable so we can change statuses etc
                      if (message.payloadString != "") {
                          var machine = jQuery.parseJSON(message.payloadString);
                          machine.clientID = clientID;
                          if (machine.status == "ready") {
                              if (arrayObjectIndexOf(self.machines(), clientID, "name") == -1) {
                                  machine.qRun = "E14_TM_Q/" + machine.name + "/Run";
                                  machine.button = function () {
                                      self.run(machine);
                                  }
                                  self.machines.push(machine);
                              }
                          }
                      }
                      //Empty payload signifies a disconnect
                      else  {
                          self.machines.remove(function (item) {
                              return item.name == clientID
                          });
                      }
                  }
              }
              catch (err) {
                  self.log.push(err.message);
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
