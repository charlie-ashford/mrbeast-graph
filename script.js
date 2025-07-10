let allMrbeastData = [];
let filteredMrbeastData = [];
let isCustomTimeframe = false;
let customStartDate = null;
let customEndDate = null;
let lastScrollTop = 0;

const buttonContainer = document.querySelector('.button-container');
const timeframeContainer = document.querySelector('.timeframe-container');

window.addEventListener('scroll', () => {
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
  if (scrollTop === 0) {
    buttonContainer.classList.remove('hidden');
    timeframeContainer.classList.remove('hidden');
  } else if (scrollTop > lastScrollTop) {
    buttonContainer.classList.add('hidden');
    timeframeContainer.classList.add('hidden');
  }
  lastScrollTop = scrollTop;
});

function formatNumber(num, decimalPlaces = 0) {
  return num.toLocaleString(undefined, {
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces,
  });
}

function formatDateTime(dateString, includeSeconds = true) {
  const date = new Date(dateString);
  if (includeSeconds) {
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  } else {
    return (
      date.toLocaleDateString() +
      ' ' +
      date.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })
    );
  }
}

function formatTime(ms) {
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));
  const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((ms % (1000 * 60)) / 1000);
  return `${days}d, ${hours}h, ${minutes}m, ${seconds}s`;
}

function formatDateTimeLocal(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function formatDateTimeLocalUTC(date) {
  const year = date.getUTCFullYear();
  const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
  const day = date.getUTCDate().toString().padStart(2, '0');
  const hours = date.getUTCHours().toString().padStart(2, '0');
  const minutes = date.getUTCMinutes().toString().padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function initializeTimeframeControls() {
  const timeframeButton = document.getElementById('timeframeButton');
  const timeframeControls = document.getElementById('timeframeControls');
  const startDateTimeInput = document.getElementById('startDateTime');
  const endDateTimeInput = document.getElementById('endDateTime');
  const applyButton = document.getElementById('applyTimeframe');
  const resetButton = document.getElementById('resetTimeframe');
  const pastDayButton = document.getElementById('pastDayPreset');

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  endDateTimeInput.value = formatDateTimeLocalUTC(now);
  startDateTimeInput.value = formatDateTimeLocalUTC(sevenDaysAgo);

  timeframeButton.addEventListener('click', () => {
    timeframeControls.classList.toggle('show');
    timeframeButton.classList.toggle(
      'active',
      timeframeControls.classList.contains('show')
    );
  });

  document.addEventListener('pointerdown', e => {
    if (
      !e.target.closest(
        '#timeframeButton, #timeframeControls, #startDateTime, #endDateTime'
      )
    ) {
      timeframeControls.classList.remove('show');
      timeframeButton.classList.remove('active');
    }
  });

  applyButton.addEventListener('click', async () => {
    const startValue = startDateTimeInput.value;
    const endValue = endDateTimeInput.value;
    if (!startValue || !endValue) {
      alert('Please select both start and end dates');
      return;
    }
    const startDate = new Date(startValue + 'Z');
    const endDate = new Date(endValue + 'Z');
    if (startDate >= endDate) {
      alert('Start date must be before end date');
      return;
    }
    if (endDate > new Date()) {
      alert('End date cannot be in the future');
      return;
    }
    applyButton.disabled = true;
    applyButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
    try {
      await fetchCustomTimeframeData(startDate, endDate);
      timeframeButton.innerHTML =
        '<i class="fas fa-calendar-alt"></i> Change Timeframe';
      timeframeButton.style.backgroundColor = '#00bce7';
    } catch (error) {
      console.error('Error fetching custom timeframe data:', error);
      alert('Error loading data for the selected timeframe. Please try again.');
    } finally {
      applyButton.disabled = false;
      applyButton.innerHTML = '<i class="fas fa-check"></i> Apply';
    }
  });

  resetButton.addEventListener('click', async () => {
    resetButton.disabled = true;
    resetButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
    try {
      isCustomTimeframe = false;
      customStartDate = null;
      customEndDate = null;
      await fetchDataAndDrawChart();
      timeframeButton.innerHTML =
        '<i class="fas fa-calendar-alt"></i> Change Timeframe';
      timeframeButton.style.backgroundColor = '#00bce7';
    } catch (error) {
      console.error('Error resetting to live data:', error);
      alert('Error loading live data. Please try again.');
    } finally {
      resetButton.disabled = false;
      resetButton.innerHTML = '<i class="fas fa-undo"></i> Reset to Live';
    }
  });

  pastDayButton.addEventListener('click', async () => {
    pastDayButton.disabled = true;
    pastDayButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading…';
    try {
      isCustomTimeframe = true;
      timeframeButton.innerHTML =
        '<i class="fas fa-calendar-alt"></i> Change Timeframe';
      timeframeButton.style.backgroundColor = '#00bce7';

      const data = await fetchData(
        'https://api.communitrics.com/mrbeast?minutelyPastDay=true'
      );

      const pastDayChartData = data.map(e => [
        new Date(e.currentTime).getTime(),
        Number(e.count),
      ]);
      filteredMrbeastData = pastDayChartData;

      drawChart(filteredMrbeastData);
      const chart = Highcharts.charts[Highcharts.charts.length - 1];
      if (chart) {
        chart.setSubtitle({
          text: `Past Day`,
          style: {
            color: '#999999',
            fontSize: '12px',
          },
        });
      }
    } catch (err) {
      console.error('Failed to load Past Day data:', err);
      alert('Could not load Past Day data. Please try again.');
    } finally {
      pastDayButton.disabled = false;
      pastDayButton.innerHTML = '<i class="fas fa-history"></i> Past Day';
    }
  });
}

async function fetchCustomTimeframeData(startDate, endDate) {
  try {
    const startISO = startDate.toISOString();
    const endISO = endDate.toISOString();
    const url =
      `https://api.communitrics.com/mrbeast?tenminutely=true` +
      `&start=${startISO}&end=${endISO}`;
    const data = await fetchData(url);
    if (!data.length) {
      alert('No data available for the selected timeframe');
      return;
    }
    isCustomTimeframe = true;
    customStartDate = startDate;
    customEndDate = endDate;
    filteredMrbeastData = data.map(entry => [
      new Date(entry.currentTime).getTime(),
      Number(entry.count),
    ]);
    drawChart(filteredMrbeastData);
    const chart = Highcharts.charts[Highcharts.charts.length - 1];
    if (chart) {
      chart.setTitle({ text: 'MrBeast Subscriber Count' });
      chart.setSubtitle({
        text: `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`,
        style: { color: '#999999', fontSize: '12px' },
      });
    }
  } catch (error) {
    console.error('Failed to fetch custom timeframe data:', error);
    throw error;
  }
}

function calculateGainedToday(data) {
  const now = new Date();
  const easternTime = new Date(
    now.toLocaleString('en-US', { timeZone: 'America/New_York' })
  );

  const startOfDayEastern = new Date(easternTime);
  startOfDayEastern.setHours(0, 0, 0, 0);

  let startOfDayCount = null;
  let closestTimeDiff = Infinity;

  for (const entry of data) {
    const entryTime = new Date(entry.currentTime);
    const entryTimeEastern = new Date(
      entryTime.toLocaleString('en-US', { timeZone: 'America/New_York' })
    );
    const timeDiff = Math.abs(entryTimeEastern - startOfDayEastern);

    if (timeDiff < closestTimeDiff && entryTimeEastern <= startOfDayEastern) {
      closestTimeDiff = timeDiff;
      startOfDayCount = entry.count;
    }
  }

  if (startOfDayCount === null && data.length > 0) {
    startOfDayCount = data[0].count;
  }

  const latestCount = data.length > 0 ? data[data.length - 1].count : 0;
  return latestCount - startOfDayCount;
}

async function updateInfoSection(filteredData) {
  const firstEntry = {
    currentTime: moment.tz('2025-01-01 00:00:00.000', 'America/New_York'),
    count: 340665376,
  };
  const lastEntry = filteredData[filteredData.length - 1];
  const totalGained = lastEntry.count - firstEntry.count;
  const totalTime =
    new Date(lastEntry.currentTime).getTime() -
    new Date(firstEntry.currentTime).getTime();

  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

  const recentData24Hours = filteredData.filter(
    entry => new Date(entry.currentTime) >= oneDayAgo
  );
  const recentData7Days = filteredData.filter(
    entry => new Date(entry.currentTime) >= sevenDaysAgo
  );
  const recentData30Days = filteredData.filter(
    entry => new Date(entry.currentTime) >= thirtyDaysAgo
  );
  const recentData365Days = filteredData.filter(
    entry => new Date(entry.currentTime) >= oneYearAgo
  );

  const recentGained24Hours =
    recentData24Hours.length > 1
      ? recentData24Hours[recentData24Hours.length - 1].count -
        recentData24Hours[0].count
      : 0;

  const recentGained7Days =
    recentData7Days.length > 1
      ? recentData7Days[recentData7Days.length - 1].count -
        recentData7Days[0].count
      : 0;

  const recentGained365Days =
    recentData365Days.length > 1
      ? recentData365Days[recentData365Days.length - 1].count -
        recentData365Days[0].count
      : 0;

  const recentGained30Days =
    recentData30Days.length > 1
      ? recentData30Days[recentData30Days.length - 1].count -
        recentData30Days[0].count
      : 0;

  const subs24HoursAgo =
    recentData24Hours.length > 0
      ? recentData24Hours[0].count
      : lastEntry.count - recentGained24Hours;

  const subs7DaysAgo =
    recentData7Days.length > 0
      ? recentData7Days[0].count
      : lastEntry.count - recentGained7Days;

  const subs30DaysAgo =
    recentData30Days.length > 0
      ? recentData30Days[0].count
      : lastEntry.count - recentGained30Days;

  const subs365DaysAgo =
    recentData365Days.length > 0
      ? recentData365Days[0].count
      : lastEntry.count - recentGained365Days;

  const infoDiv = document.getElementById('info');
  infoDiv.innerHTML = `
  <div class="info-tile">
    <div class="info-tile-header">Subscriber Count</div>
    <div class="info-tile-value">${formatNumber(lastEntry.count)}</div>
    <div class="info-tile-change">
      <strong>Latest update:</strong> ${formatDateTime(lastEntry.currentTime)}
    </div>
    <div class="info-tile-change" style="margin-top: 8px;">
      <strong>Gained today:</strong> ${formatNumber(
        calculateGainedToday(filteredData)
      )} subscribers
    </div>
  </div>
  <div class="info-tile">
    <div class="info-tile-header">2025 Growth</div>
    <div class="info-tile-value">${formatNumber(totalGained)}</div>
    <div class="info-tile-change">
      <strong>Time elapsed:</strong> ${formatTime(totalTime)}
    </div>
    <div class="info-tile-change" style="margin-top: 8px;">
      <strong>Starting count:</strong> ${formatNumber(firstEntry.count)}
    </div>
  </div>
  <div class="info-tile">
    <div class="info-tile-header">24 Hour Growth</div>
    <div class="info-tile-value">${formatNumber(recentGained24Hours)}</div>
    <div class="info-tile-change">
      <strong>Subscribers 24h ago:</strong> ${formatNumber(subs24HoursAgo)}
    </div>
    <div class="info-tile-change" style="margin-top: 8px;">
      <strong>Average hourly gain:</strong> ${formatNumber(
        recentGained24Hours / 24,
        0
      )}
    </div>
  </div>
  <div class="info-tile">
    <div class="info-tile-header">7 Day Growth</div>
    <div class="info-tile-value">${formatNumber(recentGained7Days)}</div>
    <div class="info-tile-change">
      <strong>Subscribers 7d ago:</strong> ${formatNumber(subs7DaysAgo)}
    </div>
    <div class="info-tile-change" style="margin-top: 8px;">
      <strong>Average daily gain:</strong> ${formatNumber(
        recentGained7Days / 7,
        0
      )}
    </div>
  </div>
  <div class="info-tile">
    <div class="info-tile-header">30 Day Growth</div>
    <div class="info-tile-value">${formatNumber(recentGained30Days)}</div>
    <div class="info-tile-change">
      <strong>Subscribers 30d ago:</strong> ${formatNumber(subs30DaysAgo)}
    </div>
    <div class="info-tile-change" style="margin-top: 8px;">
      <strong>Average daily gain:</strong> ${formatNumber(
        recentGained30Days / 30,
        0
      )}
    </div>
  </div>
  <div class="info-tile">
    <div class="info-tile-header">365 Day Growth</div>
    <div class="info-tile-value">${formatNumber(recentGained365Days)}</div>
    <div class="info-tile-change">
      <strong>Subscribers 365d ago:</strong> ${formatNumber(subs365DaysAgo)}
    </div>
    <div class="info-tile-change" style="margin-top: 8px;">
      <strong>Average daily gain:</strong> ${formatNumber(
        recentGained365Days / 365,
        0
      )}
    </div>
  </div>
`;
}

async function fetchData(url, signal) {
  try {
    let response = await fetch(url, { signal });
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    return await response.json();
  } catch (error) {
    if (error.name === 'AbortError') {
      throw error;
    }
    console.error('Failed to fetch data:', error);
    throw error;
  }
}

function drawChart(mrbeastData) {
  mrbeastData = mrbeastData.map(point => [
    moment.tz(point[0], 'America/New_York').valueOf(),
    point[1],
  ]);

  Highcharts.setOptions({
    time: {
      timezone: 'America/New_York',
    },
  });

  Highcharts.chart('container', {
    chart: {
      type: 'area',
      zoomType: 'x',
      panning: true,
      panKey: 'shift',
      animation: {
        duration: 800,
        easing: 'easeOutBounce',
      },
      backgroundColor: {
        linearGradient: { x1: 0, y1: 0, x2: 1, y2: 1 },
        stops: [
          [0, '#1e1e1e'],
          [1, '#1e1e1e'],
        ],
      },
      borderRadius: 10,
      style: {
        fontFamily: 'Poppins, sans-serif',
        color: '#1e1e1e',
      },
      resetZoomButton: {
        theme: {
          fill: '#1e1e1e',
          stroke: '#00bce7',
          r: 5,
          style: {
            fontFamily: 'Poppins, sans-serif',
            color: '#00bce7',
            fontSize: '12px',
            fontWeight: 'bold',
          },
          states: {
            hover: {
              fill: '#00bce7',
              style: { color: '#1e1e1e' },
            },
          },
        },
        position: { align: 'right', verticalAlign: 'top', x: -10, y: 10 },
        relativeTo: 'chart',
      },
      events: {
        dblclick() {
          this.zoomOut();
        },
        render() {
          const chart = this;
          const title = chart.xAxis[0].axisTitle;
          const centreX = chart.chartWidth / 2 - chart.plotLeft;
          title.attr({ x: centreX + 105 });
        },
      },
    },

    title: {
      text: 'MrBeast Subscriber Count',
      style: {
        fontFamily: 'Poppins, sans-serif',
        color: '#e0e0e0',
        fontSize: '20px',
        fontWeight: '600',
      },
    },

    subtitle: {
      text: '',
      style: {
        fontFamily: 'Poppins, sans-serif',
        color: '#999999',
        fontSize: '12px',
        fontWeight: 'normal',
      },
    },

    xAxis: {
      type: 'datetime',
      title: {
        text: 'Time (US Eastern)',
        align: 'middle',
        x: 0,
        margin: 15,
        style: {
          fontFamily: 'Poppins, sans-serif',
          color: '#e0e0e0',
          fontWeight: 'bold',
        },
      },
      labels: {
        style: {
          fontFamily: 'Poppins, sans-serif',
          color: '#e0e0e0',
          fontSize: '12px',
        },
        format: '{value:%H:%M:%S}',
      },
      dateTimeLabelFormats: {
        second: '%H:%M:%S',
        minute: '%H:%M',
        hour: '%H:%M',
        day: '%e. %b',
        week: '%e. %b',
        month: "%b '%y",
        year: '%Y',
      },
      tickPixelInterval: 150,
      lineColor: '#444444',
      tickColor: '#444444',
    },
    yAxis: {
      title: {
        text: 'Subscribers',
        style: {
          fontFamily: 'Poppins, sans-serif',
          color: '#e0e0e0',
          fontWeight: 'bold',
        },
      },
      labels: {
        style: {
          fontFamily: 'Poppins, sans-serif',
          color: '#e0e0e0',
          fontSize: '12px',
        },
      },
      gridLineColor: '#444444',
      tickColor: '#444444',
    },
    legend: {
      enabled: false,
    },
    plotOptions: {
      series: {
        lineWidth: 3,
        threshold: null,
        connectNulls: true,
        area: {
          fillOpacity: 0.15,
          fillColor: {
            linearGradient: {
              x1: 0,
              x2: 0,
              y1: 0,
              y2: 1,
            },
            stops: [
              [0, 'rgba(0, 188, 231, 0.7)'],
              [1, 'rgba(0, 188, 231, 0.3)'],
            ],
          },
        },
      },
    },
    tooltip: {
      followPointer: false,
      animation: false,
      shared: true,
      crosshairs: false,
      backgroundColor: 'rgba(0, 0, 0, 0.9)',
      borderColor: '#00bce7',
      borderRadius: 8,
      style: {
        fontFamily: 'Poppins, sans-serif',
        color: '#e0e0e0',
        fontSize: '14px',
      },
      formatter: function () {
        return `<span style="font-size: 12px;">${Highcharts.dateFormat(
          '%A, %b %e, %Y, %H:%M:%S',
          this.x
        )}</span><br/><b style="font-size: 14px;">Subscribers: ${this.points[0].y.toLocaleString()}</b>`;
      },
    },
    series: [
      {
        name: 'MrBeast',
        data: mrbeastData,
        boostThreshold: 50000,
        color: '#00bce7',
        fillColor: {
          linearGradient: {
            x1: 0,
            x2: 0,
            y1: 0,
            y2: 1,
          },
          stops: [
            [0, 'rgba(0, 188, 231, 0.7)'],
            [1, 'rgba(0, 188, 231, 0.3)'],
          ],
        },
      },
    ],
    credits: {
      enabled: false,
    },
  });
}

async function fetchDataAndDrawChart() {
  try {
    let url = 'https://api.communitrics.com/mrbeast';

    if (isCustomTimeframe && customStartDate && customEndDate) {
      const startISO = customStartDate.toISOString();
      const endISO = customEndDate.toISOString();
      url = `https://api.communitrics.com/mrbeast?tenminutely=true&start=${startISO}&end=${endISO}`;
    }

    let response = await fetch(url);
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    const data = await response.json();

    allMrbeastData = data.map(entry => [
      new Date(entry.currentTime).getTime(),
      Number(entry.count),
    ]);

    if (!isCustomTimeframe) {
      filteredMrbeastData =
        allMrbeastData.length > 3000
          ? allMrbeastData.slice(-3000)
          : allMrbeastData;
    } else {
      filteredMrbeastData = allMrbeastData;
    }

    if (!isCustomTimeframe) {
      updateInfoSection(data);
    }

    drawChart(filteredMrbeastData);

    const chart = Highcharts.charts[Highcharts.charts.length - 1];
    if (chart) {
      chart.setTitle({ text: 'MrBeast Subscriber Count' });

      if (isCustomTimeframe) {
        chart.setSubtitle({
          text: `${customStartDate.toLocaleDateString()} - ${customEndDate.toLocaleDateString()}`,
          style: {
            color: '#999999',
            fontSize: '12px',
          },
        });
      } else {
        chart.setSubtitle({ text: '' });
      }
    }

    const today = new Date().toISOString().split('T')[0];
    const initialFilteredData = filterDataByDate(today);
    fillHourlyTable(initialFilteredData, today);
    fillDailyTable(data);
  } catch (error) {
    console.error('Failed to fetch data:', error);
  } finally {
    document.getElementById('loader').style.display = 'none';
    document.getElementById('mainContent').style.display = 'block';
  }
}

function isEDT(date) {
  const easternDate = new Date(
    date.toLocaleString('en-US', { timeZone: 'America/New_York' })
  );

  const year = easternDate.getFullYear();

  let dstStart = new Date(year, 2, 14, 2, 0, 0);
  dstStart.setDate(14 - dstStart.getDay());

  let dstEnd = new Date(year, 10, 7, 2, 0, 0);
  dstEnd.setDate(7 - dstEnd.getDay());

  return easternDate >= dstStart && easternDate < dstEnd;
}

function findClosestEntry(data, targetDate) {
  return data.reduce((prev, curr) => {
    const prevDiff = Math.abs(
      new Date(prev.currentTime).getTime() - targetDate.getTime()
    );
    const currDiff = Math.abs(
      new Date(curr.currentTime).getTime() - targetDate.getTime()
    );
    return currDiff < prevDiff ? curr : prev;
  }, data[0]);
}

function filterDataByDate(date) {
  return allMrbeastData
    .filter(entry => {
      const entryDate = new Date(entry[0]).toISOString().split('T')[0];
      return entryDate === date;
    })
    .map(entry => ({
      currentTime: new Date(entry[0]),
      count: entry[1],
    }));
}

function fillHourlyTable(data, selectedDate) {
  const tbody = document
    .getElementById('hourlyGainsTable')
    .getElementsByTagName('tbody')[0];
  tbody.innerHTML = '';

  if (!data.length) {
    console.error('No data available to process.');
    return;
  }

  const startUtc = moment.utc(selectedDate, 'YYYY-MM-DD').startOf('day');
  const prevUtc = startUtc.clone().subtract(1, 'day');
  const prevDayStr = prevUtc.format('YYYY-MM-DD');

  const yesterday = allMrbeastData
    .map(([ts, ct]) => ({ currentTime: new Date(ts), count: ct }))
    .filter(e => moment.utc(e.currentTime).format('YYYY-MM-DD') === prevDayStr);

  let lastHourCount = null;
  let previousGain = null;
  if (yesterday.length) {
    const at23 = findClosestEntry(yesterday, prevUtc.clone().hour(23).toDate());
    if (at23) {
      lastHourCount = at23.count;
      const at22 = findClosestEntry(
        yesterday,
        prevUtc.clone().hour(22).toDate()
      );
      if (at22) previousGain = at23.count - at22.count;
    }
  }

  const nowUtc = moment.utc();
  const nextHourUtc = nowUtc.clone().add(1, 'hour');
  const todayUtcStr = nowUtc.format('YYYY-MM-DD');

  for (let h = 0; h < 24; h++) {
    const mUtc = startUtc.clone().add(h, 'hours');
    const closest = findClosestEntry(data, mUtc.toDate());

    const tr = document.createElement('tr');
    const timeCell = document.createElement('td');
    const subCell = document.createElement('td');
    const gainCell = document.createElement('td');

    const utcLabel = mUtc.utc().format('HH:mm') + ' UTC';
    const localLabel = mUtc.clone().local().format('HH:mm');
    const easternLabel = mUtc.tz('America/New_York').format('HH:mm z');

    timeCell.innerHTML = `${utcLabel} (${localLabel} local)<br>${easternLabel}`;

    if (closest) {
      const cur = closest.count;
      subCell.textContent = cur.toLocaleString();

      let gain = lastHourCount != null ? cur - lastHourCount : null;
      if (gain != null) {
        const gStr = gain.toLocaleString();
        let color = gain > 0 ? '#49e700' : '#e72b00';
        if (previousGain != null && gain < previousGain) {
          color = '#e72b00';
        }
        gainCell.innerHTML =
          gain === 0
            ? '<strong>-</strong>'
            : `<span style="color:${color};font-weight:bold">${gStr}</span>`;

        if (previousGain != null && gain !== previousGain && gain !== 0) {
          const delta = gain - previousGain;
          gainCell.innerHTML +=
            `<br><span style="font-size:smaller">(${delta > 0 ? '+' : ''}` +
            `${delta.toLocaleString()})</span>`;
        }
        previousGain = gain;
      } else {
        gainCell.textContent = '-';
      }

      if (
        mUtc.format('YYYY-MM-DD') === todayUtcStr &&
        mUtc.isSame(nextHourUtc, 'hour')
      ) {
        const fmt = new Intl.DateTimeFormat('en-US', {
          hour: '2-digit',
          minute: '2-digit',
        });
        gainCell.innerHTML +=
          `<br><span style="font-size:calc(0.9em - 15%)">` +
          `As of ${fmt.format(new Date())} local time</span>`;
      }

      lastHourCount = cur;
    } else {
      subCell.textContent = '-';
      gainCell.textContent = '-';
    }

    tr.append(timeCell, subCell, gainCell);
    tbody.appendChild(tr);
  }
}

function fillDailyTable(data) {
  const tz = 'America/New_York';
  const tbody = document
    .getElementById('dailyGainsTable')
    .getElementsByTagName('tbody')[0];
  tbody.innerHTML = '';

  if (!data.length) return;

  const entries = data.map(e => ({
    currentTime:
      e.currentTime instanceof Date ? e.currentTime : new Date(e.currentTime),
    count: Number(e.count),
  }));

  const startEastern = moment(entries[0].currentTime).tz(tz).startOf('day');
  const endEastern = moment(entries[entries.length - 1].currentTime)
    .tz(tz)
    .endOf('day');

  let cursor = startEastern.clone();
  let previousGain = null;
  let mostRecent = null;

  while (cursor.isBefore(endEastern)) {
    const nextDay = cursor.clone().add(1, 'day');
    const utcStart = cursor.clone().utc().toDate();
    const utcEnd = nextDay.clone().utc().toDate();

    const startEnt = findClosestEntry(entries, utcStart);
    const endEnt = findClosestEntry(entries, utcEnd);

    let gain = null;
    if (startEnt && endEnt) gain = endEnt.count - startEnt.count;

    const tr = document.createElement('tr');
    const dateCell = document.createElement('td');
    const subCell = document.createElement('td');
    const gCell = document.createElement('td');

    const dayLabel = cursor.format('ddd, MMM D');
    const isoDate = cursor.format('YYYY-MM-DD');
    dateCell.innerHTML = `${dayLabel}<br>${isoDate}`;

    subCell.textContent = endEnt ? endEnt.count.toLocaleString() : '-';

    if (gain != null) {
      const gStr = gain.toLocaleString();
      let color = gain > 0 ? '#49e700' : '#e72b00';
      if (previousGain != null && gain < previousGain) {
        color = '#e72b00';
      }
      gCell.innerHTML =
        gain === 0
          ? '<strong>-</strong>'
          : `<span style="color:${color};font-weight:bold">${gStr}</span>`;

      if (previousGain != null && gain !== previousGain && gain !== 0) {
        const delta = gain - previousGain;
        gCell.innerHTML +=
          `<br><span style="font-size:smaller">(${delta > 0 ? '+' : ''}` +
          `${delta.toLocaleString()})</span>`;
      }

      previousGain = gain;
    } else {
      gCell.textContent = '-';
    }

    tr.append(dateCell, subCell, gCell);
    tbody.insertBefore(tr, tbody.firstChild);
    mostRecent = tr;

    cursor = nextDay;
  }

  if (mostRecent) {
    const c = mostRecent.getElementsByTagName('td')[2];
    const nowET = moment().tz(tz).format('HH:mm');
    c.innerHTML +=
      `<br><span style="font-size:calc(0.9em - 15%)">` +
      `As of ${nowET} US Eastern</span>`;
  }
}

function convertDataToCSV(data, type = 'minutely') {
  const csvRows = [];
  const headers = [
    'Time (UTC)',
    'Subscriber Count',
    type === 'minutely'
      ? 'Minutely Gains'
      : type === 'minutelyPastWeek'
      ? 'Minutely Gains'
      : type === 'minutelyPastDay'
      ? 'Minutely Gains'
      : type === 'tenminutely'
      ? '10 Minutely Gains'
      : type === 'hourly'
      ? 'Hourly Gains'
      : type === 'dailyEST'
      ? 'Daily Gains (EST)'
      : 'Daily Gains',
  ];
  csvRows.push(headers.join(','));

  let lastSelectedSubscribers = null;

  data.sort((a, b) => new Date(a.currentTime) - new Date(b.currentTime));

  if (type === 'dailyEST') {
    const dailyData = [];
    data.forEach(entry => {
      const timestamp = new Date(entry.currentTime);

      const isDST = isEDT(timestamp);
      const offset = isDST ? -4 : -5;
      const estDate = new Date(timestamp.getTime() + offset * 60 * 60 * 1000);

      if (estDate.getUTCHours() === 0) {
        dailyData.push(entry);
      }
    });

    let lastDate = null;
    dailyData.forEach(entry => {
      const timestamp = new Date(entry.currentTime);
      const subscribers = entry.count;

      const isDST = isEDT(timestamp);
      const offset = isDST ? -4 : -5;

      const estDate = new Date(timestamp.getTime() + offset * 60 * 60 * 1000);
      estDate.setUTCHours(0, 0, 0, 0);

      if (lastDate) {
        const nextDate = new Date(lastDate);
        nextDate.setDate(nextDate.getDate() + 1);
        while (nextDate < estDate) {
          csvRows.push([nextDate.toISOString(), '', ''].join(','));
          nextDate.setDate(nextDate.getDate() + 1);
        }
      }

      const gainsInPastPeriod =
        lastSelectedSubscribers !== null
          ? subscribers - lastSelectedSubscribers
          : '';

      csvRows.push(
        [timestamp.toISOString(), subscribers, gainsInPastPeriod].join(',')
      );

      lastSelectedSubscribers = subscribers;
      lastDate = estDate;
    });

    return csvRows.join('\n');
  }

  let lastSelectedTime = null;
  const interval =
    type === 'minutely'
      ? 60 * 1000
      : type === 'minutelyPastWeek'
      ? 60 * 1000
      : type === 'minutelyPastDay'
      ? 60 * 1000
      : type === 'tenminutely'
      ? 10 * 60 * 1000
      : type === 'hourly'
      ? 60 * 60 * 1000
      : 24 * 60 * 60 * 1000;

  data.forEach(entry => {
    const timestamp = new Date(entry.currentTime);
    const subscribers = entry.count;

    if (isNaN(timestamp.getTime())) {
      console.error(`Invalid date value: ${entry.currentTime}`);
      return;
    }

    if (lastSelectedTime === null) {
      lastSelectedTime = timestamp;
      lastSelectedSubscribers = subscribers;
      csvRows.push([timestamp.toISOString(), subscribers, ''].join(','));
      return;
    }

    while (timestamp.getTime() - lastSelectedTime.getTime() > interval) {
      lastSelectedTime = new Date(lastSelectedTime.getTime() + interval);
      csvRows.push([lastSelectedTime.toISOString(), '', ''].join(','));
    }

    const gainsInPastPeriod =
      lastSelectedSubscribers !== null
        ? subscribers - lastSelectedSubscribers
        : '';

    csvRows.push(
      [timestamp.toISOString(), subscribers, gainsInPastPeriod].join(',')
    );

    lastSelectedTime = timestamp;
    lastSelectedSubscribers = subscribers;
  });

  return csvRows.join('\n');
}

function downloadCSVFile(csvText, fileName) {
  const blob = new Blob([csvText], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } else {
    window.open('data:text/csv;charset=utf-8,' + encodeURIComponent(csvText));
  }
}

document.addEventListener('DOMContentLoaded', async function () {
  const dropdownButton = document.getElementById('exportCsvButton');
  const dropdownContent = document.querySelector('.dropdown-content');
  const dropdownContainer = document.querySelector('.dropdown');

  dropdownButton.addEventListener('click', function () {
    dropdownContent.classList.toggle('show');
    dropdownButton.classList.toggle(
      'active',
      dropdownContent.classList.contains('show')
    );
  });

  window.addEventListener('click', function (e) {
    if (
      !dropdownButton.contains(e.target) &&
      !dropdownContent.contains(e.target)
    ) {
      dropdownContent.classList.remove('show');
      dropdownButton.classList.remove('active');
    }
  });

  let autoOpened = false;
  let hoverTimeout;
  dropdownContainer.addEventListener('mouseenter', function () {
    hoverTimeout = setTimeout(() => {
      if (!dropdownContent.classList.contains('show')) {
        dropdownContent.classList.add('show');
        dropdownButton.classList.add('active');
        autoOpened = true;
      }
    }, 400);
  });

  dropdownContainer.addEventListener('mouseleave', function () {
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
      hoverTimeout = null;
    }
    if (autoOpened) {
      dropdownContent.classList.remove('show');
      dropdownButton.classList.remove('active');
      autoOpened = false;
    }
  });

  initializeTimeframeControls();

  async function handleCsvDownload(url, filename, type) {
    const buttons = document.querySelectorAll('.dropdown-content button');
    buttons.forEach(button => {
      button.disabled = true;
      button.style.cursor = 'not-allowed';
    });

    let overlay = document.getElementById('overlay');
    let popup = document.getElementById('popup');

    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'overlay';
      document.body.appendChild(overlay);
    }

    if (!popup) {
      popup = document.createElement('div');
      popup.id = 'popup';
      popup.innerHTML = `
  <i class="fas fa-download" style="font-size: 3rem; color: #00bce7; margin-bottom: 20px;"></i>
  <h2>Download in Progress</h2>
  <p style="font-size: 1.2rem; line-height: 1.6; margin-bottom: 20px;">
    Processing download. This may take a while, as it is filtering a lot of data.
  </p>
  <p style="font-size: 1rem; color: #e0e0e0;">
    All CSV files are in UTC unless otherwise stated.
  </p>
  <button id="cancelDownload" class="cancel-button">
    <i class="fas fa-times"></i> Cancel Download
  </button>
`;
      document.body.appendChild(popup);
    }

    overlay.style.display = 'block';
    popup.style.display = 'block';

    const controller = new AbortController();
    const signal = controller.signal;

    document.getElementById('cancelDownload').onclick = () => {
      controller.abort();
      overlay.style.display = 'none';
      popup.style.display = 'none';
      buttons.forEach(button => {
        button.disabled = false;
        button.style.cursor = '';
      });
    };

    try {
      const csvData = convertDataToCSV(await fetchData(url, signal), type);
      downloadCSVFile(csvData, filename);
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Download cancelled by user');
      } else {
        console.error('Failed to download CSV:', error);
      }
    } finally {
      overlay.style.display = 'none';
      popup.style.display = 'none';
      buttons.forEach(button => {
        button.disabled = false;
        button.style.cursor = '';
      });
    }
  }

  document
    .getElementById('downloadMinutelyData')
    .addEventListener('click', function () {
      handleCsvDownload(
        'https://api.communitrics.com/mrbeast?minutely=true',
        'MrBeast_Minutely_Subscribers.csv',
        'minutely'
      );
    });

  document
    .getElementById('downloadMinutelyWeekData')
    .addEventListener('click', function () {
      handleCsvDownload(
        'https://api.communitrics.com/mrbeast?minutelyPastWeek=true',
        'MrBeast_Minutely_Subscribers_(Past_Week).csv',
        'minutelyPastWeek'
      );
    });

  document
    .getElementById('downloadMinutelyDayData')
    .addEventListener('click', function () {
      handleCsvDownload(
        'https://api.communitrics.com/mrbeast?minutelyPastDay=true',
        'MrBeast_Minutely_Subscribers_(Past_Day).csv',
        'minutelyPastDay'
      );
    });

  document
    .getElementById('downloadTenMinutelyData')
    .addEventListener('click', function () {
      handleCsvDownload(
        'https://api.communitrics.com/mrbeast?tenminutely=true',
        'MrBeast_10Minutely_Subscribers.csv',
        'tenminutely'
      );
    });

  document
    .getElementById('downloadHourlyData')
    .addEventListener('click', function () {
      handleCsvDownload(
        'https://api.communitrics.com/mrbeast?hourly=true',
        'MrBeast_Hourly_Subscribers.csv',
        'hourly'
      );
    });

  document
    .getElementById('downloadDailyData')
    .addEventListener('click', function () {
      handleCsvDownload(
        'https://api.communitrics.com/mrbeast?daily=true',
        'MrBeast_Daily_Subscribers.csv',
        'daily'
      );
    });

  document
    .getElementById('downloadDailyDataEST')
    .addEventListener('click', function () {
      handleCsvDownload(
        'https://api.communitrics.com/mrbeast?hourly=true',
        'MrBeast_Daily_Subscribers_EST.csv',
        'dailyEST'
      );
    });

  document
    .getElementById('viewDailyGainsButton')
    .addEventListener('click', function () {
      const mainContent = document.getElementById('mainContent');
      const tableContent = document.getElementById('tableContent');
      const button = document.getElementById('viewDailyGainsButton');
      const timeframeContainer = document.querySelector('.timeframe-container');

      if (mainContent.style.display === 'none') {
        mainContent.style.display = 'block';
        tableContent.style.display = 'none';
        button.innerHTML = '<i class="fas fa-table"></i> View Data Tables';
        button.classList.remove('active');
        timeframeContainer.style.display = 'block';
      } else {
        mainContent.style.display = 'none';
        tableContent.style.display = 'flex';
        button.innerHTML = '<i class="fas fa-chart-line"></i> View Graph';
        button.classList.remove('active');
        timeframeContainer.style.display = 'none';
      }
    });

  const datePicker = document.getElementById('datePicker');
  const today = new Date().toISOString().split('T')[0];
  datePicker.value = today;

  datePicker.addEventListener('change', function () {
    const selectedDate = this.value;
    const filteredData = filterDataByDate(selectedDate);
    fillHourlyTable(filteredData, selectedDate);
  });

  fetchDataAndDrawChart();

  const initialFilteredData = filterDataByDate(today);
  fillHourlyTable(initialFilteredData, today);
});

const tableContainer = document.getElementById('scrollableTable');
const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

if (!isTouchDevice) {
  tableContainer.addEventListener('wheel', function (e) {
    if (tableContainer.scrollHeight > tableContainer.clientHeight) {
      e.preventDefault();
      tableContainer.scrollTop += e.deltaY;
    }
  });
}
