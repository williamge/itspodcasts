module.exports = {
    mongoURL: process.env.MONGOLAB_URI || process.env.MONGOHQ_URL || 'mongodb://localhost/podcasts'
};