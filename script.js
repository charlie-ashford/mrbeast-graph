let allMrbeastData = [];
let filteredMrbeastData = [];

let lastScrollTop = 0;
const buttonContainer = document.querySelector('.button-container');
window.addEventListener('scroll', () => {
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

  if (scrollTop === 0) {
    buttonContainer.classList.remove('hidden');
  } else if (scrollTop > lastScrollTop) {
    buttonContainer.classList.add('hidden');
  }
  lastScrollTop = scrollTop;
});

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
  const formatNumber = (num, decimalPlaces = 0) =>
    num.toLocaleString(undefined, {
      minimumFractionDigits: decimalPlaces,
      maximumFractionDigits: decimalPlaces,
    });

  const formatDateTime = (dateString, includeSeconds = true) => {
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
  };

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

  const formatTime = ms => {
    const days = Math.floor(ms / (1000 * 60 * 60 * 24));
    const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);
    return `${days}d, ${hours}h, ${minutes}m, ${seconds}s`;
  };

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

function formatTime(ms) {
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));
  const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  return `${days} days, ${hours} hours, ${minutes} minutes`;
}

function drawChart(mrbeastData) {
  mrbeastData = mrbeastData.map(point => {
    return [moment.tz(point[0], 'America/New_York').valueOf(), point[1]];
  });

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
      events: {
        dblclick: function () {
          this.zoomOut();
        },
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
              style: {
                color: '#1e1e1e',
              },
            },
          },
        },
        position: {
          align: 'right',
          verticalAlign: 'top',
          x: -10,
          y: 10,
        },
        relativeTo: 'chart',
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
    xAxis: {
      type: 'datetime',
      title: {
        text: 'Time (US Eastern)',
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

  fetchDataAndDrawChart();

  document
    .getElementById('viewDailyGainsButton')
    .addEventListener('click', function () {
      const mainContent = document.getElementById('mainContent');
      const tableContent = document.getElementById('tableContent');
      const button = document.getElementById('viewDailyGainsButton');
      if (mainContent.style.display === 'none') {
        mainContent.style.display = 'block';
        tableContent.style.display = 'none';
        button.innerHTML = '<i class="fas fa-table"></i> View Data Tables';
        button.classList.remove('active');
      } else {
        mainContent.style.display = 'none';
        tableContent.style.display = 'flex';
        button.innerHTML = '<i class="fas fa-chart-line"></i> View Graph';
        button.classList.remove('active');
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

  const initialFilteredData = filterDataByDate(today);
  fillHourlyTable(initialFilteredData, today);
});

async function fetchDataAndDrawChart() {
  try {
    let response = await fetch('https://api.communitrics.com/mrbeast');
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    const data = await response.json();

    allMrbeastData = data.map(entry => [
      new Date(entry.currentTime).getTime(),
      Number(entry.count),
    ]);

    filteredMrbeastData =
      allMrbeastData.length > 3000
        ? allMrbeastData.slice(-3000)
        : allMrbeastData;

    updateInfoSection(data);
    drawChart(filteredMrbeastData);
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

async function fetchData(url) {
  try {
    let response = await fetch(url);
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch data:', error);
  }
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

function fillHourlyTable(data, selectedDate) {
  const hourlyTable = document
    .getElementById('hourlyGainsTable')
    .getElementsByTagName('tbody')[0];
  hourlyTable.innerHTML = '';

  if (data.length === 0) {
    console.error('No data available to process.');
    return;
  }

  let { previousCount, previousGain, previousGainChange } =
    getPreviousDayLastCount(selectedDate);
  let lastHourCount = previousCount;
  let subscriberBuffer = [];
  let gainBuffer = [];

  const currentUTCDate = new Date().toISOString().split('T')[0];
  const currentUTCHour = new Date().getUTCHours();

  for (let hour = 0; hour < 24; hour++) {
    const targetDate = new Date(selectedDate);
    targetDate.setUTCHours(hour, 0, 0, 0);
    const nextHourDate = new Date(targetDate);
    nextHourDate.setUTCHours(hour + 1, 0, 0, 0);

    const closestEntry = findClosestEntry(data, nextHourDate);
    const row = document.createElement('tr');
    const timeCell = document.createElement('td');
    const subscriberCell = document.createElement('td');
    const gainCell = document.createElement('td');

    const estTime = new Date(targetDate);
    const estFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/New_York',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short',
    });

    timeCell.innerHTML = `${hour
      .toString()
      .padStart(2, '0')}:00 UTC (${targetDate.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    })} local)<br>${estFormatter.format(estTime)}`;

    let gainValue = '-';
    let gain = null;

    if (hour > 0) {
      subscriberCell.textContent = subscriberBuffer.shift();
      gainCell.innerHTML = gainBuffer.shift();
    } else {
      subscriberCell.textContent =
        previousCount !== null ? previousCount.toLocaleString() : '-';
      if (previousGain !== null) {
        let gainChange = previousGainChange;
        let color = previousGainChange > 0 ? '#5bdb1f' : '#db421f';
        gainCell.innerHTML = `<span style="color: ${color}; font-weight: bold;">${previousGain.toLocaleString()}</span>`;
        gainCell.innerHTML += `<br><span style="font-size: smaller;">(${
          gainChange > 0 ? '+' : ''
        }${gainChange.toLocaleString()})</span>`;
      } else {
        gainCell.innerHTML = '-';
      }
    }

    if (
      targetDate.toISOString().split('T')[0] === currentUTCDate &&
      hour === (currentUTCHour + 1) % 24
    ) {
      const localTime = new Date();
      const localFormatter = new Intl.DateTimeFormat('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      });
      gainCell.innerHTML += `<br><span style="font-size: calc(0.9em - 15%);">As of ${localFormatter.format(
        localTime
      )} local time</span>`;
    }

    if (closestEntry) {
      const currentCount = closestEntry.count;
      if (currentCount !== undefined) {
        gain = lastHourCount !== null ? currentCount - lastHourCount : null;
        if (gain !== null) {
          gainValue = gain.toLocaleString();
          let color = '#db421f';
          if (previousGain !== null && gain < previousGain) {
            color = '#db421f';
          } else if (gain > 0) {
            color = '#5bdb1f';
          }
          gainBuffer.push(
            gain === 0
              ? `<span style="font-weight: bold;">-</span>`
              : `<span style="color: ${color}; font-weight: bold;">${gainValue}</span>`
          );
          if (gain !== 0 && previousGain !== null) {
            gainBuffer[
              gainBuffer.length - 1
            ] += `<br><span style="font-size: smaller;">(${
              gain > previousGain ? '+' : ''
            }${(gain - previousGain).toLocaleString()})</span>`;
          }
          previousGain = gain;
        } else {
          gainBuffer.push('-');
        }
        subscriberBuffer.push(currentCount.toLocaleString());
        lastHourCount = currentCount;
      } else {
        console.error(
          `currentCount is undefined for entry: ${JSON.stringify(closestEntry)}`
        );
        subscriberBuffer.push('-');
        gainBuffer.push('-');
      }
    } else {
      subscriberBuffer.push('-');
      gainBuffer.push('-');
    }

    row.appendChild(timeCell);
    row.appendChild(subscriberCell);
    row.appendChild(gainCell);

    hourlyTable.appendChild(row);
  }
}

function getPreviousDayLastCount(selectedDate) {
  const previousDay = new Date(selectedDate);
  previousDay.setDate(previousDay.getDate() - 1);
  const previousDayDateString = previousDay.toISOString().split('T')[0];

  const previousDayData = allMrbeastData
    .filter(entry => {
      const entryDate = new Date(entry[0]).toISOString().split('T')[0];
      return entryDate === previousDayDateString;
    })
    .map(entry => ({
      currentTime: new Date(entry[0]),
      count: entry[1],
    }));

  if (previousDayData.length > 0) {
    const targetTime = new Date(previousDay);
    targetTime.setUTCHours(23, 59, 59, 999);
    const closestEntry = previousDayData.reduce((prev, curr) => {
      const prevDiff = Math.abs(
        new Date(prev.currentTime).getTime() - targetTime.getTime()
      );
      const currDiff = Math.abs(
        new Date(curr.currentTime).getTime() - targetTime.getTime()
      );
      return currDiff < prevDiff ? curr : prev;
    });
    const elevenPMCount = closestEntry.count;
    targetTime.setUTCHours(22, 59, 59, 999);
    const previousHourEntry = previousDayData.reduce((prev, curr) => {
      const prevDiff = Math.abs(
        new Date(prev.currentTime).getTime() - targetTime.getTime()
      );
      const currDiff = Math.abs(
        new Date(curr.currentTime).getTime() - targetTime.getTime()
      );
      return currDiff < prevDiff ? curr : prev;
    });

    targetTime.setUTCHours(21, 59, 59, 999);
    const ninePMEntry = previousDayData.reduce((prev, curr) => {
      const prevDiff = Math.abs(
        new Date(prev.currentTime).getTime() - targetTime.getTime()
      );
      const currDiff = Math.abs(
        new Date(curr.currentTime).getTime() - targetTime.getTime()
      );
      return currDiff < prevDiff ? curr : prev;
    });

    const tenPMCount = previousHourEntry.count;
    const ninePMCount = ninePMEntry.count;
    const tenPMGain = tenPMCount - ninePMCount;
    const elevenPMGain = elevenPMCount - tenPMCount;
    const elevenPMGainChange = elevenPMGain - tenPMGain;

    return {
      previousCount: elevenPMCount,
      previousGain: elevenPMGain,
      previousGainChange: elevenPMGainChange,
    };
  }
  return {
    previousCount: null,
    previousGain: null,
    previousGainChange: null,
  };
}

function fillDailyTable(data) {
  const dailyTable = document
    .getElementById('dailyGainsTable')
    .getElementsByTagName('tbody')[0];
  dailyTable.innerHTML = '';

  let previousCount = null;
  let previousGain = null;
  let mostRecentRow = null;

  let currentDate = new Date(data[0].currentTime);
  currentDate = new Date(
    currentDate.toLocaleString('en-US', { timeZone: 'America/New_York' })
  );
  currentDate.setHours(0, 0, 0, 0);
  let endDate = new Date();
  endDate = new Date(
    endDate.toLocaleString('en-US', { timeZone: 'America/New_York' })
  );
  endDate.setHours(0, 0, 0, 0);
  endDate.setDate(endDate.getDate() + 2);

  while (currentDate < endDate) {
    const nextDate = new Date(currentDate);
    nextDate.setDate(currentDate.getDate() + 1);

    const isDST = isEDT(currentDate);
    const utcHourOffset = isDST ? 4 : 5;

    nextDate.setUTCHours(utcHourOffset, 0, 0, 0);

    const utcCurrentDate = new Date(currentDate);
    utcCurrentDate.setUTCHours(utcHourOffset, 0, 0, 0);

    const closestStartEntry = findClosestEntry(data, utcCurrentDate);
    const closestEndEntry = findClosestEntry(data, nextDate);

    const row = document.createElement('tr');
    const dateCell = document.createElement('td');
    const subscriberCell = document.createElement('td');
    const gainCell = document.createElement('td');

    const edtTime = new Date(
      currentDate.getTime() +
        (currentDate.getTimezoneOffset() + (isDST ? 240 : 300)) * 60000
    );

    const edtDateString = edtTime.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      timeZone: 'America/New_York',
    });
    const edtISODateString = edtTime.toISOString().split('T')[0];

    dateCell.innerHTML = `${edtDateString}<br>${edtISODateString}`;
    subscriberCell.textContent = closestEndEntry
      ? closestEndEntry.count.toLocaleString()
      : '-';

    let gainValue = '-';
    let gain = null;

    if (previousCount !== null && closestEndEntry) {
      gain = closestEndEntry.count - closestStartEntry.count;

      if (gain !== null) {
        gainValue = gain.toLocaleString();
        let color = '#db421f';
        if (previousGain !== null && gain < previousGain) {
          color = '#db421f';
        } else if (gain > 0) {
          color = '#5bdb1f';
        }
        gainCell.innerHTML =
          gain === 0
            ? `<span style="font-weight: bold;">-</span>`
            : `<span style="color: ${color}; font-weight: bold;">${gainValue}</span>`;
        if (gain !== 0 && previousGain !== null) {
          gainCell.innerHTML += `<br><span style="font-size: smaller;">(${
            gain > previousGain ? '+' : ''
          }${(gain - previousGain).toLocaleString()})</span>`;
        }
        previousGain = gain;
      } else {
        gainCell.textContent = '-';
      }
    } else if (previousCount === null && closestEndEntry && closestStartEntry) {
      gain = closestEndEntry.count - closestStartEntry.count;
      gainValue = gain.toLocaleString();
      gainCell.innerHTML = `<span style="color: #5bdb1f; font-weight: bold;">${gainValue}</span><br><span style="font-size: calc(0.9em - 15%);"> (Data started May 15th, <br>at 12:52pm US Eastern)</span>`;
      previousGain = gain;
    } else {
      gainCell.textContent = '-';
    }

    row.appendChild(dateCell);
    row.appendChild(subscriberCell);
    row.appendChild(gainCell);

    dailyTable.insertBefore(row, dailyTable.firstChild);
    mostRecentRow = row;

    if (closestEndEntry) {
      previousCount = closestEndEntry.count;
    }

    currentDate.setDate(currentDate.getDate() + 1);
  }

  const now = new Date();
  now.toLocaleString('en-US', { timeZone: 'America/New_York' });
  const edtTimeFormatter = new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/New_York',
  });

  if (mostRecentRow) {
    const gainCell = mostRecentRow.getElementsByTagName('td')[2];
    gainCell.innerHTML += `<br><span style="font-size: calc(0.9em - 15%);">As of ${edtTimeFormatter.format(
      now
    )} US Eastern</span>`;
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
