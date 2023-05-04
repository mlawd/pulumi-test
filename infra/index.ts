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
  source: new pulumi.asset.FileArchive('../functions')
})

const topic = new gcp.pubsub.Topic('test-topic', {
  project
})

const pubFunc = new gcp.cloudfunctionsv2.Function('pub-message', {
  location,
  description: 'a new function',
  buildConfig: {
    runtime: 'nodejs18',
    entryPoint: 'pubMessage',
    source: {
      storageSource: {
        bucket: source_bucket.name,
        object: object.name
      }
    }
  },
  serviceConfig: {
    environmentVariables: {
      TOPIC_NAME: topic.name
    }
  }
})

const subFunc = new gcp.cloudfunctionsv2.Function('sub-message', {
  location,
  description: 'a new function',
  buildConfig: {
    runtime: 'nodejs18',
    entryPoint: 'subMessage',
    source: {
      storageSource: {
        bucket: source_bucket.name,
        object: object.name
      }
    }
  },
  eventTrigger: {
    eventType: 'google.cloud.pubsub.topic.v1.messagePublished',
    pubsubTopic: topic.id
  }
})
