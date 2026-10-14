const mysql = require('mysql2')

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '1234',
  database: 'virtual_token_db'
})

db.connect((error) => {
  if (error) {
    console.error('MySQL connection failed:', error.message)
    return
  }

  console.log('MySQL connected successfully!')
})

module.exports = db