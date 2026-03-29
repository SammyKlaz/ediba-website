import pool from "../config/db.js";
import { getHomepageImages } from "./homepageImageController.js";

export const homePage = async (req, res) => {
  try {
    // Fetch last 2 sermons
    const sermonsResult = await pool.query(
      `SELECT * FROM sermons ORDER BY created_at DESC LIMIT 1`
    );

    // Fetch last 2 events
    const eventsResult = await pool.query(
      `SELECT * FROM events WHERE event_date >= CURRENT_DATE ORDER BY event_date ASC LIMIT 2`
    );

    // Fetch homepage images
    const homepageImages = await getHomepageImages();

    res.render("home", {
      sermons: sermonsResult.rows,
      events: eventsResult.rows,
      homepageImages
    });
  } catch (error) {
    console.log(error);
    res.send("Error loading home page");
  }
};
