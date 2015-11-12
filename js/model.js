/**
 * Client model, this would be what is reproduced for each machine
 * Note that the log is just for debugging not a requirement of the machine
 */

function mdrgmModel() {
    self = this;
    self.clientID = ko.observable("mdrgm" + parseInt(Math.random() * 100, 10));
    self.qStatus = "E14_TM_Q/" + self.clientID() + "/Status";
    self.qRun = "E14_TM_Q/" + self.clientID() + "/Run";
    self.log = ko.observableArray();
    self.status = { name: self.clientID, status: "ready" };
    self.disconnectMessage = new Paho.MQTT.Message("");
    self.disconnectMessage.retained = true;
    self.disconnectMessage.destinationName = self.qStatus;


    //Buttons
    self.connect = function () {
        self.client.connect({ onSuccess: self.onConnect, willMessage: self.disconnectMessage });
    }

    self.disconnect = function () {
        //Send empty message
        self.client.send(self.disconnectMessage);
        self.client.disconnect();
        self.log.push("Disconnected");
    }

    self.ready = function () {
          self.setstatus("ready", true);
    }
    
    //For self testing without a controller
    self.run = function () {
        message = new Paho.MQTT.Message("Run");
        message.destinationName = self.qRun;
        self.client.send(message);
    }

    self.setstatus = function (status, retained) {
          self.log.push(status);
          self.status.status = status;
          var message = new Paho.MQTT.Message(ko.toJSON(self.status));
          message.retained = retained;
          message.destinationName = self.qStatus;
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

      self.client.onMessageArrived = function (message) {
          //If the message is "Run" then run the machine

          self.log.push(message.destinationName);
          self.log.push(message.payloadString);

          console.log("onMessageArrived:" + message.payloadString);
      };

      self.onConnect = function() {
        self.log.push("Connected");
        self.client.subscribe(self.qRun);
      }

}

ko.applyBindings(new mdrgmModel());
