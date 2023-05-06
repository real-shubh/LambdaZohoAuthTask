("use strict");
var mongoose = require("mongoose");
const https = require("https");
const HttpStatus = require("http-status-codes");
const { Results } = require("realtimatecommon/common/typedefs");
const ZohoCreds = require("realtimatecommon/models/zoho-cred");
const MessageQueue = require("realtimatecommon/aws/message-queue");
const { resolve } = require("path");
const { ObjectId } = require("mongodb");
const ZohoTokenQueue = new MessageQueue(process.env.ZOHO_TOKEN_QUEUE);
// const clientId = process.env.ZOHO_CLIENT_ID;
// const clientSecret = process.env.ZOHO_CLIENT_SECRET;
// const refreshToken = process.env.ZOHO_REFRESH_TOKEN;

mongoose.set("strictQuery", true);
mongoose.set("sanitizeProjection", true);
const mongoosePromise = mongoose.connect(
  process.env.MONGODB ||
    "mongodb+srv://RealtimateDev:uEVLIPhHZzcuAftV@realtimatedev.rylvo.mongodb.net/RealtimateDev?retryWrites=true&w=majority"
);

exports.getRefreshToken = () => {
  return new Promise((resolve, reject) => {
    var credList;
    ZohoCreds.find({ devCode: "Brigade" }).then((creds) => {
      console.log("Creddd: ", creds);
      if (creds) {
        credList = creds;
        Promise.all(
        credList.map((cred) => {
          var clientId = cred.clientId;
          var clientSecret = cred.clientSecret;
          var refreshToken = cred.refreshToken;
          var scope = cred.scope;
          return this.getRefreshedAccessToken(
            cred._id,
            clientId,
            clientSecret,
            refreshToken
          );
        })).then((result) => {
            resolve();
          }).catch(error => {
            console.error(error);
            reject(error);
          });
      }
    });
  });
};

exports.getRefreshedAccessToken = async (
  credId,
  clientId,
  clientSecret,
  refreshToken
) => {
  const options = {
    hostname: "accounts.zoho.in",
    protocol: "https:",
    path:
      "/oauth/v2/token?" +
      `refresh_token=${refreshToken}&client_id=${clientId}&client_secret=${clientSecret}&grant_type=refresh_token`,
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  };
  try {
    const tokenRequest = https.request(options, (res) => {
      var chunks = "";
      res.setEncoding("utf8");
      if (res.statusCode != HttpStatus.OK) {
        console.log("there's some error buddy!", res.statusCode);
      } else {
        res.on("data", (chunk) => {
          chunks = chunks + chunk;
        });
        res.on("end", () => {
          const result = JSON.parse(chunks);
          console.log("result=", result);
          if (result.error) {
            console.error(result.error);
            throw result.error;
          } else {
            ZohoCreds.updateOne(
              { _id: ObjectId(credId) },
              {
                accessToken: result.access_token,
              }
            ).then((updateResult) => {
              console.log("UPDATED!!!", updateResult);
            });
            console.log("JEE BAAT");
          }
          return result;
        });
      }
    });
    tokenRequest.on("error", (error) => {
      console.error("request has error: ", error);
    });
    tokenRequest.end();
  } catch (error) {
    console.error("%%",error);
  }
};

exports.handler = async () => {
  await mongoosePromise;
  await this.getRefreshToken();
};

this.handler();
