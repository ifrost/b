(function () {

    /**
     * ml per minute factor to use when amount is not provided
     */
    const ML_PER_MINUTE = 4;

    const load = async () => {
        const logs = await getData();
        const mainWindows = [
            {name: '24h', from: 24},
            {name: '12h', from: 12},
            {name: '6h', from: 6},
            {name: '5h', from: 5},
        ];
        const otherWindows = [
            // {name: 'month', from: 24 * 30, days: 30},
            {name: 'week', from: 24 * 7, days: 7},
            {name: 'week-2', from: 24 * 7 * 2, to: 24 * 7, days: 7},
            {name: 'week-3', from: 24 * 7 * 3, to: 24 * 7 * 2, days: 7},
            {name: 'week-4', from: 24 * 7 * 4, to: 24 * 7 * 3, days: 7},

            {name: '-1d', from: 24 * 2, to: 24 * 1},
            {name: '-2d', from: 24 * 3, to: 24 * 2},
            {name: '-3d', from: 24 * 4, to: 24 * 3},
            {name: '-4d', from: 24 * 5, to: 24 * 4},
            {name: '-5d', from: 24 * 6, to: 24 * 5},
            {name: '-6d', from: 24 * 7, to: 24 * 6},
            {name: '-7d', from: 24 * 8, to: 24 * 7},

            {name: '-8d', from: 24 * 9, to: 24 * 8},
            {name: '-9d', from: 24 * 10, to: 24 * 9},
            {name: '-10d', from: 24 * 11, to: 24 * 10},
            {name: '-11d', from: 24 * 12, to: 24 * 11},
            {name: '-12d', from: 24 * 13, to: 24 * 12},
            {name: '-13d', from: 24 * 14, to: 24 * 13},
            {name: '-14d', from: 24 * 15, to: 24 * 14},

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
        var formattedLogs = logs.splice(0,20).map(formatLog).join('\n');
        var formattedOtherStats = otherStats.map(formatStats).join('\n');

        const output = `${formattedMainStats}\n---\n${formattedLogs}\n---\n${formattedOtherStats}`
        document.body.innerHTML = `<pre>${output}<pre>`;
        console.log(output)
    }

    const createStats = (windows, logs) => {
        return windows.map((w) => {
            const from =  (new Date()).getTime() - w.from * 60 * 60 * 1000
            const to =  (new Date()).getTime() - (w.to || 0) * 60 * 60 * 1000
            const filtered = logs.filter((l) => l.startTimestamp >= from && l.endTimestamp <= to)
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
        return `${stats.name}: ${s.amount.total} ml (${s.amount.bottle}🍼${s.amount.breast}🤱) ${s.duration.total}′ (${s.duration.bottle}🍼${s.duration.breast}🤱) (${s.count}🖐️${stats.days > 1 ?  (s.count/stats.days).toFixed(1) + '☝️' : ''} ${s.feedFreq}h)`
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

    window.onload = load;

})();
