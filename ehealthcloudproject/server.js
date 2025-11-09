const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.static(path.join(__dirname, 'public')));

// Set EJS as view engine and explicitly define views folder
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

// Routes
const authRoutes = require('./routes/authRoutes');       // corrected path
const patientRoutes = require('./routes/patientRoutes'); // corrected path

app.use('/', authRoutes);
app.use('/', patientRoutes);

// Default redirect
app.get('/', (req, res) => res.redirect('/login'));

// Start server
app.listen(PORT, () => console.log(`✅ Server running at http://localhost:${PORT}`));
