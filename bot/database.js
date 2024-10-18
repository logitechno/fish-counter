const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./messages.db', (err) => {
    if (err) {
        console.error('Не удалось подключиться БД:', err.message);
    } else {
        console.log('Подключение к БД SQLite');
        db.run(`CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            content TEXT,
            messageId TEXT,
            author TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);
    }
});

function insertMessage(content, messageId, author) {
    return new Promise((resolve, reject) => {
        const sql = `INSERT INTO messages (content, messageId, author) VALUES (?, ?, ?)`;
        db.run(sql, [content, messageId, author], function (err) {
            if (err) {
                console.error('Ошибка сохранения сообщения:', err.message);
                return reject(err);
            }
            console.log(`Сообщение сохранено: ${content}`);
            resolve(this.lastID);
        });
    });
}

function getLastMessageId() {
    return new Promise((resolve, reject) => {
        db.get(`SELECT MAX(id) AS id FROM messages`, (err, row) => {
            if (err) {
                console.error('Ошибка получения последнего ID сообщения:', err.message);
                return reject(err);
            }
            resolve(row.id || 0);
        });
    });
}

module.exports = {
    insertMessage,
    getLastMessageId
};
