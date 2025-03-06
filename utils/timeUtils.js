const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: 'numeric',
        hour12: true
    })
}

module.exports = { formatTime }
