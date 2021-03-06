// The Cloud Functions for Firebase SDK to create Cloud Functions and setup triggers.
const functions = require("firebase-functions");
const { TranslationServiceClient } = require("@google-cloud/translate");
 
const dialogflow = require('@google-cloud/dialogflow').v2beta1;
const uuid = require("uuid/v4");
 
// The Firebase Admin SDK to access the Firebase Realtime Database.
const admin = require("firebase-admin");
admin.initializeApp();
 
async function translateText(text, targetLang = "en-US") {
  // Instantiates a client
  const translationClient = new TranslationServiceClient();
 
  // Construct request
  const request = {
    parent: `projects/${functions.config().chat.projectid}/locations/us-central1`,
    contents: [text],
    mimeType: "text/plain", // mime types: text/plain, text/html
    targetLanguageCode: targetLang
  };
 
  // Run request
  const [response] = await translationClient.translateText(request);
  const translation = response.translations[0];
  return {
    "languageCode" : translation.detectedLanguageCode,
    "translatedText" : translation.translatedText
  };
}
 
async function getIntent(msg, sessionId) {
  // Create a new session
  const sessionClient = new dialogflow.SessionsClient();
  const sessionPath = sessionClient.projectAgentSessionPath(
    functions.config().chat.projectid,
    sessionId
  );
  
  const knowledgeBaseId = functions.config().chat.knowledgebaseid;
  const knowledgeBasePath =
  'projects/' + functions.config().chat.projectid + '/knowledgeBases/' + knowledgeBaseId + '';
 
  const request = {
    session: sessionPath,
    queryInput: {
      text: {
        text: msg,
        // Always send to Dialogflow in English
        languageCode: "en-AU"
      },
    },
    queryParams: {
    knowledgeBaseNames: [knowledgeBasePath],
    },
  };
 
  // Send request and log result
  const responses = await sessionClient.detectIntent(request);
  const result = responses[0].queryResult;
  console.log(`Detected Intent: ${result.intent.displayName}`);
  return {
      "intent" : result.intent.displayName,
      "replyText" : result.fulfillmentText,
  }
}
 
exports.translateText = functions.https.onRequest(async (req, res) => {
  const reply = await translateText(req.body.text, req.body.targetLang);
  res.json({
    detectedLanguageCode: reply["languageCode"],
    translatedText: reply["translatedText"]
  });
});
 
exports.getIntent = functions.https.onRequest(async (req, res) => {
  const sessionId = uuid();
  const result = await getIntent(req.body.text, sessionId);
  res.json({
    intent: result.intent,
    replyText: result.replyText
  });
});
 
exports.translateIntent = functions.https.onRequest(async (req, res) => {
  const sessionId = req.body.sessionId;
  console.log("Session id ", sessionId);
  const enQuery = await translateText(req.body.text, "en-US");
  const languageCode = enQuery.languageCode;
  console.log("Language code " + languageCode);
  const enRequest = enQuery.translatedText;
 
  console.log("Getting intent for ", enRequest);
  const enReply = await getIntent(enRequest, sessionId);
 
  // Translate back to the speakers origin language
  let translatedReply = enReply.replyText;
  if (languageCode && !languageCode.includes("en")) {
    translatedReply = (await translateText(enReply.replyText, languageCode)).translatedText;
  }
 
  res.json({
    detectedLanguage: languageCode,
    intent: enReply.intent,
    replyText: translatedReply ? translatedReply : enReply.replyText,
    enReply: enReply.replyText,
  });
});