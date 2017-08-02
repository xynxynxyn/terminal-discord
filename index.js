const Discord = require('discord.js');
const fs = require('fs');
const readline = require('readline');
const rl = readline.createInterface(process.stdin, process.stdout);

var client = new Discord.Client();
var config = JSON.parse(fs.readFileSync('config.json'));
var token = config.token;
var MaxNameLength = config.MaxNameLength;
var seperator = config.Seperator;
var HistoryLength = config.HistoryLength;


//login with user token
clear();
login(token);


//Main Program
client.on('ready', () => {

    //Channel selection menu
    console_out('User ' + client.user.username + ' successfully logged in\n')
    console_out('Available Guilds');
    var guilds = guildList();
    for(var i=0; i<guilds.length; i++){
        console_out('['+i+']'+' '+guilds[i].name);
    }
    rl.question('Choose Guild ', function(index){
        var guild = guildList()[index];
        console_out('Available Channels');
        var channels = channelsList(guild);
        for(var i=0; i<channels.length; i++){
            console_out('['+i+']'+' '+channels[i].name);
        }
        rl.question('Choose Channel ', function(index){
            channel = channels[index];

            //clears window, fetches the last n messages and display them
            history(channel);

            //when a message is recieved display the last n messages
            client.on('message', message => {
                if(message.channel == channel){
                    history(channel);
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
                    channel.send(line);
                    rl.prompt(true);
                }
            });
        });
    });
});






//Functions

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
            clear();
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
    var author = message.author.username;
    if(author.length<MaxNameLength){
        var x = MaxNameLength - author.length;
        for(var i=0; i<x; i+=1){
            author = author + ' ';
        }
    }else if(author.length>MaxNameLength){
        author = author.slice(0,MaxNameLength);
    }
    console_out(timestamp + ' ' + author + seperator + ' ' + content);
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

