// utils/weather.js
const axios = require("axios");
require("dotenv").config();

const OWM_KEY = process.env.OPENWEATHERMAP_KEY;
const BAD_CONDITIONS = new Set([
  "Thunderstorm",
  "Drizzle",
  "Rain",
  // "Snow",
  "Mist",
  // "Smoke",
  // "Haze",
  // "Dust",
  "Fog",
  // "Sand",
  // "Ash",
  // "Squall",
  // "Tornado",
]);

/**
 * Returns true when the current weather at coords is in our BAD_CONDITIONS list.
 * @param {number} lat
 * @param {number} lon
 */
async function isBadWeather(lat, lon) {
  try {
    const resp = await axios.get(
      "https://api.openweathermap.org/data/2.5/weather",
      {
        params: {
          lat,
          lon,
          appid: OWM_KEY,
        },
      }
    );
    // OpenWeatherMap returns `weather` as an array of conditions:
    // [{ id, main: "Rain", description: "light rain", ... }, ...]
    const mains = resp.data.weather.map((w) => w.main);
    return mains.some((m) => BAD_CONDITIONS.has(m));
  } catch (err) {
    console.error("Weather API error:", err.message);
    // In doubt, treat it as clear rather than penalize?
    return false;
  }
}

module.exports = { isBadWeather };
