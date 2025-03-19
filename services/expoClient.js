const { Expo } = require('expo-server-sdk')

const expo = new Expo()

expo.sendNotification = async (message) => {
    try {
        const chunks = expo.chunkPushNotifications([message])
        for (const chunk of chunks) {
            await expo.sendPushNotificationsAsync(chunk)
        }
    } catch (err) {
        console.error('Error sending notification:', err)
    }
}

module.exports = expo
