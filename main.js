// @ts-check

'use strict';

const slackWebhookURL = process.env.TRIL_SLACK_WEBHOOK_URL;
const dbPath = process.env.TRIL_DB_PATH;

const sqlite3 = require('sqlite3');
const trending = require('trending-github');
const slackWebhook = require('slack-webhook');

function init() {
    const db = new sqlite3.Database(dbPath);
    db.serialize(() => {
        db.run("CREATE TABLE IF NOT EXISTS gh_trending (name TEXT unique)");
        db.close();
    });
}

function sendSlack(repo) {
    const slack = new slackWebhook(slackWebhookURL);
    slack.send({
        attachments: [{
            "color": "#6cc644",
            "author_name": repo.author,
            "author_link": "https://github.com/" + repo.author,
            "title": repo.name,
            "title_link": repo.href,
            "text": repo.description,
            "fields": [{
                "title": "Language / Stars / Forks",
                "value": ":label: " + repo.language + " :star: " + repo.stars + " :fork_and_knife: " + repo.forks
            }]
        }],
        username: 'tril',
        icon_emoji: ':github:'
    });
}

function fetchTrending(sendSlackFlag = true, period, language) {
    const db = new sqlite3.Database(dbPath);
    db.serialize(() => {
        var stmt = db.prepare("INSERT INTO gh_trending VALUES (?)");
        trending(period, language).then(repos => repos.forEach((repo) => {
            stmt.run(repo.name, (err) => {
                if (err) {
                    console.log(err);
                } else {
                    if (sendSlackFlag) {
                        sendSlack(repo);
                    } else {
                        console.log(repo);
                    }
                }
            });
        })).then(() => {
            stmt.finalize();
            db.close();
        });
    });
}

function main() {
    // init create database
    init();
    
    // send fetched trending repositories to slack
    const sendSlackFlag = true;

    // fetch all trend
    // fetchTrending(sendSlackFlag, "today");

    // fetch Go trend
    fetchTrending(sendSlackFlag, "today", "Go");
    
    // fetch Java trend
    fetchTrending(sendSlackFlag, "today", "Java");
    
    // fetch Swift trend
    fetchTrending(sendSlackFlag, "today", "Swift");
    
    // fetch Clojure trend
    fetchTrending(sendSlackFlag, "today", "Clojure");

}

main();
