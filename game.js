// Canvas init [Start]
const canvas = document.querySelector('#canvas')
const ctx = canvas.getContext('2d')
// Canvas init [END]

// Canvas Settings [START] ? this sets at begining the height and width to window size and the numbers are for margin to avoid scrollbars
canvas.width = innerWidth - 25
canvas.height = innerHeight - 30

// Canvas Settings [END]

// Init [START]

const mouse = {
    x: innerWidth / 2,
    y: innerHeight / 2
}

let enemy1 = []
let enemy1Face = '🤢'
let enemy2Face = '😷'
let enemy3Face = '😈'
let enemy1X = ((canvas.width / 2) / 2) / 2
let enemy1Y = 80
let enemy1Fontsize = 36
let dx = 2
let enemyMoveDistanceY = 2
let eBullets = []
let bullets = []
let txt = 'hello'
let player1 = '🗻'
let life = 3
let lifeIcon = '🖤'
let lifeCheck = true
let allowClick = true
let textCheck = false
let text = ''


// let newT = new TextC(txt, 50, mouse.y, 0, 64, 'red')

// Init [END]


// Classes [START]

class RectangleObj {
    // you create new Rectangles by calling this as a function
    // these are the arguments you pass in
    // add default values to avoid errors on empty arguments
    constructor(
        x = 0, y = 0,
        width = 0, height = 0,
        fillColor = '', strokeColor = '', strokeWidth = 2
    ) {
        // ensure the arguments passed in are numbers
        this.x = Number(x)
        this.y = Number(y)
        this.width = Number(width)
        this.height = Number(height)
        this.fillColor = fillColor
        this.strokeColor = strokeColor
        this.strokeWidth = strokeWidth
    }

    // get keyword causes this method to be called
    // when you use myRectangle.area
    get area() {
        return this.width * this.height
    }

    // gets the X position of the left side
    get left() {
        // origin is at top left so just return x
        return this.x
    }

    // get X position of right side
    get right() {
        // x is left position + the width to get end point
        return this.x + this.width
    }

    // get the Y position of top side
    get top() {
        // origin is at top left so just return y
        return this.y
    }

    // get Y position at bottom
    get bottom() {
        return this.y + this.height
    }

    // draw rectangle to screen
    draw() {
        // destructuring
        const {
            x,
            y,
            width,
            height,
            fillColor,
            strokeColor,
            strokeWidth
        } = this

        // saves the current styles set elsewhere
        // to avoid overwriting them
        ctx.save()

        // set the styles for this shape
        ctx.fillStyle = fillColor
        ctx.lineWidth = strokeWidth

        // create the *path*
        ctx.beginPath()
        ctx.strokeStyle = strokeColor
        ctx.rect(x, y, width, height)

        // draw the path to screen
        ctx.fill()
        ctx.stroke()

        // restores the styles from earlier
        // preventing the colors used here
        // from polluting other drawings
        ctx.restore()
    }
}

class TextC {

    constructor(
        text = '',
        x = 0,
        y = 0,
        fontSize = 0
    ) {
        this.text = text
        this.x = Number(x)
        this.y = Number(y)
        this.fontSize = Number(fontSize)
    }

    draw() {
        const {
            text,
            x,
            y,
            fontSize
        } = this

        ctx.font = `${fontSize}px`
        ctx.fillText(text, x, y)
    }

}

// Classes [END]


// Draw [START]

for (let i = 0; i < 10; i++) {
    if (i == 0) {
        enemy1.push(new TextC(enemy1Face, enemy1X, enemy1Y, enemy1Fontsize))
    } else {
        // console.log(enemy1);
        enemy1.push(new TextC(enemy1Face, enemy1[i - 1].x + enemy1Fontsize + 10, enemy1Y, enemy1Fontsize))
    }
}
for (let i = 0; i < 10; i++) {
    if (i == 0) {
        enemy1Y = enemy1[0].y + enemy1Fontsize + 10
        enemy1.push(new TextC(enemy2Face, enemy1X, enemy1Y, enemy1Fontsize))
    } else {
        // console.log(enemy1);
        enemy1.push(new TextC(enemy2Face, enemy1[i - 1].x + enemy1Fontsize + 10, enemy1Y, enemy1Fontsize))
    }
}
for (let i = 0; i < 10; i++) {
    if (i == 0) {
        enemy1Y = enemy1[10].y + enemy1Fontsize + 10
        enemy1.push(new TextC(enemy2Face, enemy1X, enemy1Y, enemy1Fontsize))
    } else {
        // console.log(enemy1);
        enemy1.push(new TextC(enemy2Face, enemy1[i - 1].x + enemy1Fontsize + 10, enemy1Y, enemy1Fontsize))
    }
}
for (let i = 0; i < 10; i++) {
    if (i == 0) {
        enemy1Y = enemy1[20].y + enemy1Fontsize + 10
        enemy1.push(new TextC(enemy3Face, enemy1X, enemy1Y, enemy1Fontsize))
    } else {
        // console.log(enemy1);
        enemy1.push(new TextC(enemy3Face, enemy1[i - 1].x + enemy1Fontsize + 10, enemy1Y, enemy1Fontsize))
    }
}

// Draw [END]

// Animation [START]

setInterval(() => {
    // Clear canvas each frame Must to have [START]
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Clear canvas [END]

    ctx.font = '64px'
    if (life !== 0) ctx.fillText(`${lifeIcon.repeat(life)}`, 15, 40)

    ctx.font = '32px Georgia'
    ctx.fillText(player1, mouse.x, canvas.height - 15)

    enemy1.forEach((v, i) => {
        v.x += dx
        if (v.x + dx + 45 > canvas.width || v.x + dx <= 0) {
            dx = -dx;
            if (i == 0 || i == 10 || i == 20 || i == 19 || i == 9) {
                v.x += dx * 1.5
            }
            enemy1.forEach((v, i) => {
                v.y += 7
                if (i == 0) {
                    v.x += dx
                }
            })
            if (v.y >= canvas.height - 30) {
                console.log('lost');
                endGame(enemy1, player1.text, false)
            }
        }

        v.draw()
    })

    if (textCheck) {
        ctx.font = '168px'
        ctx.fillText(text, (canvas.width / 2) - 200, canvas.height / 2)
    }

    eBullets.forEach((v, i) => {
        v.y += 2
        v.draw()
        if (v.y > canvas.height) {
            eBullets.splice(i, 1)
        }
        if (v.x < mouse.x + 38 && v.x + v.width > mouse.x &&
            v.y < canvas.height - 20 && v.y + v.height > canvas.height - 20) {
            console.log('hit player');
            player1 = ''
            setTimeout(() => {
                player1 = '🗻'
                setTimeout(() => {
                    player1 = ''
                    setTimeout(() => {
                        player1 = '🗻'
                        setTimeout(() => {
                            player1 = ''
                            setTimeout(() => {
                                player1 = '🗻'
                            }, 100);
                        }, 100);
                    }, 100);
                }, 100);
            }, 100);
            if (lifeCheck) {
                lifeCheck = false
                life -= 1
                setTimeout(() => {
                    lifeCheck = true
                }, 1500);
            }
            if (life <= 0) {
                player1 = ''
                endGame(enemy1, player1.text, false)
            }
        }
    });
    // console.log(eBullets);


    bullets.forEach((v, i) => {
        v.y -= 5
        v.draw()
        if (v.y < 0) {
            bullets.splice(i, 1)
        }
        enemy1.forEach((v2, i2) => {
            // distx = v2.x - v.x
            // disty = v2.y - v.y
            // sqaureRoute = sqrt(distx ** 2 + disty ** 2)
            if (v.x < v2.x + 38 && v.x + v.width > v2.x &&
                v.y < v2.y + 32 && v.y + v.height > v2.y) {
                console.log('hit');
                deathAnimation(Math.floor(Math.random() * 5), v2)
                bullets.splice(i, 1)
                setTimeout(() => {
                    enemy1.splice(i2, 1)
                }, 500);
            }
            // enemy1.length == 0 ? endGame(enemy1, player1.text, true) : null
            // console.log(enemy1.length);
        })
    })

}, 10);

setTimeout(() => {
    setInterval(() => {
        let ran2 = Math.floor(Math.random() * enemy1.length)
        let ran3 = Math.floor(Math.random() * enemy1.length)
        let ran4 = Math.floor(Math.random() * enemy1.length)
        let ran5 = Math.floor(Math.random() * enemy1.length)
        let ran6 = Math.floor(Math.random() * enemy1.length)
        let ran7 = Math.floor(Math.random() * enemy1.length)
        // console.log(`ran2 : ${ran2}  ran3 ${ran3}`);
        let e1 = enemy1[ran2]
        let e2 = enemy1[ran3]
        let e3 = enemy1[ran4]
        let e4 = enemy1[ran5]
        let e5 = enemy1[ran6]
        let e6 = enemy1[ran7]
        eShoot(e1)
        eShoot(e2)
        setTimeout(() => {
            eShoot(e3)
        }, 2000);
        setTimeout(() => {
            eShoot(e4)
        }, 4000);
        setTimeout(() => {
            eShoot(e5)
        }, 6000);
        setTimeout(() => {
            eShoot(e6)
        }, 3000);

    }, 4000);
}, 4000);

setInterval(() => {
    if (enemy1.length <= 0) {
        endGame(enemy1, player1.text, true)
    }
}, 5000);

// Animation [END]



// Eventlistners [START]

addEventListener('mousemove', (event) => {
    mouse.x = event.clientX
    mouse.y = event.clientY
})

//? this takes care of screen resizing to give canvas the full browser
//? 'window' rather than document to track the window not html
window.addEventListener('resize', () => {
    canvas.width = innerWidth - 25
    canvas.height = innerHeight - 30
    console.log(`Canvas Size : X${canvas.width} Y${canvas.height}`);
    setTimeout(() => {
        location.reload()
    }, 1500);
})

addEventListener('click', () => {
    if (allowClick) {
        player1 = '🌋'
        console.log('click');
        bullets.push(new RectangleObj(mouse.x + 17, canvas.height - 45, 5, 5, 'red'))
        setTimeout(() => {
            player1 = '🗻'
        }, 200)

        // console.log(bullets);

        allowClick = false
        setTimeout(() => {
            allowClick = true
        }, 350)
    } else {
        console.log(`too fast`);
    }
})

// Eventlistners [END]

// functions [START]

function deathAnimation(ran, v2) {
    if (ran == 0) {
        v2.text = '💢'
        setTimeout(() => {
            v2.text = '🤬'
            setTimeout(() => {
                v2.text = '💢'
                setTimeout(() => {
                    v2.text = '🤬'
                    setTimeout(() => {
                        v2.text = '💢'
                    }, 100);
                }, 100);
            }, 100);
        }, 100);
    } else if (ran == 1) {
        v2.text = '🔅'
        setTimeout(() => {
            v2.text = '🔆'
            setTimeout(() => {
                v2.text = '🔅'
                setTimeout(() => {
                    v2.text = '🔆'
                    setTimeout(() => {
                        v2.text = '🔅'
                    }, 100);
                }, 100);
            }, 100);
        }, 100);
    } else if (ran == 2) {
        v2.text = '🔴'
        setTimeout(() => {
            v2.text = '🔶'
            setTimeout(() => {
                v2.text = '🔴'
                setTimeout(() => {
                    v2.text = '🔶'
                    setTimeout(() => {
                        v2.text = '🔴'
                    }, 100);
                }, 100);
            }, 100);
        }, 100);
    } else if (ran == 3) {
        v2.text = '⭕'
        setTimeout(() => {
            v2.text = '⛔'
            setTimeout(() => {
                v2.text = '⭕'
                setTimeout(() => {
                    v2.text = '⛔'
                    setTimeout(() => {
                        v2.text = '⭕'
                    }, 100);
                }, 100);
            }, 100);
        }, 100);
    } else {
        v2.text = '🖤'
        setTimeout(() => {
            v2.text = '💔'
            setTimeout(() => {
                v2.text = '🖤'
                setTimeout(() => {
                    v2.text = '💔'
                    setTimeout(() => {
                        v2.text = '🖤'
                    }, 100);
                }, 100);
            }, 100);
        }, 100);
    }
}

function eShoot(eFace) {
    if (eFace != undefined) {
        if (eFace.text == '🤢') {
            eFace.text = '🤮'
            eBullets.push(new RectangleObj(eFace.x, eFace.y, 10, 10, 'green'))
            setTimeout(() => {
                eFace.text = '🤢'
            }, 800);
        } else if (eFace.text == '😷') {
            eFace.text = '😩'
            eBullets.push(new RectangleObj(eFace.x, eFace.y, 10, 10, 'yellow'))
            setTimeout(() => {
                eFace.text = '😷'
            }, 800);
        } else if (eFace.text == '😈') {
            eFace.text = '👿'
            eBullets.push(new RectangleObj(eFace.x, eFace.y, 10, 10, 'red', 'black'))
            setTimeout(() => {
                eFace.text = '😈'
            }, 800);
        }
    }
}

function endGame(arr1, player1, Victory) {
    if (Victory) {
        arr1 = []
        text = 'Winner Winner No Chicken Thou'
        textCheck = true
        setTimeout(() => {
            location.reload()
        }, 10000);
    } else {
        arr1.splice(0, arr1.length)
        arr1.push(new RectangleObj(0,0,0,0))
        text = 'I guess YOU LOST! HA'
        textCheck = true
        setTimeout(() => {
            location.reload()
        }, 10000);
    }
}
