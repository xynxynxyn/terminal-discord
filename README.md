# Terminal-Discord

![terminal-discord](https://my.mixtape.moe/hblbex.png)

A simple terminal based client for Discord using the [discord.js](https://discord.js.org) API.

## Installation
Clone the repository to a directory of your choice.
Find your token and add it to the config file.
Run sudo ./install.sh

## Config-File

### Token

Terminal-Discord uses a token to login rather than email and password since discord.js doesn't support that method anymore.
To retrieve your token open up your Discord client and press Ctrl-Shift-I. Navigate to the Application tab and find the token in the local storage.

![Token](https://my.mixtape.moe/taqhbx.png)

### MaxNameLength

The maximum length of usernames. If the value is null no extra spaces will be added to names and the messages will not be alligned

Default is 10

### Seperator

Seperator between username and message content.

Default is ">"

### HistoryLength

Number of messages loaded at a time.

Default is 50

### defaultGuild

The index of the guild you want selected at startup.
Substract 1 from the index in the menu.

Default is null

### defaultChannel
The index of the channel you want selected at startup.
Substract 1 from the index in the menu.

Default is null

### prompt
The prompt used.

Default is ">"

### colorsupport
Wether color for usernames is enabled or not.

Default is true

### mentionColor
What background color the message should have when you get mentioned. Only applicable when colorsupport is enabled. Setting this to null disables the feature.

Default is null

### usenick
Wether the nickname should be displayed when available.

Default is true

### time
Show the timestamp next to a message.

Default is true

### date
Enable date support to display DD.MM.YYYY in front of the time.

Default is false


## Commands

Enter a command while in a channel using /.

__q__ or __quit__: exits the client

__u__, __update__, __r__, __refresh__: refreshes manually

__nick__: changes your nickname

__d__, __delete__: deletes the last sent message

__e__, __edit__: replace the content of your last sent message with the string after /e

__m__, __menu__: open the channel selection menu to switch to a different channel

__o__, __online__: show a list of currently online users


Note that edit and delete only work on messages sent in the current session. If you haven't sent a message in the current session the command will do nothing.
