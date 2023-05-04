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

const _function = new gcp.cloudfunctionsv2.Function('function-3', {
  location,
  description: 'a new function',
  buildConfig: {
    runtime: 'nodejs18',
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
  }
})
