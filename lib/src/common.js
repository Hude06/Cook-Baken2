export function gen_id(prefix) {
    return `${prefix}_${Math.floor(Math.random() * 100000)}`;
}
export class SuperArray {
    constructor() {
        this.data = [];
    }
    clear() {
        this.data = [];
    }
    push_end(value) {
        this.data.push(value);
    }
    length() {
        return this.data.length;
    }
    pop_start() {
        return this.data.shift();
    }
    forEach(cb) {
        // @ts-ignore
        this.data.forEach((v, i) => cb(v, i));
    }
}
export class Observable {
    constructor() {
        this.listeners = new Map();
    }
    addEventListener(etype, cb) {
        if (!this.listeners.has(etype))
            this.listeners.set(etype, new Array());
        this.listeners.get(etype).push(cb);
    }
    fire(etype, payload) {
        if (!this.listeners.has(etype))
            this.listeners.set(etype, new Array());
        this.listeners.get(etype).forEach(cb => cb(payload));
    }
}
export class Point {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
    translate(x, y) {
        return new Point(this.x - x, this.y - y);
    }
    divide_floor(scale) {
        return new Point(Math.floor(this.x / scale), Math.floor(this.y / scale));
    }
    add(pt) {
        return new Point(this.x + pt.x, this.y + pt.y);
    }
    set(x, y) {
        this.x = x;
        this.y = y;
    }
    copy_from(pt) {
        this.x = pt.x;
        this.y = pt.y;
    }
    clone() {
        return new Point(this.x, this.y);
    }
    subtract(trans) {
        return new Point(this.x - trans.x, this.y - trans.y);
    }
}
export class Rect {
    constructor(x, y, w, h) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
    }
    contains(pt) {
        if (pt.x < this.x)
            return false;
        if (pt.y < this.y)
            return false;
        if (pt.x >= this.x + this.w)
            return false;
        if (pt.y >= this.y + this.h)
            return false;
        return true;
    }
    bottom() {
        return this.y + this.h;
    }
    right() {
        return this.x + this.w;
    }
}
export class Size {
    constructor(w, h) {
        this.w = w;
        this.h = h;
    }
    shrink(pad) {
        return new Size(this.w - pad * 2, this.h - pad * 2);
    }
    grow(pad) {
        return new Size(this.w + pad * 2, this.h + pad * 2);
    }
    subtract(delta) {
        return new Size(this.w - delta.x, this.h - delta.y);
    }
    add(delta) {
        return new Size(this.w + delta.x, this.h + delta.y);
    }
}
