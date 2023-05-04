import * as pulumi from '@pulumi/pulumi'
import * as gcp from '@pulumi/gcp'

const location = 'europe-west2'
const project = 'matthew-law-dev'

// [START functions_v2_basic_gcs]
const source_bucket = new gcp.storage.Bucket('source-bucket', {
  location,
  uniformBucketLevelAccess: true
})
const object = new gcp.storage.BucketObject('object', {
  bucket: source_bucket.name,
  source: new pulumi.asset.FileAsset('function-source.zip')
})
// Add path to the zipped function source code
const trigger_bucket = new gcp.storage.Bucket('trigger-bucket', {
  location,
  uniformBucketLevelAccess: true
})
const gcsAccount = gcp.storage.getProjectServiceAccount({
  project
})
// To use GCS CloudEvent triggers, the GCS service account requires the Pub/Sub Publisher(roles/pubsub.publisher) IAM role in the specified project.
// (See https://cloud.google.com/eventarc/docs/run/quickstart-storage#before-you-begin)
const gcs_pubsub_publishing = new gcp.projects.IAMMember('gcs-pubsub-publishing', {
  project,
  role: 'roles/pubsub.publisher',
  member: gcsAccount.then(gcsAccount => `serviceAccount:${gcsAccount.emailAddress}`)
})
const account = new gcp.serviceaccount.Account('account', {
  accountId: 'gcf-sa',
  displayName: 'Test Service Account - used for both the cloud function and eventarc trigger in the test'
})
// Permissions on the service account used by the function and Eventarc trigger
const invoking = new gcp.projects.IAMMember(
  'invoking',
  {
    project,
    role: 'roles/run.invoker',
    member: pulumi.interpolate`serviceAccount:${account.email}`
  },
  {
    dependsOn: [gcs_pubsub_publishing]
  }
)
const event_receiving = new gcp.projects.IAMMember(
  'event-receiving',
  {
    project,
    role: 'roles/eventarc.eventReceiver',
    member: pulumi.interpolate`serviceAccount:${account.email}`
  },
  {
    dependsOn: [invoking]
  }
)
const artifactregistry_reader = new gcp.projects.IAMMember(
  'artifactregistry-reader',
  {
    project,
    role: 'roles/artifactregistry.reader',
    member: pulumi.interpolate`serviceAccount:${account.email}`
  },
  {
    dependsOn: [event_receiving]
  }
)
const _function = new gcp.cloudfunctionsv2.Function(
  'function',
  {
    location,
    description: 'a new function',
    buildConfig: {
      runtime: 'nodejs12',
      entryPoint: 'entryPoint',
      environmentVariables: {
        BUILD_CONFIG_TEST: 'build_test'
      },
      source: {
        storageSource: {
          bucket: source_bucket.name,
          object: object.name
        }
      }
    },
    serviceConfig: {
      maxInstanceCount: 3,
      minInstanceCount: 1,
      availableMemory: '256M',
      timeoutSeconds: 60,
      environmentVariables: {
        SERVICE_CONFIG_TEST: 'config_test'
      },
      ingressSettings: 'ALLOW_INTERNAL_ONLY',
      allTrafficOnLatestRevision: true,
      serviceAccountEmail: account.email
    },
    eventTrigger: {
      triggerRegion: location,
      eventType: 'google.cloud.storage.object.v1.finalized',
      retryPolicy: 'RETRY_POLICY_RETRY',
      serviceAccountEmail: account.email,
      eventFilters: [
        {
          attribute: 'bucket',
          value: trigger_bucket.name
        }
      ]
    }
  },
  {
    dependsOn: [event_receiving, artifactregistry_reader]
  }
)
