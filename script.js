// Hàm cập nhật đồng hồ thời gian thực
function updateRealTimeClock() {
  const now = new Date();
  const options = { 
    hour: '2-digit', 
    minute: '2-digit', 
    second: '2-digit',
    hour12: false
  };
  const timeString = now.toLocaleTimeString('vi-VN', options);
  
  const clockElement = document.getElementById('realTimeClock');
  if (clockElement) {
    clockElement.innerHTML = `<i class="far fa-clock"></i> ${timeString}`;
  }
}

// Trong hàm submit form:
const now = new Date();
const options = { 
  day: '2-digit', 
  month: '2-digit', 
  year: 'numeric',
  hour: '2-digit', 
  minute: '2-digit',
  hour12: false
};
const lastUpdatedString = `<i class="fas fa-sync-alt"></i> Cập nhật lúc ${now.toLocaleTimeString('vi-VN', options)}`;
document.getElementById('lastUpdated').innerHTML = lastUpdatedString;
document.getElementById('lastUpdated').classList.remove('hidden');



document.getElementById("weatherForm").addEventListener("submit", async function (e) {
  e.preventDefault();
  const city = document.getElementById("cityInput").value.trim();
  const resultDiv = document.getElementById("weatherResult");
  const loadingDiv = document.getElementById("loadingState");
  const errorDiv = document.getElementById("errorMessage");
  const searchBtn = document.getElementById("searchBtn");
  
  if (!city) return;
  
  try {
    // Show loading state
    hideAllStates();
    loadingDiv.classList.remove("hidden");
    searchBtn.disabled = true;
    
    console.log("Searching for city:", city);
    
    // Get city coordinates
    const geoResponse = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en`
    );
    
    if (!geoResponse.ok) {
      throw new Error("Failed to connect to geocoding service");
    }
    
    const geoData = await geoResponse.json();
    console.log("Geocoding response:", geoData);
    
    if (!geoData.results || geoData.results.length === 0) {
      throw new Error("City not found. Please try another name.");
    }
    
    const { latitude, longitude, name, country, admin1 } = geoData.results[0];
    console.log("Found coordinates:", { latitude, longitude, name, country, admin1 });
    
    // Get weather data
    const weatherResponse = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}` +
      `&current_weather=true` +
      `&hourly=relativehumidity_2m,uv_index` +
      `&daily=weathercode,temperature_2m_max,temperature_2m_min,sunrise,sunset` +
      `&timezone=auto` +
      `&forecast_days=1`
    );
    
    if (!weatherResponse.ok) {
      throw new Error("Failed to connect to weather service");
    }
    
    const weatherData = await weatherResponse.json();
    console.log("Weather response:", weatherData);
    
    if (!weatherData.current_weather) {
      throw new Error("Weather data not available for this location.");
    }
    
    // Process data
    const current = weatherData.current_weather;
    const daily = weatherData.daily;
    const hourly = weatherData.hourly;
    
    const humidity = hourly.relativehumidity_2m ? hourly.relativehumidity_2m[0] : "N/A";
    const uvIndex = hourly.uv_index ? Math.round(hourly.uv_index[0] || 0) : "N/A";
    const sunrise = formatTime(daily.sunrise ? daily.sunrise[0] : null);
    const sunset = formatTime(daily.sunset ? daily.sunset[0] : null);
    const weatherDesc = mapWeatherCode(current.weathercode);
    const weatherIcon = getWeatherIcon(current.weathercode);
    
    // Update UI
    document.getElementById("locationName").textContent = `${name}${admin1 ? `, ${admin1}` : ''}, ${country}`;
    document.getElementById("currentDate").textContent = formatDate(current.time);
    document.getElementById("temperature").textContent = Math.round(current.temperature);
    document.getElementById("weatherDesc").textContent = weatherDesc;
    document.getElementById("weatherIcon").innerHTML = `<i class="${weatherIcon}"></i>`;
    document.getElementById("windSpeed").textContent = Math.round(current.windspeed);
    document.getElementById("humidity").textContent = humidity;
    document.getElementById("uvIndex").textContent = uvIndex;
    document.getElementById("sunrise").textContent = sunrise;
    document.getElementById("sunset").textContent = sunset;
    
    if (daily.temperature_2m_max && daily.temperature_2m_min) {
      document.getElementById("tempMax").querySelector(".value").textContent = Math.round(daily.temperature_2m_max[0]);
      document.getElementById("tempMin").querySelector(".value").textContent = Math.round(daily.temperature_2m_min[0]);
    }
    
    // Create weather effects based on weather code
    createWeatherEffects(current.weathercode);
    
    // Show results with animation
    hideAllStates();
    resultDiv.classList.remove("hidden");
    setTimeout(() => {
      resultDiv.classList.add("show");
    }, 50);
    
  } catch (error) {
    console.error("Error fetching weather data:", error);
    hideAllStates();
    showError(error.message || "Failed to get weather data. Please try again.");
  } finally {
    searchBtn.disabled = false;
  }
});

function hideAllStates() {
  document.getElementById("weatherResult").classList.add("hidden");
  document.getElementById("weatherResult").classList.remove("show");
  document.getElementById("loadingState").classList.add("hidden");
  document.getElementById("errorMessage").classList.add("hidden");
}

function showError(message) {
  const errorDiv = document.getElementById("errorMessage");
  errorDiv.textContent = message;
  errorDiv.classList.remove("hidden");
}

// Weather Effects
function createWeatherEffects(weatherCode) {
  const effectsContainer = document.getElementById("weatherEffects");
  effectsContainer.innerHTML = '';
  
  const isDay = new Date().getHours() > 6 && new Date().getHours() < 18;
  
  // Clear existing classes
  document.body.className = '';
  
  // Add base class
  document.body.classList.add(isDay ? 'day' : 'night');
  
  // Create effects based on weather code
  switch(true) {
    // Clear sky
    case weatherCode === 0:
      if (isDay) {
        // Create sun
        const sun = document.createElement('div');
        sun.className = 'sun';
        sun.style.width = '100px';
        sun.style.height = '100px';
        sun.style.top = '50px';
        sun.style.right = '50px';
        effectsContainer.appendChild(sun);
      } else {
        // Create stars
        for (let i = 0; i < 50; i++) {
          const star = document.createElement('div');
          star.className = 'star';
          star.style.width = `${Math.random() * 3 + 1}px`;
          star.style.height = star.style.width;
          star.style.left = `${Math.random() * 100}vw`;
          star.style.top = `${Math.random() * 100}vh`;
          star.style.backgroundColor = 'white';
          star.style.borderRadius = '50%';
          star.style.opacity = Math.random();
          star.style.animation = `twinkle ${Math.random() * 5 + 3}s infinite`;
          effectsContainer.appendChild(star);
        }
      }
      break;
      
    // Partly cloudy
    case weatherCode === 1 || weatherCode === 2:
      createClouds(3);
      if (isDay) {
        const sun = document.createElement('div');
        sun.className = 'sun';
        sun.style.width = '80px';
        sun.style.height = '80px';
        sun.style.top = '30px';
        sun.style.right = '30px';
        sun.style.opacity = '0.7';
        effectsContainer.appendChild(sun);
      }
      break;
      
    // Overcast
    case weatherCode === 3:
      createClouds(25);
      break;
      
    // Fog
    case weatherCode === 45 || weatherCode === 48:
      createFog();
      break;
      
    // Drizzle
    case weatherCode >= 51 && weatherCode <= 55:
      createRain(50, 1);
      createClouds(3);
      break;
      
    // Freezing drizzle
    case weatherCode === 56 || weatherCode === 57:
      createRain(50, 1, true);
      createClouds(3);
      break;
      
    // Rain
    case weatherCode >= 61 && weatherCode <= 65:
      createRain(100, 2);
      createClouds(4);
      break;
      
    // Freezing rain
    case weatherCode === 66 || weatherCode === 67:
      createRain(100, 2, true);
      createClouds(4);
      break;
      
    // Snow
    case weatherCode >= 71 && weatherCode <= 77:
      createSnow(150);
      createClouds(4);
      break;
      
    // Rain showers
    case weatherCode >= 80 && weatherCode <= 82:
      createRain(150, 3);
      createClouds(5);
      break;
      
    // Snow showers
    case weatherCode === 85 || weatherCode === 86:
      createSnow(200);
      createClouds(5);
      break;
      
    // Thunderstorm
    case weatherCode >= 95 && weatherCode <= 99:
      createRain(200, 3);
      createClouds(6);
      createThunder();
      break;
      
    default:
      if (isDay) {
        const sun = document.createElement('div');
        sun.className = 'sun';
        sun.style.width = '100px';
        sun.style.height = '100px';
        sun.style.top = '50px';
        sun.style.right = '50px';
        effectsContainer.appendChild(sun);
      }
  }
}

function createClouds(count) {
  const effectsContainer = document.getElementById("weatherEffects");
  
  for (let i = 0; i < count; i++) {
    const cloud = document.createElement('div');
    cloud.className = 'cloud';
    
    const size = Math.random() * 100 + 50;
    cloud.style.width = `${size}px`;
    cloud.style.height = `${size * 0.6}px`;
    cloud.style.left = `${Math.random() * 100}vw`;
    cloud.style.top = `${Math.random() * 30}vh`;
    cloud.style.opacity = Math.random() * 0.5 + 0.3;
    cloud.style.animationDuration = `${Math.random() * 30 + 20}s`;
    
    effectsContainer.appendChild(cloud);
  }
}

// ===== PHÁT HIỆN MOBILE VÀ ĐIỀU CHỈNH HIỆU ỨNG =====
function isMobile() {
  return /Android|iPhone|iPad/i.test(navigator.userAgent) || window.innerWidth < 768;
}

// ===== CẬP NHẬT CÁC HÀM TẠO HIỆU ỨNG =====
function createRain(count, intensity, isFreezing = false) {
  const effectsContainer = document.getElementById("weatherEffects");
  const mobileMultiplier = isMobile() ? 0.5 : 1; // Giảm 50% số lượng trên mobile

  for (let i = 0; i < count * mobileMultiplier; i++) {
    const rain = document.createElement('div');
    rain.className = 'rain';
    
    // Sử dụng transform thay vì top/left để tối ưu
    rain.style.transform = `translate(${Math.random() * 100}vw, ${Math.random() * -100}px)`;
    
    // Giảm độ phức tạp trên mobile
    if (isMobile()) {
      rain.style.height = `${Math.random() * 10 + 5}px`;
      rain.style.opacity = Math.random() * 0.4 + 0.1;
    } else {
      rain.style.height = `${Math.random() * 20 + 10}px`;
    }
    
    effectsContainer.appendChild(rain);
  }
}

function createSnow(count) {
  const effectsContainer = document.getElementById("weatherEffects");
  const mobileMultiplier = isMobile() ? 0.5 : 1; // Giảm 50% số lượng trên mobile

  for (let i = 0; i < count * mobileMultiplier; i++) {
    const snow = document.createElement('div');
    snow.className = 'snow';
    
    snow.style.left = `${Math.random() * 100}vw`;
    snow.style.top = `${Math.random() * -100}px`;
    snow.style.width = `${Math.random() * 8 + 4}px`;
    snow.style.height = snow.style.width;
    snow.style.opacity = Math.random() * 0.8 + 0.2;
    
    // Different speeds and paths for snowflakes
    const duration = 3 + Math.random() * 5;
    snow.style.animationDuration = `${duration}s`;
    snow.style.animationDelay = `${Math.random() * 5}s`;
    
    effectsContainer.appendChild(snow);
  }
}

function createFog() {
  const effectsContainer = document.getElementById("weatherEffects");
  const mobileMultiplier = isMobile() ? 0.5 : 1; // Giảm 50% số lượng trên mobile
  for (let i = 0; i < 20 * mobileMultiplier; i++) {
    const fog = document.createElement('div');
    fog.className = 'fog';
    
    const size = Math.random() * 200 + 100;
    fog.style.width = `${size}px`;
    fog.style.height = `${size * 0.3}px`;
    fog.style.left = `${Math.random() * 100}vw`;
    fog.style.top = `${Math.random() * 100}vh`;
    fog.style.opacity = Math.random() * 0.2 + 0.1;
    fog.style.animationDuration = `${Math.random() * 60 + 30}s`;
    
    effectsContainer.appendChild(fog);
  }
}

function createThunder() {
  const thunder = document.createElement('div');
  thunder.className = 'thunder';
  document.getElementById("weatherEffects").appendChild(thunder);
}

// Helper functions
function mapWeatherCode(code) {
  const weatherCodes = {
    0: "Trời quang đãng",
    1: "Trời hầu như quang đãng",
    2: "Ít mây",
    3: "Nhiều mây (u ám)",
    45: "Sương mù nhẹ",
    48: "Sương mù đóng băng",
    51: "Mưa phùn nhẹ",
    53: "Mưa phùn vừa",
    55: "Mưa phùn dày đặc",
    56: "Mưa phùn đóng băng nhẹ",
    57: "Mưa phùn đóng băng dày đặc",
    61: "Mưa nhẹ",
    63: "Mưa vừa",
    65: "Mưa to",
    66: "Mưa đóng băng nhẹ",
    67: "Mưa đóng băng nặng",
    71: "Tuyết nhẹ",
    73: "Tuyết vừa",
    75: "Tuyết dày",
    77: "Bông tuyết nhỏ",
    80: "Mưa rào nhẹ",
    81: "Mưa rào vừa",
    82: "Mưa rào rất to",
    85: "Tuyết rào nhẹ",
    86: "Tuyết rào dày",
    95: "Dông (có sấm sét)",
    96: "Dông có mưa đá nhẹ",
    99: "Dông có mưa đá nặng"
  };
  return weatherCodes[code] || "Không xác định";
}


function getWeatherIcon(code) {
  const isDay = new Date().getHours() > 6 && new Date().getHours() < 18;
  
  const iconMap = {
    0: isDay ? "fas fa-sun" : "fas fa-moon",
    1: isDay ? "fas fa-cloud-sun" : "fas fa-cloud-moon",
    2: "fas fa-cloud",
    3: "fas fa-cloud",
    45: "fas fa-smog",
    48: "fas fa-smog",
    51: "fas fa-cloud-rain",
    53: "fas fa-cloud-rain",
    55: "fas fa-cloud-rain",
    56: "fas fa-temperature-low",
    57: "fas fa-temperature-low",
    61: "fas fa-cloud-showers-heavy",
    63: "fas fa-cloud-showers-heavy",
    65: "fas fa-cloud-showers-heavy",
    66: "fas fa-icicles",
    67: "fas fa-icicles",
    71: "fas fa-snowflake",
    73: "fas fa-snowflake",
    75: "fas fa-snowflake",
    77: "fas fa-snowflake",
    80: "fas fa-cloud-rain",
    81: "fas fa-cloud-showers-heavy",
    82: "fas fa-poo-storm",
    85: "fas fa-snowflake",
    86: "fas fa-snowflake",
    95: "fas fa-bolt",
    96: "fas fa-poo-storm",
    99: "fas fa-poo-storm"
  };
  
  return iconMap[code] || "fas fa-question";
}

function formatTime(isoString) {
  if (!isoString) return "N/A";
  try {
    const time = isoString.split("T")[1].split(":");
    return `${time[0]}:${time[1]}`;
  } catch (e) {
    return "N/A";
  }
}

function formatDate(isoString) {
  try {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(isoString).toLocaleDateString(undefined, options);
  } catch (e) {
    return new Date().toLocaleDateString();
  }
}

// Add twinkle animation for stars
const style = document.createElement('style');
style.textContent = `
  @keyframes twinkle {
    0%, 100% { opacity: 0.2; }
    50% { opacity: 1; }
  }
  `;
document.head.appendChild(style);
// ===== PHÁT HIỆN MOBILE VÀ ĐIỀU CHỈNH HIỆU ỨNG =====
function isMobile() {
  return /Android|iPhone|iPad/i.test(navigator.userAgent) || window.innerWidth < 768;
}
