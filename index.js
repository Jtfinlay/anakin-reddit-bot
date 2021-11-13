require('dotenv').config();

const Snoowrap = require('snoowrap');
const Snoostorm = require('snoostorm');
const messages = require('./messages');

const reddit = new Snoowrap({
    userAgent: process.env.REDDIT_USER_AGENT,
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    username: process.env.REDDIT_USER,
    password: process.env.REDDIT_PASS
});

const client = new Snoostorm(reddit);

const stream = client.CommentStream({
    subreddit: process.env.SUBREDDIT,
    results: 100
});

stream.on('comment', comment => {
    console.log('process comment');
    //Go through each possible response and look for a match.
    const reply = messages.extractReply(comment);

    if (!reply) {
        return;
    }

    console.log(`Found message: ${comment.body}`);
    console.log(`Responding with: ${reply}`);

    comment.reply(reply)
        .then(resp => {
            console.log(`Responded to message.`);
        })
        .catch(err => {
            console.error(err);
        });
});