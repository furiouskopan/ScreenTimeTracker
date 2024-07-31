document.addEventListener('DOMContentLoaded', function() {
    browser.storage.local.get('thisWeek').then(result => {
        if (result.thisWeek) {
            const weekData = result.thisWeek;
            renderWeeklyChart(weekData);
        }
    });

    function renderWeeklyChart(weekData) {
        const ctx = document.getElementById('weeklyChart').getContext('2d');
        const labels = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const data = labels.map((day, index) => {
            const dayData = weekData[index] || {};
            const totalTime = Object.values(dayData).reduce((sum, time) => sum + time, 0);
            return totalTime / (1000 * 60 * 60); // Convert to hours
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
