let lastLat, lastLon;

async function fetchData(lat, lon) {
  lastLat = lat;
  lastLon = lon;

  const loading = document.getElementById('loading');
  const wrapper = document.getElementById('wrapper');
  try {
    const response = await fetch(`/api?lat=${lat}&lon=${lon}`);
    const { weather, reverseLocation, forecast } = await response.json();

    clearInterval(timeInterval);
    const initialTime = new Date(weather.dt * 1000);
    const timezoneOffset = weather.timezone || 0;
    const time = new Date(initialTime.getTime() + timezoneOffset * 1000);
    updateTime(time);
    let elapsedTime = 0;
    timeInterval = setInterval(() => {
      const newTime = new Date(time.getTime() + elapsedTime * 1000);
      updateTime(newTime);
      elapsedTime++;
    }, 1000);

    document.getElementById('city-country').textContent = `${reverseLocation.name}, ${reverseLocation.country}`;

    const weatherIcon = document.getElementById('weather-icon');
    const weatherName = document.getElementById('weather-name');
    const temp = document.getElementById('temp');
    const feelsLike = document.getElementById('feels-like');
    const windSpeed = document.getElementById('wind-speed');
    const windIcon = document.getElementById('wind-icon');

    weatherIcon.src = `https://openweathermap.org/img/wn/${weather.weather[0].icon}@4x.png`;
    weatherIcon.alt = `${weather.weather[0].description}`;
    weatherName.textContent = `${capitalizeWords(weather.weather[0].description)}`;
    temp.textContent = `Temperature: ${Math.round(weather.main.temp)}°C`;
    feelsLike.textContent = `Feels like: ${Math.round(weather.main.feels_like)}°C`;
    windSpeed.textContent = `Wind speed: ${weather.wind.speed}`;
    windIcon.style.transform = `rotate(${weather.wind.deg}deg)`;

    for (let i = 0; i < forecast.list.length; i += 8) {
      const entry = forecast.list[i];
      const date = new Date(entry.dt * 1000);
      const weekday = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
      const day = weekday[date.getDay()];

      const weekBlock = document.getElementById(`forecast-${i}`);
      const forecastIcon = weekBlock.querySelector('.forecast-icon');
      const weekDay = weekBlock.querySelector('.weekday');
      const condition = weekBlock.querySelector('.forecast-condition');
      const temp = weekBlock.querySelector('.forecast-temp');

      forecastIcon.src = `https://openweathermap.org/img/wn/${entry.weather[0].icon}@4x.png`;
      weekDay.textContent = capitalizeWords(day);
      condition.textContent = capitalizeWords(entry.weather[0].description);
      temp.textContent = `${Math.round(entry.main.temp)}°C`;
    }
  } catch (error) {
    console.error('Error:', error);
    displayError('Failed to fetch weather data.');
  } finally {
    loading.style.display = 'none';
    wrapper.style.display = 'flex';
  }
}

// TIME
let timeInterval;
function updateTime(time) {
  const hours = time.getUTCHours().toString().padStart(2, 0);
  const minutes = time.getUTCMinutes().toString().padStart(2, 0);
  document.getElementById('hours').textContent = hours;
  document.getElementById('minutes').textContent = minutes;
}

// TITLE CASE
function capitalizeWords(str) {
  return str
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

// WEATHER BY CURRENT LOCATION
document.addEventListener('DOMContentLoaded', () => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;

        fetchData(lat, lon);
      },
      (error) => {
        console.error('Geolocation error:', error);
        displayError('Could not retrieve your location.');
      }
    );
  } else {
    displayError('Your browser does not support geolocation');
  }
});

// WEATHER BY SEARCH
const submitBtn = document.getElementById('search-svg');
const searchInput = document.getElementById('search-city');

submitBtn.addEventListener('click', findLocation);
searchInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    findLocation();
  }
});

async function findLocation() {
  const locationQuery = searchInput.value.trim().toLowerCase();

  if (!locationQuery) {
    displayError('Please enter a city name.');
    return;
  }

  try {
    const response = await fetch(`/api?q=${locationQuery}`);
    const data = await response.json();

    const location = data.location;

    if (location && location.length > 0) {
      const lat = location[0].lat;
      const lon = location[0].lon;

      fetchData(lat, lon);
    } else {
      displayError('Location not found. Please try again.');
    }
  } catch (error) {
    console.error('Error:', error);
    displayError('Failed to find the location.');
  }
}

// UPDATING THE PAGE
let awayStartTime;
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') {
    awayStartTime = new Date().getTime();
  } else if (document.visibilityState === 'visible') {
    const returnTime = new Date().getTime();
    const timeAway = (returnTime - awayStartTime) / 1000;

    if (timeAway >= 60) {
      if (lastLat !== undefined && lastLon !== undefined) {
        fetchData(lastLat, lastLon);
      } else {
        console.warn('No coordinates available for fetching data.');
      }
    }
  }
});

// ERROR HANDLING
const errorBlock = document.getElementById('error');
const errorMessage = document.getElementById('error-message');
const errorBtn = document.getElementById('error-button');

function displayError(message) {
  if (errorBlock) {
    errorBlock.style.display = 'flex';
    errorMessage.textContent = message;
  } else {
    console.warn('Error block element not found in HTML.');
  }
}

errorBtn.addEventListener('click', () => {
  errorBlock.style.display = 'none';
});
