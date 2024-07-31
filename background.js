let activeDomain = null;
let startTime = null;
let timeSpent = {};
let notificationSent = {};
let today = new Date().toDateString();

function getDomain(url) {
  const a = document.createElement('a');
  a.href = url;
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
      notificationSent[activeDomain] = 0; // Initialize notification tracking
    }

    timeSpent[activeDomain] += elapsedTime;

    const hoursSpent = Math.floor(timeSpent[activeDomain] / (1000 * 60 * 60));
    if (hoursSpent > notificationSent[activeDomain]) {
      sendNotification(activeDomain, hoursSpent);
      notificationSent[activeDomain] = hoursSpent;
    }
  }
  activeDomain = domain;
  startTime = Date.now();
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
  browser.storage.local.set({ timeSpent, today, notificationSent });
}

function loadTimeSpent() {
  browser.storage.local.get(['timeSpent', 'today', 'notificationSent']).then(result => {
    if (result.timeSpent) {
      timeSpent = result.timeSpent;
    }
    if (result.today && result.today === today) {
      today = result.today;
    }
    if (result.notificationSent) {
      notificationSent = result.notificationSent;
    }
  });
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

setInterval(() => {
  checkForDailyReset();
  saveTimeSpent();
}, 60 * 1000);

browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.command === 'getTimeSpent') {
    const sortedTimeSpent = Object.entries(timeSpent).sort(([, a], [, b]) => b - a);
    sendResponse(sortedTimeSpent);
  }
});

loadTimeSpent();
