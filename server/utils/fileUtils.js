const fs = require("fs");
const fsPromise = require('fs').promises;
const md5 = require('md5');

const { asyncForEach } = require('./asyncForEach.js');

const sleep = (milliseconds) => {
    return new Promise(resolve => setTimeout(resolve, milliseconds))
}

const getFileModifiedEpochMs = async (filePath) => {
    try {
        const stats = await fsPromise.stat(filePath);
        return stats.mtime.getTime();
    } catch (error) {
        console.warn(`Error retrieving file modified time: ${filePath}`);
        return undefined;
    }
}

function watchFileAndRunMethodOnChange (filePath, onChangeCallback) {
    let prevMd5 = md5(fs.readFileSync(filePath));
    let prevSize = undefined;
    let fsWait = false;
    const fsWatcher = fs.watch(filePath, async (event, filename) => {
        if (filename) {

            // console.log('fs.watch');
            // Debounce signal via 500 ms delay, this is because this callback can fire multiple times on one file change
            if (fsWait) return;
            fsWait = setTimeout(() => {
                fsWait = false;
            }, 500);

            await sleep(500); // Sleep while the file normalizes

            // Compare MD5 checksums to see if file actually changed
            const currMd5 = md5(fs.readFileSync(filePath));
            const fileSizeInBytes = fs.statSync(filePath).size;
            // console.info(`oldmd5: ${prevMd5} newmd5: ${currMd5} oldsize: ${prevSize} newsize: ${fileSizeInBytes}`);
            if (currMd5 === prevMd5 && prevSize === fileSizeInBytes) return;

            prevMd5 = currMd5;
            prevSize = fileSizeInBytes;

            // console.log(`File contents changed, reloading: ${filename}`);
            try {
                fs.accessSync(filePath, fs.constants.F_OK | fs.constants.R_OK);
                // console.info(`File found! Invoking callback on new contents from file: ${filePath}`);
                const content = fs.readFileSync(filePath, 'utf8');
                onChangeCallback(content);
            } catch (error) {
                    console.error(`File does not exist or is not readable, can't continue: ${filePath} Error: ${error}`);
                    throw error;
            }

        }
    });
    return fsWatcher;
}

const getLastModFileInDir = async (dir, filenameRegex = '') => {
    let files = await fsPromise.readdir(dir);
    if (filenameRegex) {
        const rx = new RegExp(filenameRegex);
        const filtFiles = files.filter(file => rx.test(file));
        files = filtFiles;
    }

    const statArr = [];
    await asyncForEach(files, async file => {
        const fileFp = `${dir}/${file}`
        const stats = await fsPromise.stat(fileFp);
        statArr.push({ file: fileFp, fileBasename: file, stats });
    });

    const mostRecent = statArr.reduce((prev, curr) => {
        if (!prev || !prev.stats || !prev.stats.mtimeMs) {
            return curr;
        };
        return (prev.stats.mtimeMs > curr.stats.mtimeMs) ? prev : curr;
    });
    return mostRecent;
}

module.exports = {
    sleep,
    getFileModifiedEpochMs,
    watchFileAndRunMethodOnChange,
    getLastModFileInDir
}