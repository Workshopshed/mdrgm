/**
 * Created by user on 07/11/2015.
 */

function mdrgmModel() {
  self = this;
  self.clientID = ko.observable("mdrgm" + parseInt(Math.random() * 100, 10));
  self.log = ko.observableArray();

  //Buttons
  self.connect = function() {
    self.client.connect({onSuccess:onConnect});}
  self.disconnect = function() {
    self.client.disconnect();
    self.log.push("Disconnected");}
  self.status = function() {
    message = new Paho.MQTT.Message("Hello");
    message.destinationName = "E14_TM_Q/Status";
    self.client.send(message);
  }
  self.run = function() {
    message = new Paho.MQTT.Message("Run");
    message.destinationName = "E14_TM_Q/Run/" + self.clientID();
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
    self.log.push(message.payloadString);
    console.log("onMessageArrived:" + message.payloadString);
  };

// called when the client connects
  function onConnect() {
    // Once a connection has been made, make a subscription and send a message.
    self.log.push("Connected");
    // Note that a machine would just connect to run and a monitor would just connect to status.
    self.client.subscribe("E14_TM_Q/Status");
    self.client.subscribe("E14_TM_Q/Run/" + self.clientID());
  }

}

ko.applyBindings(new mdrgmModel());
