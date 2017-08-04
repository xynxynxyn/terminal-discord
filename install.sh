#!/bin/bash

path='HOME'
if [ -d "${!path}/.config" ]; then
    mkdir ${!path}/.config/terminal-discord
    cp config.json ${!path}/.config/terminal-discord
else
    mkdir ${!path}/.terminal-discord
    cp config.json ${!path}/.terminal-discord
fi

sudo npm -g install
