/* ============================================================================
   activities.js — the things he does when nobody is driving.

   An activity is a pose function plus a mark to stand on. While one is running
   it owns the transform outright, which is what keeps each one self-contained:
   adding a sixth is an entry in this map and nothing else.

   Angles are degrees from "hanging straight down", and a limb at angle t points
   in direction (-sin t, cos t). When the whole rig is rotated -90 degrees to lie
   him down, that becomes (cos t, sin t) on stage — so 0 runs toward his feet,
   -90 is straight up, and positive angles dip toward the floor. Getting that
   backwards is how you put a robot's arm through the ground.
   ========================================================================== */

import { RIG_SCALE, up, HIP_Y } from "./rig.js";

const clamp = (n, lo, hi) => (n < lo ? lo : n > hi ? hi : n);
const lerp = (a, b, t) => a + (b - a) * t;
const rand = (a, b) => a + Math.random() * (b - a);
const easeOut = (t) => 1 - Math.pow(1 - t, 3);

export const ACTIVITIES = {
  sleep: {
    scene: "workshop", mark: 434, duration: 17,
    status: "sleeping",
    pose(p, t) {
      // Rotating -90° about the feet lays him out head-left along the floor,
      // so the origin sits a torso-half above the mat and his head lands on
      // the pillow up(152) to the left of it.
      p.lean = -90;
      p.x = 434;
      p.y = p.groundY - up(23);
      p.noShadow = true;

      const breath = Math.sin(t * 1.05);
      p.legF = -7 + breath * 2; p.kneeF = 10;
      p.legB = -16 + breath * 2; p.kneeB = 15;
      // arms resting at his sides — with the rig rotated -90°, 0° runs from
      // his shoulders toward his feet, so these are small angles, not large ones
      p.armF = -20 + breath * 3; p.elbowF = 14;
      p.armB = -9; p.elbowB = 9;
      p.headR = -14;
      p.bob = breath * 0.8;
      p.visorOpen = 0.06;
      p.coreDim = 0.35 + Math.sin(t * 1.05) * 0.25;
      p.lookAt(p.x - 60, p.y);

      if (t % 2.6 < 0.02) p.fx.emit("zzz", p.x - up(140), p.y - up(30));
    },
  },

  cook: {
    scene: "kitchen", mark: 492, duration: 19,
    status: "cooking",
    pose(p, t) {
      p.x = 492; p.face = 1;   // up(52) further on puts the pan over the burner
      const cycle = (t % 3.4) / 3.4;
      const tossing = cycle > 0.52 && cycle < 0.76;
      const swing = tossing ? Math.sin((cycle - 0.52) / 0.24 * Math.PI) : 0;
      const idle = Math.sin(t * 1.5);

      p.armF = -74 - swing * 34; p.elbowF = 46 - swing * 30;
      p.armB = 14 + idle * 5;    p.elbowB = 26;
      p.legF = 3; p.kneeF = 4;
      p.legB = -7; p.kneeB = 8;
      p.bob = idle * 1.5 - swing * 3;
      p.headR = -7 - swing * 5;
      p.lookAt(p.x + 80, p.groundY - up(104));

      // the pan tracks the hand, then whips over on the toss
      p.prop("pan", {
        x: p.x + up(52) + swing * 10,
        y: p.groundY - up(84) - swing * 24,
        r: -12 - swing * 155,
        s: RIG_SCALE,
      });
      p.sceneEl("burner")?.setAttribute("opacity", (0.5 + Math.sin(t * 9) * 0.22).toFixed(2));

      if (tossing && Math.random() < 0.45) {
        p.fx.emit("bit", p.x + up(56), p.groundY - up(104), { vx: rand(-26, 34), vy: rand(-250, -170) });
      }
      if (Math.random() < 0.06) p.fx.emit("steam", p.x + up(52) + rand(-16, 16), p.groundY - up(94));
    },
  },

  ride: {
    scene: "road", mark: 300, duration: 17,
    status: "riding",
    pose(p, t) {
      const cruise = Math.min(1, t / 2);
      const bikeX = lerp(-140, 720, easeOut(Math.min(1, t / 8))) + Math.sin(t * 0.55) * 28;
      const bump = Math.sin(t * 12) * 1.7 * cruise;

      p.prop("bike", { x: bikeX, y: p.groundY - up(30) + bump, s: RIG_SCALE });
      p.spinWheels(t * 9 * cruise);
      p.noShadow = true;

      // seated: hips over the seat, feet forward on the pegs, hands on the bars
      // his hips have to land on the seat, and the hips sit `up(-HIP_Y)`
      // above the rig origin, so the origin goes below the seat by that much
      p.x = bikeX + 4;
      p.y = p.groundY - up(30) - up(34) + up(-HIP_Y) + bump;
      p.face = 1;
      p.lean = -12 - cruise * 5;
      p.legF = -60; p.kneeF = 75;
      p.legB = -52; p.kneeB = 82;
      p.armF = -95; p.elbowF = 14;
      p.armB = -88; p.elbowB = 12;
      p.headR = 12;
      p.bob = 0;
      p.lookAt(p.x + 240, p.y - 140);

      // the dashed centerline scrolling is what actually sells the speed
      const line = p.sceneEl("roadline");
      if (line) line.setAttribute("stroke-dashoffset", (-t * 560 * cruise).toFixed(1));

      if (Math.random() < 0.4 * cruise) {
        p.fx.emit("puff", bikeX - 70, p.groundY - 22, { vx: rand(-80, -34), vy: rand(-36, -8) });
      }
    },
  },

  climb: {
    scene: "mountain", mark: 470, duration: 17,
    status: "climbing",
    pose(p, t) {
      const reach = Math.sin(t * 2.1);
      const side = reach > 0 ? 1 : -1;

      p.x = 604;
      p.y = 322 + reach * 7;
      p.face = 1;
      p.lean = 5;
      p.noShadow = true;

      // opposite limbs reach together, the way anything with four of them climbs
      // ~180° reaches straight up; a small elbow keeps the forearm going the
      // same way instead of folding back behind his head
      p.armF = 170 + side * 20; p.elbowF = 16 + side * 10;
      p.armB = 170 - side * 20; p.elbowB = 16 - side * 10;
      p.legF = -12 - side * 15; p.kneeF = 38 + side * 14;
      p.legB = -12 + side * 15; p.kneeB = 38 - side * 14;
      p.headR = -10 + reach * 4;
      p.bob = 0;
      p.lookAt(p.x + 30, p.y - 240);

      // the wall slides past him instead of him leaving the frame
      const wall = p.sceneEl("rockwall");
      if (wall) wall.setAttribute("transform", `translate(0 ${((t * 64) % 220).toFixed(1)})`);

      if (Math.random() < 0.07) {
        p.fx.emit("chip", p.x - 26, p.y + 34, { vx: rand(-46, -12), vy: rand(-70, 10) });
      }
    },
  },

  service: {
    scene: "workshop", mark: 640, duration: 19,
    status: "changing the oil",
    pose(p, t) {
      const bikeX = 640;
      p.prop("bike", { x: bikeX, y: p.groundY - up(122), s: RIG_SCALE });  // up on the jack
      p.prop("jack", { x: bikeX, y: p.groundY, s: RIG_SCALE });
      p.prop("oilpan", { x: bikeX - 104, y: p.groundY - 14, s: 1.15 });
      p.spinWheels(0);

      // flat on his back, head under the engine, one arm working a wrench
      p.lean = -90;
      p.x = bikeX + up(86);
      p.y = p.groundY - up(23);
      p.face = 1;
      p.noShadow = true;

      // -90° is straight up once he's on his back, which is where the bike is
      const turn = Math.sin(t * 3.6);
      p.armF = -86 + turn * 20; p.elbowF = 28 - turn * 14;
      p.armB = -14; p.elbowB = 11;
      p.legF = -9; p.kneeF = 13;
      p.legB = -19; p.kneeB = 17;
      p.headR = 12;
      p.bob = 0;
      p.lookAt(p.x - 90, p.y - 40);

      const fill = clamp((t - 2) / 12, 0, 1);
      p.propEl("oilpan")?.querySelector(".oil-level")?.setAttribute("opacity", (fill * 0.95).toFixed(2));
      if (t > 2 && t < 14.5 && Math.random() < 0.2) p.fx.emit("drip", bikeX - 104, p.groundY - up(88));
    },
  },
};
