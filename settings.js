import Chart from 'chart.js/auto';
import * as XLSX from 'xlsx';

document.addEventListener('DOMContentLoaded', function() {
    // Load the weekly data and render the chart
    browser.storage.local.get('thisWeek').then(result => {
        if (result.thisWeek) {
            const weekData = result.thisWeek;
            renderWeeklyChart(weekData);
            displayTopSites(weekData);
            displayDailyTime(weekData);
        }
    });

    // Load the hidden domains and display them with an undo option
    browser.storage.local.get('hiddenDomains').then(result => {
        const hiddenDomains = result.hiddenDomains || {};
        const hiddenDomainsContainer = document.createElement('div');
        hiddenDomainsContainer.id = 'hiddenDomainsContainer';
        
        const settingsBody = document.querySelector('body');
        settingsBody.appendChild(document.createElement('hr')); // Divider
        settingsBody.appendChild(hiddenDomainsContainer);

        if (Object.keys(hiddenDomains).length > 0) {
            displayHiddenDomains(hiddenDomains);
        } else {
            hiddenDomainsContainer.textContent = 'No hidden domains.';
        }
    });

    // Function to display hidden domains
    function displayHiddenDomains(hiddenDomains) {
        const hiddenDomainsContainer = document.getElementById('hiddenDomainsContainer');
        hiddenDomainsContainer.innerHTML = ''; // Clear the container

        hiddenDomainsContainer.innerHTML = '<h2>Hidden Domains</h2>';
        Object.keys(hiddenDomains).forEach(domain => {
            const div = document.createElement('div');
            div.classList.add('hidden-domain-item');

            const domainName = document.createElement('span');
            domainName.textContent = domain;
            div.appendChild(domainName);

            const undoButton = document.createElement('button');
            undoButton.textContent = 'Undo';
            undoButton.classList.add('undo-btn');
            undoButton.addEventListener('click', () => {
                undoHideDomain(domain);
            });
            div.appendChild(undoButton);

            hiddenDomainsContainer.appendChild(div);
        });
    }

    // Function to undo the hiding of a domain
    function undoHideDomain(domain) {
        browser.storage.local.get('hiddenDomains').then(result => {
            const hiddenDomains = result.hiddenDomains || {};
            delete hiddenDomains[domain]; // Remove the domain from hiddenDomains

            browser.storage.local.set({ hiddenDomains }).then(() => {
                // Update the hidden domains list after undo
                displayHiddenDomains(hiddenDomains);
            });
        });
    }

   // Function to display top 5 most used sites
   function displayTopSites(weekData) {
    const domainTimes = {};

    // Aggregate time spent on each domain across all days
    weekData.forEach(dayData => {
        Object.keys(dayData).forEach(domain => {
            if (!domainTimes[domain]) {
                domainTimes[domain] = 0;
            }
            domainTimes[domain] += dayData[domain];
        });
    });

    // Sort domains by total time spent (descending order)
    const sortedDomains = Object.entries(domainTimes)
        .sort(([, timeA], [, timeB]) => timeB - timeA)
        .slice(0, 5); // Get top 5

    // Display top 5 domains
    const topSitesContainer = document.createElement('div');
    topSitesContainer.innerHTML = '<h2>Top 5 Sites This Week</h2>';
    
    sortedDomains.forEach(([domain, time]) => {
        const timeInHours = (time / (1000 * 60 * 60)).toFixed(2); // Convert to hours
        const domainDiv = document.createElement('div');
        domainDiv.textContent = `${domain}: ${timeInHours} hours`;
        topSitesContainer.appendChild(domainDiv);
    });

    document.body.appendChild(topSitesContainer);
}

// Function to display time spent each day
function displayDailyTime(weekData) {
    const labels = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    // Display time spent for each day
    const dailyTimeContainer = document.createElement('div');
    dailyTimeContainer.innerHTML = '<h2>Time Spent Per Day</h2>';
    
    // Rearranging weekData so that Monday is first
    const adjustedWeekData = weekData.slice(1).concat(weekData[0]); // Move Sunday to the end

    adjustedWeekData.forEach((dayData, index) => {
        const totalTime = Object.values(dayData).reduce((sum, time) => sum + time, 0);
        const timeInHours = (totalTime / (1000 * 60 * 60)).toFixed(2); // Convert to hours
        const dayDiv = document.createElement('div');
        dayDiv.textContent = `${labels[index]}: ${timeInHours} hours`;
        dailyTimeContainer.appendChild(dayDiv);
    });

    document.body.appendChild(dailyTimeContainer);
}
});
    
function renderWeeklyChart(weekData) {
    console.log('Week Data:', weekData); // Debugging line to ensure data is passed correctly

    const ctx = document.getElementById('weeklyChart').getContext('2d');
    const labels = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    // Rearranging weekData so that Monday is first
    const adjustedWeekData = weekData.slice(1).concat(weekData[0]); // Move Sunday to the end

    const data = labels.map((day, index) => {
        const dayData = adjustedWeekData[index] || {};
        const totalTime = Object.values(dayData).reduce((sum, time) => sum + time, 0);
        return totalTime / (1000 * 60 * 60); // Convert milliseconds to hours
    });

    console.log('Chart Data:', data); // Debugging line to see if data is formatted correctly

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Hours Spent',
                data: data,
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}
