import {CanvasSurface, gen_id, Palette, Sheet, Sprite, SpriteFont, SpriteGlyph, Tilemap} from "thneed-gfx";

export const GRAYSCALE_PALETTE = [
    '#ff00ff',
    '#f0f0f0',
    '#d0d0d0',
    '#909090',
    '#404040',
];

export type CB = (any) => void;
export type Etype = "change"|"reload"|"structure"|'main-selection'|'palette-change'

export class Observable {
    listeners: Map<Etype, Array<CB>>

    constructor() {
        this.listeners = new Map<Etype, Array<CB>>();
    }

    addEventListener(etype: Etype, cb: CB) {
        if (!this.listeners.has(etype)) this.listeners.set(etype, new Array<CB>());
        this.listeners.get(etype).push(cb);
    }

    fire(etype: Etype, payload: any) {
        if (!this.listeners.has(etype)) this.listeners.set(etype, new Array<CB>());
        this.listeners.get(etype).forEach(cb => cb(payload))
    }
}


function obj_to_class(sh, doc:Doc) {
    if(sh.clazz === 'Sprite') {
        let sprite = new Sprite(sh.id, sh.name, sh.w, sh.h, doc)
        sprite.data = sh.data
        sprite.sync()
        return sprite
    }
    if(sh.clazz === 'Tilemap') {
        let tilemap = new Tilemap(sh.id, sh.name, sh.w, sh.h)
        tilemap.data = sh.data
        return tilemap
    }
    if(sh.clazz === 'Sheet') {
        let sheet = new Sheet(sh.id,sh.name)
        sheet.sprites = sh.sprites.map(sp => obj_to_class(sp, doc))
        return sheet
    }
    if(sh.clazz === 'Font') {
        let font = new SpriteFont(sh.id,sh.name)
        font.glyphs = sh.glyphs.map(g => obj_to_class(g, doc))
        return font
    }
    if(sh.clazz === 'Glyph') {
        let glyph = new SpriteGlyph(sh.id,sh.name,sh.w,sh.h, doc)
        glyph.data = sh.data
        glyph.meta = sh.meta
        if(!glyph.meta.left) glyph.meta.left = 0
        if(!glyph.meta.right) glyph.meta.right = 0
        if(!glyph.meta.baseline) glyph.meta.baseline = 0
        glyph.sync()
        return glyph
    }
    throw new Error(`don't know how to deserialize ${sh.clazz}`)
}

export class Doc extends Observable implements Palette {
    sheets: Sheet[]
    fonts: SpriteFont[]
    maps:Tilemap[]
    name:string

    selected_color: number
    private _palette: string[]
    font_palette: string[]
    selected_tile: number
    selected_map: number
    selected_font: number
    selected_glyph: number
    map_grid_visible: boolean;
    selected_tree_item_index:number
    selected_tree_item:any
    selected_sheet: number;
    private _dirty: boolean;

    constructor() {
        super();
        this.selected_color = 1;
        this._palette = GRAYSCALE_PALETTE
        this.font_palette = [
            '#ffffff',
            '#404040',
        ];
        let sheet = new Sheet("sheet1", "first sheet")
        sheet.add(new Sprite(gen_id('sprite'),'sprite1',8,8,this))
        sheet.add(new Sprite(gen_id('sprite'),'sprite2',8,8,this))
        this.sheets = [sheet]
        this.selected_sheet = 0
        this.selected_tile = 0;
        let tilemap = new Tilemap(gen_id('tilemap'),'main-map', 16, 16);
        tilemap.set_pixel(0, 0, 'sprite1');
        this.maps = [tilemap]
        this.map_grid_visible = true;
        let font = new SpriteFont(gen_id('font'),'somefont')
        let glyph = new SpriteGlyph(gen_id('glyph'),'a',8,8,this)
        font.glyphs.push(glyph)
        this.fonts = [font]
        this.selected_tree_item_index = -1
        this.selected_tree_item = null
        this._dirty = false
        this.name = 'unnamed-project'
    }

    get_color_palette(): string[] {
        return this._palette
    }

    palette(): string[] {
        return this._palette
    }
    get_selected_sheet():Sheet {
        return this.sheets[this.selected_sheet]
    }
    get_selected_tile() {
        let sheet = this.get_selected_sheet();
        if (!sheet) return null
        return sheet.sprites[this.selected_tile]
    }
    get_selected_map():Tilemap {
        return this.maps[this.selected_map]
    }
    get_selected_font():SpriteFont {
        return this.fonts[this.selected_font]
    }
    get_selected_glyph():SpriteGlyph {
        let font = this.get_selected_font()
        if(!font) return  null
        return font.glyphs[this.selected_glyph]
    }

    set_selected_sheet(target: Sheet) {
        this.selected_sheet = this.sheets.indexOf(target)
        this.fire('main-selection',this.selected_sheet)
    }
    set_selected_map(target: Tilemap) {
        this.selected_map = this.maps.indexOf(target)
        this.fire('main-selection',this.selected_map)
    }
    set_selected_font(target: SpriteFont) {
        this.selected_font = this.fonts.indexOf(target)
        this.fire('main-selection',this.selected_font)
    }
    set_selected_glyph(target: SpriteGlyph) {
        let font = this.get_selected_font()
        if(!font) return
        this.selected_glyph = font.glyphs.indexOf(target)
    }


    toJsonObj() {
        return {
            version:2,
            sheets: this.sheets.map(sh => sh.toJsonObj()),
            fonts:  this.fonts.map(fnt => fnt.toJsonObj()),
            maps:   this.maps.map(mp => mp.toJsonObj()),
        }
    }

    reset_from_json(data) {
        // console.log('data is',data)
        if(data.version === 1) {
            if(data.fonts && data.fonts.length > 0) {
                console.log("pretending to upgrade the document")
                data.version = 2
            } else {
                console.log("really upgrade")
                data.maps.forEach(mp => {
                    console.log("converting",mp)
                    mp.clazz = 'Tilemap'
                    if(!mp.id) mp.id = gen_id("tilemap")
                    if(!mp.name) mp.name = gen_id("unknown")
                    return mp
                })
                data.version = 2
            }
        }
        if(data.version !== 2) throw new Error("we can only parse version 2 json")
        // console.log("processing",data);

        this.sheets = data.sheets.map(sh => {
            // console.log("sheet",sh)
            return obj_to_class(sh,this)
        })
        this.fonts = data.fonts.map(fnt => {
            // console.log("font",fnt)
            return obj_to_class(fnt, this)
        })
        this.maps = data.maps.map(mp => {
            // console.log("map is",mp)
            let mp2 = obj_to_class(mp, this)
            // console.log("restored map is",mp2)
            return mp2
        })


        this.selected_color = 0
        this.selected_tile = 0
        this.selected_map = 0
        this.selected_font = 0
        this.selected_glyph = 0
        this.map_grid_visible = true
        this.selected_tree_item_index = -1
        this.selected_tree_item = null
        this.selected_sheet = 0

        console.log("final version of the doc is",this)
        console.log("selected sheet is",this.get_selected_sheet())
        console.log('selected tile is',this.get_selected_tile())
        console.log("selected map is",this.get_selected_map())
        console.log("selected font is",this.get_selected_font())
        console.log("selected gly0h is",this.get_selected_glyph())
        this.fire('reload',this)
        this.fire('structure',this)
    }

    dirty() {
        return this._dirty
    }

    mark_dirty() {
        this._dirty = true
    }

    persist() {
        let json = this.toJsonObj()
        let str = JSON.stringify(json,null, '  ')
        localStorage.setItem('backup',str)
        console.log("persisted to backup")
        this._dirty = false
    }

    check_backup() {
        let item = localStorage.getItem('backup')
        if(item) {
            let data = JSON.parse(item)
            this.reset_from_json(data)
        }
    }

    // set_palette(palette: string[]) {
    //     this._palette = palette
    //     this.fire('palette-change',this._palette)
    //     this.sheets.forEach(sh => {
    //         sh.sprites.forEach(sp => {
    //             sp.sync()
    //         })
    //     })
    // }
}

export function draw_sprite(sprite: Sprite, ctx: CanvasSurface, x: number, y: number, scale: number, palette:string[]) {
    sprite.forEachPixel((val: number, i: number, j: number) => {
        ctx.fillRect(x + i * scale, y + j * scale, scale, scale, palette[val]);
    });
}
