let activeDomain = null;
let startTime = null;
let timeSpent = {};
let notificationSent = {};
let today = new Date().toDateString();
const TRACKING_INTERVAL = 1000; // Update time every second

function getDomain(url) {
  const a = document.createElement('a');
  a.href = url;

  // Skip internal pages like settings.html
  if (a.pathname.includes('settings.html') || a.pathname.includes('otherMiscPage.html')) {
    return null;
  }

  let domain = a.hostname.replace('www.', '');
  const parts = domain.split('.');
  if (parts.length > 2) {
    domain = parts.slice(-2).join('.');
  }
  domain = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
  return domain;
}

function updateTimeSpent(domain) {
  if (activeDomain !== null && startTime !== null) {
    const now = Date.now();
    const elapsedTime = now - startTime;

    if (!timeSpent[activeDomain]) {
      timeSpent[activeDomain] = 0;
    }

    // Update the time spent for the active domain
    timeSpent[activeDomain] += elapsedTime;

    // Handle notifications
    const hoursSpent = Math.floor(timeSpent[activeDomain] / (1000 * 60 * 60));
    if (hoursSpent > (notificationSent[activeDomain] || 0)) {
      sendNotification(activeDomain, hoursSpent);
      notificationSent[activeDomain] = hoursSpent;
    }
  }

  // Update active domain and reset start time
  activeDomain = domain;
  startTime = Date.now();

  // Save time spent to storage
  saveTimeSpent();
}

function sendNotification(domain, hoursSpent) {
  const options = {
    type: 'basic',
    title: 'Screen Time Tracker',
    message: `You have spent ${hoursSpent} hour(s) on ${domain}.`,
    iconUrl: 'icons/clock_icon.png'
  };
  browser.notifications.create(`time-notification-${domain}-${hoursSpent}`, options);
}

function checkForDailyReset() {
  const currentDay = new Date().toDateString();
  if (currentDay !== today) {
    timeSpent = {};
    notificationSent = {}; // Reset notification tracking
    today = currentDay;
    saveTimeSpent();
  }
}

function saveTimeSpent() {
  const todayIndex = new Date().getDay();

  browser.storage.local.get('thisWeek').then(result => {
    let thisWeek = result.thisWeek || Array(7).fill({});

    // Ensure deep cloning of objects to avoid reference issues
    thisWeek = thisWeek.map(day => ({ ...day }));

    // Ensure that today's data exists
    if (!thisWeek[todayIndex]) {
      thisWeek[todayIndex] = {};
    }

    // Directly set the cumulative time spent on each domain for today
    for (let domain in timeSpent) {
      thisWeek[todayIndex][domain] = timeSpent[domain];
    }

    // Persist the updated week data
    browser.storage.local.set({ thisWeek });
  });
}

function loadTimeSpent() {
  browser.storage.local.get(['thisWeek', 'notificationSent']).then(result => {
    if (result.thisWeek) {
      const todayIndex = new Date().getDay();
      timeSpent = result.thisWeek[todayIndex] || {};
    } else {
      timeSpent = {};
    }
    if (result.notificationSent) {
      notificationSent = result.notificationSent || {};
    }
  });
}


function startTracking() {
  setInterval(() => {
    checkForDailyReset();
    saveTimeSpent();
  }, 60 * 1000); // Check daily reset every minute

  setInterval(() => {
    if (activeDomain !== null && startTime !== null) {
      updateTimeSpent(activeDomain); // Update time every second
    }
  }, TRACKING_INTERVAL);
}

browser.tabs.onActivated.addListener(activeInfo => {
  browser.tabs.get(activeInfo.tabId).then(tab => {
    const domain = getDomain(tab.url);
    updateTimeSpent(domain);
  });
});

browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (tab.active && changeInfo.status === 'complete') {
    const domain = getDomain(tab.url);
    updateTimeSpent(domain);
  }
});

browser.windows.onFocusChanged.addListener(windowId => {
  if (windowId === browser.windows.WINDOW_ID_NONE) {
    updateTimeSpent(null);
  } else {
    browser.tabs.query({ active: true, windowId }).then(tabs => {
      if (tabs.length > 0) {
        const domain = getDomain(tabs[0].url);
        updateTimeSpent(domain);
      }
    });
  }
});

browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.command === 'getTimeSpent') {
    const sortedTimeSpent = Object.entries(timeSpent).sort(([, a], [, b]) => b - a);
    sendResponse(sortedTimeSpent);
  }
});

loadTimeSpent();
startTracking();
