#!/bin/bash
cd ~/dialogflow_translation/
sed -i "s|"dialogflow"|"@google-cloud/dialogflow"|g" ~/dialogflow_translation/functions/package.json
sed -i "s|"1.0.0"|"2.0.0"|g" ~/dialogflow_translation/functions/package.json
sed -i "s|"\:\ \"8\""|"\:\ \"10\""|g" ~/dialogflow_translation/functions/package.json
echo "package.json updated..."

sed -i "s|"\(\"dialogflow\"\)"|"\(\'@google-cloud\/dialogflow\'\)\.v2beta1"|g" ~/dialogflow_translation/functions/index.js
sed -i "s|"sessionClient\.sessionPath"|"sessionClient\.projectAgentSessionPath"|g" ~/dialogflow_translation/functions/index.js
sed -i '54i \ \ const knowledgeBaseId = functions.config().chat.knowledgebaseid' ~/dialogflow_translation/functions/index.js
sed -i '54i \ \ const knowledgeBaseId = functions.config().chat.knowledgebaseid' ~/dialogflow_translation/functions/index.js
sed -i '55i \ \ const knowledgeBasePath =' ~/dialogflow_translation/functions/index.js
sed -i '56i placeholder'  ~/dialogflow_translation/functions/index.js
sed -i "s|"placeholder"|"\ \ \ \ \'projects\/\'\ \+\ functions.config\(\)\.chat\.\projectid\ \+\ \'\/knowledgeBases\/\'\ \+\ knowledgeBaseId\ \+\ \'\ \'\;"|g" ~/dialogflow_translation/functions/index.js
sed -i "s|"targetLanguageCode\:\ targetLang"|"targetLanguageCode\:\ targetLang,"|g" ~/dialogflow_translation/functions/index.js
sed -i '22i \ \ \ \ queryParams: {' ~/dialogflow_translation/functions/index.js
sed -i '23i \ \ \ \ \ \ knowledgeBaseNames\:\ \[knowledgeBasePath\]\,' ~/dialogflow_translation/functions/index.js
sed -i '24i \ \ \ \ \}\,' ~/dialogflow_translation/functions/index.js
echo "index.js updated..."

SA_NAME=svc-df-api-reader
gcloud iam service-accounts create $SA_NAME --display-name $SA_NAME SA_EMAIL=$(gcloud iam service-accounts list --filter=displayName:$SA_NAME --format='value(email)')
gcloud projects add-iam-policy-binding $DEVSHELL_PROJECT_ID --role roles/dialogflow.reader --member serviceAccount:$SA_EMAIL
gcloud iam service-accounts keys create key.json --iam-account $SA_EMAIL
export GOOGLE_APPLICATION_CREDENTIALS=~/key.json
touch ./request.json
output=$(curl -X GET -H "Authorization: Bearer "$(gcloud auth application-default print-access-token) -H "Content-Type: application/json; charset=utf-8" -d @request.json https://dialogflow.googleapis.com/v2beta1/projects/$DEVSHELL_PROJECT_ID/knowledgeBase)
echo $output
