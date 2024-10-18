const { EmbedBuilder } = require('discord.js');

let logChannel;

function setLogChannel(channel) {
    logChannel = channel;
}

async function logToChannel(logMessage, title) {
    if (logChannel.isTextBased() && logChannel) {
        const embed = new EmbedBuilder()
            .setColor(0xc3d660)
            .setTitle(`${title}`)
            .setDescription(`${logMessage}`)
            .setTimestamp();

        try {
            await logChannel.send({ embeds: [embed] });
        } catch (err) {
            console.error('Ошибка при отправке сообщения в лог-канал:', err);
        }
    }
}

module.exports = {
    setLogChannel,
    logToChannel
};
