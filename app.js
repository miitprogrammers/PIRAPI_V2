const express = require("express");
const path = require("path");
const frontend = express();
const frontendPORT = process.env.PORT || 8080;

// Sajikan file statis dari folder 'dist'
frontend.use(express.static(path.join(__dirname, "dist")));

// Tangani semua rute dengan mengembalikan file index.html
frontend.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

// Jalankan server
frontend.listen(frontendPORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
