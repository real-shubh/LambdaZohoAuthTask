console.log("Hi there!");
("use strict");
const https = require("https");
const HttpStatus = require("http-status-codes");
const { Results } = require("realtimatecommon/common/typedefs");
const MessageQueue = require("realtimatecommon/aws/message-queue");
const ZohoTokenQueue = new MessageQueue(process.env.ZOHO_TOKEN_QUEUE);
const clientId = process.env.ZOHO_CLIENT_ID;
const clientSecret = process.env.ZOHO_CLIENT_SECRET;

exports.handler = async (event) => {
  try {
    console.log("Inside the handler!", event);
    for (let i = 0; i < event.Records.length; i++) {
      const record = event.Records[i];
      var data;
      try {
        data = JSON.parse(record.body);
        console.log("body: ",data);
        var accessToken = data.refreshToken;
        const options = {
          hostname: "accounts.zoho.in",
          protocol: "https:",
          path:
            "/oauth/v2/token?" +
            `refresh_token=${accessToken}&client_id=${clientId}&client_secret=${clientSecret}&grant_type=refresh_token`,
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        };
        const tokenReq = https.request(options, (res) => {
          var chunks = "";
          if (res.statusCode != 200) {
            res.setEncoding("utf8");
            console.log("there's some error buddy!", res.statusCode);
            return;
          } else {
            res.on("data", (chunk) => {
              chunks = chunks + chunk;
              console.log("Chunks= ", chunks);
            });
            res.on("end", () => {
              const result = JSON.parse(chunks);
              console.log("result=", result);
            });
          }
        });
        tokenReq.on("error", (error) => {
          console.error("request has error: ", error);
        });
        tokenReq.end();
      } catch (error) {
        console.error(error);
        console.error("Failed Task: ", record);
      }
    }
    console.log("finished!!!");
    return {
      statusCode: 200,
      body: JSON.stringify("Access token refreshed!"),
    };
  } catch (error) {
    console.error(error);
    return { statusCode: 500, body: JSON.stringify(error) };
  }
};

this.handler({
  Records: [
    {
      body: JSON.stringify({
        refreshToken:
          "1000.aaf4e3e88898d07611bb6b9648a417f9.f275c33cd63548a446e72a70efc16391",
      }),
    },
  ],
});
