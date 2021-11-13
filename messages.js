const responses = require('./responses.json');
const ignoreList = require('./ignore-list.json');

const groupMatchRegex = /\$(\d*)/gi;

const KNOWN_BOTS = ["Obiwan-Kenobi-Bot", "sheev-bot"];
const IGNORE_PHRASES = ["You were my brother, Anakin. I loved you.", "You were my brother, Anakin. I loved you!", "You were my brother, Anakin. I loved you"];

function extractMessage(comment, resp) {
    let regex = new RegExp(resp.pattern, 'gi');
    let matches = regex.exec(comment.body);
    let message = null;

    if (matches && matches.length > 0) {
        //if we get to here then we can extract a response. 
        //Pick a random response to send back.
        if (resp.responses) {
            message = getRandomArrayItem(resp.responses);
        } else {
            message = resp.response;
        }

        //Check if the message contains a group match keyword, i.e $0, $1 ect.
        //A $ symbol followed by a number indicates the matching group to add to the text.
        let groupMatch = groupMatchRegex.exec(message);

        //Go through each match and extract the group from the original message.
        while (groupMatch != null) {
            let identifier = groupMatch[0];
            let index = parseInt(groupMatch[1]);

            if (Number.isNaN(index)) {
                break;
            }

            let origGroup = matches[index + 1].trim(); //returns captured group (...) in regex

            message = message.replace(identifier, origGroup);

            groupMatch = groupMatchRegex.exec(message);
        }
    }

    //Check if the message contains any keywords.
    if (message && message.indexOf('$username') > -1) {
        if (KNOWN_BOTS.includes('$username')) {
            message = message.replace('$username', 'Master');
        } else {
            message = message.replace('$username', comment.author.name);
        }
    }

    return message;
}

function getRandomArrayItem(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function findAndExtractMessage(comment, arr) {
    for (let i = 0; i < arr.length; i++) {
        let resp = arr[i];
        let message = extractMessage(comment, resp);

        if (message) {
            return message;
        }
    }

    return null;
}

function hasReplied(comments) {
    return comments && comments.findIndex(c => c.author.name === process.env.REDDIT_USER) >= 0;
}

module.exports = {

    extractReply(comment) {
        //make sure we're not replying to ourselves.
        if (comment.author.name === process.env.REDDIT_USER) {
            return null;
        }

        if (hasReplied(comment.replies)) {
            console.log('Not answering twice!');
            return null;
        }

        if (ignoreList.users.includes(comment.author.name)) {
            return null;
        }

        if (IGNORE_PHRASES.includes(comment.body)) {
            return null;
        }

        let message = null;
        
        message = findAndExtractMessage(comment, responses.messages);

        return message;
    }

};
