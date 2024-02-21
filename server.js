// app.js

const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcrypt');

const app = express();
const port = 3002;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors());

// MySQL connection
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'Abi#2234',
  database: 'library'
});

// Route to fetch books with pagination and filter
app.get('/books', (req, res) => {
  const perPage = 10; // Number of results per page
  const page = req.query.page || 1; // Current page, default is 1
  const offset = (page - 1) * perPage;

  let query = 'SELECT * FROM books';
  let countQuery = 'SELECT COUNT(*) as total FROM books';

  const filters = req.query.filters;
  if (filters) {
    query += ' WHERE ';
    countQuery += ' WHERE ';
    const filterKeys = Object.keys(filters);
    filterKeys.forEach((key, index) => {
      if (index > 0) {
        query += ' AND ';
        countQuery += ' AND ';
      }
      query += `${key} LIKE '%${filters[key]}%'`;
      countQuery += `${key} LIKE '%${filters[key]}%'`;
    });
  }

  query += ` LIMIT ${perPage} OFFSET ${offset}`;

  connection.query(query, (error, results) => {
    if (error) throw error;
    connection.query(countQuery, (err, countResult) => {
      if (err) throw err;
      const total = countResult[0].total;
      const totalPages = Math.ceil(total / perPage);
      res.json({
        books: results,
        pagination: {
          total,
          totalPages,
          currentPage: page
        }
      });
    });
  });
});

// Route to add a new book
app.post('/addbooks', (req, res) => {
  const { title, author, subject, publish_date } = req.body;

  const query = 'INSERT INTO books (title, author, subject, publish_date) VALUES (?, ?, ?, ?)';
  connection.query(query, [title, author, subject, publish_date], (error, results) => {
    if (error) {
      console.error('Error adding book:', error);
      res.status(500).json({ error: 'Error adding book' });
    } else {
      res.status(200).json({ message: 'Book added successfully' });
    }
  });
});

// Signup endpoint
app.post('/signup', async (req, res) => {
  const { username, email, password } = req.body;

  // Hash the password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Insert user into database
  const query = 'INSERT INTO users (username, email, password) VALUES (?, ?, ?)';
  connection.query(query, [username, email, hashedPassword], (error, results) => {
    if (error) {
      console.error('Error signing up user:', error);
      res.status(500).json({ error: 'Error signing up user' });
    } else {
      res.status(200).json({ message: 'User signed up successfully' });
    }
  });
});

// Signin endpoint
app.post('/signin', async (req, res) => {
  const { username, password } = req.body;

  // Check if the user exists
  const query = 'SELECT * FROM users WHERE username = ?';
  connection.query(query, [username], async (error, results) => {
    if (error) {
      console.error('Error signing in user:', error);
      res.status(500).json({ error: 'Error signing in user' });
    } else if (results.length === 0) {
      res.status(401).json({ error: 'Invalid login credentials' });
    } else {
      const user = results[0];
      // Check if the password is correct
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (isPasswordValid) {
        res.status(200).send("Login Sucessful");
      } else {
        res.status(401).json({ error: 'Invalid login credentials' });
      }
    }
  });
});

app.delete('/books/:id', (req, res) => {
  const bookId = req.params.id;

  const query = 'DELETE FROM books WHERE id = ?';

  connection.query(query, [bookId], (error, results) => {
    if (error) {
      console.error('Error deleting book:', error);
      res.status(500).json({ error: 'Error deleting book' });
    } else {
      console.log('Book deleted successfully');
      res.status(200).json({ message: 'Book deleted successfully' });
    }
  });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

