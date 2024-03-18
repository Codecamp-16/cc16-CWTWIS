const express = require("express");
const i18next = require("i18next");
const Backend = require("i18next-fs-backend");
const i18middleware = require("i18next-http-middleware");

const UserRoute = require("./user/UserRoute");

i18next
  .use(Backend)
  .use(i18middleware.LanguageDetector)
  .init({
    fallbackLng: "en",
    lng: "en",
    ns: ["translation"],
    defaultNS: "translation",
    backend: {
      loadPath: "./locales/{{lng}}/{{ns}}.json",
    },
    detection: {
      lookupHeader: "accept-language",
    },
  });

const app = express();
app.use(express.json());
app.use(i18middleware.handle(i18next));
app.use("/api/v1.0", UserRoute);

module.exports = app;
