import { cloudEvent, http } from '@google-cloud/functions-framework'
import { PubSub } from '@google-cloud/pubsub'

interface EventData {
  message: {
    data: string
  }
}

http('pubMessage', async (_, res) => {
  console.log('topicName', process.env.TOPIC_NAME)
  try {
    const messageId = await new PubSub().topic(process.env.TOPIC_NAME!).publishMessage({ data: Buffer.from('this-is-data') })

    console.log(`Message ${messageId} published.`)
    res.send(202)
  } catch (err) {
    console.error(`Received error while publishing: ${(err as TypeError).message}`)
    res.send(500)
  }
})

cloudEvent('subMessage', ev => {
  console.log(Buffer.from((ev.data as EventData).message.data, 'base64').toString())
})
