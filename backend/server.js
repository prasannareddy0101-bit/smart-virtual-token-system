require('dotenv').config();

const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./db');

const app = express();
const server = http.createServer(app);

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error(
    'JWT_SECRET is missing. Add it to your backend/.env file.'
  );
}

const io = new Server(server, {
  cors: {
    origin: 'http://localhost:5173'
  }
});

app.use(cors());
app.use(express.json());


// =====================================================
// AUTHENTICATION MIDDLEWARE
// =====================================================

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      message: 'Please log in to continue.'
    });
  }

  const token = authHeader.substring(7);

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (error) {
    return res.status(401).json({
      message: 'Your session is invalid or has expired. Please log in again.'
    });
  }
}


function requireOfficer(req, res, next) {
  if (!['officer', 'admin'].includes(req.user.role)) {
    return res.status(403).json({
      message: 'Officer access required.'
    });
  }

  next();
}


// =====================================================
// HOME
// =====================================================

app.get('/', (req, res) => {
  res.json({
    message: 'Virtual Token Backend is running!'
  });
});


// =====================================================
// USER REGISTRATION
// =====================================================

app.post('/auth/register', async (req, res) => {
  const { name, email, phone, password } = req.body;

  if (
    typeof name !== 'string' ||
    typeof email !== 'string' ||
    typeof password !== 'string' ||
    !name.trim() ||
    !email.trim() ||
    !password
  ) {
    return res.status(400).json({
      message: 'Name, email and password are required.'
    });
  }

  if (password.length < 8) {
    return res.status(400).json({
      message: 'Password must contain at least 8 characters.'
    });
  }

  if (name.trim().length > 100 || email.trim().length > 150) {
    return res.status(400).json({
      message: 'Name or email is too long.'
    });
  }

  const normalizedEmail = email.trim().toLowerCase();

  try {
    const passwordHash = await bcrypt.hash(password, 12);

    const sql = `
      INSERT INTO accounts
        (name, email, phone, password_hash, role)
      VALUES (?, ?, ?, ?, 'user')
    `;

    db.query(
      sql,
      [
        name.trim(),
        normalizedEmail,
        typeof phone === 'string' && phone.trim()
          ? phone.trim()
          : null,
        passwordHash
      ],
      (error, result) => {
        if (error) {
          if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({
              message: 'An account with this email already exists.'
            });
          }

          console.error('Registration error:', error);

          return res.status(500).json({
            message: 'Could not create your account.'
          });
        }

        res.status(201).json({
          message: 'Registration successful. Please log in.',
          userId: result.insertId
        });
      }
    );
  } catch (error) {
    console.error('Password hashing error:', error);

    res.status(500).json({
      message: 'Could not process registration.'
    });
  }
});


// =====================================================
// USER LOGIN
// =====================================================

app.post('/auth/login', (req, res) => {
  const { email, password } = req.body;

  if (
    typeof email !== 'string' ||
    typeof password !== 'string' ||
    !email.trim() ||
    !password
  ) {
    return res.status(400).json({
      message: 'Email and password are required.'
    });
  }

  const sql = `
    SELECT
      id,
      name,
      email,
      phone,
      password_hash,
      role
    FROM accounts
    WHERE email = ?
    LIMIT 1
  `;

  db.query(
    sql,
    [email.trim().toLowerCase()],
    async (error, results) => {
      if (error) {
        console.error('User login database error:', error);

        return res.status(500).json({
          message: 'Database error.'
        });
      }

      if (results.length === 0) {
        return res.status(401).json({
          message: 'Invalid email or password.'
        });
      }

      const account = results[0];

      if (account.role !== 'user') {
        return res.status(403).json({
          message: 'Please use the officer login page.'
        });
      }

      try {
        const passwordMatches = await bcrypt.compare(
          password,
          account.password_hash
        );

        if (!passwordMatches) {
          return res.status(401).json({
            message: 'Invalid email or password.'
          });
        }

        const token = jwt.sign(
          {
            id: account.id,
            role: account.role
          },
          JWT_SECRET,
          {
            expiresIn: '8h'
          }
        );

        res.json({
          message: 'Login successful.',
          token,
          user: {
            id: account.id,
            name: account.name,
            email: account.email,
            phone: account.phone,
            role: account.role
          }
        });
      } catch (compareError) {
        console.error('Password verification error:', compareError);

        res.status(500).json({
          message: 'Login failed.'
        });
      }
    }
  );
});


// =====================================================
// OFFICER / ADMIN LOGIN
// =====================================================

app.post('/auth/officer-login', (req, res) => {
  const { email, password } = req.body;

  if (
    typeof email !== 'string' ||
    typeof password !== 'string' ||
    !email.trim() ||
    !password
  ) {
    return res.status(400).json({
      message: 'Email and password are required.'
    });
  }

  const sql = `
    SELECT
      id,
      name,
      email,
      phone,
      password_hash,
      role,
      counter_number
    FROM accounts
    WHERE email = ?
    LIMIT 1
  `;

  db.query(
    sql,
    [email.trim().toLowerCase()],
    async (error, results) => {
      if (error) {
        console.error('Officer login database error:', error);

        return res.status(500).json({
          message: 'Database error.'
        });
      }

      if (results.length === 0) {
        return res.status(401).json({
          message: 'Invalid email or password.'
        });
      }

      const account = results[0];

      if (!['officer', 'admin'].includes(account.role)) {
        return res.status(403).json({
          message: 'This account does not have officer access.'
        });
      }

      try {
        const passwordMatches = await bcrypt.compare(
          password,
          account.password_hash
        );

        if (!passwordMatches) {
          return res.status(401).json({
            message: 'Invalid email or password.'
          });
        }

        const token = jwt.sign(
          {
            id: account.id,
            role: account.role
          },
          JWT_SECRET,
          {
            expiresIn: '8h'
          }
        );

        res.json({
          message: 'Officer login successful.',
          token,
          user: {
            id: account.id,
            name: account.name,
            email: account.email,
            phone: account.phone,
            role: account.role,
            counterNumber: account.counter_number
          }
        });
      } catch (compareError) {
        console.error('Officer password verification error:', compareError);

        res.status(500).json({
          message: 'Login failed.'
        });
      }
    }
  );
});


// =====================================================
// GET LOGGED-IN USER PROFILE
// =====================================================

app.get('/auth/profile', requireAuth, (req, res) => {
  const sql = `
    SELECT
      id,
      name,
      email,
      phone,
      role,
      counter_number,
      created_at
    FROM accounts
    WHERE id = ?
    LIMIT 1
  `;

  db.query(sql, [req.user.id], (error, results) => {
    if (error) {
      console.error('Profile error:', error);

      return res.status(500).json({
        message: 'Could not load profile.'
      });
    }

    if (results.length === 0) {
      return res.status(404).json({
        message: 'Account not found.'
      });
    }

    const account = results[0];

    res.json({
      id: account.id,
      name: account.name,
      email: account.email,
      phone: account.phone,
      role: account.role,
      counterNumber: account.counter_number,
      createdAt: account.created_at
    });
  });
});


// =====================================================
// UPDATE LOGGED-IN USER PROFILE
// =====================================================

app.put('/auth/profile', requireAuth, (req, res) => {
  const { name, phone } = req.body;

  if (
    typeof name !== 'string' ||
    !name.trim() ||
    name.trim().length > 100
  ) {
    return res.status(400).json({
      message: 'Enter a valid name.'
    });
  }

  if (
    phone !== undefined &&
    phone !== null &&
    typeof phone !== 'string'
  ) {
    return res.status(400).json({
      message: 'Enter a valid phone number.'
    });
  }

  const normalizedPhone =
    typeof phone === 'string' && phone.trim()
      ? phone.trim()
      : null;

  if (normalizedPhone && normalizedPhone.length > 20) {
    return res.status(400).json({
      message: 'Phone number is too long.'
    });
  }

  const sql = `
    UPDATE accounts
    SET name = ?, phone = ?
    WHERE id = ?
  `;

  db.query(
    sql,
    [name.trim(), normalizedPhone, req.user.id],
    (error, result) => {
      if (error) {
        console.error('Profile update error:', error);

        return res.status(500).json({
          message: 'Could not update profile.'
        });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({
          message: 'Account not found.'
        });
      }

      res.json({
        message: 'Profile updated successfully.'
      });
    }
  );
});


// =====================================================
// CREATE TOKEN
// =====================================================

app.post('/token', (req, res) => {
  const { service } = req.body;

  if (typeof service !== 'string' || !service.trim()) {
    return res.status(400).json({
      message: 'Service is required.'
    });
  }

  const allowedServices = [
    'Income Certificate',
    'Birth Certificate',
    'Caste Certificate',
    'Other Services'
  ];

  if (!allowedServices.includes(service.trim())) {
    return res.status(400).json({
      message: 'Please select a valid service.'
    });
  }

  const sql = `
    SELECT token_number
    FROM tokens
    ORDER BY id DESC
    LIMIT 1
  `;

  db.query(sql, (error, results) => {
    if (error) {
      console.error('Token lookup error:', error);

      return res.status(500).json({
        message: 'Database error.'
      });
    }

    let nextNumber = 51;

    if (results.length > 0) {
      const lastToken = results[0].token_number;

      nextNumber = parseInt(lastToken.substring(1), 10) + 1;
    }

    const token = `A${String(nextNumber).padStart(3, '0')}`;

    const insertSql = `
      INSERT INTO tokens
        (token_number, service, status)
      VALUES (?, ?, 'Waiting')
    `;

    db.query(
      insertSql,
      [token, service.trim()],
      (insertError, result) => {
        if (insertError) {
          console.error('Token creation error:', insertError);

          return res.status(500).json({
            message: 'Could not create token.'
          });
        }

        const newToken = {
          id: result.insertId,
          token,
          service: service.trim(),
          status: 'Waiting',
          counterNumber: null
        };

        io.emit('queueUpdated', newToken);

        res.status(201).json(newToken);
      }
    );
  });
});


// =====================================================
// GET COMPLETE QUEUE
// =====================================================

app.get('/queue', (req, res) => {
  const sql = `
    SELECT
      id,
      token_number AS token,
      service,
      status,
      counter_number AS counterNumber,
      created_at,
      called_at,
      completed_at
    FROM tokens
    ORDER BY id ASC
  `;

  db.query(sql, (error, results) => {
    if (error) {
      console.error('Queue fetch error:', error);

      return res.status(500).json({
        message: 'Database error.'
      });
    }

    res.json(results);
  });
});


// =====================================================
// GET TOKEN INFORMATION
// =====================================================

app.get('/queue/info/:token', (req, res) => {
  const token = req.params.token;

  const tokenQuery = `
    SELECT
      id,
      token_number AS token,
      service,
      status,
      counter_number AS counterNumber
    FROM tokens
    WHERE token_number = ?
    LIMIT 1
  `;

  db.query(tokenQuery, [token], (error, tokenResults) => {
    if (error) {
      console.error('Token information error:', error);

      return res.status(500).json({
        message: 'Database error.'
      });
    }

    if (tokenResults.length === 0) {
      return res.status(404).json({
        message: 'Token not found.'
      });
    }

    const person = tokenResults[0];

    const servingQuery = `
      SELECT
        token_number AS token,
        service,
        counter_number AS counterNumber
      FROM tokens
      WHERE status = 'Called'
      ORDER BY counter_number ASC
    `;

    db.query(servingQuery, (servingError, servingResults) => {
      if (servingError) {
        console.error('Serving queue error:', servingError);

        return res.status(500).json({
          message: 'Could not load serving queue.'
        });
      }

      const waitingQuery = `
        SELECT COUNT(*) AS peopleAhead
        FROM tokens
        WHERE status = 'Waiting'
          AND service = ?
          AND id < ?
      `;

      db.query(
        waitingQuery,
        [person.service, person.id],
        (waitingError, waitingResults) => {
          if (waitingError) {
            console.error('Waiting count error:', waitingError);

            return res.status(500).json({
              message: 'Could not calculate waiting count.'
            });
          }

          const peopleAhead =
            person.status === 'Waiting'
              ? waitingResults[0].peopleAhead
              : 0;

          res.json({
            token: person.token,
            service: person.service,
            status: person.status,
            counterNumber: person.counterNumber,
            nowServing: servingResults,
            peopleAhead
          });
        }
      );
    });
  });
});


// =====================================================
// CALL NEXT TOKEN — OFFICER ONLY
// =====================================================

app.post(
  '/queue/next',
  requireAuth,
  requireOfficer,
  (req, res) => {
    const counterNumber =
      Number(req.body.counterNumber) || 1;

    if (![1, 2, 3].includes(counterNumber)) {
      return res.status(400).json({
        message: 'Invalid counter number.'
      });
    }

    // Officers are restricted to their assigned counter.
    if (
      req.user.role === 'officer'
    ) {
      const officerSql = `
        SELECT counter_number
        FROM accounts
        WHERE id = ?
        LIMIT 1
      `;

      db.query(
        officerSql,
        [req.user.id],
        (officerError, officerResults) => {
          if (officerError) {
            console.error(officerError);

            return res.status(500).json({
              message: 'Could not verify officer counter.'
            });
          }

          if (
            officerResults.length === 0 ||
            officerResults[0].counter_number !== counterNumber
          ) {
            return res.status(403).json({
              message: 'You can only operate your assigned counter.'
            });
          }

          callNextToken(counterNumber, res);
        }
      );

      return;
    }

    // Administrators can operate any valid counter.
    callNextToken(counterNumber, res);
  }
);


function callNextToken(counterNumber, res) {
  const currentSql = `
    SELECT *
    FROM tokens
    WHERE status = 'Called'
      AND counter_number = ?
    ORDER BY id ASC
    LIMIT 1
  `;

  db.query(
    currentSql,
    [counterNumber],
    (currentError, currentResults) => {
      if (currentError) {
        console.error(currentError);

        return res.status(500).json({
          message: 'Database error.'
        });
      }

      if (currentResults.length > 0) {
        return res.status(400).json({
          message: `Counter ${counterNumber} is already serving ${currentResults[0].token_number}.`,
          token: currentResults[0].token_number
        });
      }

      const findSql = `
        SELECT *
        FROM tokens
        WHERE status = 'Waiting'
        ORDER BY id ASC
        LIMIT 1
      `;

      db.query(findSql, (error, results) => {
        if (error) {
          console.error(error);

          return res.status(500).json({
            message: 'Database error.'
          });
        }

        if (results.length === 0) {
          return res.json({
            message: 'No one is waiting.'
          });
        }

        const person = results[0];

        const updateSql = `
          UPDATE tokens
          SET
            status = 'Called',
            counter_number = ?,
            called_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `;

        db.query(
          updateSql,
          [counterNumber, person.id],
          (updateError) => {
            if (updateError) {
              console.error(updateError);

              return res.status(500).json({
                message: 'Could not call token.'
              });
            }

            const updatedPerson = {
              id: person.id,
              token: person.token_number,
              service: person.service,
              status: 'Called',
              counterNumber
            };

            io.emit('queueUpdated', updatedPerson);

            res.json(updatedPerson);
          }
        );
      });
    }
  );
}


// =====================================================
// COMPLETE CURRENT TOKEN — OFFICER ONLY
// =====================================================

app.post(
  '/queue/complete',
  requireAuth,
  requireOfficer,
  (req, res) => {
    const counterNumber =
      Number(req.body.counterNumber) || 1;

    if (![1, 2, 3].includes(counterNumber)) {
      return res.status(400).json({
        message: 'Invalid counter number.'
      });
    }

    // Officers can complete tokens only at their assigned counter.
    if (req.user.role === 'officer') {
      const officerSql = `
        SELECT counter_number
        FROM accounts
        WHERE id = ?
        LIMIT 1
      `;

      db.query(
        officerSql,
        [req.user.id],
        (officerError, officerResults) => {
          if (officerError) {
            console.error(officerError);

            return res.status(500).json({
              message: 'Could not verify officer counter.'
            });
          }

          if (
            officerResults.length === 0 ||
            officerResults[0].counter_number !== counterNumber
          ) {
            return res.status(403).json({
              message: 'You can only operate your assigned counter.'
            });
          }

          completeCurrentToken(counterNumber, res);
        }
      );

      return;
    }

    // Administrators can complete tokens at any valid counter.
    completeCurrentToken(counterNumber, res);
  }
);


function completeCurrentToken(counterNumber, res) {
  const findSql = `
    SELECT *
    FROM tokens
    WHERE status = 'Called'
      AND counter_number = ?
    ORDER BY id ASC
    LIMIT 1
  `;

  db.query(
    findSql,
    [counterNumber],
    (error, results) => {
      if (error) {
        console.error(error);

        return res.status(500).json({
          message: 'Database error.'
        });
      }

      if (results.length === 0) {
        return res.json({
          message: `No one is currently being served at Counter ${counterNumber}.`
        });
      }

      const person = results[0];

      const updateSql = `
        UPDATE tokens
        SET
          status = 'Completed',
          completed_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `;

      db.query(
        updateSql,
        [person.id],
        (updateError) => {
          if (updateError) {
            console.error(updateError);

            return res.status(500).json({
              message: 'Could not complete token.'
            });
          }

          const completedPerson = {
            id: person.id,
            token: person.token_number,
            service: person.service,
            status: 'Completed',
            counterNumber
          };

          io.emit('queueUpdated', completedPerson);

          res.json(completedPerson);
        }
      );
    }
  );
}


// =====================================================
// SOCKET.IO
// =====================================================

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});


// =====================================================
// START SERVER
// =====================================================

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(
    `Backend server running on http://localhost:${PORT}`
  );
});