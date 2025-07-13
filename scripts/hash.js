const bcrypt = require('bcryptjs');

bcrypt.hash('Diego123$', 10).then((hash) => {
  console.log('Hash generado:', hash);
});


db.users.insertOne({
  username: "diegoadmin",
  email: "diegoadmin@uce.edu.ec",
  password: "$2b$10$C5l14v2ediI6MpdbJKSI..bGmR5Yjo6VvpHFEwN7zCX1VE.x9OivS",
  role: "admin"
})