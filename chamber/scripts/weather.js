// scripts/weather.js (improved)
// 1) Attempts One Call (current + daily).
// 2) If One Call fails due to permission or other server error, falls back to /weather + /forecast.
// 3) Logs detailed errors to console and shows a helpful message in the UI.
// Expects <body data-owm-key="...">

(() => {
  'use strict';
  const body = document.body;
  const apiKey = body && body.dataset && body.dataset.owmKey;
  const LAT = 33.4484;
  const LON = -112.0740;

  const currentEl = document.getElementById('weather-current');
  const forecastEl = document.getElementById('weather-forecast');

  if (!apiKey) {
    console.warn('OpenWeather API key missing from <body data-owm-key="">');
    showError('Weather unavailable — API key not configured.');
    return;
  }
  if (!currentEl || !forecastEl) {
    console.warn('Weather DOM elements missing (#weather-current, #weather-forecast).');
    return;
  }

  // Try OneCall first
  (async function init() {
    try {
      await fetchOneCall();
    } catch (err) {
      console.warn('OneCall failed, attempting fallback endpoints:', err);
      try {
        await fetchFallback();
      } catch (err2) {
        console.error('All weather fetch attempts failed:', err2);
        showError('Weather unavailable.');
      }
    }
  })();

  // --- One Call (preferred) ---
  async function fetchOneCall() {
    const url = new URL('https://api.openweathermap.org/data/2.5/onecall');
    url.search = new URLSearchParams({
      lat: LAT,
      lon: LON,
      exclude: 'minutely,hourly,alerts',
      units: 'imperial',
      appid: apiKey
    }).toString();

    const resp = await fetch(url.toString());
    if (!resp.ok) {
      // read body if possible for better debugging
      let text = '';
      try { text = await resp.text(); } catch (e) { /* ignore */ }
      const message = `OneCall error ${resp.status} ${resp.statusText}${text ? ' — ' + text : ''}`;
      console.error(message);
      // 401/403 often means invalid key or insufficient plan/permissions
      if (resp.status === 401 || resp.status === 403) {
        showError('Weather unavailable — API key unauthorized (check key & permissions).');
      } else {
        showError('Weather unavailable.');
      }
      throw new Error(message);
    }

    const data = await resp.json();
    // Basic validation
    if (!data || !data.current || !Array.isArray(data.daily)) {
      console.error('OneCall returned unexpected payload', data);
      throw new Error('Unexpected OneCall payload');
    }

    renderCurrentFromOneCall(data);
    renderForecastFromOneCall(data);
  }

  function renderCurrentFromOneCall(data) {
    const c = data.current;
    const temp = Math.round(Number(c.temp));
    const weather = c.weather && c.weather[0] || {};
    const desc = capitalize(weather.description || 'Unknown');
    const icon = weather.icon ? `https://openweathermap.org/img/wn/${weather.icon}@2x.png` : '';

    currentEl.innerHTML = `
      <div style="display:flex;gap:.6rem;align-items:center">
        ${icon ? `<img src="${icon}" alt="${escape(desc)}" width="64" height="64">` : ''}
        <div>
          <p class="temp" style="font-size:1.6rem;margin:.1rem 0">${escape(temp)}°F</p>
          <p class="condition" style="margin:0">${escape(desc)}</p>
          <p class="muted small" style="margin-top:.25rem">Updated: ${escape(formatLocalTime(c.dt, data.timezone_offset))}</p>
        </div>
      </div>
    `;
  }

  function renderForecastFromOneCall(data) {
    const days = data.daily.slice(1, 4); // next 3 days
    if (!days.length) {
      forecastEl.innerHTML = `<p class="muted small">Forecast unavailable.</p>`;
      return;
    }

    forecastEl.innerHTML = `<ul class="forecast-list" style="list-style:none;padding:0;margin:0">
      ${days.map(d => {
        const label = formatLocalTime(d.dt, data.timezone_offset, { weekdayShort: true, monthDay: true });
        const desc = d.weather && d.weather[0] && capitalize(d.weather[0].description) || '';
        const icon = d.weather && d.weather[0] && `https://openweathermap.org/img/wn/${d.weather[0].icon}.png` || '';
        const max = Math.round(Number(d.temp.max));
        const min = Math.round(Number(d.temp.min));
        return `<li style="display:flex;align-items:center;gap:.6rem;padding:.5rem 0;border-bottom:1px solid rgba(0,0,0,0.03)">
          <div style="min-width:90px"><strong>${escape(label)}</strong></div>
          ${icon ? `<img src="${icon}" alt="${escape(desc)}" width="36" height="36">` : ''}
          <div style="flex:1"><div class="muted small">${escape(desc)}</div></div>
          <div style="min-width:85px;text-align:right"><strong>${escape(max)}°</strong> / ${escape(min)}°</div>
        </li>`;
      }).join('')}
    </ul>`;
  }

  // --- Fallback: /weather + /forecast (5 day / 3 hour) ---
  async function fetchFallback() {
    // 1) current
    const curUrl = new URL('https://api.openweathermap.org/data/2.5/weather');
    curUrl.search = new URLSearchParams({ lat: LAT, lon: LON, units: 'imperial', appid: apiKey }).toString();

    const curResp = await fetch(curUrl.toString());
    if (!curResp.ok) {
      let txt = '';
      try { txt = await curResp.text(); } catch (e) {}
      const msg = `Current weather error ${curResp.status} ${curResp.statusText} ${txt}`;
      console.error(msg);
      if (curResp.status === 401 || curResp.status === 403) {
        showError('Weather unavailable — API key unauthorized (check key & permissions).');
      } else {
        showError('Weather unavailable.');
      }
      throw new Error(msg);
    }
    const curData = await curResp.json();
    renderCurrentFromFallback(curData);

    // 2) forecast (3-hour increments). We'll aggregate to get next 3 calendar days.
    const fUrl = new URL('https://api.openweathermap.org/data/2.5/forecast');
    fUrl.search = new URLSearchParams({ lat: LAT, lon: LON, units: 'imperial', appid: apiKey }).toString();
    const fResp = await fetch(fUrl.toString());
    if (!fResp.ok) {
      let txt = '';
      try { txt = await fResp.text(); } catch (e) {}
      console.error('Forecast error', fResp.status, fResp.statusText, txt);
      throw new Error('Forecast fetch failed');
    }
    const fData = await fResp.json();
    renderForecastFrom3Hour(fData);
  }

  function renderCurrentFromFallback(curData) {
    const temp = Math.round(Number(curData.main && curData.main.temp));
    const weather = curData.weather && curData.weather[0] || {};
    const desc = capitalize(weather.description || '');
    const icon = weather.icon ? `https://openweathermap.org/img/wn/${weather.icon}@2x.png` : '';
    const updated = formatLocalTime(Math.floor(Date.now() / 1000), 0, { timeOnly: true });

    currentEl.innerHTML = `
      <div style="display:flex;gap:.6rem;align-items:center">
        ${icon ? `<img src="${icon}" alt="${escape(desc)}" width="64" height="64">` : ''}
        <div>
          <p class="temp" style="font-size:1.6rem;margin:.1rem 0">${escape(temp)}°F</p>
          <p class="condition" style="margin:0">${escape(desc)}</p>
          <p class="muted small" style="margin-top:.25rem">Updated: ${escape(updated)}</p>
        </div>
      </div>
    `;
  }

  function renderForecastFrom3Hour(fData) {
    if (!fData || !Array.isArray(fData.list)) {
      forecastEl.innerHTML = `<p class="muted small">Forecast unavailable.</p>`;
      return;
    }

    // Build day-buckets (local date) for next 3 calendar days (exclude today)
    const buckets = {}; // key = 'YYYY-MM-DD'
    const tzOffset = 0; // forecast times are in UTC but include dt; we'll convert based on local timezone below
    fData.list.forEach(item => {
      const dt = new Date(item.dt * 1000);
      // build local date string (site user's locale). For consistency, get the date in the site's timezone (we'll use UTC date derived)
      const isoDay = dt.toISOString().slice(0,10);
      if (!buckets[isoDay]) buckets[isoDay] = [];
      buckets[isoDay].push(item);
    });

    // Determine today's ISO day in UTC to exclude it
    const todayISO = (new Date()).toISOString().slice(0,10);
    const dayKeys = Object.keys(buckets).filter(k => k !== todayISO).sort().slice(0,3);

    if (!dayKeys.length) {
      forecastEl.innerHTML = `<p class="muted small">No forecast data available.</p>`;
      return;
    }

    const lis = dayKeys.map(iso => {
      const list = buckets[iso];
      // compute min/max temps and a representative weather (most frequent at midday)
      let min = Infinity, max = -Infinity;
      const freq = {};
      list.forEach(it => {
        if (it.main && typeof it.main.temp_min === 'number') min = Math.min(min, it.main.temp_min);
        if (it.main && typeof it.main.temp_max === 'number') max = Math.max(max, it.main.temp_max);
        const w = (it.weather && it.weather[0] && it.weather[0].description) || '';
        if (w) freq[w] = (freq[w] || 0) + 1;
      });
      if (min === Infinity) min = null;
      if (max === -Infinity) max = null;
      // pick most frequent description
      const repDesc = Object.keys(freq).sort((a,b) => freq[b]-freq[a])[0] || '';
      // label date nicely
      const dtLabel = new Date(iso + 'T00:00:00Z');
      const label = dtLabel.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
      return { label, max: max ? Math.round(max) : '--', min: min ? Math.round(min) : '--', desc: repDesc };
    });

    forecastEl.innerHTML = `<ul class="forecast-list" style="list-style:none;padding:0;margin:0">
      ${lis.map(l => `<li style="display:flex;align-items:center;gap:.6rem;padding:.5rem 0;border-bottom:1px solid rgba(0,0,0,0.03)">
        <div style="min-width:90px"><strong>${escape(l.label)}</strong></div>
        <div style="flex:1"><div class="muted small">${escape(l.desc)}</div></div>
        <div style="min-width:85px;text-align:right"><strong>${escape(l.max)}°</strong> / ${escape(l.min)}°</div>
      </li>`).join('')}
    </ul>`;
  }

  // --- Utilities ---
  function showError(msg) {
    currentEl.innerHTML = `<p class="muted small">${escape(msg)}</p>`;
    forecastEl.innerHTML = `<p class="muted small">${escape(msg)}</p>`;
  }

  function formatLocalTime(unixSec, tzOffset = 0, opts = {}) {
    // If timezone offset provided (seconds), apply it, else use local machine timezone.
    const ms = Number(unixSec) * 1000 + (Number(tzOffset) || 0) * 1000;
    const dt = new Date(ms);
    if (opts.timeOnly) {
      return dt.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
    }
    if (opts.weekdayShort && opts.monthDay) {
      return dt.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
    }
    return dt.toLocaleString();
  }

  function capitalize(s='') {
    return String(s).replace(/\b\w/g, c => c.toUpperCase());
  }
  function escape(s='') {
    return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);
  }

})();

