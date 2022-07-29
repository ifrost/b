(function () {

    /**
     * ml per minute factor to use when amount is not provided
     */
    const ML_PER_MINUTE = 4;

    const load = async () => {
        const logs = await getData();
        const today = (new Date().getHours()) + (new Date().getMinutes() / 60);
        const mainWindows = [
            {name: '24h', from: 24},
            {name: '12h', from: 12},
            {name: '6h', from: 6},
            {name: '5h', from: 5},
            {name: 'today', from: today },
        ];
        const otherWindows = [
            {name: 'month', from: 24 * 30, days: 30},
            {name: 'week', from: 24 * 7, days: 7},
            {name: 'week-2', from: 24 * 7 * 2, to: 24 * 7, days: 7},
            {name: 'week-3', from: 24 * 7 * 3, to: 24 * 7 * 2, days: 7},
            {name: 'week-4', from: 24 * 7 * 4, to: 24 * 7 * 3, days: 7},
            {name: 'week-5', from: 24 * 7 * 5, to: 24 * 7 * 4, days: 7},
            {name: 'week-6', from: 24 * 7 * 6, to: 24 * 7 * 5, days: 7},
            {name: 'week-7', from: 24 * 7 * 7, to: 24 * 7 * 6, days: 7},
            {name: 'week-8', from: 24 * 7 * 8, to: 24 * 7 * 7, days: 7},

            {name: '-1d', from: today + 24, to: today},
            {name: '-2d', from: today + 24 * 2, to: today + 24 * 1},
            {name: '-3d', from: today + 24 * 3, to: today + 24 * 2},
            {name: '-4d', from: today + 24 * 4, to: today + 24 * 3},
            {name: '-5d', from: today + 24 * 5, to: today + 24 * 4},
            {name: '-6d', from: today + 24 * 6, to: today + 24 * 5},
            {name: '-7d', from: today + 24 * 7, to: today + 24 * 6},
            {name: '-8d', from: today + 24 * 8, to: today + 24 * 7},

            {name: '-9d', from: today + 24 * 9, to: today + 24 * 8},
            {name: '-10d', from: today + 24 * 10, to: today + 24 * 9},
            {name: '-11d', from: today + 24 * 11, to: today + 24 * 10},
            {name: '-12d', from: today + 24 * 12, to: today + 24 * 11},
            {name: '-13d', from: today + 24 * 13, to: today + 24 * 12},
            {name: '-14d', from: today + 24 * 14, to: today + 24 * 13},

            {name: '24+1.0h', from: 24 - 1, to: -1},
            {name: '24+1.5h', from: 24 - 1.5, to: -1.5},
            {name: '24+2.0h', from: 24 - 2, to: -2},
            {name: '24+2.5h', from: 24 - 2.5, to: -2.5},
            {name: '24+3.0h', from: 24 - 3, to: -3},
            {name: '24+3.5h', from: 24 - 3.5, to: -3.5},
            {name: '24+4.0h', from: 24 - 4, to: -4},
            {name: '24+4.5h', from: 24 - 4.5, to: -4.5},
            {name: '24+5.0h', from: 24 - 5, to: -5},
            {name: '24+5.5h', from: 24 - 5.5, to: -5.5},
            {name: '24+6h', from: 24 - 6, to: -6},
            {name: '24+7h', from: 24 - 7, to: -7},

            {name: '6+1.0h', from: 6 - 1, to: -1},
            {name: '6+1.5h', from: 6 - 1.5, to: -1.5},
            {name: '6+2.0h', from: 6 - 2, to: -2},
            {name: '6+2.5h', from: 6 - 2.5, to: -2.5},
            {name: '6+3.0h', from: 6 - 3, to: -3},
            {name: '6+3.5h', from: 6 - 3.5, to: -3.5},
            {name: '6+4.0h', from: 6 - 4, to: -4},
            {name: '6+4.5h', from: 6 - 4.5, to: -4.5},
            {name: '6+5.0h', from: 6 - 5, to: -5},
            {name: '6+5.5h', from: 6 - 5.5, to: -5.5},
        ];
        const mainStats = createStats(mainWindows, logs);
        const otherStats = createStats(otherWindows, logs);
        var formattedMainStats = mainStats.map(formatStats).join('\n');
        var formattedLogs = logs.concat().splice(0, 20).map(formatLog).join('\n');
        var formattedOtherStats = otherStats.map(formatStats).join('\n');

        var { formatted, entries } = predictNextFeedTime(logs);

        const nextFeedTime = formatted;
        const output = `${formattedMainStats}\n---\nnext? ${nextFeedTime}\n${formattedLogs}\n---\n${formattedOtherStats}`;
        const content = document.getElementById('content');
        content.innerHTML = `<pre>${output}<pre>`;
        generateChart(entries, { name: 'gaps', label: 'Feeding gaps (h)', getter: (e) => e.nextRaw});
        generateChart(entries, { name: 'amount', label: 'Amount (ml)', getter: (e) => e.amount});
        generateChart(entries, { name: 'duration', label: 'Duration (min)', getter: (e) => e.log.duration});

        other2(entries, logs);
    }

    const other = (entries) => {
        const stats = {};
        let total = 0;
        entries.forEach((entry) => {
            const h = entry.log.start.getHours();
            stats[h] = stats[h] || 0;
            stats[h]++;
            total++;
        });

        let csv = ''
        for (var i in stats) {
            csv += `${i}, ${stats[i]}\n`;
        }

        console.log(csv);
    }

    const other2 = (entries, logs) => {
        const today = (new Date().getHours()) + (new Date().getMinutes() / 60);
        const stats = [];
        for (let i=1; i<45; i++) {
            const w =  {name: 'a', from: today + 24 * i, to: today + 24 * (i - 1)};
            const s = createStats([w], logs);
            stats.push([i, s[0].stats.duration.breast, s[0].stats.duration.bottle]);
        }
        // console.log(stats.reverse());
        let csv = ''
        stats.reverse().forEach((e) => {
            csv += `-${e[0]}d, ${e[1]}, ${e[2]}\n`;
        });
        console.log(csv);
    }

    const filterByWindow = (w, logs) => {
        const from = (new Date()).getTime() - w.from * 60 * 60 * 1000;
        const to = (new Date()).getTime() - (w.to || 0) * 60 * 60 * 1000;
        const filtered = logs.filter((l) => l.startTimestamp >= from && l.startTimestamp <= to);
        return filtered;
    }

    const createStats = (windows, logs) => {
        return windows.map((w) => {
            const filtered = filterByWindow(w, logs);
            return {
                name: w.name,
                days: w.days,
                stats: getStats(filtered),
            }
        });
    }

    /**
     * @return {Object[]}
     */
    const getData = async () => {
        var data = await fetch("https://dl.dropboxusercontent.com/s/4xsatr8ujknxony/baby.log");
        var logs = (await data.text()).split('\n').reverse().filter(l => !!l.trim().length);
        logs = logs.map(parseData);
        logs.sort((a, b) => b.timestamp - a.timestamp);
        return logs;
    }

    /**
     * Converts a log line (in logfmt) to key-value pair
     */
    const parseLogLine = (line) => {
        const dict = {};
        line.split(' ').forEach((kv) => {
            var [key, value] = kv.split('=');
            dict[key] = value;
        });
        return dict;
    }

    const parseData = (log) => {
        var parsed = parseLogLine(log);
        parsed.duration = parseInt(parsed.duration);
        parsed.startTimestamp = parseInt(parsed.timestamp);
        if (parsed.amount) {
            parsed.amount = parseInt(parsed.amount);
        } else {
            parsed.amount = parsed.duration * ML_PER_MINUTE;
        }
        parsed.start = new Date();
        parsed.start.setTime(parsed.startTimestamp);
        parsed.end = new Date();
        parsed.endTimestamp = parsed.startTimestamp + parsed.duration * 60 * 1000;
        parsed.end.setTime(parsed.endTimestamp);
        parsed.icon = parsed.type === 'bottle' ? '🍼' : '🤱';
        return parsed;
    }

    const diffTillNow = (date) => {
        var diff = (Date.now() - date.getTime()) / 1000 / 60; // minutes
        var diffHours = Math.floor(diff / 60)
        var diffDisplay = diffHours.toString().padStart(2, '0') + ':' + (diff - diffHours * 60).toFixed(0).padStart(2, '0');
        return diffDisplay;
    }

    const formatLog = (log) => {
        const from = formatDate(log.start, true);
        const to = formatDate(log.end, false);

        var diffFrom = diffTillNow(log.start);
        var diffTo = diffTillNow(log.end);
        return `${from}-${to} ${log.icon} ${log.amount} ml 🕒 ${log.duration.toString().padStart(2, '0')}′ -${diffFrom}-${diffTo}`
    }

    const formatStats = (stats) => {
        var s = stats.stats;
        return `${stats.name}: ${s.amount.total} ml (${s.amount.bottle}🍼${s.amount.breast}🤱) ${s.duration.total}′ (${s.duration.bottle}🍼${s.duration.breast}🤱) (${s.count}🖐️${stats.days > 1 ? (s.count / stats.days).toFixed(1) + '☝️' : ''} ${s.feedFreq}h)`
    }

    const formatDate = (datetime, short) => {
        return datetime.getHours().toString().padStart(2, '0') + ':' + datetime.getMinutes().toString().padStart(2, '0') + (!short ? ' ' + datetime.getDate() + '/' + (datetime.getMonth() + 1) : '');
    }

    const getStats = (logs) => {
        const stats = {
            count: logs.length,
            amount: {breast: 0, bottle: 0, total: 0},
            duration: {breast: 0, bottle: 0, total: 0},
            feedFreq: logs.length >= 2 ? ((logs[0].startTimestamp - logs[logs.length - 1].startTimestamp) / logs.length / 1000 / 60 / 60).toFixed(1) : '-',
        }
        logs.forEach((log) => {
            stats.amount.total += log.amount;
            stats.amount[log.type] += log.amount;
            stats.duration.total += log.duration;
            stats.duration[log.type] += log.duration;
        });
        return stats;
    }

    const buildMarkov = (logs) => {
        const data = logs.concat().reverse();
        const entries = data.map((log, i) => {
            const next = i !== data.length - 1 ? (data[i + 1].startTimestamp - log.timestamp) / 1000 / 60 / 60 : NaN;
            const nextA = Math.floor(next);
            const nextB = next - nextA;
            const nextRounded = nextA + (nextB >= 0.5 ? 0.5 : 0)
            return {
                index: i,
                log,
                hour: log.start.getHours() + (log.start.getMinutes() >= 30 ? 0.5 : 0),
                next: nextRounded,
                nextRaw: next,
                amount: log.amount,
            }
        });

        const W = 8;
        const remaining = entries.concat();
        const window = remaining.splice(0, W);

        const list = [window];
        while (remaining.length) {
            window.shift();
            window.push(remaining.shift());
            list.push(
                window.concat(),
            );
        }
        return { list, entries };
    }

    const calculateDiff = (pattern, current) => {
        const W = pattern.length;
        let distance = 0;
        pattern.forEach((entry, index) => {
            const hDiffA = Math.abs(entry.hour - current[index].hour);
            const hDiffB = Math.abs(entry.hour - current[index].hour + 24);
            const hDistance = Math.min(hDiffA, hDiffB);
            let nextDistance = 0;
            if (index !== W - 1) {
                nextDistance = Math.abs(entry.next - current[index].next);
            } else {
                return;
            }

            let aDistance = Math.abs(entry.amount - current[index].amount);

            const w = (index + 1) / (W - 1);
            const hW = 0.2;
            const nW = 0.2;
            const aW = 0.02;
            distance += ((hDistance * hW) + (nextDistance * nW) + (aDistance * aW)) * w;
        });

        return {distance, next: pattern[W - 1].next, amount: pattern[W - 1].amount};
    }

    const predictNextFeedTime = (logs) => {
        const { list, entries } = buildMarkov(logs);
        const markov = list;
        const current = markov[markov.length - 1];

        let scores = [];
        markov.forEach((list) => {
            scores.push(calculateDiff(list, current));
        })
        scores = scores.filter((s) => !isNaN(s.next));
        scores.sort((a, b) => a.distance - b.distance);

        const T = 5;
        let top = scores.concat().slice(0, T).map((s) => s.next);
        let topA = scores.concat().slice(0, T).map((s) => s.amount);
        top.sort();
        const med = (top[2] * 0.1 + top[3] * 0.2 + top[4] * 0.7);
        const medA = (topA[0] * 0.2 + topA[1] * 0.2 + topA[2] * 0.2 + topA[3] * 0.2 + topA[4] * 0.2);

        const predictedTime = new Date();
        predictedTime.setTime(current[current.length - 1].log.startTimestamp + med * 60 * 60 * 1000)
        return { formatted: formatDate(predictedTime) + ' ' + medA.toFixed(0) + ' ml', entries }
    }

    const generateChart = (entries, options) => {
        const from = (new Date()).getTime() - 24 * 7 * 60 * 60 * 1000;
        const to = (new Date()).getTime() - (0) * 60 * 60 * 1000;
        entries = entries.filter((e) => {
            return e.log.startTimestamp >= from && e.log.startTimestamp <= to;
        })
        const ctx = document.getElementById(options.name);
        const myChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels:  entries.map((e) => formatDate(e.log.start)),
                datasets: [{
                    label: options.label,
                    data: entries.map(options.getter),
                    backgroundColor: [
                        'rgba(255, 99, 132, 0.2)',
                        'rgba(54, 162, 235, 0.2)',
                        'rgba(255, 206, 86, 0.2)',
                        'rgba(75, 192, 192, 0.2)',
                        'rgba(153, 102, 255, 0.2)',
                        'rgba(255, 159, 64, 0.2)'
                    ],
                    borderColor: [
                        'rgba(255, 99, 132, 1)',
                        'rgba(54, 162, 235, 1)',
                        'rgba(255, 206, 86, 1)',
                        'rgba(75, 192, 192, 1)',
                        'rgba(153, 102, 255, 1)',
                        'rgba(255, 159, 64, 1)'
                    ],
                    borderWidth: 1
                }
                ]
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

    window.onload = load;

})();
