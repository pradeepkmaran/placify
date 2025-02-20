
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { google } = require('googleapis');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Configure CORS
const corsOptions = {
  origin: process.env.FRONTEND_URL || '*', // Allow requests from your frontend URL
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true, // Allow cookies to be sent with requests
  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));

app.use(session({
  secret: process.env.SESSION_SECRET || 'your_session_secret',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: process.env.NODE_ENV === 'production', maxAge: 24 * 60 * 60 * 1000 }
}));

app.use(passport.initialize());
app.use(passport.session());

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/auth/google/callback",
    scope: [
      'profile', 
      'email',
      'https://www.googleapis.com/auth/drive.readonly'
    ]
  },
  function(accessToken, refreshToken, profile, done) {

    const user = {
      id: profile.id,
      email: profile.emails[0].value,
      name: profile.displayName,
      accessToken,
      refreshToken
    };
    return done(null, user);
  }
));

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((obj, done) => {
  done(null, obj);
});

app.get('/', (req, res) => {
  if (req.isAuthenticated()) {
    res.send(`
      <h1>Welcome, ${req.user.name}</h1>
      <a href="/drive/list">View your Google Drive files</a><br>
      <a href="/auth/logout">Logout</a>
    `);
  } else {
    res.send(`
      <h1>Google Drive Integration</h1>
      <a href="/auth/google">Login with Google</a>
    `);
  }
});

app.get('/auth/google', 
  passport.authenticate('google')
);

app.get('/auth/google/callback', 
  passport.authenticate('google', { failureRedirect: '/' }),
  (req, res) => {
    res.redirect('/');
  }
);

app.get('/auth/logout', (req, res) => {
  req.logout(function(err) {
    if (err) { return next(err); }
    res.redirect('/');
  });
});

function isAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/');
}

app.get('/drive/list', isAuthenticated, async (req, res) => {
  try {
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({
      access_token: req.user.accessToken,
      refresh_token: req.user.refreshToken
    });

    const drive = google.drive({ version: 'v3', auth: oauth2Client });
    
    const response = await drive.files.list({
      pageSize: 10,
      fields: 'files(id, name, mimeType, webViewLink)',
    });

    const files = response.data.files;
    if (files.length === 0) {
      res.send('No files found in your Google Drive.');
      return;
    }

    let filesList = '<h1>Your Google Drive Files</h1>';
    filesList += '<ul>';
    files.forEach(file => {
      filesList += `<li><a href="${file.webViewLink}" target="_blank">${file.name}</a> (${file.mimeType})</li>`;
    });
    filesList += '</ul>';
    filesList += '<a href="/">Back to Home</a>';

    res.send(filesList);
  } catch (error) {
    console.error('Error fetching Google Drive files:', error);
    res.status(500).send('Error fetching your Google Drive files');
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});