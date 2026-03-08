import dotenv from "dotenv";
dotenv.config();
import express from "express";
import bodyParser from "body-parser";
import path from "path";
import indexRoute from "./routes/index.js";
import eventsRoute from "./routes/events.js";
import sermonsRoute from "./routes/sermons.js";
import giveRoute from "./routes/give.js";
import adminRoute from "./routes/admin.js";
import authRoutes from "./routes/auth.js";
import session from "express-session";
import aboutRoute from "./routes/about.js";
import adminUsersRoutes from "./routes/adminUsers.js";
import adminHomepageImagesRoutes from "./routes/adminHomepageImages.js";
import flash from "connect-flash";

const app = express();
const PORT = process.env.PORT || 10000;

app.use(
  session({
    secret: "church_secret_key",
    resave: false,
    saveUninitialized: false,
     cookie: {
      maxAge: 1000 * 60 * 60 * 24
    }
  })
);

// Flash middleware
app.use(flash());


// Set locals for user and flash messages
app.use((req, res, next) => {
  res.locals.user = req.session.user;
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  next();
});


app.set("view engine", "ejs");
app.set("views", path.join(process.cwd(), "views"));

app.set("view cache", false);


app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));



app.use("/", indexRoute);
app.use("/", eventsRoute);
app.use("/", sermonsRoute);
app.use("/", giveRoute);
app.use("/", adminRoute);
app.use(authRoutes);
app.use("/", aboutRoute);
app.use(adminUsersRoutes);
app.use(adminHomepageImagesRoutes);

import "./cronJobs.js";

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

