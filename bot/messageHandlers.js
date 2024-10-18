const { logToChannel } = require('./logger');
const { channelID, messagePattern } = require('../config.json');
const { insertMessage } = require("./database");

const MESSAGE_PATTERN = new RegExp(messagePattern);

module.exports = (client, expectedNumber) => {
    client.on('messageDelete', async (message) => {
        if (message.channel.id !== channelID) return;

        const logMessage = `**Автор:** ${message.author.tag} (ID: ${message.author.id})\n**Канал:** ${message.channel.name} (ID: ${message.channel.id})\n**Текст:** \`${message.content}\``;
        await logToChannel(logMessage, 'Пропажа рыбы!');
    });

    client.on('messageUpdate', async (oldMessage, newMessage) => {
        if (oldMessage.channel.id !== channelID) return;

        const logMessage = `**Автор:** ${oldMessage.author.tag} (ID: ${oldMessage.author.id})\n**Канал:** ${oldMessage.channel.name} (ID: ${oldMessage.channel.id})\n**Старый текст:** \`${oldMessage.content}\`\n**Новый текст:** \`${newMessage.content}\``;
        await logToChannel(logMessage, 'Редактирование сообщения');
    });

    client.on('messageCreate', async (message) => {
        if (message.channel.id === channelID && !message.author.bot) {
            const pattern = MESSAGE_PATTERN.exec(message.content);

            if (pattern == null || expectedNumber !== parseInt(pattern.at(0), 10)) {
                message.delete()
                    .then(() => {
                        message.author.send(`Ожидалось: ${expectedNumber} 🐟. Пожалуйста, следуйте последовательности!`);
                    })
                    .catch(err => console.log('Ошибка при удалении сообщения:', err));
            } else {
                expectedNumber++;
                await insertMessage(message.content, message.id, message.author.username); // Вставка сообщения в БД
            }
        }
    });
};
