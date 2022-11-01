const canvas: HTMLCanvasElement = document.getElementById("game") as HTMLCanvasElement
const context = canvas.getContext("2d")!
console.log("Starting...")

interface GameObject {
    physics(seconds: number): void
    draw(context: CanvasRenderingContext2D): void
}

function deadzone(num: number): number {
    if (Math.abs(num) < 0.2) return 0
    else return num
}

function dist(deltaX: number, deltaY: number): number {
    return Math.sqrt(deltaX * deltaX + deltaY * deltaY)
}

class ExamplePlayer implements GameObject {
    constructor(public gamepadNum: number, public x: number = 0, public y: number = 0) { }
    radius = 3
    bulletRadius = 1
    vx = 0
    vy = 0
    angle = 0
    charge = 0
    damage = 0
    physics(seconds: number): void {
        const pad = navigator.getGamepads()[this.gamepadNum]
        if (pad != null) {
            this.x += deadzone(pad.axes[0]) * 40 * seconds * (1.2 - this.charge) / 1.2
            this.y += deadzone(pad.axes[1]) * 40 * seconds * (1.2 - this.charge) / 1.2
            if(dist(pad.axes[3], pad.axes[2]) > 0.7) {
                this.angle = Math.atan2(pad.axes[3], pad.axes[2])
                this.charge = Math.min(this.charge + seconds, 1)
            } else if(this.charge > 0) {
                if(this.charge > 0.1) {
                    objects.push(new Bullet(
                        this.gamepadNum,
                        this.x,
                        this.y,
                        Math.cos(this.angle) * this.charge * -400,
                        Math.sin(this.angle) * this.charge * -400,
                        this.bulletRadius
                    ))
                }
                this.charge = 0
            }
        }
        this.x += this.vx * seconds
        this.y += this.vy * seconds
        if(dist(this.vx, this.vy) > 10) {
            this.vx -= 10 * this.vx / Math.abs(this.vx + this.vy)
            this.vy -= 10 * this.vy / Math.abs(this.vx + this.vy)
        } else {
            this.vx = 0
            this.vy = 0
        }
        if(dist(this.x, this.y) > 100) {
            this.x = 0
            this.y = 0
            this.vx = 0
            this.vy = 0
            this.damage = 0
        }
        for(const other of objects) {
            if(other instanceof Bullet && other.gamepadNum != this.gamepadNum) {
                if(dist(this.x - other.x, this.y - other.y) < this.radius + other.radius) {
                    this.damage += other.damage
                    this.vx += other.vx * this.damage / 100
                    this.vy += other.vy * this.damage / 100
                    objects.splice(objects.indexOf(other), 1)
                }
            }
        }
    }
    draw(context: CanvasRenderingContext2D): void {
        context.strokeStyle = "red"
        context.lineWidth = 1
        context.beginPath()
        context.ellipse(this.x, this.y, this.radius, this.radius, 0, 0, 360)
        context.stroke()
        context.beginPath()
        context.ellipse(
            this.x + this.charge * (this.radius - this.bulletRadius) * Math.cos(this.angle), 
            this.y + this.charge * (this.radius - this.bulletRadius) * Math.sin(this.angle), 
            1, 1, 0, 0, 360
        )
        context.stroke()
        context.textAlign = "center"
        context.fillStyle = "red"
        // context.font
        context.fillText(Math.round(this.damage).toString(), this.x, this.y - 5)
    }
}

class Bullet implements GameObject {
    constructor(public gamepadNum: number, public x: number = 0, public y: number = 0, public vx: number = 0, public vy: number = 0, public radius: number = 1) { }
    damage = dist(this.vx, this.vy) / 10
    physics(seconds: number): void {
        this.x += this.vx * seconds
        this.y += this.vy * seconds
        if(Math.sqrt(this.x * this.x + this.y * this.y) > 100) {
            objects.splice(objects.indexOf(this), 1)
        }
        for(const other of objects) {
            if(other instanceof Bullet && other.gamepadNum != this.gamepadNum) {
                if(dist(this.x - other.x, this.y - other.y) < this.radius + other.radius) {
                    objects.splice(objects.indexOf(this), 1)
                }
            }
        }
    }
    draw(context: CanvasRenderingContext2D): void {
        context.strokeStyle = "red"
        context.lineWidth = 1
        context.beginPath()
        context.ellipse(this.x, this.y, this.radius, this.radius, 0, 0, 360)
        context.stroke()
    }

}

const objects: Array<GameObject> = [new ExamplePlayer(0, 0, 0), new ExamplePlayer(1, 10, 10)]

let lastFrame = Date.now()
function frame() {
    const now = Date.now()
    const seconds = (now - lastFrame) / 1000
    lastFrame = now
    if (canvas.width != canvas.scrollWidth || canvas.height != canvas.scrollHeight) {
        canvas.width = canvas.scrollWidth
        canvas.height = canvas.scrollHeight
    }

    context.clearRect(0, 0, canvas.width, canvas.height)
    context.save()
    context.translate(canvas.width / 2, canvas.height / 2)
    const canvasSize = Math.min(canvas.width / 2, canvas.height / 2)
    context.scale(canvasSize / 100, canvasSize / 100)

    context.strokeStyle = "black"
    context.lineWidth = 1
    context.beginPath()
    context.ellipse(0, 0, 100, 100, 0, 0, 360)
    context.stroke()

    for (const obj of objects.concat([])) {
        obj.physics(seconds)
        obj.draw(context)
    }

    context.restore()
    window.requestAnimationFrame(ev => {
        frame()
    })
}

window.requestAnimationFrame(ev => {
    frame()
})