# File: deploy.ps1

$PROJECT_ID = "speedshift-493423"
$SERVICE_NAME = "speedshift-billing-api"
$REGION = "europe-west2"   # change if you chose a different region
$RUNTIME_SERVICE_ACCOUNT = "speedshift-billing-api@speedshift-493423.iam.gserviceaccount.com"

gcloud config set project $PROJECT_ID

gcloud run deploy $SERVICE_NAME `
  --source . `
  --region $REGION `
  --platform managed `
  --allow-unauthenticated `
  --service-account $RUNTIME_SERVICE_ACCOUNT `
  --set-env-vars "NODE_ENV=production,GOOGLE_CLOUD_PROJECT=$PROJECT_ID,FIRESTORE_DATABASE_ID=speedshift,APP_PACKAGE_NAME=com.speedshift.app"