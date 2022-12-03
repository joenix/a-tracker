// Init Completed
let completed = false;

// Debug Mode
let mtrDebug = false;

// Applet ID
let id = '';

// Channel
let bizScenario = '';

// Generally Params
let extParams = {};

// Params Types
let paramsType = {
    type: 'string',
    seedId: 'string',
    bizType: 'string',
    logLevel: 'number',
    actionId: 'string',
    spmId: 'string',
    param1: 'string',
    param2: 'string',
    param3: 'string',
    param4: 'string'
};

// Keys for Remote
let keys = ['seedId', 'actionId'];

// Foreach
function foreach(json = {}, callback = () => {}, clone = true) {
    const cache = clone ? {} : json;

    for (let k in json) {
        cache[k] = callback(json[k], k) || json[k];
    }

    return cache;
}

// Keys Checking
function keysChecking(opts = {}) {
    for (let key of keys) {
        if (!opts[key]) {
            return console.log(`[MAS] ${key} 不能为空`), true;
        }
    }
}

// JS Bridge
function jsBridgeReady(callback = () => {}) {
    window.AlipayJSBridge ? callback() : document.addEventListener('AlipayJSBridgeReady', callback, false);
}

// Sync API for 神策
function track(eventId, eventData = {}) {
    let eventSource = { ext: {} };

    foreach(eventData, (key) => {
        (paramsType[key] ? eventSource : eventSource.ext)[key] = eventData[key];
    });

    sender(eventId, eventSource);
}

// Sender
function sender(eventId, eventData = {}) {
    if (!eventId) {
        return console.warn(`[MAS] eventId 不能为空`);
    }

    let { ext = {}, actionId, bizType } = eventData;

    if (!actionId) {
        console.warn(`[MAS] actionId 不能为空`);
    }

    let opts = {};

    foreach(eventData, (key) => {
        if (paramsType[key] && paramsType[key] === typeof eventData[key]) {
            opts[key] = eventData[key];
        }
    });

    remoter({
        ...opts,

        seedId: eventId,
        actionId,
        bizType,

        param4: extParamsFormatter(Object.assign(extParams, ext))
    });
}

// Remoter
function remoter(opts = {}) {
    if (mtrDebug) {
        console.log('[mTracker]', 'Remote Log: ', opts);
    }

    // #ifdef H5
    jsBridgeReady(() => AlipayJSBridge.call('Remote Log: ', opts));
    // #endif

    // #ifdef MP-ALIPAY
    my.call('Remote Log: ', opts);
    // #endif
}

// extParams Formatter
function extParamsFormatter(json = {}, nes = []) {
    bizScenario && nes.push('mBizScenario='.concat(encode(bizScenario)));

    // #ifdef MP-ALIPAY
    nes.push('id='.concat(encode(id)));
    // #endif

    foreach(json, (e) => {
        nes.push(''.concat(e, '=').concat(encode(json[e])));
    });

    return nes.join(',');
}

// Encode
function encode(e) {
    if ('string' == typeof e) {
        return e.replace(/=|,|\^|\$\$/g, (e) => {
            switch (e) {
                case ',':
                    return '%2C';
                case '^':
                    return '%5E';
                case '$$':
                    return '%24%24';
                case '=':
                    return '%3D';
                case '&&':
                    return '%26%26';
                default:
                    return ' ';
            }
        });
    }

    return e;
}

// Export Usage
export default {
    install(Vue) {
        // No Init
        if (!completed) {
            return console.warn('[MAS] 请优先执行 init 初始化');
        }

        // Extension API on Vue 2
        Vue.prototype.$track = sender;
    },

    /**
     * @param mtrDebug { boolean } - Debug Mode
     * @param id { number } - Applet ID
     * @param bizScenario { string } - Channel
     * @param extendParams { object } - Generally Params
     * ========== ========== ========== ========== ==========
     */
    init(conf = {}) {
        if (typeof conf.mtrDebug == 'boolean') {
            mtrDebug = conf.mtrDebug;
        }

        // #ifdef MP-ALIPAY
        if (conf.id) {
            if (!/^\d{16}$/.test(conf.id)) {
                return console.warn('[MAS] 小程序id不能为空');
            }
            id = conf.id;
        }
        // #endif

        if (conf.extendParams) {
            typeof conf.extendParams === 'object' ? (extParams = conf.extParams) : console.warn('[MAS] extendParams 格式错误');
        }

        bizScenario = conf.bizScenario;

        // Extend by Joenix
        if (conf.paramsType) {
            paramsType = conf.paramsType;
        }

        completed = true;
    }
};
