const generateMessage =  (username = 'Anon', text) => {
    return {
        text,
        createdAt: new Date().getTime(),
        username
    }
}


module.exports = {
    generateMessage,
}