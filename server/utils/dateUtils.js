const durationToReadable = (seconds) => {
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
};

const dateDiffSeconds = (oldDate, newDate) => {
    const oldSec = Math.round(oldDate.getTime() / 1000);
    const newSec = Math.round(newDate.getTime() / 1000);
    return newSec - oldSec;
}

const dateDiffSecondsReadable = (oldDate, newDate) => {
    return durationToReadable(dateDiffSeconds(oldDate, newDate));
}

module.exports = {
    durationToReadable,
    dateDiffSeconds,
    dateDiffSecondsReadable
}