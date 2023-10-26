const lives = 5;

const SPACE_BAR = 32;

const SHIP_HEIGHT = 50;
const SHIP_WIDTH = 15;
const SHIP_SPEED = 5;
const SHIP_COLOR = 'magenta';
const SHIP_GROWTH = 45;
const START_SHOOTING_RATE = 2;
let SHOOTING_RATE = START_SHOOTING_RATE;


const BULLET_SPEED = 5;
const BULLET_SIZE = 7;
const BULLET_SIZE_SLOW = 30;
const BULLET_COLOR = 'grey';

const CANVAS_WIDTH = 1200;
const CANVAS_HEIGHT = 750;

const ENEMY_SIZE = 40;
const ENEMY_COLOR = 'red';
let ENEMY_GEN_RATE = 200;  // Larger = slower
let ENEMY_SPEED = 2;

let shipX = CANVAS_WIDTH / 2;
let shipY = CANVAS_HEIGHT - 100;

let ship;

let score = 0;

let cooldown = 0;
let cooldownMax = 20;

let isShooting = false;
let bullets = [];

let isGameOver = false;
let updatePos = 1;
let gameOverTick = 0;

let lastBulletTick = 0;

let enemies = [];

let tick = ENEMY_GEN_RATE - 20;

class EntityCircle {
    constructor(x, y, diam, col) {
        this.x = x;
        this.y = y;
        this.diam = diam;
        this.radius = diam / 2;
        this.col = col;
  
        this.display = function() {
            let c = color(col);
            fill(this.col);
            noStroke();
            circle(this.x, this.y, this.diam);
        }
    }
}

class Ship {
    constructor(x, y, width, height, col) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.col = color(col);
  
        this.display = function() {
            fill(this.col);
            noStroke();
            rect(this.x, this.y, this.width, this.height);

            let c = color('black');
            fill(c);
            rect(this.x + (this.width / 2) - (BULLET_SIZE / 2), this.y, BULLET_SIZE, this.height / 8);

            if(cooldown) {
                c = color('blue');
                fill(c);
                rect(this.x, this.y + ((this.height / cooldownMax) * (cooldownMax - cooldown)), this.width, this.height - ((this.height / cooldownMax) * (cooldownMax - cooldown)))
                console.log(cooldownMax)
            }
        }
    }
}


function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function collisionCircles(circle1, circle2) {
    let distance = dist(circle1.x, circle1.y, circle2.x, circle2.y);
    return (distance < circle1.radius + circle2.radius);
}

function collisionRectCircle(rect, circle) {
    let testX = circle.x;
    let testY = circle.y;
    
    if (circle.x < rect.x)                      testX = rect.x;                  // test left edge
    else if (circle.x > rect.x + rect.width)    testX = rect.x+rect.width;       // right edge
    if (circle.y < rect.y)                      testY = rect.y;                  // top edge
    else if (circle.y > rect.y + rect.height)   testY = rect.y + rect.height;    // bottom edge
    
    let d = dist(circle.x, circle.y, testX, testY);
    
    return d <= circle.radius;
}

function setup() {
    createCanvas(windowWidth, windowHeight);
    ship = new Ship(shipX, shipY, SHIP_WIDTH, SHIP_HEIGHT, SHIP_COLOR);
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight, true);
}

function keyPressed() {
    if(keyCode === 38 || keyCode === 16) {
        if (SHOOTING_RATE === START_SHOOTING_RATE) {
            SHOOTING_RATE *= 10;
        } else {
            SHOOTING_RATE = START_SHOOTING_RATE
        }
    }
  }
  
function draw() {
    tick++;

    // Ship
    if (keyIsDown(LEFT_ARROW)) {
        if(ship.x + (ship.width / 2) > 0)
            ship.x -= SHIP_SPEED * updatePos;
    }
    
    if (keyIsDown(RIGHT_ARROW)) {
        if(ship.x + (ship.width / 2) < windowWidth)
            ship.x += SHIP_SPEED * updatePos;
    }



    // Bullets
    isShooting = keyIsDown(SPACE_BAR);
    if(isShooting) {
        let bulletStartX = ship.x + ship.width / 2;
        let bulletStartY = ship.y - BULLET_SIZE / 2;
        let bulletsLength = bullets.length;
        if(lastBulletTick < tick - SHOOTING_RATE && !(isGameOver) && cooldown < cooldownMax) {
            lastBulletTick = tick;
            cooldown++;
            let bulletSize = BULLET_SIZE;
            if(SHOOTING_RATE > START_SHOOTING_RATE)
                bulletSize = BULLET_SIZE_SLOW;
            bullets.push(new EntityCircle(bulletStartX, bulletStartY, bulletSize, BULLET_COLOR));
        }
    } else {
        if (tick%10 == 0 && cooldown > 0)
            cooldown--;
    }

    // Collisions
    // Set entity positions to outside of canvas. Removed by the filter
    let bulletsCopy = [...bullets];
    for(let i = 0; i < bullets.length; i++) {
        for(let j = 0; j < enemies.length; j++) {
            if(collisionCircles(bullets[i], enemies[j])) {
                bullets[i].y = -1; 
                enemies[j].x = -1;
                score++;
            }
        }
    }
    enemies = enemies.filter(enemy => enemy.x > 0);
    bullets = bullets.filter(bullet => bullet.y > 0);

    // Check enemies that made it past the ship
    let enemyLength = enemies.length;
    enemies = enemies.filter(enemy => enemy.y < windowHeight);
    ship.width += (enemyLength - enemies.length) * SHIP_GROWTH;

    // Enemy
    if(tick%ENEMY_GEN_RATE == 0  && !isGameOver) {
        if(ENEMY_GEN_RATE > 100)
            ENEMY_GEN_RATE -= 10;
        else if(ENEMY_SPEED < 3)
            ENEMY_SPEED++;
        else 
            ENEMY_GEN_RATE--;
        enemies.push(new EntityCircle(getRandomInt(50, windowWidth - 50), ENEMY_SIZE, ENEMY_SIZE, ENEMY_COLOR));
    }

    // Draw
    clear();

    for(let i = 0; i < bullets.length; i++) {
        bullets[i].y -= BULLET_SPEED * updatePos;
        bullets[i].display();
    }

    for(let i = 0; i < enemies.length; i++) {
        enemies[i].y += ENEMY_SPEED * updatePos;
        enemies[i].display();
    }

    ship.display();

    removeElements();
    let p = createP('Score: ' + score);
    p.style('font-size', '16px');
    p.position(10, 0);

    if(isGameOver) {
        updatePos = 0;
        gameOverTick++;
        if(gameOverTick > 200) {
            clear();
            fill(color('red'));
            rect(0, 0, windowWidth, windowHeight);
            removeElements();
            p = createP('Your score: ' + score);
            p.style('font-size', '50px');
            p.position(400, 200);
        }
    }

    // Check game over
    if(!isGameOver) {
        for(let i = 0; i < enemies.length; i++) {
            if(collisionRectCircle(ship, enemies[i])) {
                enemies[i].col = 'orange';
                isGameOver = true;
            }
        }
    }
}