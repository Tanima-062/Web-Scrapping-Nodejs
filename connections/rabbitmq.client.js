import amqp from 'amqplib';

let connection = null;

// Create a connection once
async function getConnection() {
    if (!connection) {
        connection = await amqp.connect(process.env.RABBIT_MQ_URL);
    }
    return connection;
}

// Create a new channel for each queue or operation
export async function createChannel() {
    const conn = await getConnection();
    return await conn.createChannel();
}
