import { randomUUID } from "crypto";
import { Decoder, Encoder } from "@msgpack/msgpack";

const PORT = "5810";
const serverAddr = "ws://localhost:" + PORT + "/nt/nt4.js";
const socket = new WebSocket(serverAddr);

console.log(`Listening on ${serverAddr}`);

const msgpackDecoder = new Decoder();
const msgpackEncoder = new Encoder();
const rttOnly = false;

// message is received
socket.addEventListener("message", event => {
    console.log(typeof event.data);
    if (typeof event.data === "string") {
        // Exit if RTT only
        if (rttOnly) {
          console.warn("[NT4] Ignoring text message, received by RTT only connection.");
        }
  
        // JSON array
        let msgData = JSON.parse(event.data);
        if (!Array.isArray(msgData)) {
          console.warn("[NT4] Ignoring text message, JSON parsing did not produce an array at the top level.");
          return;
        }
  
        msgData.forEach((msg) => {
        //   // Validate proper format of message
        //   if (typeof msg !== "object") {
        //     console.warn("[NT4] Ignoring text message, JSON parsing did not produce an object.");
        //     return;
        //   }
  
        //   if (!("method" in msg) || !("params" in msg)) {
        //     console.warn("[NT4] Ignoring text message, JSON parsing did not find all required fields.");
        //     return;
        //   }
  
          let method = msg["method"];
          let params = msg["params"];
  
        //   if (typeof method !== "string") {
        //     console.warn('[NT4] Ignoring text message, JSON parsing found "method", but it wasn\'t a string.');
        //     return;
        //   }
  
        //   if (typeof params !== "object") {
        //     console.warn('[NT4] Ignoring text message, JSON parsing found "params", but it wasn\'t an object.');
        //     return;
        //   }
  
          // Message validates reasonably, switch based on supported methods
          if (method === "announce") {
            // let newTopic = new NT4_Topic();
            // newTopic.uid = params.id;
            // newTopic.name = params.name;
            // newTopic.type = params.type;
            // newTopic.properties = params.properties;
            // serverTopics.set(newTopic.name, newTopic);
            // onTopicAnnounce(newTopic);
            console.log(JSON.stringify(params["properties"]));
          } else if (method === "unannounce") {
            let removedTopic = serverTopics.get(params.name);
            if (!removedTopic) {
              console.warn("[NT4] Ignoring unannounce, topic was not previously announced.");
              return;
            }
            // serverTopics.delete(removedTopic.name);
            // onTopicUnannounce(removedTopic);
          } else if (method === "properties") {
            let topic = serverTopics.get(params.name);
            if (!topic) {
              console.warn("[NT4] Ignoring set properties, topic was not previously announced.");
              return;
            }
            for (const key of Object.keys(params.update)) {
              let value = params.update[key];
              if (value === null) {
                delete topic.properties[key];
              } else {
                topic.properties[key] = value;
              }
            }
          } else {
            console.warn("[NT4] Ignoring text message - unknown method " + method);
            return;
          }
        });
      } else {
        // MSGPack
        for (let unpackedData of msgpackDecoder.decodeMulti(event.data)) {
        // topicID, timestamp, typeIdx should be integers
          let topicID = unpackedData[0]
          let timestamp_us = unpackedData[1];
          let typeIdx = unpackedData[2];
          let value = unpackedData[3];
          console.log(topicID, timestamp_us, typeIdx, value.toString());
  
          // Validate types
          if (typeof topicID !== "number") {
            console.warn("[NT4] Ignoring binary data, topic ID is not a number");
            return;
          }
          if (typeof timestamp_us !== "number") {
            console.warn("[NT4] Ignoring binary data, timestamp is not a number");
            return;
          }
          if (typeof typeIdx !== "number") {
            console.warn("[NT4] Ignoring binary data, type index is not a number");
            return;
          }
  
          // Process data
        //   if (topicID >= 0) {
        //     if (rttOnly) {
        //       console.warn("[NT4] Ignoring binary data, not an RTT message but received by RTT only connection");
        //     }
        //     // let topic: NT4_Topic | null = null;
        //     let topic = null;
        //     for (let serverTopic of serverTopics.values()) {
        //       if (serverTopic.uid === topicID) {
        //         topic = serverTopic;
        //         break;
        //       }
        //     }
        //     if (!topic) {
        //       console.warn("[NT4] Ignoring binary data - unknown topic ID " + topicID.toString());
        //       return;
        //     }
        //     onNewTopicData(topic, timestamp_us, value);
        //   } else if (topicID === -1) {
        //     ws_handleReceiveTimestamp(timestamp_us, value as number);
        //   } else {
        //     console.warn("[NT4] Ignoring binary data - invalid topic ID " + topicID.toString());
        //   }
        }
      }
});

// According to advantagescope
const subuid = Math.floor(Math.random() * 99999999);
const options = {};

function ws_onOpen(ws) {
  // Set the flag allowing general server communication
  serverConnectionActive = true;
  console.log('[NT4] Connected with protocol "' + ws.protocol + '"');

  // If v4.1, start RTT only ws
  if (ws.protocol === "v4.1.networktables.first.wpi.edu") {
    ws_connect(true);
  } else {
    // v4.0 and RTT only should send timestamp
    // ws_sendTimestamp();
  }

  // if (ws.protocol !== "rtt.networktables.first.wpi.edu") {
  //   // Publish any existing topics
  //   for (const topic of this.publishedTopics.values()) {
  //     this.ws_publish(topic);
  //   }

  //   // Subscribe to existing subscriptions
  //   for (const subscription of this.subscriptions.values()) {
  //     this.ws_subscribe(subscription);
  //   }

  //   // User connection-opened hook
  //   this.onConnect();
  // }
}

// socket opened
socket.addEventListener("open", event => {
    console.log("Opened!");
    // ????
    const rttWs = false;
    // Copy advantagescope
    const ws = new WebSocket(
      serverAddr,
      rttWs ? ["rtt.networktables.first.wpi.edu"] : ["v4.1.networktables.first.wpi.edu", "networktables.first.wpi.edu"]
    );
    ws.binaryType = "arraybuffer";
    ws.addEventListener("open", () => ws_onOpen(ws));
    ws.addEventListener("message", (event) => ws_onMessage(event, rttWs));
    // socket.send(JSON.stringify([
    //     {
    //         method: 'subscribe',
    //         params: {
    //             topics: ["/Robot/Swerve/Pose"],
    //             subuid,
    //             options
    //         }
    //     }
    // ]));
});
// socket closed
socket.addEventListener("close", event => {
    console.log(event.reason)
});

// error handler
socket.addEventListener("error", event => {
    console.log(event.error);
});