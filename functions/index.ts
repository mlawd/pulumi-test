import { http } from '@google-cloud/functions-framework'
import { PubSub } from '@google-cloud/pubsub'

http('entryPoint', async (req, res) => {
  console.log('hey')

  res.send(200)
})
