let initFlag = false; // 初始化完成标记
let mtrDebug = false; // 选填，默认为 false
let logTag = '[mTracker]';
let bizScenario = ''; // 必填，渠道来源
let id = ''; // mpaas小程序必填
let mustKeys = ['seedId', 'actionId']; // remoteLog 必传参数
let _extParams = {};

/**
 * track('clickseedname', { bizType: 'Pay', ext: { productId: 'xxx' } })
 */

const paramsType = {
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

function logParamsCheck(options) {
    for (let i = 0; i < mustKeys.length; i++) {
        if (!options[mustKeys[i]]) {
            console.warn(`[mas] ${mustKeys[i]}不能为空`);
            return true;
        }
    }
}

function jsBridgeReady(callback) {
    // 如果 jsbridge 已经注入则直接调用
    if (window.AlipayJSBridge) {
        callback && callback();
    } else {
        // 如果没有注入则监听注入的事件
        document.addEventListener('AlipayJSBridgeReady', callback, false);
    }
}

// 同神策api
function track(eventId, eventData = {}) {
    let _evtData = {
        ext: {}
    };
    Object.keys(eventData).forEach((key) => {
        if (paramsType[key]) {
            _evtData[key] = eventData[key];
        } else {
            _evtData.ext[key] = eventData[key];
        }
    });

    sendLog(eventId, _evtData);
}

/**
 * sendLog('payclick', { actionId: 'click', bizType: 'alipay', ext: {a: 1, b: 2} })
 * @param {*} eventId
 * @param {*} eventData
 * @returns
 */
function sendLog(eventId, eventData = {}) {
    if (!eventId) {
        console.warn(`[mas] eventId 不能为空`);
        return;
    }
    var { ext = {}, actionId, bizType } = options;
    if (!actionId) {
        console.warn(`[mas] actionId 不能为空`);
        // return
    }
    let options = {};
    Object.keys(eventData).forEach((key) => {
        if (paramsType[key] && paramsType[key] === typeof eventData[key]) {
            options[key] = eventData[key];
        }
    });
    _remoteLog({
        ...options,
        seedId: eventId,
        actionId,
        bizType,
        param4: _formatExtParams(Object.assign(_extParams, ext))
    });
}

function _remoteLog(options) {
    let apiObj = options;
    // Object.assign(apiObj, options);

    if (mtrDebug) {
        console.log(logTag, 'remoteLog', apiObj);
    }
    // #ifdef H5
    jsBridgeReady(function () {
        AlipayJSBridge.call('remoteLog', apiObj);
    });
    // #endif
    // #ifdef MP-ALIPAY
    my.call('remoteLog', apiObj);
    // #endif
}

function _formatExtParams(t) {
    let n = [];
    bizScenario && n.push('mBizScenario='.concat(encodeStr(bizScenario)));
    // #ifdef MP-ALIPAY
    n.push('id='.concat(encodeStr(id)));
    // #endif
    Object.keys(t).forEach(function (e) {
        n.push(''.concat(e, '=').concat(encodeStr(t[e])));
    });
    return n.join(',');
}

function encodeStr(e) {
    return 'string' == typeof e
        ? e.replace(/=|,|\^|\$\$/g, function (e) {
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
          })
        : e;
}

export default {
    install: (Vue) => {
        if (!initFlag) {
            console.warn('[mas] 请先执行埋点初始化方法init');
            return;
        }
        Vue.prototype.$track = function (eventId, options) {
            sendLog(eventId, options);
        };
    },
    init(conf = {}) {
        // conf: mtrDebug, bizScenario, id
        if (typeof conf.mtrDebug === 'boolean') mtrDebug = conf.mtrDebug;
        // #ifdef MP-ALIPAY
        if (conf.id) {
            if (/^\d{16}$/.test(conf.id)) {
                id = conf.id;
            } else {
                console.warn('[mas] 小程序id不能为空');
                return;
            }
        }
        // #endif
        if (conf.extendParams) {
            if (typeof conf.extendParams === 'object') {
                _extParams = conf.extendParams;
            } else {
                console.warn('[mas] extendParams 格式错误');
            }
        }
        bizScenario = conf.bizScenario;

        initFlag = true;
    }
};
