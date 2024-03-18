const app = require("./src/app");
const sequelize = require("./src/config/database");

console.log(process.env.NODE_ENV);

sequelize.sync({ force: true });

app.listen(3000, () => console.log("app is running"));
