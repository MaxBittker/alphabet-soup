import * as Matter from "matter-js";
import { render } from "react-dom";
let debug = false;
// debug = true;
// module aliases
let Engine = Matter.Engine,
  World = Matter.World,
  Vector = Matter.Vector,
  Bodies = Matter.Bodies,
  Render = Matter.Render,
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
const textStyle = `font-size: 18px; alignment-baseline: middle; text-anchor: middle;`;
function renderedTextSize(string: string) {
  scratchSvg.innerHTML = `<text id="scratchText" style="${textStyle}">${string}</text>`;
  let scratchText = document.getElementById("scratchText");
  var bBox = scratchText.getBBox();
  return {
    width: bBox.width,
    height: bBox.height
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
  var mouse = Mouse.create(debug ? render.canvas : touch),
    mouseConstraint = MouseConstraint.create(engine, {
      mouse: mouse,
      constraint: {
        // allow bodies on mouse to rotate
        angularStiffness: 0,
        render: {
          visible: false
        }
      }
    });

  World.add(engine.world, mouseConstraint);
  engine.world.gravity.y = 0;

  // keep the mouse in sync with rendering
  // render.mouse = mouse;

  let boxes = [];

  let ground = Bodies.rectangle(
    200,
    window.innerHeight + 40,
    window.innerWidth * 3,
    100,
    {
      isStatic: true
    }
  );
  let leftWall = Bodies.rectangle(-50, 200, 100, 4000, { isStatic: true });
  let rightWall = Bodies.rectangle(window.innerWidth + 50, 200, 100, 4000, {
    isStatic: true
  });

  // add all of the bodies to the world
  World.add(engine.world, [ground, leftWall, rightWall]);
  //   World.add(engine.world, [ground, leftWall, rightWall]); //, leftRamp, rightRamp]);

  // run the engine
  Engine.run(engine);

  let radToDeg = r => r * (180 / Math.PI);
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
      path = `<path d="${pathData}" style="${style}"></path>`;
      return ` <g transform="${transform}" >
        ${path}
        <text style="${textStyle}">${body.label}</text>
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
      width += 10;
      height += 5;
      let body = Bodies.rectangle(
        100 + Math.random() * 100,
        Math.random() * window.innerHeight - 100,
        width,
        height
      );
      body._width = width;
      body._height = height;
      // body.frictionAir = 0.03;
      body.label = word;
      body.torque = Math.random() - 0.5;
      body.force = { x: 0.01, y: 0.0 };
      boxes.push(body);
      console.log(lastBody);
      if (lastBody) {
        var constraint = Constraint.create({
          bodyA: body,
          pointA: { x: -body._width / 2, y: -body._height / 2 },
          bodyB: lastBody,
          pointB: { x: lastBody._width / 2, y: -body._height / 2 },
          stiffness: 0.001,
          damping: 0.9,
          length: 3
        });
        var constraint2 = Constraint.create({
          bodyA: body,
          pointA: { x: -body._width / 2, y: body._height / 2 },
          bodyB: lastBody,
          pointB: { x: lastBody._width / 2, y: body._height / 2 },
          stiffness: 0.01,
          damping: 0.1,
          length: 5
        });
        World.add(engine.world, [body, constraint, constraint2]);
      } else {
        World.add(engine.world, [body]);
      }
      lastBody = body;

      return body;
    },
    removeWord: () => {
      let box = closestBody(boxes, { x: 175, y: 350 * 1.25 });
      if (!box) return;
      //   box.isSleeping = false;
      Matter.Body.setVelocity(box, { x: 0, y: -5 });
      box.pulse = true;
      //   console.log("a");
      window.setTimeout(() => {
        // console.log("c");
        World.remove(engine.world, box);
        boxes = boxes.filter(b => b != box);
      }, 200);

      return box.label;
    }
  };
}
export { startPhysics };
