const { Client, GatewayIntentBits } = require('discord.js');
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });
const { token, channelID, logChannelID } = require('../config.json');
const messageHandlers = require('./messageHandlers');
const { setLogChannel, logToChannel } = require('./logger');
const { getLastMessageId } = require('./database');

let expectedNumber;

client.once('ready', async () => {
    console.log(`Защитник рыбов активирован ${client.user.tag}!`);

    try {
        const fishChannel = await client.channels.fetch(channelID);
        const logChannel = await client.channels.fetch(logChannelID);
        if (fishChannel.isTextBased()) {
            setLogChannel(logChannel);
            await fishChannel.messages.fetch();

            expectedNumber = await getLastMessageId() + 1;
            await logToChannel(`Ожидаемое следующее число: ${expectedNumber}`, 'Отладка');

            messageHandlers(client, expectedNumber);
        } else {
            console.error('Канал не текстовый!');
        }
    } catch (err) {
        console.error('Ошибка при получении сообщений:', err);
    }
});

client.login(token);
