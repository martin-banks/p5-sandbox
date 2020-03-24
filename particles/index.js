/* eslint-globals Matter */

// Settings
let initialCases = 1
let mortalityRate = 0.4
let subjects = 100
let distancing = 0.6
let simulationLength = 20
let infectionLength = 6

const stats = {
  healthy: 0,
  infected: 0,
  cured: 0,
  dead: 0,
}

const dump = document.querySelector('pre.dump')
const chartContainer = document.querySelector('div.chart')
const maxDeadLine = document.querySelector('.chartContainer hr')

const inputs = {
  start: document.querySelector('button#start'),
  distancing: document.querySelector('#distancing input'),
  infection: document.querySelector('#infectionLength input'),
  simulation: document.querySelector('#simulationLength input'),
}

inputs.distancing.addEventListener('change', function () {
  console.log('distancing', this.value)
  distancing = parseInt(this.value, 10) / 100
})
inputs.infection.addEventListener('change', function () {
  console.log('infectionLength', this.value)
  infectionLength = parseInt(this.value, 10)
})
inputs.simulation.addEventListener('change', function () {
  console.log('simulationLength', this.value)
  simulationength = parseInt(this.value, 10)
})

maxDeadLine.style.top = `${chartContainer.offsetHeight - (chartContainer.offsetHeight * mortalityRate)}px`

const chart = []
function barTemplate (data) {
  const total = Object.keys(stats).reduce((total, a) => total + stats[a], 0)
  return `<div class="chart__bar"><!--
    --><div class="chart__bar--section cured" style="height: ${data.cured && data.cured / total * 100}px" ></div><!--
    --><div class="chart__bar--section healthy" style="height: ${data.healthy && data.healthy / total * 100}px" ></div><!--
    --><div class="chart__bar--section infected" style="height: ${data.infected && data.infected / total * 100}px" ></div><!--
    --><div class="chart__bar--section dead" style="height: ${data.dead && data.dead / total * 100}px" ></div><!--
  --></div>`
}
function updateChart (data) {
  chart.push(barTemplate(data))
  chartContainer.innerHTML = chart.join('')
}



// Core methods
const { Engine, Render, World, Bodies, Events } = Matter
Matter.Resolver._restingThresh = 1; // default is 4

// Create our engine
const engine = Engine.create()

// Create a renderer
const element = document.querySelector('#matter')
const render = Render.create({ element, engine })
render.options.wireframes = false

// Create our elements
// const ground = Bodies.rectangle(0, 600, 2000, 10, { isStatic: true, restitution: 1 })
const walls = [
  Bodies.rectangle(0, -500, 2000, 1000, { isStatic: true, inertia: Infinity }),       // ? top
  Bodies.rectangle(1300, 0, 1000, 2000, { isStatic: true, inertia: Infinity }),     // ? right
  Bodies.rectangle(0, 1100, 2000, 1000, { isStatic: true, inertia: Infinity }),     // ? bottom
  Bodies.rectangle(-500, 0, 1000, 1500, { isStatic: true, inertia: Infinity }),       // ? left
]

walls.forEach(w => {
  w.render.fillStyle = '#000000'
  w.restitution = 0.8
})

// Add elements to the world
// World.add(engine.world, [boxA, boxB, ground])
const boxes = [... new Array(subjects)]
  .map((b, i) => Bodies.polygon(
    Math.random() * 780 + 10, // x
    Math.random() * 580 + 10, // y
    10,
    4,
    {
      frictionAir: 0,
      friction: 0,
      frictionStatic: 0,
      // density: 1,
      restitution: 0.8,
      label: `circle--${i}`,
      // mass: 0,
      // inertia: Infinity,
      // inverseInertia: 0,
      render: {
        fillStyle: 'lightblue',
        strokeStyle: 'white',
        lineWidth: 1
      },
      isStatic: i > (subjects - (subjects * distancing)),
      // slob: 0,
      collisionFilter: {
        category: '0x0001',
        mask: '0x0001',
      },
      status: 'normal',
    }
  ))

boxes.forEach(b => {
  const a = Math.random() * Math.PI * 2
  const vectorX = Math.cos(a)
  const vectorY = Math.sin(a)
  Matter.Body.setVelocity(b, {
    x: vectorX * 1, // (Math.random() - 0.5) * 5,
    y: vectorY * 1, // (Math.random() - 0.5) * 5,
  })
  // console.log(0.2 * a)
  Matter.Body.applyForce(b,
    { x: 0, y: 0 },
    { x: 0.00002 * vectorX, y: 0.00002 * vectorY }
  )
})

engine.world.gravity.scale = 0
World.add(engine.world, [...boxes, ...walls])

function killOrCure (body) {
  stats.infected -= 1
  const chance = Math.random()
  if (chance > mortalityRate) {
    // cured!
    // console.log('💊💊💊💊 CURED 💊💊💊💊', body)
    body.status = 'cured'
    body.render.fillStyle = '#00ff00'
    stats.cured += 1
  } else {
    // dead
    body.collisionFilter.mask = '0x0004'
    setTimeout(() => {
      body.render.fillStyle = '#000000'
      body.status = 'dead'
      Matter.Body.setVelocity(body, { x: 0, y: 0 })
      // console.log('☠️☠️☠️☠️ DEAD ☠️☠️☠️☠️', body.status, body)
      stats.dead += 1
    }, 200)
  }
}



Events.on(engine, 'collisionEnd', (x) => {
  x.pairs.forEach(p => {
    const { bodyA, bodyB } = p

    const cured = (bodyA.status === 'cured' || bodyB.status === 'cured')
    if (cured) return

    const infected = (bodyA.status === 'infected' || bodyB.status === 'infected')
      && (bodyA.label.includes('circle') && bodyB.label.includes('circle'))

    if (infected) {
      if (bodyA.status === 'normal') {
        setTimeout(() => {
          killOrCure(bodyA)
        }, infectionLength * 1000)
      } else if (bodyB.status === 'normal') {
        setTimeout(() => {
          killOrCure(bodyB)
        }, infectionLength * 1000)
      }
      if (bodyA.status !== 'infected') {
        bodyA.render.fillStyle = '#ff0000'
        bodyA.status = 'infected'
        stats.healthy -= 1
        stats.infected += 1
      }
      if (bodyB.status !== 'infected') {
        bodyB.render.fillStyle = '#ff0000'
        bodyB.status = 'infected'
        stats.healthy -= 1
        stats.infected += 1
      }
    } else {
      if (bodyA.render.fillStyle === '#00ff00' || bodyB.render.fillStyle === '#00ff00') {
        console.log(bodyA.render.fillStyle, bodyB.render.fillStyle)
      }
    }
  })
})


let running = false
function updateDump () {
  dump.innerHTML = JSON.stringify(stats, null, 2)
  if (running) {
    window.requestAnimationFrame(updateDump)
  }
}

let chartInterval = null

// Start the engine
// setTimeout(() => {
//   running = true
//   Engine.run(engine)
//   Render.run(render)
//   stats.healthy = (subjects - 1)
//   stats.infected = initialCases
//   for (let i = 0; i < initialCases; i++) {
//     boxes[i].status = 'infected'
//     boxes[i].render.fillStyle = 'purple'
//     setTimeout(() => {
//       killOrCure(boxes[i])
//     }, 5000)
//   }

//   setTimeout(() => {
//     console.log('Stopping simulation')
//     Render.stop(render)
//     running = false
//   }, simulationLength * 1000)

//   window.requestAnimationFrame(updateDump)
//   chartInterval = setInterval(() => {
//     if (running) {
//       window.requestAnimationFrame(() => {
//         updateChart(stats)
//       })
//     } else {
//       clearInterval(chartInterval)
//     }
//   }, 100)
// }, 2000)


inputs.start.addEventListener('click', function () {
  this.style.display = 'none'

  running = true
  Engine.run(engine)
  Render.run(render)
  stats.healthy = (subjects - 1)
  stats.infected = initialCases
  for (let i = 0; i < initialCases; i++) {
    boxes[i].status = 'infected'
    boxes[i].render.fillStyle = 'purple'
    setTimeout(() => {
      killOrCure(boxes[i])
    }, 5000)
  }

  setTimeout(() => {
    console.log('Stopping simulation')
    Render.stop(render)
    Render.stop(render)
    running = false
  }, simulationLength * 1000)

  window.requestAnimationFrame(updateDump)
  chartInterval = setInterval(() => {
    if (running) {
      window.requestAnimationFrame(() => {
        updateChart(stats)
      })
    } else {
      clearInterval(chartInterval)
    }
  }, 100)
})


// function setup() {
//   createCanvas(800, 800);
// }

// function draw() {
//   background(220);
// }