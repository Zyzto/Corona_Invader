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

let emeny = []
let bullets = []
let txt = 'hello'
let player1 = '🗻'
let allowClick = true;

// let newT = new TextObj(txt, 50, mouse.y, 0, 64, 'red')

// Init [END]

// Draw [START]

// ctx.beginPath()
// ctx.font = '64px Georgia'
// ctx.fillText('hello',mouse.x,mouse.y)



// Draw [END]

// Animation [START]

setInterval(() => {
    // Clear canvas each frame Must to have [START]
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Clear canvas [END]


    ctx.font = '32px Georgia'
    ctx.fillText(player1, mouse.x, canvas.height - 15)

    bullets.forEach((v, i) => {
        v.y -= 2
        v.draw()
        if (v.y < 0) {
            bullets.splice(i, 1)
        }
    })

}, 10);

// Animation [END]

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
        // a bit overkill for this tutorial
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

class TextObj {
    // you create new Rectangles by calling this as a function
    // these are the arguments you pass in
    // add default values to avoid errors on empty arguments
    constructor(
        text = '', x = 0, y = 0,
        width = 0, fontsize = 16, fillColor = 'black'
    ) {
        // ensure the arguments passed in are numbers
        this.text = String(text)
        this.x = Number(x)
        this.y = Number(y)
        this.width = Number(width)
        this.fontsize = Number(fontsize)
        this.fillColor = String(fillColor)
    }

    // get keyword causes this method to be called
    get area() {
        return this.width
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
        return this.y + (this.fontsize / 2)
    }

    // get Y position at bottom
    // get bottom() {
    //     return this.y + this.height
    // }

    // draw rectangle to screen
    draw() {
        // destructuring
        const {
            text,
            x,
            y,
            width,
            fillColor,
        } = this

        // saves the current styles set elsewhere
        // to avoid overwriting them
        ctx.save()

        // Draw Text
        ctx.font = `${this.fontsize}px`
        ctx.fillText(text, x, y, width)
        ctx.fillStyle = `${fillColor}`

        // restores the styles from earlier
        // preventing the colors used here
        // from polluting other drawings
        ctx.restore()
    }
}

// Classes [END]

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
})

addEventListener('click', () => {
    if (allowClick) {
    player1 = '🌋'
    console.log('click');
    bullets.push(new RectangleObj(mouse.x + 17, canvas.height - 45, 5, 5, 'red'))
    setTimeout(() => {
        player1 = '🗻'
    }, 200)

    console.log(bullets);

    allowClick = false
    setTimeout(() => {
        allowClick = true
    }, 1000)
    } else {
        console.log(`too fast`);
}
})

// Eventlistners [END]