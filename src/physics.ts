import * as Matter from "matter-js";
import { render } from "react-dom";
import bigrams from "./bigrams";
console.log(bigrams);
let debug = false;
// debug = true;
// module aliases
let Engine = Matter.Engine,
  World = Matter.World,
  Vector = Matter.Vector,
  Bodies = Matter.Bodies,
  Render = Matter.Render,
  Query = Matter.Query,
  Constraint = Matter.Constraint,
  MouseConstraint = Matter.MouseConstraint,
  Mouse = Matter.Mouse;

// create an engine
let engine = Engine.create({
  positionIterations: 5,
  constraintIterations: 5
  //   enableSleeping: true
});

var render;
if (debug) {
  // create renderer
  render = Render.create({
    element: document.body,
    engine: engine,
    options: {
      width: window.innerWidth,
      height: window.innerHeight,
      showAngleIndicator: true,
      wireframes: false
    }
  });

  Render.run(render);
}

let scratchSvg = document.getElementById("scratch");
const textStyle = `font-size: 5.5em; alignment-baseline: middle; text-anchor: middle;`;
function renderedTextSize(string: string) {
  scratchSvg.innerHTML = `<text id="scratchText" style="${textStyle}">${string}</text>`;
  let scratchText = document.getElementById("scratchText");
  var bBox = scratchText.getBBox();
  return {
    width: bBox.width,
    height: bBox.height * 0.9
  };
}
function closestBody(bodies: [], point: Matter.Vector) {
  if (bodies.length == 0) {
    return;
  }
  let smallest_d = Infinity;
  let smallest = bodies[0];
  bodies.forEach(body => {
    let d = Vector.magnitude(Vector.sub(body.position, point));
    // console.log(body);
    if (d < smallest_d) {
      smallest = body;
      smallest_d = d;
    }
  });
  return smallest;
}

function startPhysics(box) {
  // add mouse control
  let touch = document.getElementById("touch");
  if (debug) {
    touch.style = "z-index:-4";
  }
  var mouse = Mouse.create(debug ? render.canvas : touch),
    mouseConstraint = MouseConstraint.create(engine, {
      mouse: mouse,
      constraint: {
        // allow bodies on mouse to rotate
        angularStiffness: 0.5,
        render: {
          visible: false
        }
      }
    });

  World.add(engine.world, mouseConstraint);
  engine.world.gravity.y = 0.0;

  // keep the mouse in sync with rendering
  // render.mouse = mouse;

  let boxes = [];

  let ground = Bodies.rectangle(
    200,
    window.innerHeight + 95,
    window.innerWidth * 3,
    200,
    {
      isStatic: true
    }
  );
  let ceiling = Bodies.rectangle(200, -95, window.innerWidth * 3, 200, {
    isStatic: true
  });
  let leftWall = Bodies.rectangle(-95, 200, 200, 4000, { isStatic: true });
  let rightWall = Bodies.rectangle(window.innerWidth + 95, 200, 200, 4000, {
    isStatic: true
  });

  // add all of the bodies to the world
  World.add(engine.world, [ground, ceiling, leftWall, rightWall]);
  //   World.add(engine.world, [ground, leftWall, rightWall]); //, leftRamp, rightRamp]);

  // run the engine
  Engine.run(engine);

  let radToDeg = r => r * (180 / Math.PI);
  let degToRad = d => d * (Math.PI / 180);

  Matter.Events.on(engine, "beforeUpdate", () => {
    boxes.forEach(body => {
      const { position } = body;
      let r = 50;
      let bound = Matter.Bounds.create([
        Matter.Vector.sub(body.position, { x: r, y: r }),
        Matter.Vector.add(body.position, { x: r, y: r })
      ]);
      let neighbors = Query.region(boxes, bound);
      // console.log(neighbors.length);
      // body._dvx = 0;
      // body._dvy = 0;
      neighbors.forEach(neighbor => {
        const delta = Matter.Vector.sub(body.position, neighbor.position);
        const distance2 = Matter.Vector.magnitudeSquared(delta);

        if (distance2 == 0) {
          return;
        }

        let a = body.label.toUpperCase();
        let b = neighbor.label.toUpperCase();
        let bigram = a + b;

        if (
          Matter.Vector.magnitudeSquared(
            Matter.Vector.sub(body.vertices[0], neighbor.position)
          ) <
          Matter.Vector.magnitudeSquared(
            Matter.Vector.sub(body.vertices[1], neighbor.position)
          )
        ) {
          bigram = b + a;
        }
        // console.log(bigram);

        //TODO arrange letters

        let affinity = 1.0;
        if (bigrams[bigram] != undefined) {
          affinity = bigrams[bigram] / 100;
        }
        // console.log(affinity);

        // console.log(affinity);
        function attract(p1, p2, repel = 1) {
          const delta = Matter.Vector.sub(p2, p1);
          const distance2 = Matter.Vector.magnitudeSquared(delta);

          let intensity = 1 / distance2;
          intensity *= 0.03;
          intensity *= affinity;
          intensity = Math.min(intensity, 0.0005);
          intensity = Math.max(intensity, -0.0005);
          intensity *= repel;
          Matter.Body.applyForce(
            body,
            p2,
            Matter.Vector.mult(delta, intensity)
          );
        }
        // debugger;
        // attract(body.position, neighbor.position);

        attract(body.vertices[0], neighbor.vertices[1]);
        attract(body.vertices[3], neighbor.vertices[2]);
        attract(body.vertices[1], neighbor.vertices[0]);
        attract(body.vertices[2], neighbor.vertices[3]);

        attract(body.vertices[0], neighbor.vertices[0], -0.5);
        attract(body.vertices[0], neighbor.vertices[3], -0.5);

        attract(body.vertices[1], neighbor.vertices[1], -0.5);
        attract(body.vertices[1], neighbor.vertices[2], -0.5);

        attract(body.vertices[2], neighbor.vertices[2], -0.5);
        attract(body.vertices[2], neighbor.vertices[1], -0.5);

        attract(body.vertices[3], neighbor.vertices[3], -0.5);
        attract(body.vertices[3], neighbor.vertices[0], -0.5);

        // body._dvx += ((body._vx || 0) + distance.x) * velocityDecay;
        // body._dvy += ((body._vY || 0) + distance.y) * velocityDecay;
      });
      // Matter.Body.applyForce()
      // setVelocity(body, {
      // x: body._dvx,
      // y: body._dvy
      // });
      // let angle = radToDeg(body.angle);
      // Matter.Body.setAngle(body, degToRad(angle));
    });
  });

  Matter.Events.on(engine, "afterUpdate", () => {
    const paths = boxes.map((body, index) => {
      // const paths = engine.world.bodies.map((body, index) => {
      const { vertices, position, angle } = body;
      const pathData = `M ${body._width * -0.5} ${body._height * -0.5} l ${
        body._width
      } 0 l 0 ${body._height} l ${-body._width} 0 z`;

      let fillColor = !body.pulse ? "white" : "rgba(255,230,230)";
      const style = `fill: ${fillColor}; fill-opacity: 1; stroke: grey; stroke-width: 1px; stroke-opacity: 0.5`;
      const degrees = radToDeg(angle);
      const transform = `translate(${position.x}, ${position.y}) rotate(${degrees})`;
      let path = null;
      // path = `<path d="${pathData}" style="${style}"></path>`;
      return ` <g transform="${transform}" >
        ${path}
        <text style="${textStyle}" id>${body.label}</text>
      </g>`;
    });

    if (!debug) {
      box.innerHTML = ` ${paths.join("\n")} `;
    }
  });
  let lastBody;
  return {
    addWord: (word: string) => {
      let { width, height } = renderedTextSize(word);
      // width += 10;
      if (word.length < 1 || word == " ") {
        width += 30;
        height += 20;
        lastBody = undefined;
        return;
      }
      height *= 0.9;

      let pos = {
        x: window.innerWidth / 4 + (Math.random() * window.innerWidth) / 2,
        y: window.innerHeight * 0.2 + (Math.random() * window.innerHeight) / 8
      };
      if (lastBody && lastBody.position.x < window.innerWidth - 50) {
        pos = Vector.clone(lastBody.vertices[1]);
        pos.y += height / 2;
        pos.x += 60;
      }
      let body = Bodies.rectangle(pos.x, pos.y, width, height);
      body._width = width;
      body._height = height;
      body.frictionAir = 0.05;
      body.label = word;
      body.torque = Math.random() - 0.5;
      body.force = { x: -0.05, y: (Math.random() - 0.5) * 0.1 };
      boxes.push(body);
      if (lastBody && word != " ") {
        var constraint = Constraint.create({
          bodyA: body,
          pointA: { x: -body._width / 2, y: -body._height / 2 },
          bodyB: lastBody,
          pointB: Vector.sub(lastBody.vertices[1], lastBody.position),
          // pointB: { x: lastBody._width / 2, y: -body._height / 2 },
          stiffness: 0.002,
          damping: 0.9,
          length: 5
        });
        // lastBody.angle = 0;
        // debugger;
        var constraint2 = Constraint.create({
          bodyA: body,
          pointA: { x: -body._width / 2, y: body._height / 2 },
          bodyB: lastBody,
          pointB: Vector.sub(lastBody.vertices[2], lastBody.position),
          stiffness: 0.002,
          damping: 0.9,
          length: 5
        });
        body.c1 = constraint;
        body.c2 = constraint2;
        World.add(engine.world, [body]);

        // World.add(engine.world, [body, constraint, constraint2]);
      } else {
        World.add(engine.world, [body]);
      }
      lastBody = body;

      return body;
    },
    removeWord: () => {
      lastBody = undefined;
      let box = boxes[boxes.length - 1];
      if (!box || !box._width) return;
      //   box.isSleeping = false;
      Matter.Body.setVelocity(box, { x: 0, y: -5 });
      box.pulse = true;
      //   console.log("a");
      // window.setTimeout(() => {
      // console.log("c");
      World.remove(engine.world, box);

      boxes = boxes.filter(b => b != box);
      if (box.c1) {
        World.remove(engine.world, [box.c1, box.c2]);
      }
      // }, 100);

      return box.label;
    }
  };
}
export { startPhysics };
