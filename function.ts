import { http } from '@google-cloud/functions-framework'
import { PubSub } from '@google-cloud/pubsub'

http('entryPoint', async (req, res) => {
  console.log('oh')

  res.send(200)
})
