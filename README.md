# Terminal-Discord

![terminal-discord](https://my.mixtape.moe/hblbex.png)

A simple terminal based client for Discord using the [discord.js](https://discord.js.org) API.

## Config-File

### Token

Terminal-Discord uses a token to login rather than email and password since discord.js doesn't support that method anymore.
To retrieve your token open up your Discord client and press Ctrl-Shift-I. Navigate to the Application tab and find the token in the local storage.

![Token](https://my.mixtape.moe/taqhbx.png)

### MaxNameLength

The maximum length of usernames.

Default is 10

### Seperator

Seperator between username and message content.

Default is ">"

### HistoryLength

Number of messages loaded at a time.

Default is 50

### defaultGuild

The index of the guild you want selected at startup.

Default is null

### defaultChannel
The index of the channel you want selected at startup.

Default is null

### prompt
The prompt used.

Default is ">"

### colorsupport
Wether color for usernames is enabled or not.

Default is true


## Commands

Enter a command while in a channel using /.

__q__ or __quit__: exits the client

__u__, __update__, __r__, __refresh__: refreshes manually

__nick__: changes your nickname

__d__, __delete__: deletes the last sent message

__e__, __edit__: replace the content of your last sent message with the string after /e

__m__, __menu__: open the channel selection menu to switch to a different channel


Note that edit and delete only work on messages sent in the current session. If you haven't sent a message in the current session the command will do nothing.
