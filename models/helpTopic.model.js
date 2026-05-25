const mongoose = require('mongoose');

const helpTopicSchema = new mongoose.Schema({
    topicId: {
        type: String,
        required: true,
        unique: true
    },
    title: {
        type: String,
        required: true
    },
    iconKey: {
        type: String,
        required: true
    }
}, { timestamps: true });

module.exports = mongoose.model('HelpTopic', helpTopicSchema);
