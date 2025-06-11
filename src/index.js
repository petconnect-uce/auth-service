const express = require('express');
const app = express();
const authRoutes = require('./routes/auth.js');

app.use(express.json());
app.use('/api/auth', authRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Auth service running on port ${PORT}`));
