#!/usr/bin/env node

const discord = require("discord.js");
const fs = require("fs");
const readline = require("readline");
const rl_sync = require("readline-sync");
const chalk = require("chalk");
const rl = readline.createInterface(process.stdin, process.stdout);
const client = new discord.Client();

const config = parse_config();

// Global non const variables
let prompt = config["prompt"];
let guild = null;
let channel = null;

clear_screen();
console_out("Logging in...");
client.login(config["token"]);

// Client events
client.on("ready", () => {
  console_out("User" + client.user.username + " successfully logged in");

  rl.setPrompt(prompt);

  let default_status = get_default_channel();
  if (!default_status) {
    init();
  }

  history();

  // Readline listener
  rl.on("line", line => {
    // Check for command
    if (line[0] === "/" && line.length > 1) {
      let parse = line.match(/[a-z,A-Z]+\b/);
      if (parse !== null) {
        let cmd = parse[0];
        let arg = line.substr(cmd.length + 2, line.length);
        command(cmd.toLowerCase(), arg);
      } else {
        command("", "");
      }
    } else {
      history(channel);
      if (line !== "") {
        channel.send(line);
        rl.prompt();
      }
    }
  });
});

client.on("message", message => {
  if (message.channel === channel) {
    message.acknowledge();
    show_message(message);
  }
});

client.on("messageDelete", message => {
  if (message.channel === channel) {
    history(channel);
  }
});

client.on("messageUpdate", message => {
  if (message.channel === channel) {
    history(channel);
  }
});

client.on("error", err => {
  console_out("[Connection error]");
});

// Functions

function get_default_channel() {
  if (config["default_guild"] !== null && config["default_channel"] !== null) {
    guild = client.guilds.array()[config["default_guild"]];
    if (guild !== undefined) {
      channel = guild.channels.array()[config["default_channel"]];
      if (channel != undefined) {
        return true;
      }
    }
  }
  return false;
}

// Menu that selects a channel from nothing
function init() {
  // Check if default guild and channel are set in config
  while (true) {
    guild = select_guild();
    if (guild === undefined) {
      console_out("No guild selected.\nShowing direct messages...");
      rl.pause();
      rl_sync.keyInPause(" ");
      rl.resume();
      channel = select_other();
      if (channel === undefined) {
        exit("No channel selected. Exiting...");
      } else {
        return;
      }
    }

    while (true) {
      channel = select_channel();
      if (channel === undefined) {
        break;
      }
      return;
    }
  }
}

// Returns the index of the selected guild
function select_guild() {
  let guild_list = client.guilds.array();
  let guild_names = client.guilds.array().map(g => g.name);

  return guild_list[select_item(guild_names)];
}

// Returns the index of the selected channel
function select_channel() {
  if (guild === undefined) {
    return undefined;
  }

  let channel_list = guild.channels.array().filter(c => c.type === "text");
  let channel_names = channel_list.map(c => c.name);

  return channel_list[select_item(channel_names)];
}

// sets the channel to a dm or gm channel
function select_other() {
  let channel_list = client.channels
    .array()
    .filter(c => c.type === "group" || c.type === "dm")
    .sort((a, b) => {
      if (a.lastMessageID < b.lastMessageID) {
        return 1;
      }
      if (a.lastMessageID > b.lastMessageID) {
        return -1;
      }
      return 0;
    });
  let channel_names = channel_list.map(
    c =>
      c.type === "dm"
        ? c.recipient.username
        : c.recipients
            .array()
            .map(r => r.username)
            .join()
  );

  return channel_list[select_item(channel_names)];
}

// Returns a object with all relevant options
function parse_config() {
  let config = {
    max_name_length: null,
    allign: false,
    separator: ":",
    history_length: null,
    default_guild: null,
    default_channel: null,
    mention_color: "#A52D00",
    default_color: "#FFFFFF",
    prompt: ">",
    show_date: true,
    show_time: true,
    use_nickname: true,
    token: "",
    select_count: 8,
    color_support: true,
    show_embeds: true
  };

  let user_config;
  let config_path = get_config_path();
  try {
    user_config = JSON.parse(fs.readFileSync(config_path, "utf8"));
  } catch (err) {
    if (err.code === "ENOENT") {
      exit("Config file " + config_path + " does not exist");
    } else if (err instanceof SyntaxError) {
      exit("Config file " + config_path + " is not valid JSON");
    } else {
      exit("Could not parse config file");
    }
  }

  for (let key in config) {
    if (user_config[key] !== undefined) {
      config[key] = user_config[key];
    }
  }

  if (config["token"] === "") {
    exit(
      "Config file " +
        config_path +
        " does not contain a token.\n Refer to the README.md for retrieving your token."
    );
  }

  return config;
}

// Locates a config file
// Parses command line args first and then tries default locations
function get_config_path() {
  if (process.argv[2] !== undefined) {
    return process.argv[2];
  }

  let homedir = process.env.HOME;
  if (fs.existsSync(homedir + "/.terminal-discord/config.json")) {
    return homedir + "/.terminal-discord/config.json";
  } else if (fs.existsSync(homedir + "/.config/terminal-discord/config.json")) {
    return homedir + "/.config/terminal-discord/config.json";
  } else {
    console_out("No config could be found in the default locations.");
    if (rl_sync.keyInYNStrict("Create a default config?")) {
      let install_path = "";
      if (fs.existsSync(homedir + "/.config/")) {
        if (!fs.existsSync(homedir + "/.config/terminal-discord/")) {
          fs.mkdirSync(homedir + "/.config/terminal-discord");
        }
        install_path = homedir + "/.config/terminal-discord/";
      } else {
        if (!fs.existsSync(homedir + "/.terminal-discord/")) {
          fs.mkdirSync(homedir + "/.terminal-discord");
        }
        install_path = homedir + "/.terminal-discord";
      }

      fs.writeFileSync(
        install_path + "/config.json",
        '{\n"token": "",\n"max_name_length": null,\n"allign": false,\n"separator": ":",\n"history_length": null,\n"default_guild": null,\n"default_channel": null,\n"mention_color": "#A52D00",\n"default_color": "#FFFFFF",\n"prompt": ">",\n"show_date": true,\n"show_time": true,\n"use_nickname": true,\n"select_count": 8,\n"color_support": true,\n"show_embeds": true\n}'
      );
      console_out("Created a config file in " + install_path);
      return install_path + "config.json";
    } else {
      exit("Exiting...");
    }
  }
}

function exit(reason) {
  console_out(reason);
  process.exit(1);
}

function clear_screen() {
  console_out("\033[2J");
  console_out("\033[H");
}

function console_out(msg) {
  readline.clearLine(process.stdout, 0);
  readline.cursorTo(process.stdout, 0, null);
  console.log(msg);
  rl.prompt(true);
}

function history() {
  channel.acknowledge();
  n =
    config["history_length"] === null
      ? process.stdout.rows
      : config["history_length"];
  channel
    .fetchMessages({
      limit: n
    })
    .then(messages => {
      messages
        .array()
        .reverse()
        .forEach(m => show_message(m));
    });
}

// Displays a message
function show_message(message) {
  let content = message.cleanContent;
  //emote check
  content = content.replace(/<a*:/g, "");
  content = content.replace(/\:\d*>/g, "");

  let date = message.createdAt;
  let timestamp = "";
  if (config["show_time"]) {
    let hour = date.getHours();
    if (hour < 10) {
      hour = "0" + hour;
    }
    let min = date.getMinutes();
    if (min < 10) {
      min = "0" + min;
    }
    timestamp = hour + ":" + min + " ";
  }

  if (config["show_date"]) {
    timestamp =
      date.getDay() +
      "." +
      date.getMonth() +
      "." +
      date.getFullYear() +
      " " +
      timestamp;
  }

  let author = message.author.username;
  if (config["use_nickname"] && message.member != null) {
    author = message.member.displayName;
  }

  let attachment = config["show_embeds"]
    ? message.attachments
        .array()
        .map(a => a.url)
        .join("\n")
    : "";

  if (config["max_name_length"] !== null) {
    if (author.length < config["max_name_length"] && config["allign"]) {
      let x = config["max_name_length"] - author.length;
      author = author + " ".repeat(x);
    } else if (author.length > config["max_name_length"]) {
      author = author.slice(0, config["max_name_length"]);
    }
  }

  if (config["color_support"]) {
    if (message.member !== null) {
      let color = message.member.displayHexColor;
      if (color != "#000000") {
        author = chalk.hex(color)(author);
      } else {
        author = chalk.hex(config["default_color"])(author);
      }
    } else {
      author = chalk.hex(config["default_color"])(author);
    }
  }

  if (message.isMemberMentioned(client.user) && config["color_support"]) {
    let nick;
    if (channel.type !== "dm" && channel.type !== "group") {
      nick = message.guild.me.displayName;
    }
    let mention_id = new RegExp(
      "@" + nick.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&")
    );
    let mention = chalk.bgHex(config["mention_color"])(
      content.match(mention_id)
    );
    content = content.replace(mention_id, mention);
  }
  console_out(
    timestamp + author + config["separator"] + attachment + " " + content
  );
}

// Shows info for the currently selected channel
function channel_info() {
  clear_screen();
  let name = "";
  let guild_name = "";
  let guild_index = "";
  let channel_index = "";
  if (channel.type === "text") {
    name = channel.name;
    guild_name = guild.name;
    guild_index = client.guilds.array().indexOf(guild);
    channel_index = guild.channels
      .array()
      .filter(c => c.type === "text")
      .indexOf(channel);
  } else if (channel.type === "dm") {
    name = channel.recipient;
  } else if (channel.type === "group") {
    name = channel.recipients.join();
  }
  console_out(
    "Info for channel " +
      name +
      "\nguild: " +
      guild_name +
      "\nguild_index: " +
      guild_index +
      "\nchannel_index: " +
      channel_index +
      "\ncreated_at: " +
      channel.createdAt +
      "\ntype: " +
      channel.type
  );
}

// Select an item from a list and return the index
function select_item(items) {
  if (!items || !items.length) {
    return -1;
  }

  const MAX_ITEMS = 8,
    MAX_PAGE_INDEX = Math.ceil(items.length / MAX_ITEMS) - 1;

  let page_index = 0;
  while (true) {
    const PAGE_ITEMS = [];
    let index_prev = -1,
      index_next = -1;
    if (page_index > 0) {
      PAGE_ITEMS.push(`(PREVIOUS ${MAX_ITEMS} items)`);
      index_prev = PAGE_ITEMS.length - 1;
    }
    Array.prototype.push.apply(
      PAGE_ITEMS,
      items.slice(page_index * MAX_ITEMS, (page_index + 1) * MAX_ITEMS)
    );
    if (page_index < MAX_PAGE_INDEX) {
      PAGE_ITEMS.push(
        `(NEXT ${
          page_index < MAX_PAGE_INDEX - 1
            ? MAX_ITEMS
            : items.length - MAX_ITEMS * (page_index + 1)
        } item(s))`
      );
      index_next = PAGE_ITEMS.length - 1;
    }

    //console.log('\x1B[2J');
    clear_screen();
    rl.pause();
    const index = rl_sync.keyInSelect(PAGE_ITEMS);
    rl.resume();
    if (index_prev !== -1 && index === index_prev) {
      page_index--;
    } else if (index_next !== -1 && index === index_next) {
      page_index++;
    } else {
      return index === -1
        ? index
        : index + page_index * MAX_ITEMS - (index_prev === -1 ? 0 : 1);
    }
  }
}

function command(cmd, arg) {
  let last_message;
  let new_channel;
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
      clear_screen();
      history();
      break;
    case "d":
    case "delete":
      last_message = client.user.lastMessage;
      if (last_message !== undefined && last_message.deletable) {
        last_message.delete();
      }
      break;
    case "e":
    case "edit":
      last_message = client.user.lastMessage;
      if (last_message !== undefined && last_message.editable) {
        last_message.edit(arg);
      }
      break;
    case "m":
    case "menu":
      clear_screen();
      init();
      history();
      break;
    case "c":
    case "channel":
      new_channel = select_channel();
      channel = new_channel === undefined ? channel : new_channel;
      clear_screen();
      history();
      break;
    case "o":
    case "online":
      if (channel.type === "text") {
        let members_list = channel.guild.members
          .array()
          .filter(m => m.presence.status !== "offline");

        clear_screen();
        console_out("Online Users: ");
        members_list.forEach(m =>
          console_out(
            "  " +
              m.user.presence.status.slice(0, 3) +
              "  " +
              (m.nickname !== null
                ? m.nickname + " aka " + m.user.username
                : m.user.username)
          )
        );
        rl.pause();
        rl_sync.keyInPause(" ");
        rl.resume();
      }

      clear_screen();
      history();
      break;
    case "pm":
    case "dm":
    case "g":
    case "gr":
    case "group":
      new_channel = select_other();
      channel = new_channel === undefined ? channel : new_channel;
      clear_screen();
      history();
      break;
    case "i":
    case "info":
      channel_info();
      rl.pause();
      rl_sync.keyInPause(" ");
      rl.resume();
      clear_screen();
      history();
      break;
    default:
      console_out("Unknown command");
      break;
  }
}
