const { Expo } = require('expo-server-sdk')

const expo = new Expo()

expo.notificationQueue = []

expo.queueNotification = (message) => {
    expo.notificationQueue.push(message)
}

expo.sendQueuedNotifications = async () => {
    const chunks = expo.chunkPushNotifications(expo.notificationQueue)
    for (const chunk of chunks) {
        try {
            await expo.sendPushNotificationsAsync(chunk)
        } catch (err) {
            console.error(err)
        }
    }
    expo.notificationQueue = []
}

module.exports = expo
