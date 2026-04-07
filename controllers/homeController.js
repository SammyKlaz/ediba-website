import pool from "../config/db.js";
import { getHomepageImages } from "./homepageImageController.js";

export const homePage = async (req, res) => {
  try {
    // Fetch last 2 events
    const eventsResult = await pool.query(
      `SELECT * FROM events WHERE event_date >= CURRENT_DATE ORDER BY event_date ASC LIMIT 2`
    );

    // Fetch homepage images
    const homepageImages = await getHomepageImages();

    // no sermons passed to template anymore
    res.render("home", {
      sermons: [],
      events: eventsResult.rows,
      homepageImages
    });
  } catch (error) {
    console.error('homePage error', error && (error.stack || error));
    res.status(500).send("Error loading home page: " + (error && error.message ? error.message : String(error)));
  }
};
