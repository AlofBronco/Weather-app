import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, '../client')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/index.html'));
});

app.get('/api', async (req, res) => {
  const { lat, lon, q } = req.query;

  try {
    // Fetch weather data if lat and lon are provided
    let weatherData, reverseLocationData, forecastData;

    if (lat && lon) {
      const weatherResponse = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${process.env.API_KEY}`
      );
      weatherData = await weatherResponse.json();

      const reverseLocationResponse = await fetch(
        `https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${process.env.API_KEY}`
      );
      reverseLocationData = await reverseLocationResponse.json();

      const forecastResponse = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${process.env.API_KEY}`
      );
      forecastData = await forecastResponse.json();
    }

    // Fetch location data if `q` is provided
    let locationData;
    if (q) {
      const locationResponse = await fetch(`https://api.openweathermap.org/geo/1.0/direct?q=${q}&limit=1&appid=${process.env.API_KEY}`);
      locationData = await locationResponse.json();
    }

    res.json({
      weather: weatherData || null,
      location: locationData || null,
      reverseLocation: reverseLocationData ? reverseLocationData[0] : null,
      forecast: forecastData || null,
    });
  } catch (error) {
    res.status(500).send('Internal Server Error');
    console.error(error);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
