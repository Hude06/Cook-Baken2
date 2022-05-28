import {on, randi} from "../../common/util";
// @ts-ignore
import snake_json from "./snake.json";
import {
    CanvasSurface, EVENTS,
    log,
} from "../../lib/src/canvas";
import {GridModel} from "../../common/models";
import {LayerView} from "../../lib/src/components";
import {Observable, Point, Rect, Size, SuperArray} from "../../lib/src/common";
import {CommonEvent, BaseView, BaseParentView} from "../../lib/src/core";
import {
    CHERRY_BLOSSOM,
    DEMI_CHROME,
    Doc, DUNE,
    GRAYSCALE_PALETTE,
    INVERTED_PALETTE,
    Sheet,
    Sprite,
    SpriteFont, Tilemap
} from "../tileeditor/app-model";

const SCALE = 3
const SPEEDS = [
    40,35,30,25,20,20,20,
    15,15,15,
    13,13,13,
    10,10,10,
    9,9,9,
    8,8,8,
    7,7,7,
    6,6,6,
    5,5,5,
    4,4,4
]
const START_POSITION = new Point(15,15)
const CANVAS_SIZE = new Size(30,20)
const BOARD_SIZE = new Size(20,20)
const EMPTY = 0;
const WALL = 1;
const TAIL = 2;
const FOOD = 3;
const SHRINK = 5;
const BAKEN = 4;
const SCORE_POSITION = new Point(8*SCALE*10,8*SCALE*0)
const HOME_POSTION = new Point(14*SCALE*-4,8*SCALE*0)
const SHRINK_ODDS = 3
const BAKEN_ODDS = 4
const COLOR_PALETTES = [
    GRAYSCALE_PALETTE,
    INVERTED_PALETTE,
    DEMI_CHROME,
    CHERRY_BLOSSOM,
    DUNE,
]

class BakenModel {
    position: Point
    direction: Point
    tail: SuperArray
    speed:number
    length:number
    constructor() {
        this.position = new Point(0,0)
        this.direction = new Point(0,-1)
        this.tail = new SuperArray()
        this.speed = 0
        this.length = 1
    }

}
class ScoreModel {
    lives: number;
    constructor() {
        this.lives = 0
        this.lives = 0
    }
}

class GridView extends BaseParentView {
    private model: GridModel;
    private sheet: Sheet;
    private wall_left: Sprite;
    private wall_right: Sprite;
    private empty: Sprite;
    private tail: Sprite;
    private food: Sprite;
    private shrink: Sprite;
    private baken: Sprite;
    private wall_top: Sprite;
    private wall_bottom: Sprite;
    constructor(model: GridModel, sheet: Sheet) {
        super('grid-view')
        this.model = model;
        this.sheet = sheet
        this.wall_left = sheet.sprites.find(s => s.name === 'wall_left')
        this.wall_right = sheet.sprites.find(s => s.name === 'wall_right')
        this.wall_top = sheet.sprites.find(s => s.name === 'wall_top')
        this.wall_bottom = sheet.sprites.find(s => s.name === 'wall_bottom')
        this.empty = sheet.sprites.find(s => s.name === 'ground')
        this.tail = sheet.sprites.find(s => s.name === 'tail')
        this.food = sheet.sprites.find(s => s.name === 'food')
        this.baken = sheet.sprites.find(s => s.name === 'baken')
        this.shrink = sheet.sprites.find(s => s.name === 'potion')
    }
    draw(g: CanvasSurface): void {
        g.ctx.imageSmoothingEnabled = false
        g.fillBackgroundSize(this.size(),'white')
        this.model.forEach((w,x,y)=>{
            let color = 'white'
            if (w === EMPTY) color = 'white'
            if (w === WALL) color = 'blue'
            if (w === TAIL) color = 'orange'
            if (w === FOOD) color = 'red'
            if (w === SHRINK) color = 'green'

            let xx = x*8*SCALE
            let yy = y*8*SCALE
            g.fill(new Rect(xx,yy,1*8*SCALE,1*8*SCALE),color);
            if (w === EMPTY) g.draw_sprite(xx,yy,this.empty,SCALE)
            if (w === WALL) {
                if(x === 0) g.draw_sprite(xx, yy, this.wall_left, SCALE)
                if(x === this.model.w-1) g.draw_sprite(xx, yy, this.wall_right, SCALE)
                if(y === 0) g.draw_sprite(xx, yy, this.wall_top, SCALE)
                if(y === this.model.w-1) g.draw_sprite(xx, yy, this.wall_bottom, SCALE)
            }
            if (w === TAIL) g.draw_sprite(xx,yy,this.tail,SCALE)
            if (w === FOOD) g.draw_sprite(xx,yy,this.food,SCALE)
            if (w === SHRINK) g.draw_sprite(xx,yy,this.shrink,SCALE)
            if (w === BAKEN) g.draw_sprite(xx,yy,this.baken,SCALE)

        })
    }
    input(event: CommonEvent): void {
    }

    layout2(g: CanvasSurface, available: Size): Size {
        this.set_size(new Size(this.model.w*8*SCALE,this.model.h*8*SCALE))
        return this.size()
    }
    set_visible(visible: boolean) {
        this._visible = visible
    }
 }

class BakenView extends BaseView {
    private model: BakenModel;
    private sprite_slice: Sprite;
    constructor(model: BakenModel, spritesheet: Sheet) {
        super('baken')
        this.model = model;
        this.sprite_slice = spritesheet.sprites.find(sp => sp.name === 'baken')
        this.set_size(new Size(8*SCALE,8*SCALE))
    }
    draw(g: CanvasSurface): void {
        g.ctx.imageSmoothingEnabled = false
        // g.fill(new Rect(0,0,16,16),'yellow')
        g.draw_sprite(0,0,this.sprite_slice,SCALE)
    }
    position(): Point {
        return new Point(
            this.model.position.x*8*SCALE,
            this.model.position.y*8*SCALE
        )
    }

    layout2(g: CanvasSurface, available: Size): Size {
        return this.size()
    }
}
class ScoreView extends BaseView{
    private score: ScoreModel;
    private font: SpriteFont;
    private Baken: BakenModel;

    constructor(score: ScoreModel, baken: BakenModel, font: SpriteFont) {
        super('score-view')
        this.score = score;
        this.Baken == baken;
        this.font = font;
        this.set_size(new Size(32,16))
    }
    draw(g: CanvasSurface): void {
        g.ctx.save()
        g.ctx.translate(this.position().x,this.position().y)
        // g.fillBackgroundSize(this.size(),'red')
        let lines = [
            `Baken ${this.score.lives}`,
            `Coins ${this.score.lives}`,
        ]
        lines.forEach((str,i) => {
            g.fillStandardText(str, 10, 16*i*4+32, 'base', 2)
        })
        g.ctx.restore()
    }
    layout2(g: CanvasSurface, available: Size): Size {
        return this.size()
    }
}
class SplashView extends BaseView {
    constructor() {
        super('splash-view');
    }
    draw(g: CanvasSurface): void {
        g.fillBackgroundSize(this.size(),'rgba(255,255,255,1.0)')
        g.ctx.save()
        g.ctx.strokeStyle = 'black'
        g.ctx.lineWidth = 4
        g.ctx.strokeRect(4,4,this.size().w-4*2,this.size().h-4*2)
        g.ctx.restore()
        let x = 175
        g.fillBackgroundSize(this.size(),'rgba(51,255,175')
        g.fillStandardText('Cook The Baken', x,150,'base',2)
        let lines = [
            'Arrow keys to move',
            `'p' switch colors`,
            'Press Any Key To Start'
        ]
        lines.forEach((str,i) => {
            g.fillStandardText(str,x,220+i*32,'base',1)
        })

    }

    layout2(g: CanvasSurface, available: Size): Size {
        this.set_size(available)
        return this.size()
    }

    set_visible(visible: boolean) {
        this._visible = visible
    }
}
class DialogView extends BaseView {
    private text: string;
    private map: Tilemap;
    private sheet: Sheet;
    constructor(map:Tilemap, sheet:Sheet) {
        super('dialog-view');
        this.map = map
        this.sheet = sheet
        this.text = ''
    }
    draw(g: CanvasSurface): void {
        g.fillBackgroundSize(this.size(),'rgba(255,255,255,0.0)')
        let sprite_w = this.sheet.sprites[0].w
        let map_w = this.map.w * sprite_w * SCALE
        let map_scale = SCALE * sprite_w
        let map_x = (this.size().w - map_w)/2
        let text_w = g.measureText(this.text,'base').w *2
        let text_x = (this.size().w - text_w)/2
        g.draw_tilemap(this.map,this.sheet,map_x,16,map_scale)
        g.fillStandardText(this.text, text_x,150,'base',2)
    }
    layout2(g: CanvasSurface, available: Size): Size {
        this.set_size(available)
        return this.size()
    }
    set_visible(visible: boolean) {
        this._visible = visible
    }

    set_text(died: string) {
        this.text = died
    }
}


function find_empty_point(board: GridModel, min: number, max: number):Point {
    while(true) {
        let x = randi(min,max)
        let y = randi(min,max)
        if(board.get_xy(x,y) === EMPTY) {
            return new Point(x,y)
        }
    }
}


export async function start() {
    log("starting", snake_json)
    log("total level count =", SPEEDS.length)
    let doc = new Doc()
    doc.reset_from_json(snake_json)

    let All = new Observable();

    let surface = new CanvasSurface(CANVAS_SIZE.w*8*SCALE,CANVAS_SIZE.h*8*SCALE);
    surface.load_jsonfont(doc,'base','base')


    let root = new LayerView()
    let baken = new BakenModel()
    baken.position.copy_from(START_POSITION);
    let board = new GridModel(BOARD_SIZE)
    board.fill_all(()=>EMPTY)
    let board_layer = new LayerView();
    board_layer._name = 'board'
    let board_view = new GridView(board,doc.sheets[0])
    board_layer.add(board_view);
    root.add(board_layer);

    let home_view = new  DialogView(doc.maps.find(m => m.name === 'home'), doc.sheets[0]);
    root.add(home_view)
    home_view.set_position(HOME_POSTION)
    home_view.set_visible(false)

    root.add(new BakenView(baken,doc.sheets[0]));


    let score = new ScoreModel()
    let score_view = new ScoreView(score, baken, doc.fonts[0])
    score_view.set_position(SCORE_POSITION)
    board_layer.add(score_view)
    

    let splash_layer = new SplashView();
    root.add(splash_layer);


    let dialog_layer = new DialogView(doc.maps.find(m => m.name === 'dialog'), doc.sheets[0]);
    root.add(dialog_layer)
    dialog_layer.set_visible(false)

    surface.addToPage(document.getElementById("wrapper"));
    surface.set_root(root);
    surface.setup_keyboard_input()
    
    let current_palette = 0
    function cycle_palette() {
        current_palette = (current_palette + 1) % COLOR_PALETTES.length
        doc.set_palette(COLOR_PALETTES[current_palette])
    }

    surface.on_input((e) => {
        if(gameover) {
            splash_layer.set_visible(false)
            gameover = false
            playing = true
            nextLevel()
        }
        if(e.type === 'keydown') {
            if(e.key === 'ArrowLeft')  turn_to(new Point(-1,0));
            if(e.key === 'ArrowRight') turn_to(new Point(+1,0));
            if(e.key === 'ArrowUp')    turn_to(new Point(+0,-1));
            if(e.key === 'ArrowDown')  turn_to(new Point(+0,+1));
            if(e.key === 'p') cycle_palette()
            if(e.key === 'h') {
                home_view.set_visible(true)
                board_view.set_visible(false)
            }
        }
    })
    let playing = false
    let gameover = true

    function restart() {
        score.lives = 1
        score.lives = 1
        baken.speed = 1
        baken.position.copy_from(START_POSITION);
    }

    function nextLevel() {
        board.fill_all(()=>EMPTY);
        board.fill_row(0,()=>WALL)
        board.fill_col(0,()=>WALL)
        board.fill_row(board.h-1,()=>WALL)
        board.fill_col(board.w-1,()=>WALL)
        board.set_at(new Point(randi(1,16),7), BAKEN)
    }

    let clock = 0
    function turn_to(pt) {
        baken.position = baken.position.add(pt)
    }
    
    function process_tick() {
        clock += 1
        //if(clock % SPEEDS[snake.speed] !== 0) return

        let spot = board.get_at(baken.position);
        if (spot === BAKEN) {
            console.log("lives going up")
            score.lives += 1
            board.set_at(baken.position,  EMPTY)
            board.set_at(new Point(randi(1,16),randi(1,16)), BAKEN)
            return
            
        }

        

        //drop a tail spot where the head is
        board.set_at(baken.position,TAIL)
        //add to the tail
        baken.tail.push_end(baken.position);
        // trim tail if too long
        while (baken.tail.length() > baken.length) {
            board.set_at(baken.tail.pop_start(),EMPTY) // remove tail spot
        }   
        //check the new spot
        // if (spot === WALL) return die();
        // if (spot === TAIL) return die();
    }

    restart()

    function refresh() {
        if(playing)process_tick()
        surface.repaint()
        requestAnimationFrame(refresh)
    }
    requestAnimationFrame(refresh)
}
