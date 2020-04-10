export function getCookie(cname) {
    var name = cname + '=';
    var decodedCookie = decodeURIComponent(document.cookie);
    var ca = decodedCookie.split(';');
    for (var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) === ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) === 0) {
            return c.substring(name.length, c.length);
        }
    }
    return '';
}

export function decodeHpayloadCookie(hpayloadCookieString) {
    const arr = hpayloadCookieString.split('.');
    const header = JSON.parse(window.atob(arr[0]));
    const payload = JSON.parse(window.atob(arr[1]));
    return { header, payload };
}

export function getPayload() {
    const hpayloadCookieString = getCookie('hpayloadCookie');
    if (hpayloadCookieString === '') {
        return undefined;
    }
    const { payload } = decodeHpayloadCookie(hpayloadCookieString);
    return payload;
}
