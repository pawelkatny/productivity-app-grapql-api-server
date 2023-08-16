const express = require("express");
const app = express();
const port = 3000;

app.get("/", (res, req) => {
  res.send("Productivity app");
});

app.listen(port, () => {
  console.log(`Server started at PORT ${port}.`);
});
