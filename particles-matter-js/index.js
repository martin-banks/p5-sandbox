/* eslint-globals Matter */
const { Engine, Render, World, Bodies, Events } = Matter

// Settings
let initialCases = 1
let mortalityRate = 0
let subjects = 250
let distancing = 0.8
let simulationLength = 20
let infectionLength = 7

const stats = {
  healthy: 0,
  infected: 0,
  cured: 0,
  dead: 0,
}

const dump = document.querySelector('pre.dump')
const chartContainer = document.querySelector('div.chart')
const maxDeadLine = document.querySelector('.chartContainer hr.expectedDead')

const inputs = {
  start: document.querySelector('button#start'),
  distancing: document.querySelector('#distancing input'),
  // infection: document.querySelector('#infectionLength input'),
  // simulation: document.querySelector('#simulationLength input'),
}

function setDistancing () {
  const { value } = inputs.distancing
  console.log('distancing', value)
  distancing = parseInt(value, 10) / 100
  inputs.distancing.parentElement.querySelector('span').innerText = distancing
}
// function setInfectionLength () {
//   const { value } = inputs.infection
//   console.log('infectionLength', value)
//   // infectionLength = parseInt(value, 10)
//   inputs.infection.parentElement.querySelector('span').innerText = infectionLength
// }
// function setSimulationLength () {
//   const { value } = inputs.simulation
//   console.log('simulationLength', value)
//   // simulationLength = parseInt(value, 10)
//   inputs.simulation.parentElement.querySelector('span').innerText = simulationLength
// }
inputs.distancing.addEventListener('change', setDistancing)
// inputs.infection.addEventListener('change', setInfectionLength)
// inputs.simulation.addEventListener('change', setSimulationLength)

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

let running = false
function updateDump () {
  dump.innerHTML = JSON.stringify(stats, null, 2)
  if (running) {
    window.requestAnimationFrame(updateDump)
  }
}

let chartInterval = null

// Set up Matter.js engine and renderer
const engine = Engine.create()
const element = document.querySelector('#matter')
const render = Render.create({ element, engine })
render.options.wireframes = false

// Start the Matter.js engine
Engine.run(engine)

setDistancing()
// setInfectionLength()
// setSimulationLength()


function killOrCure (body) {
  stats.infected -= 1
  const chance = Math.random()
  if (chance > mortalityRate) {
    // cured!
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
      stats.dead += 1
    }, 200)
  }
}


inputs.start.addEventListener('click', function () {
  Matter.Resolver._restingThresh = 1; // default is 4

  // Create our elements
  const walls = [
    Bodies.rectangle(0, -500, 2000, 1000, { isStatic: true, inertia: Infinity }),       // ? top
    Bodies.rectangle(1300, 0, 1000, 2000, { isStatic: true, inertia: Infinity }),     // ? right
    Bodies.rectangle(0, 1100, 2000, 1000, { isStatic: true, inertia: Infinity }),     // ? bottom
    Bodies.rectangle(-500, 0, 1000, 1500, { isStatic: true, inertia: Infinity }),       // ? left
  ]

  walls.forEach(w => {
    w.render.fillStyle = '#000000'
    w.restitution = 0.9
  })

  // Add elements to the world
  // World.add(engine.world, [boxA, boxB, ground])
  const boxes = [... new Array(subjects)]
    .map((b, i) => Bodies.polygon(
      i < 1 ? 400 : Math.random() * 780 + 10, // x
      i < 1 ? 300 : Math.random() * 580 + 10, // y
      10, // sides
      5, // size
      {
        frictionAir: 0,
        friction: 0,
        frictionStatic: 0,
        // density: 1,
        restitution: 1,
        label: `circle--${i}`,
        // mass: 0,
        inertia: 0,
        inverseInertia: 0,
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

  // Set initial velocity for particles
  boxes.forEach(b => {
    const a = Math.random() * Math.PI * 2
    const vectorX = Math.cos(a)
    const vectorY = Math.sin(a)
    Matter.Body.setVelocity(b, {
      x: vectorX * 1, // (Math.random() - 0.5) * 5,
      y: vectorY * 1, // (Math.random() - 0.5) * 5,
    })
    Matter.Body.applyForce(b,
      { x: 0, y: 0 },
      { x: 0.00001 * vectorX, y: 0.00001 * vectorY }
    )
  })

  engine.world.gravity.scale = 0
  World.add(engine.world, [...boxes, ...walls])


  // Custom actions when a parrticle collision is detected
  Events.on(engine, 'collisionStart', (x) => {
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

  this.style.display = 'none'
  running = true
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
    World.remove(engine.world, [...boxes, ...walls])
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
