require('dotenv').config();

const bcrypt = require('bcryptjs');
const readline = require('readline');
const db = require('./db');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function ask(question) {
  return new Promise(resolve => {
    rl.question(question, answer => resolve(answer.trim()));
  });
}

async function main() {
  try {
    const name = await ask('Officer name: ');
    const email = (await ask('Officer email: ')).toLowerCase();
    const phone = await ask('Phone (optional): ');
    const password = await ask('Password (minimum 8 characters): ');
    const counterInput = await ask('Assigned counter (1, 2, or 3): ');

    const counterNumber = Number(counterInput);

    if (!name || !email || password.length < 8) {
      throw new Error(
        'Name, email and a password of at least 8 characters are required.'
      );
    }

    if (![1, 2, 3].includes(counterNumber)) {
      throw new Error('Counter must be 1, 2, or 3.');
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const sql = `
      INSERT INTO accounts
        (name, email, phone, password_hash, role, counter_number)
      VALUES (?, ?, ?, ?, 'officer', ?)
    `;

    db.query(
      sql,
      [
        name,
        email,
        phone || null,
        passwordHash,
        counterNumber
      ],
      error => {
        if (error) {
          console.error('Could not create officer:', error.message);
        } else {
          console.log('Officer account created successfully.');
        }

        rl.close();
        db.end();
      }
    );
  } catch (error) {
    console.error(error.message);
    rl.close();
    db.end();
  }
}

main();