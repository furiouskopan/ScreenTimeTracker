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

    // Helper function to format milliseconds into "X hours Y minutes"
    function formatTime(milliseconds) {
        const totalMinutes = Math.floor(milliseconds / (1000 * 60));
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        return `${hours} hour${hours !== 1 ? 's' : ''} ${minutes} minute${minutes !== 1 ? 's' : ''}`;
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
            const formattedTime = formatTime(time); // Format time
            const domainDiv = document.createElement('div');
            domainDiv.textContent = `${domain}: ${formattedTime}`;
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
            const formattedTime = formatTime(totalTime); // Format time
            const dayDiv = document.createElement('div');
            dayDiv.textContent = `${labels[index]}: ${formattedTime}`;
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
        return totalTime; // Keep it in milliseconds for chart data
    });

    console.log('Chart Data:', data); // Debugging line to see if data is formatted correctly

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Hours Spent',
                data: data.map(time => time / (1000 * 60 * 60)), // Convert to hours for display
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: (value) => {
                            return `${Math.floor(value)} hour${Math.floor(value) !== 1 ? 's' : ''}`; // Custom y-axis tick formatting
                        }
                    }
                }
            }
        }
    });
}


// Function to export weekly data and top sites to an Excel file
function exportToExcel(weekData, topSites) {
    // Prepare data for the Excel file
    const exportData = [];

    // Add header row
    exportData.push(['Day', 'Site', 'Time Spent (Hours)']);

    // Add daily data
    const labels = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    weekData.forEach((dayData, dayIndex) => {
        for (const domain in dayData) {
            const timeSpent = convertMsToHours(dayData[domain]); // Convert to hours
            exportData.push([labels[dayIndex], domain, timeSpent]);
        }
    });

    // Add top sites
    exportData.push([]); // Add an empty row
    exportData.push(['Top 5 Sites This Week']);
    exportData.push(['Site', 'Time Spent (Hours)']);
    
    topSites.forEach(([domain, time]) => {
        const timeInHours = convertMsToHours(time);
        exportData.push([domain, timeInHours]);
    });

    // Create a worksheet from the data
    const worksheet = XLSX.utils.aoa_to_sheet(exportData);

    // Create a new workbook and add the worksheet
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Weekly Data');

    // Export the workbook to a file
    XLSX.writeFile(workbook, 'Weekly_Screen_Time_Tracker.xlsx');
}

function convertMsToHours(ms) {
    return (ms / (1000 * 60 * 60)).toFixed(2); // Convert milliseconds to hours and round to 2 decimal places
}

// Add an export button to your settings.html file (you can place it where appropriate)
const exportButton = document.createElement('button');
exportButton.textContent = 'Export to Excel';
exportButton.addEventListener('click', () => {
    // Fetch week data and top sites, then call exportToExcel
    browser.storage.local.get('thisWeek').then(result => {
        if (result.thisWeek) {
            const weekData = result.thisWeek;
            const topSites = getTopSites(weekData); // Create a function to extract top sites
            exportToExcel(weekData, topSites);
        }
    });
});

document.body.appendChild(exportButton);

// Helper function to get the top sites from week data
function getTopSites(weekData) {
    const domainTimes = {};
    weekData.forEach(dayData => {
        for (let domain in dayData) {
            if (!domainTimes[domain]) {
                domainTimes[domain] = 0;
            }
            domainTimes[domain] += dayData[domain];
        }
    });

    // Sort and return the top 5 sites
    return Object.entries(domainTimes)
        .sort(([, timeA], [, timeB]) => timeB - timeA)
        .slice(0, 5);
}

document.addEventListener('DOMContentLoaded', function () {
    const darkModeToggle = document.getElementById('darkModeToggle');
    const sunIcon = document.getElementById('sunIcon');
    const moonIcon = document.getElementById('moonIcon');
    const body = document.body;

    // Load saved theme from local storage
    const currentTheme = localStorage.getItem('theme') || 'light';
    if (currentTheme === 'dark') {
        body.classList.add('dark-mode');
        sunIcon.style.display = 'block';
        moonIcon.style.display = 'none';
    } else {
        body.classList.add('light-mode');
        moonIcon.style.display = 'block';
        sunIcon.style.display = 'none';
    }

    // Toggle dark mode
    darkModeToggle.addEventListener('click', function () {
        if (body.classList.contains('dark-mode')) {
            body.classList.replace('dark-mode', 'light-mode');
            moonIcon.style.display = 'block';
            sunIcon.style.display = 'none';
            localStorage.setItem('theme', 'light');
        } else {
            body.classList.replace('light-mode', 'dark-mode');
            sunIcon.style.display = 'block';
            moonIcon.style.display = 'none';
            localStorage.setItem('theme', 'dark');
        }
    });
});


