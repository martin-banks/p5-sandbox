const population = 50
const speed = 2
const diameter = 9
const people = []
const timeToCure = 5 * 1000
let normalTotal = population
let infectedTotal = 0
let curedTotal = 0
let deadTotal = 0
let running = true
const simulationLength = 10 * 1000
let sessionTime = 0
const distancing = 0.6

const dump = document.querySelector('pre.dump')
const chartContainer = document.querySelector('div.chart')
const maxDeadLine = document.querySelector('.chartContainer hr.expectedDead')

const chart = []
function barTemplate () {
  return `<div class="chart__bar"><!--
    --><div class="chart__bar--section cured" style="height: ${curedTotal && curedTotal / population * 100}px" ></div><!--
    --><div class="chart__bar--section healthy" style="height: ${normalTotal && normalTotal / population * 100}px" ></div><!--
    --><div class="chart__bar--section infected" style="height: ${infectedTotal && infectedTotal / population * 100}px" ></div><!--
    --><div class="chart__bar--section dead" style="height: ${deadTotal && deadTotal / population * 100}px" ></div><!--
  --></div>`
}
const tick = 100
function updateChart () {
  sessionTime += tick
  if (sessionTime > simulationLength) {
    running = false
    return
  }
  chart.push(barTemplate())
  chartContainer.innerHTML = chart.join('')
  setTimeout(() => {
    window.requestAnimationFrame(updateChart)
  }, tick)
}
window.requestAnimationFrame(updateChart)


class Person {
  constructor ({ x, y, index, diameter, infected, status, moving }) {
    this.infected = infected
    this.status = status
    this.infectedTime = infected ? new Date().getTime() : null
    this.moving = moving
    this.id = index
    this.diameter = diameter
    this.position = { x, y }
    this.velocity = {
      x: random(-1, 1) * speed,
      y: random(-1, 1) * speed,
    }
  }

  move () {
    this.position.x += this.velocity.x
    this.position.y += this.velocity.y
    if ((this.position.x + (this.diameter / 2)) > width) {
      this.position.x = width - (this.diameter / 2)
      this.velocity.x *= -1
    } else if ((this.position.x - (this.diameter / 2)) < 0) {
      this.position.x = this.diameter / 2
      this.velocity.x *= -1
    }
    if ((this.position.y + (this.diameter / 2)) > height) {
      this.position.y = height - (this.diameter / 2)
      this.velocity.y *= -1
    } else if ((this.position.y - (this.diameter / 2)) < 0) {
      this.position.y = this.diameter / 2
      this.velocity.y *= -1
    }
  }

  intersect () {
    for (let i = this.id + 1; i < population; i++) {
      if (this.id === i) return

      let distanceX = people[i].position.x - this.position.x
      let distanceY = people[i].position.y - this.position.y
      let distance = sqrt((distanceX * distanceX) + (distanceY * distanceY))
      let minDist = (people[i].diameter / 2) + (this.diameter / 2)

      if (distance < minDist) {
        // Handle update directions
        if (this.velocity.x > 0) {
          if (this.position.x > people[i].position.x) {
            people[i].velocity.x *= -1
          } else {
            this.velocity.x *= -1
          }
        } else {
          if (this.position.x > people[i].position.x) {
            this.velocity.x *= -1
          } else {
            people[i].velocity.x *= -1
          }
        }

        if (this.velocity.y > 0) {
          if (this.position.y > people[i].position.y) {
            people[i].velocity.y *= -1
          } else {
            this.velocity.y *= -1
          }
        } else {
          if (this.position.y > people[i].position.y) {
            this.velocity.y *= -1
          } else {
            people[i].velocity.y *= -1
          }
        }

        // Handle update infected
        if (!this.infected && !people[i].infected) {
          return
        } else if (this.infected && people[i].infected) {
          return

        } else if (this.status === 'normal' && people[i].status === 'infected') {
          this.infected = true
          this.status = 'infected'
          this.infectedTime = new Date().getTime()
          normalTotal--
          infectedTotal++
          return

        } else if (this.status === 'infected' && people[i].status === 'normal') {
          people[i].infected = true
          people[i].status = 'infected'
          people[i].infectedTime = new Date().getTime()
          normalTotal--
          infectedTotal++
          return
        }
      }
    }
  }

  statusUpdate () {
    if (this.status === 'normal') return
    if (this.status === 'infected') {
      if (this.infectedTime && ((this.infectedTime + timeToCure) <= new Date().getTime())) {
        this.status = 'cured'
        this.infected = false
        infectedTotal--
        curedTotal++
      }
    }
  }

  display (person) {
    if (this.status === 'infected') {
      fill(255, 0, 0)
    } else if (this.status === 'cured') {
      fill(0, 255, 0)
    } else {
      fill(255)
    }
    ellipse(this.position.x, this.position.y, this.diameter, this.diameter)
    noStroke()
  }
}


function setup () {
  createCanvas(800, 400)
  for (let i = 0; i < population; i++) {
    people.push(new Person({
      x: random(width),
      y: random(height),
      index: i,
      diameter, // : diameter + (10 * i),
      infected: i < 1,
      status: i < 1 ? 'infected' : 'normal',
      moving: i < (population * distancing),
    }))
  }
}

function draw () {
  background(0)
  people.forEach(function (person, i) {
    if (running) {
      if (person.moving){
        person.move()
      }
      person.intersect(i)
      person.statusUpdate()
    }
    person.display(person)
  })
  dump.innerText = JSON.stringify({
    population,
    normalTotal,
    infectedTotal,
    curedTotal,
  }, null, 2)
}

function stop () {
  running = false
}


