#! /usr/bin/env node
const Discord = require('discord.js');
const fs = require('fs');
const readline = require('readline');
const rlSync = require('readline-sync');
const chalk = require('chalk');
const rl = readline.createInterface(process.stdin, process.stdout);
var client = new Discord.Client();
var config = JSON.parse(fs.readFileSync('/home/youmu/Documents/tiscord/config.json'));
var token = config.token;
var MaxNameLength = config.MaxNameLength;
var seperator = config.Seperator;
var HistoryLength = config.HistoryLength;
var defaultGuild = config.defaultGuild;
var defaultChannel = config.defaultChannel;
var colorsupport = config.colorsupport;
var channel;
var datesupport = config.date;
rl.setPrompt(config.prompt);


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
            if(line != ''){
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
        console_out('\nAvailable Guilds');
        var guilds = guildList();
        for(var i=0; i<guilds.length; i++){
            console_out('['+i+']'+' '+guilds[i].name);
        }
        console_out('[q] quit\n');
        rl.pause();
        var guild_index = rlSync.keyIn('');
        rl.resume();
        if(-1<guild_index && guild_index<guilds.length){
            while(true){
                var guild = guildList()[guild_index];
                console_out('Available Channels');
                var channels = channelsList(guild);
                for(var i=0; i<channels.length; i++){
                    console_out('['+i+']'+' '+channels[i].name);
                }
                console_out('[b] go back');
                console_out('[q] quit\n');
                rl.pause();
                var channel_index = rlSync.keyIn('');
                rl.resume();
                if(-1<channel_index && channel_index<channels.length){
                    var channel = channels[channel_index];
                    return channel;
                }else if(channel_index== 'b'){
                    break;
                }else if(channel_index == 'q'){
                    process.exit(-1);
                }else{
                    console_out('Invalid option\n');
                }
            }
        }else if(guild_index == 'q'){
            process.exit(-1);
        }else{
            console_out('Invalid option');
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
            console_out('Set nick to ' + arg)
            break;
        case 'update':
        case 'refresh':
        case 'u':
        case 'r':
            history(channel);
            break;
        case 'd':
        case 'delete':
            var last_message = channel.guild.me.lastMessage;
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
            channel = menu();
            history(channel);
            break;
        default:
            console_out('Unknown command');
    }
}

//use this instead of console.log for clean lines
function console_out(msg) {
    process.stdout.clearLine();
    process.stdout.cursorTo(0);
    console.log(msg);
    rl.prompt(true);
}

//fetch an array of the last N messages
function history(channel) {
    channel.fetchMessages({limit: HistoryLength})
        .then(messages => {
            for(var i=messages.size-1; -1<i; i--){
                showMessage(messages.array()[i]);
            }
        })
}

//show message
function showMessage(message) {
    var content = message.cleanContent;
    var date = message.createdAt;
    var hour = date.getHours();
    if(hour<10){
        hour = '0' + hour;
    }
    var min = date.getMinutes();
    if(min<10){
        min = '0' + min;
    }
    var timestamp = hour + ':' + min
    if(datesupport){
        timestamp = date.getDay() + '.' + date.getMonth() + '.' + date.getFullYear() +  ' ' + timestamp;
    }
    var author = message.author.username;
    var attachment = '';
    if(message.attachments.array().length > 0){
        //var pics = message.attachments.array();
        var attachment = ' ' + message.attachments.array()[0]['url'];
    }
    if(MaxNameLength != null){
        if(author.length<MaxNameLength){
            var x = MaxNameLength - author.length;
            for(var i=0; i<x; i+=1){
                author = author + ' ';
            }
        }else if(author.length>MaxNameLength){
            author = author.slice(0,MaxNameLength);
        }
    }
    if(colorsupport == true){
        var color = message.member.displayHexColor;
        if(color != '#000000'){
            author = chalk.hex(color)(author);
        }
    }
    console_out(timestamp + ' ' + author + seperator + attachment + ' ' + content);
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

