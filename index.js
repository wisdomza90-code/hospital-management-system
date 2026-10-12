app.use(session({
  name: 'hospital.sid',
  secret: 'dev-insecure-secret-change-me',
  resave: false,
  saveUninitialized: true,
  cookie: { 
    httpOnly: true,
    sameSite: 'lax',
    secure: false,
    maxAge: 1000 * 60 * 60 * 8 
  }
}));
