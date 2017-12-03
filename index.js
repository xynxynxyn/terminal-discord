#! /usr/bin/env node
const Discord = require('discord.js');
const fs = require('fs');
const readline = require('readline');
const rlSync = require('readline-sync');
const chalk = require('chalk');
const rl = readline.createInterface(process.stdin, process.stdout);
var client = new Discord.Client();
var configPath = getConfigPath();
if(configPath != 0){
    var config = JSON.parse(fs.readFileSync(configPath));
    var token = config.token;
    var MaxNameLength = config.MaxNameLength;
    var seperator = config.Seperator;
    var HistoryLength = config.HistoryLength;
    var defaultGuild = config.defaultGuild;
    var defaultChannel = config.defaultChannel;
    var colorsupport = config.colorsupport;
    var mentionColor = config.mentionColor;
    var channel;
    var usenick = config.usenick;
    var datesupport = config.date;
    var timesupport = config.time;
    rl.setPrompt(config.prompt);
}else{
    console_out('Couldn\'t find a config file\nPlace a copy of config.json in ~/.config/terminal-discord/ or ~/.terminal-discord/');
    process.exit(-1);
}


//login with user token
clear();
login(token);

client.on('ready', () => {
    console_out('User ' + client.user.username + ' successfully logged in');
    if(defaultGuild != null && defaultChannel != null){
        channel = channelsList(guildList()[defaultGuild])[defaultChannel];
    }else{
        channel = menu();
    }
    //clears window, fetches the last n messages and display them
    history(channel);

    //when a message is recieved display the last n messages
    client.on('message', message => {
        if(message.channel == channel){
            if(message.author == client.user){
                history(channel);
            }else{
                showMessage(message);
            }
        }
    });

    //start listening
    rl.on('line', function(line) {
        if(line[0] == '/' && line.length>1){
            //check for command
            var cmd = line.match(/[a-z]+\b/)[0];
            var arg = line.substr(cmd.length+2, line.length);
            command(cmd, arg);
        }else{
            //send a message
            if(line == ''){
                history(channel);
            }else{
                channel.send(line);
                rl.prompt(true);
            }
        }
    });
})

//Functions

//Menu
function menu() {
    while(true){
        var guilds = guildList();
        var guildnames = [];
        for(var i=0; i<guilds.length; i++){
            //console_out('['+i+']'+' '+guilds[i].name);
            guildnames.push(guilds[i].name);
        }
        rl.pause();
        if(guildnames.length>8){
            var guild_index = select(guildnames, 'Show additional guilds', 'Show previous guilds', 'Choose a guild');
        }else{
            var guild_index = rlSync.keyInSelect(guildnames, 'Choose a guild');
        }
        rl.resume();
        if(-1<guild_index && guild_index<guilds.length){
            while(true){
                var guild = guildList()[guild_index];
                var channels = channelsList(guild);
                var channelnames = [];
                for(var i=0; i<channels.length; i++){
                    //console_out('['+i+']'+' '+channels[i].name);
                    channelnames.push(channels[i].name);
                }
                rl.pause();
                if(channelnames.length>8){
                    var channel_index = select(channelnames, 'Show additional channels', 'Show previous channels', 'Choose a channel');
                }else{
                    var channel_index = rlSync.keyInSelect(channelnames,'Choose a channel');
                }
                if(-1<channel_index && channel_index<channels.length){
                    var channel = channels[channel_index];
                    return channel;
                }else if(channel_index== -1){
                    break;
                }
            }
        }else if(guild_index == -1){
            process.exit(-1);
        }
    }
}

//Commands
function command(cmd, arg) {
    switch (cmd) {
        case 'q':
        case 'quit':
            process.exit(-1);
            break;
        case 'nick':
            channel.guild.me.setNickname(arg);
            console_out('Set nick to ' + arg);
            break;
        case 'update':
        case 'refresh':
        case 'u':
        case 'r':
            clear();
            history(channel);
            break;
        case 'd':
        case 'delete':
            var last_message = client.user.lastMessage;
            if(last_message != undefined){
                if(last_message.deletable){
                    last_message.delete()
                        .then(history(channel));
                }
            }
            break;
        case 'e':
        case 'edit':
            var last_message = channel.guild.me.lastMessage;
            if(last_message != undefined){
                if(last_message.editable){
                    last_message.edit(arg)
                        .then(history(channel));
                }
            }
            break;
        case 'm':
        case 'menu':
            clear();
            channel = menu();
            history(channel);
            break;
        case 'o':
        case 'online':
            var membersList = channel.guild.members.array();
            var i = 0;
            while(true){
                if(membersList[i].presence.status == 'offline'){
                    if(i>-1){
                        membersList.splice(i,1);
                    }
                }else{
                    i++;
                }
                if(i == membersList.length){
                    break;
                }
            }
            clear();
            console_out('Online Users: ');
            for(var i=0; i<membersList.length; i++){
                var name = membersList[i].user.username;
                if(membersList[i].nickname != undefined){
                    name = membersList[i].nickname + ' (aka ' + name + ')';
                }
                console_out('  ' + membersList[i].user.presence.status.slice(0,3) + '  ' + name);
            }
            rl.pause();
            rlSync.keyInPause('');
            rl.resume();
            clear();
            history(channel);
            break;
        case 'pm':
        case 'dm':
            clear();
            rl.pause();
            var dm_channel = select_dm(dm_channels())
            if( dm_channel != undefined){
                channel = dm_channel;
            }
            rl.resume();
            clear();
            history(channel);
            break;
        case 'g':
        case 'gr':
        case 'group':
            clear();
            rl.pause();
            var group_channel = select_group(group_channels());
            if(group_channel != undefined){
                channel = group_channel;
            }
            rl.resume();
            clear();
            history(channel);
            break;
        default:
            console_out('Unknown command');
            break;
    }
}

//returns sorted dm/group channel list
function group_channels(){
    var channel_list = client.channels.filterArray(channel => channel.type=='group');
    return channel_list.sort(function (a, b) {
        return a.lastMessageID - b.lastMessageID;
    }).reverse();
}
function dm_channels(){
    var channel_list = client.channels.filterArray(channel => channel.type=='dm');
    return channel_list.sort(function (a, b) {
        return a.lastMessageID - b.lastMessageID;
    }).reverse();
}

function select_group(list){
    var names = [];
    for(var i=0; i<list.length; i++){
        var members = list[i].recipients.array();
        names.push([]);
        for(var j=0; j<members.length; j++){
            names[i].push(members[j].username);
        }
    }
    if(names.length>8){
        var dm_id = select(names, 'Show previous channels', 'Show additional channels', 'Choose DM channel');
    }else{
        var dm_id = rlSync.keyInSelect(names, 'Choose DM channel');
    }
    return list[dm_id];
}

function select_dm(list){
    var names = [];
    for(var i=0; i<list.length; i++){
        names.push(list[i].recipient.username);
    }
    if(names.length>8){
        var dm_id = select(names, 'Show previous channels', 'Show additional channels', 'Choose DM channel');
    }else{
        var dm_id = rlSync.keyInSelect(names, 'Choose DM channel');
    }
    return list[dm_id];
}


//general select function
function select(list, previous, next, choice){
    var n = Math.ceil(list.length/8);
    var select_list = [];
    for(var i=0; i<n; i++){
        select_list.push(list.slice(0,8));
        list = list.slice(8);
    }
    for(var i=1; i<select_list.length; i++){
        select_list[i].unshift(previous)
    }
    var x = 0
    while(true){
        if(x==n-1){
            var temp = rlSync.keyInSelect(select_list[x], choice,{cancel: 'CANCEL'});
        }else{
            var temp = rlSync.keyInSelect(select_list[x], choice,{cancel: next});
        }
        if(temp==-1 && x==select_list.length-1){
            return guild_index = -1;
            break;
        }else if(temp==-1){
            x += 1;
        }else if(temp==0 && x!=0){
            x -= 1;
        }else{
            if(x==0){
                return guild_index = temp;
            }else{
                return guild_index = x*8+temp-1;
            }
            break;
        }
    }
}

//use this instead of console.log for clean lines
function console_out(msg) {
    process.stdout.clearLine();
    process.stdout.cursorTo(0);
    console.log(msg);
    rl.prompt(true);
}

//get config path
function getConfigPath() {
    var homedir = process.env['HOME'];
    if(fs.existsSync(homedir + '/.terminal-discord/config.json')){
        return homedir + '/.terminal-discord/config.json';
    }else if(fs.existsSync(homedir + '/.config/terminal-discord/config.json')){
        return homedir + '/.config/terminal-discord/config.json';
    }else{
        return 0;
    }
}

//fetch an array of the last N messages
function history(channel) {
    channel.fetchMessages({limit: HistoryLength})
        .then(messages => {
            for(var i=messages.size-1; -1<i; i--){
                showMessage(messages.array()[i]);
            }
        });
}

//show message
function showMessage(message) {
    var content = message.cleanContent;
    //emote check
    content = content.replace(/\<:/g, '');
    content = content.replace(/\:\d*>/g, '');
    var date = message.createdAt;
    var timestamp = '';
    if(timesupport == true){
        var hour = date.getHours();
        if(hour<10){
            hour = '0' + hour;
        }
        var min = date.getMinutes();
        if(min<10){
            min = '0' + min;
        }
        timestamp = hour + ':' + min + ' '
    }
    if(datesupport){
        timestamp = date.getDay() + '.' + date.getMonth() + '.' + date.getFullYear() +  ' ' + timestamp;
    }
    var author = message.author.username;
    if(message.member != null){
        if(message.member.nickname != undefined && usenick == true){
            var author = message.member.nickname;
        }
    }
    var attachment = '';
    if(message.attachments.array().length > 0){
        //var pics = message.attachments.array();
        var attachment = ' ' + message.attachments.array()[0]['url'];
    }
    if(MaxNameLength != null){
        if(author.length<MaxNameLength){
            var x = MaxNameLength - author.length;
            author = author + ' '.repeat(x);
        }else if(author.length>MaxNameLength){
            author = author.slice(0,MaxNameLength);
        }
    }
    if(colorsupport && message.member != null){
        var color = message.member.displayHexColor;
        if(color != '#000000'){
            author = chalk.hex(color)(author);
        }
    }
    if(message.isMemberMentioned(client.user) && colorsupport && mentionColor != null){
        if(channel.type!='dm' && channel.type!='group' && message.guild.me.nickname != undefined){
            var meNick = message.guild.me.nickname;
        }else{
            var meNick = client.user.username;
        }
        var mentionId = new RegExp('\@' + meNick);
        var mention = chalk.bgHex(mentionColor)(content.match(mentionId));
        content = content.replace(mentionId, mention);
    }
    console_out(timestamp + author + seperator + attachment + ' ' + content);
}


//login function
function login(token) {
    console_out('Logging in...');
    client.login(token);
}

//clear screen
function clear() {
    console_out('\033c');
}


//lists channels of a guild
//returns channel array
function channelsList(guild) {
    var channels = guild.channels.array();
    var i = 0;
    while(true){
        if(channels[i].type != 'text'){
            if(i>-1){
                channels.splice(i, 1);
            }
        }else{
            i +=1;
        }
        if(i == channels.length){
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

