const { Client, GatewayIntentBits, EmbedBuilder} = require('discord.js');
const sqlite3 = require('sqlite3').verbose();
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });
const { token, channelID, logChannelID, messagePattern } = require('./config.json');

const db = new sqlite3.Database('./messages.db', (err) => {
    if (err) {
        console.error('Не удалось открыть базу данных:', err.message);
    } else {
        console.log('Подключение к базе данных SQLite');
        db.run(`CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            messageId TEXT,
            author TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);
    }
});

const MESSAGE_PATTERN = new RegExp(messagePattern);

let expectedNumber

let fishChannel
let logChannel

client.once('ready', async () => {
    console.log(`Защитник рыбов активирован ${client.user.tag}!`);

    try {
        fishChannel = await client.channels.fetch(channelID);
        logChannel = await client.channels.fetch(logChannelID);
        if (fishChannel.isTextBased() && logChannel.isTextBased()) {
            await fishChannel.messages.fetch();

            db.get(`SELECT MAX(id) AS id FROM messages`, async function (err, row) {
                if (err) throw err;
                if (row.id == null) {
                    expectedNumber = 1;
                    const logMessage = 'Не найдено валидных чисел, начинаем с 1';
                    console.log(logMessage);
                    await logToChannel(logMessage, 'Отладка');
                    return;
                }

                expectedNumber = row.id + 1;
                const logMessage = `Ожидаемое следующее число: ${expectedNumber}`;
                console.log(logMessage);
                await logToChannel(logMessage, 'Отладка');
            });

        } else {
            console.error('Канал не текстовый!');
        }
    } catch (err) {
        console.error('Ошибка при получении сообщений:', err);
    }
});

client.on('messageCreate', async (message) => {
    if (message.channel.id === channelID && !message.author.bot) {
        const pattern = MESSAGE_PATTERN.exec(message.content);

        if (pattern == null || expectedNumber !== parseInt(pattern.at(0), 10)) {
            message.delete()
                .then(() => {
                    message.author.send(`Ожидалось: ${expectedNumber} 🐟. Пожалуйста, следуйте последовательности!`);
                })
                .catch(err =>
                    console.log('Ошибка при удалении сообщения:', err))

        } else {
            expectedNumber++;

            const newMessage = {
                content: message.content,
                messageId: message.id,
                author: message.author.username,
            };

            const sql = `INSERT INTO messages (messageId, author) VALUES (?, ?)`;
            db.run(sql, [newMessage.messageId, newMessage.author], function (err) {
                try {
                    console.log(`Сообщение сохранено: ${newMessage.content}`);
                } catch {
                    console.error('Ошибка сохранения сообщения:', err.message);
                }
            });
        }
    }
});

client.on('messageDelete', async (message) => {
    if (message.channel.id !== channelID) return;

    const logMessage = `**Автор:** ${message.author.tag} (ID: ${message.author.id})\n**Канал:** ${message.channel.name} (ID: ${message.channel.id})\n**Текст:** \`${message.content}\``;
    await logToChannel(logMessage, 'Пропажа рыбы!');
});

client.on('messageUpdate', async (oldMessage, newMessage) => {
    if (oldMessage.channel.id !== channelID) return;

    const logMessage = `**Автор:** ${oldMessage.author.tag} (ID: ${oldMessage.author.id})\n**Канал:** ${oldMessage.channel.name} (ID: ${oldMessage.channel.id})\n**Старый текст:** "${oldMessage.content}"\n**Новый текст:** \`${newMessage.content}\``;
    await logToChannel(logMessage, 'Редактирование сообщения');
});

async function logToChannel(logMessage, title) {
    if (logChannel.isTextBased() && logChannel) {
        const embed = new EmbedBuilder()
            .setColor(0xc3d660)
            .setTitle(`${title}`)
            .setDescription(`${logMessage}`)
            .setTimestamp();

        logChannel.send({ embeds: [embed] })
            .catch(err => console.error('Ошибка при отправке сообщения в лог-канал:', err));
    }
}

client.login(token);
