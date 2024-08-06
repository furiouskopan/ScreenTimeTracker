function formatTime(ms) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
}

function updateTimes(sortedTimes) {
  let totalTime = 0;

  sortedTimes.forEach(([domain, time]) => {
    totalTime += time;

    browser.storage.local.get('hiddenDomains').then(result => {
      const hiddenDomains = result.hiddenDomains || {};
      if (hiddenDomains[domain]) return;

      let timeDiv = document.getElementById(`time-${domain}`);
      let domainDiv = document.getElementById(`domain-${domain}`);
      
      if (!timeDiv || !domainDiv) {
        const div = document.createElement('div');
        div.classList.add('tab-time');

        const closeBtn = document.createElement('span');
        closeBtn.textContent = 'X';
        closeBtn.classList.add('close-btn');
        closeBtn.addEventListener('click', () => {
          hideDomain(domain);
        });

        domainDiv = document.createElement('div');
        domainDiv.id = `domain-${domain}`;
        domainDiv.textContent = domain;

        timeDiv = document.createElement('div');
        timeDiv.id = `time-${domain}`;
        timeDiv.textContent = formatTime(time);

        div.appendChild(closeBtn);
        div.appendChild(domainDiv);
        div.appendChild(timeDiv);
        document.getElementById('tabTimes').appendChild(div);
      } else {
        timeDiv.textContent = formatTime(time);
      }
    });
  });

  const totalDiv = document.getElementById('total-time');
  if (!totalDiv) {
    const newTotalDiv = document.createElement('div');
    newTotalDiv.classList.add('tab-time');
    newTotalDiv.style.fontWeight = 'bold';
    newTotalDiv.id = 'total-time';
    newTotalDiv.textContent = `Total Time: ${formatTime(totalTime)}`;
    document.getElementById('tabTimes').appendChild(newTotalDiv);
  } else {
    totalDiv.textContent = `Total Time: ${formatTime(totalTime)}`;
  }
}

function hideDomain(domain) {
  browser.storage.local.get('hiddenDomains').then(result => {
    const hiddenDomains = result.hiddenDomains || {};
    hiddenDomains[domain] = true;
    browser.storage.local.set({ hiddenDomains }).then(() => {
      const domainDiv = document.getElementById(`domain-${domain}`);
      const timeDiv = document.getElementById(`time-${domain}`);
      if (domainDiv && timeDiv) {
        domainDiv.parentElement.remove(); 
      }
      refreshTimes();
    });
  });
}

function refreshTimes() {
  browser.runtime.sendMessage({ command: 'getTimeSpent' }).then(response => {
    updateTimes(response);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  refreshTimes();
  setInterval(refreshTimes, 1000); 
});
