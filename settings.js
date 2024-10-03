document.addEventListener('DOMContentLoaded', function() {
    // Load the weekly data and render the chart
    browser.storage.local.get('thisWeek').then(result => {
        if (result.thisWeek) {
            const weekData = result.thisWeek;
            renderWeeklyChart(weekData);
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

    function renderWeeklyChart(weekData) {
        const ctx = document.getElementById('weeklyChart').getContext('2d');
        const labels = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const data = labels.map((day, index) => {
            const dayData = weekData[index] || {};
            const totalTime = Object.values(dayData).reduce((sum, time) => sum + time, 0);
            return totalTime / (1000 * 60 * 60); // Convert milliseconds to hours
        });

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
});
