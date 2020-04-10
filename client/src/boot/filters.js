import { date } from 'quasar';

export default ({ Vue /* app, router, Vue, ... */ }) => {
    Vue.filter('toUpper', function (str) {
        return str.toUpperCase();
    });

    Vue.filter('epochSecToPretty', function (epochSec) {
        const ts = new Date(parseInt(`${epochSec}000`));
        return date.formatDate(ts, 'YYYY-MM-DD HH:mm:ss')
    });

    Vue.filter('epochMSToPretty', function (epochSec) {
        const ts = new Date(parseInt(epochSec));
        return date.formatDate(ts, 'YYYY-MM-DD HH:mm:ss')
    });

    Vue.filter('dateToPretty', function (dateStr) {
        const ts = new Date(dateStr);
        return date.formatDate(ts, 'YYYY-MM-DD HH:mm:ss')
    });

    const newlineRx = new RegExp(/\n/, 'g');
    const newlineReplStr = '<br>';

    Vue.filter('unixToHtml', function (strWithNewlines) {
        return strWithNewlines.replace(newlineRx, newlineReplStr);
    });

    Vue.filter('durationToReadable', function (seconds) {
        if (!seconds) {
            return '';
        } else if (seconds === 'N/A') {
            return seconds;
        }
        var levels = [
            [Math.floor(seconds / 31536000), 'y'],
            [Math.floor((seconds % 31536000) / 86400), 'd'],
            [Math.floor(((seconds % 31536000) % 86400) / 3600), 'h'],
            [Math.floor((((seconds % 31536000) % 86400) % 3600) / 60), 'm'],
            [(((seconds % 31536000) % 86400) % 3600) % 60, 's']
        ];
        var returntext = '';

        for (var i = 0, max = levels.length; i < max; i++) {
            if (levels[i][0] === 0 && i !== max - 1) continue;
            /* eslint-disable indent */
            returntext += ' ' + levels[i][0] + '' + levels[i][1] + (i === max - 1 ? '' : ',');
                // ' ' + (
                //     levels[i][0] === 1
                //     ? levels[i][1].substr(0, levels[i][1].length - 1)
                //     : levels[i][1]
                // );
            /* eslint-enable indent */
        };
        return returntext.trim();
    });
}
