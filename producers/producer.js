import { createChannel } from '../connections/rabbitmq.client.js';

export async function sendToQueue(queue, message, priority = 0) {
    const channel = await createChannel();

    try {
        // Assert the queue to ensure it exists with the given properties
        await channel.assertQueue(queue, { 
            durable: true, 
            arguments: { "x-max-priority": 255 } 
        });

        // Send the message to the queue with priority and persistence
        channel.sendToQueue(queue, Buffer.from(JSON.stringify(message)), {
            priority,
            persistent: true,
        });

        // Optional: Add a log if needed
        // console.log(`Message sent to queue: ${queue}, priority: ${priority}`);
    } catch (error) {
        console.error("Error sending message to queue:", error);
    } finally {
        await channel.close();
    }
}
