function formatTime(ms) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
}

function displayTimes(sortedTimes) {
  const tabTimesDiv = document.getElementById('tabTimes');
  tabTimesDiv.innerHTML = '';

  let totalTime = 0;

  sortedTimes.forEach(([domain, time]) => {
    const div = document.createElement('div');
    div.classList.add('tab-time');
    const domainDiv = document.createElement('div');
    domainDiv.textContent = domain;
    const timeDiv = document.createElement('div');
    timeDiv.textContent = formatTime(time);
    div.appendChild(domainDiv);
    div.appendChild(timeDiv);
    tabTimesDiv.appendChild(div);

    totalTime += time;
  });

  const totalDiv = document.createElement('div');
  totalDiv.classList.add('tab-time');
  totalDiv.style.fontWeight = 'bold';
  totalDiv.textContent = `Total Time: ${formatTime(totalTime)}`;
  tabTimesDiv.appendChild(totalDiv);
}

function refreshTimes() {
  browser.runtime.sendMessage({ command: 'getTimeSpent' }).then(response => {
    displayTimes(response);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  refreshTimes();
  setInterval(refreshTimes, 1000); 
});
