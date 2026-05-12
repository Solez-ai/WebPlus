var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  BROWSER_RUNTIME: () => BROWSER_RUNTIME
});
module.exports = __toCommonJS(index_exports);
var BROWSER_RUNTIME = `
const dom = {
  get: (selector) => {
    const el = document.querySelector(selector);
    return new WebPlusElement(el);
  },
  createElement: (tag) => {
    return new WebPlusElement(document.createElement(tag));
  },
  render: (html) => {
    document.body.innerHTML = html;
  }
};

class WebPlusElement {
  constructor(el) { 
    this.el = el;
    this.style = el ? el.style : {};
  }
  is_valid() { return !!this.el; }
  get scrollHeight() { return this.el ? this.el.scrollHeight : 0; }
  set scrollTop(v) { if (this.el) this.el.scrollTop = v; }
  text(val) { 
    if (val === undefined) return this.el ? this.el.innerText : "";
    if (this.el) this.el.innerText = val; 
    return this; 
  }
  html(val) { 
    if (val === undefined) return this.el ? this.el.innerHTML : "";
    if (this.el) this.el.innerHTML = val; 
    return this; 
  }
  on(event, cb) { if (this.el) this.el.addEventListener(event, cb); return this; }
  add_class(cls) { if (this.el) this.el.classList.add(cls); return this; }
  append(child) { if (this.el && child.el) this.el.appendChild(child.el); return this; }
}

const webplus = {
  dom,
  print: (...args) => console.log(...args),
  stdlib_init: () => console.log("Web+ Stdlib Initialized"),
  stdlib_cleanup: () => console.log("Web+ Stdlib Cleaned up"),
  fetch: (url, opts) => {
    console.log("Fetching:", url, opts);
    return {
        then: (cb) => {
            if (url === "/api/metrics" || url === "/api/messages") {
                setTimeout(() => cb({ 
                    status: () => 200,
                    json: () => ({ 
                        cpu: Math.random() * 100, 
                        memory: Math.random() * 1024, 
                        network: Math.random() * 500,
                        username: "System",
                        content: "Live update from server",
                        timestamp: Date.now()
                    }) 
                }), 100);
            }
            return { catch: () => {} };
        }
    };
  },
  Vector: class {
    constructor() { this.items = []; }
    push(val) { this.items.push(val); }
    size() { return this.items.length; }
    at(i) { return this.items[i]; }
    get length() { return this.items.length; }
  },
};

function toString(val) { return String(val); }
function getCurrentTime() { return Math.floor(Date.now() / 1000); }
function getTimestamp() { return getCurrentTime(); }
function alloc(n, type) { 
  const create = () => {
    if (typeof type === 'function') return new type();
    if (typeof type === 'string') {
      try {
        const T = eval(type);
        if (typeof T === 'function') return new T();
      } catch(e) {}
    }
    return {};
  };
  return n === 1 ? create() : Array(n).fill(0).map(() => create()); 
}
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
function rand() { return Math.floor(Math.random() * (RAND_MAX + 1)); }
function sqrt(n) { return Math.sqrt(n); }
function pow(a, b) { return Math.pow(a, b); }
function abs(n) { return Math.abs(n); }
function sin(n) { return Math.sin(n); }
function cos(n) { return Math.cos(n); }
function atan2(y, x) { return Math.atan2(y, x); }
function floor(n) { return Math.floor(n); }
function ceil(n) { return Math.ceil(n); }
function round(n) { return Math.round(n); }
function sprintf(buf, fmt, ...args) {
    let res = fmt;
    for (const arg of args) {
        res = res.replace(/%(.d+)?f/, (match, p1) => {
            if (p1) return arg.toFixed(parseInt(p1.substring(1)));
            return arg.toString();
        });
        res = res.replace(/%d/, arg.toString());
        res = res.replace(/%s/, arg.toString());
    }
    if (buf && typeof buf === 'object') buf.value = res;
    return res;
}
function json(obj) { return JSON.stringify(obj); }
function parseJSON(str, target) { 
    try { 
        const parsed = JSON.parse(str); 
        Object.assign(target, parsed); 
    } catch(e) {} 
}
const RAND_MAX = 32767;

const worker = {
    spawn: (cb) => {
        (async () => {
            try { await cb(); } catch(e) { console.error("Worker error:", e); }
        })();
        return { 
            join: () => 0, 
            detach: () => {},
            terminate: () => {}
        };
    }
};

const Response = {};
const Event = { key: "" };
const Date = window.Date;
const size_t = Number;
const string = (val) => (val && typeof val === 'object' && 'value' in val) ? val.value : String(val);
`;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  BROWSER_RUNTIME
});
