#! /usr/bin/env node
const Discord = require("discord.js");
const fs = require("fs");
const readline = require("readline");
const rlSync = require("readline-sync");
const chalk = require("chalk");
const rl = readline.createInterface(process.stdin, process.stdout);
var client = new Discord.Client();
var configPath;
if (process.argv[2] === undefined) {
    configPath = getConfigPath();
} else {
    configPath = process.argv[2];
}
var channel;
if (fs.existsSync(configPath)) {
    var config = JSON.parse(fs.readFileSync(configPath));

    if (config.token != null) {
        var token = config.token;
    } else {
        console_out("Couldn't find token in config file");
        process.exit(-1);
    }
    var MaxNameLength = null;
    var allign = true;
    var seperator = ">";
    var HistoryLength = 70;
    var defaultGuild = null;
    var defaultChannel = null;
    var colorsupport = true;
    var mentionColor = true;
    var usenick = true;
    var datesupport = false;
    var timesupport = false;
    var prompt = ">";
    var displaynick = false;

    if (config.MaxNameLength != undefined) {
        MaxNameLength = config.MaxNameLength;
    }
    if (config.seperator != undefined) {
        var seperator = config.seperator;
    }
    if (config.HistoryLength != undefined) {
        HistoryLength = config.HistoryLength;
    }
    if (
        config.defaultGuild != undefined &&
        config.defaultChannel != undefined
    ) {
        defaultGuild = config.defaultGuild;
        defaultChannel = config.defaultChannel;
    }
    if (config.colorsupport != undefined) {
        colorsupport = config.colorsupport;
    }
    if (config.mentionColor != undefined) {
        mentionColor = config.mentionColor;
    }
    if (config.usenick != undefined) {
        var usenick = config.usenick;
    }
    if (config.date != undefined) {
        datesupport = config.date;
    }
    if (config.time != undefined) {
        timesupport = config.time;
    }
    if (config.prompt != undefined) {
        prompt = config.prompt;
    }
    if (config.displaynick != undefined) {
        displaynick = config.displaynick;
    }
    if (config.allign != undefined) {
        allign = config.allign;
    }
} else {
    if (configPath != 0) {
        console_out("Could not find a config file in " + configPath);
    } else {
        console_out(
            "~/.config/terminal-discord/ or ~/.terminal-discord do not exist\nPlace a config file in one of those directories"
        );
    }
    process.exit(-1);
}

//login with user token
clear();
login(token);

client.on("ready", () => {
    console_out("User " + client.user.username + " successfully logged in");
    if (displaynick) {
        prompt = client.user.username + " " + prompt;
    }
    rl.setPrompt(prompt);
    if (defaultGuild != null && defaultChannel != null) {
        channel = channelsList(guildList()[defaultGuild])[defaultChannel];
    } else {
        channel = menu();
    }
    //clears window, fetches the last n messages and display them
    history(channel);

    //when a message is recieved display the last n messages
    client.on("message", message => {
        if (message.channel === channel) {
            showMessage(message);
            message.acknowledge();
        }
    });
    client.on("messageDelete", message => {
        if (message.channel === channel) {
            history(channel);
        }
    });
    client.on("messageUpdate", oldMessage => {
        if (oldMessage.channel === channel) {
            history(channel);
        }
    });

    //start listening
    rl.on("line", function(line) {
        if (line[0] === "/" && line.length > 1) {
            //check for command
            var cmd = line.match(/[a-z,A-Z]+\b/)[0];
            var arg = line.substr(cmd.length + 2, line.length);
            command(cmd.toLowerCase(), arg);
        } else {
            //send a message
            if (line === "") {
                history(channel);
            } else {
                history(channel);
                channel.send(line);
                rl.prompt(true);
            }
        }
    });
});

//Functions

//Menu
function menu() {
    while (true) {
        var guilds = guildList();
        var guildnames = [];
        for (var i = 0; i < guilds.length; i++) {
            //console_out('['+i+']'+' '+guilds[i].name);
            guildnames.push(guilds[i].name);
        }
        rl.pause();
        var guild_index;
        if (guildnames.length > 8) {
            guild_index = select(
                guildnames,
                "Show previous guilds",
                "Show additional guilds",
                "Choose a guild"
            );
        } else {
            guild_index = rlSync.keyInSelect(guildnames, "Choose a guild");
        }
        rl.resume();
        if (-1 < guild_index && guild_index < guilds.length) {
            while (true) {
                var guild = guildList()[guild_index];
                var channels = channelsList(guild);
                var channelnames = [];
                for (var i = 0; i < channels.length; i++) {
                    //console_out('['+i+']'+' '+channels[i].name);
                    channelnames.push(channels[i].name);
                }
                rl.pause();
                var channel_index;
                if (channelnames.length > 8) {
                    channel_index = select(
                        channelnames,
                        "Show previous channels",
                        "Show additional channels",
                        "Choose a channel"
                    );
                } else {
                    channel_index = rlSync.keyInSelect(
                        channelnames,
                        "Choose a channel"
                    );
                }
                if (-1 < channel_index && channel_index < channels.length) {
                    var channel = channels[channel_index];
                    return channel;
                } else if (channel_index === -1) {
                    break;
                }
            }
        } else if (guild_index === -1) {
            process.exit(-1);
        }
    }
}

//Commands
function command(cmd, arg) {
    var lastmessage;
    switch (cmd) {
        case "q":
        case "quit":
            process.exit(-1);
            break;
        case "nick":
            channel.guild.me.setNickname(arg);
            console_out("Set nick to " + arg);
            break;
        case "update":
        case "refresh":
        case "u":
        case "r":
            clear();
            history(channel);
            break;
        case "d":
        case "delete":
            last_message = client.user.lastMessage;
            if (last_message != undefined) {
                if (last_message.deletable) {
                    last_message.delete();
                }
            }
            break;
        case "e":
        case "edit":
            last_message = client.user.lastMessage;
            if (last_message != undefined) {
                if (last_message.editable) {
                    last_message.edit(arg);
                }
            }
            break;
        case "m":
        case "menu":
            clear();
            channel = menu();
            history(channel);
            break;
        case "o":
        case "online":
            if (channel.type === "text") {
                var membersList = channel.guild.members.array();
                var i = 0;
                while (true) {
                    if (membersList[i].presence.status === "offline") {
                        if (i > -1) {
                            membersList.splice(i, 1);
                        }
                    } else {
                        i++;
                    }
                    if (i === membersList.length) {
                        break;
                    }
                }

                clear();
                console_out("Online Users: ");
                for (var i = 0; i < membersList.length; i++) {
                    var name = membersList[i].user.username;
                    if (membersList[i].nickname != undefined) {
                        name = membersList[i].nickname + " (aka " + name + ")";
                    }
                    console_out(
                        "  " +
                            membersList[i].user.presence.status.slice(0, 3) +
                            "  " +
                            name
                    );
                }
                rl.pause();
                rlSync.keyInPause("");
                rl.resume();
            }
            clear();
            history(channel);

            break;
        case "pm":
        case "dm":
            clear();
            rl.pause();
            var dm_channel = select_dm(dm_channels());
            if (dm_channel != undefined) {
                channel = dm_channel;
            }
            rl.resume();
            clear();
            history(channel);
            break;
        case "g":
        case "gr":
        case "group":
            clear();
            rl.pause();
            var group_channel = select_group(group_channels());
            if (group_channel != undefined) {
                channel = group_channel;
            }
            rl.resume();
            clear();
            history(channel);
            break;
        default:
            console_out("Unknown command");
            break;
    }
}

//returns sorted dm/group channel list
function group_channels() {
    var channel_list = client.channels.filterArray(
        channel => channel.type === "group"
    );
    return channel_list
        .sort(function(a, b) {
            return a.lastMessageID - b.lastMessageID;
        })
        .reverse();
}
function dm_channels() {
    var channel_list = client.channels.filterArray(
        channel => channel.type === "dm"
    );
    return channel_list
        .sort(function(a, b) {
            return a.lastMessageID - b.lastMessageID;
        })
        .reverse();
}

function select_group(list) {
    var names = [];
    var dm_id;
    for (var i = 0; i < list.length; i++) {
        var members = list[i].recipients.array();
        names.push([]);
        for (var j = 0; j < members.length; j++) {
            names[i].push(members[j].username);
        }
    }
    if (names.length > 8) {
        dm_id = select(
            names,
            "Show previous channels",
            "Show additional channels",
            "Choose DM channel"
        );
    } else {
        dm_id = rlSync.keyInSelect(names, "Choose DM channel");
    }
    return list[dm_id];
}

function select_dm(list) {
    var names = [];
    var dm_id;
    for (var i = 0; i < list.length; i++) {
        names.push(list[i].recipient.username);
    }
    if (names.length > 8) {
        dm_id = select(
            names,
            "Show previous channels",
            "Show additional channels",
            "Choose DM channel"
        );
    } else {
        dm_id = rlSync.keyInSelect(names, "Choose DM channel");
    }
    return list[dm_id];
}

//general select function
function select(list, previous, next, choice) {
    var n = Math.ceil(list.length / 8);
    var select_list = [];
    for (var i = 0; i < n; i++) {
        select_list.push(list.slice(0, 8));
        list = list.slice(8);
    }
    for (var i = 1; i < select_list.length; i++) {
        select_list[i].unshift(previous);
    }
    var x = 0;
    var temp;
    while (true) {
        if (x === n - 1) {
            temp = rlSync.keyInSelect(select_list[x], choice, {
                cancel: "CANCEL"
            });
        } else {
            temp = rlSync.keyInSelect(select_list[x], choice, {
                cancel: next
            });
        }
        if (temp === -1 && x === select_list.length - 1) {
            return (guild_index = -1);
        } else if (temp === -1) {
            x += 1;
        } else if (temp === 0 && x != 0) {
            x -= 1;
        } else {
            if (x === 0) {
                return (guild_index = temp);
            } else {
                return (guild_index = x * 8 + temp - 1);
            }
            break;
        }
    }
}

//use this instead of console.log for clean lines
function console_out(msg) {
    readline.clearLine(process.stdout, 0);
    readline.cursorTo(process.stdout, 0, null);
    console.log(msg);
    rl.prompt(true);
}

//get config path
function getConfigPath() {
    var homedir = process.env.HOME;
    if (fs.existsSync(homedir + "/.terminal-discord/config.json")) {
        return homedir + "/.terminal-discord/config.json";
    } else if (
        fs.existsSync(homedir + "/.config/terminal-discord/config.json")
    ) {
        return homedir + "/.config/terminal-discord/config.json";
    } else {
        return 0;
    }
}

//fetch an array of the last N messages
function history(channel) {
    channel.fetchMessages({ limit: HistoryLength }).then(messages => {
        for (var i = messages.size - 1; -1 < i; i--) {
            showMessage(messages.array()[i]);
            messages.array()[i].acknowledge();
        }
    });
}

//show message
function showMessage(message) {
    var content = message.cleanContent;
    //emote check
    content = content.replace(/<:/g, "");
    content = content.replace(/\:\d*>/g, "");
    var date = message.createdAt;
    var timestamp = "";
    if (timesupport === true) {
        var hour = date.getHours();
        if (hour < 10) {
            hour = "0" + hour;
        }
        var min = date.getMinutes();
        if (min < 10) {
            min = "0" + min;
        }
        timestamp = hour + ":" + min + " ";
    }
    if (datesupport) {
        timestamp =
            date.getDay() +
            "." +
            date.getMonth() +
            "." +
            date.getFullYear() +
            " " +
            timestamp;
    }
    var author = message.author.username;
    if (message.member != null) {
        if (message.member.nickname != undefined && usenick === true) {
            author = message.member.nickname;
        }
    }
    var attachment = "";
    if (message.attachments.array().length > 0) {
        //var pics = message.attachments.array();
        attachment = " " + message.attachments.array()[0].url;
    }
    if (MaxNameLength != null) {
        if (author.length < MaxNameLength && allign) {
            var x = MaxNameLength - author.length;
            author = author + " ".repeat(x);
        } else if (author.length > MaxNameLength) {
            author = author.slice(0, MaxNameLength);
        }
    }
    if (colorsupport && message.member != null) {
        var color = message.member.displayHexColor;
        if (color != "#000000") {
            author = chalk.hex(color)(author);
        }
    }
    if (
        message.isMemberMentioned(client.user) &&
        colorsupport &&
        mentionColor != null
    ) {
        var meNick;
        if (
            channel.type != "dm" &&
            channel.type != "group" &&
            message.guild.me.nickname != undefined
        ) {
            meNick = message.guild.me.nickname;
        } else {
            meNick = client.user.username;
        }
        var mentionId = new RegExp(
            "@" + meNick.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&")
        );
        var mention = chalk.bgHex(mentionColor)(content.match(mentionId));
        content = content.replace(mentionId, mention);
    }
    console_out(timestamp + author + seperator + attachment + " " + content);
}

//login function
function login(token) {
    console_out("Logging in...");
    client.login(token);
}

//clear screen
function clear() {
    console_out("\033[2J");
    console_out("\033[H");
}

//lists channels of a guild
//returns channel array
function channelsList(guild) {
    var channels = guild.channels.array();
    var i = 0;
    while (true) {
        if (channels[i].type != "text") {
            if (i > -1) {
                channels.splice(i, 1);
            }
        } else {
            i += 1;
        }
        if (i === channels.length) {
            break;
        }
    }
    return channels;
}

//list available guilds
//returns array of guilds
function guildList() {
    var Guilds = client.guilds.array();
    return Guilds;
}
