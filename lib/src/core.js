import { Point, Size } from "./common";
export class CommonEvent {
    constructor(type, pt, ctx) {
        this.type = type;
        this.pt = pt;
        this.ctx = ctx;
    }
    translate(x, y) {
        let ce = new CommonEvent(this.type, this.pt.translate(x, y), this.ctx);
        ce.button = this.button;
        ce.details = this.details;
        return ce;
    }
}
export class BaseParentView {
    constructor(id) {
        this.id = id;
        this._size = new Size(100, 100);
        this._position = new Point(0, 0);
        this._children = [];
        this._name = 'unnamed';
        this._listeners = new Map();
        this._visible = true;
    }
    log(...args) {
        console.log(this.name(), ...args);
    }
    size() {
        return this._size;
    }
    set_size(size) {
        this._size = size;
    }
    position() {
        return this._position;
    }
    set_position(point) {
        this._position = point;
    }
    clip_children() {
        return false;
    }
    draw(g) {
    }
    get_children() {
        return this._children;
    }
    add(view) {
        this._children.push(view);
    }
    remove(view) {
        this._children = this._children.filter(ch => ch !== view);
    }
    input(event) {
    }
    is_parent_view() {
        return true;
    }
    name() {
        return this._name;
    }
    on(type, cb) {
        this._get_listeners(type).push(cb);
    }
    off(type, cb) {
        this._listeners.set(type, this._get_listeners(type).filter(c => c != cb));
    }
    fire(type, payload) {
        this._get_listeners(type).forEach(cb => cb(payload));
    }
    visible() {
        return this._visible;
    }
    _get_listeners(type) {
        if (!this._listeners.has(type))
            this._listeners.set(type, []);
        return this._listeners.get(type);
    }
}
export class BaseView {
    constructor(id) {
        this.id = id;
        this._size = new Size(100, 100);
        this._position = new Point(0, 0);
        this._visible = true;
        this._name = 'unnamed';
        this._listeners = new Map();
    }
    log(...args) {
        console.log(`${this.name()}:`, ...args);
    }
    _get_listeners(type) {
        if (!this._listeners.has(type))
            this._listeners.set(type, []);
        return this._listeners.get(type);
    }
    on(type, cb) {
        this._get_listeners(type).push(cb);
    }
    off(type, cb) {
        this._listeners.set(type, this._get_listeners(type).filter(c => c != cb));
    }
    fire(type, payload) {
        this._get_listeners(type).forEach(cb => cb(payload));
    }
    size() {
        return this._size;
    }
    set_size(size) {
        this._size = size;
    }
    position() {
        return this._position;
    }
    set_position(point) {
        this._position = point;
    }
    input(event) {
    }
    name() {
        return this._name;
    }
    visible() {
        return this._visible;
    }
}
