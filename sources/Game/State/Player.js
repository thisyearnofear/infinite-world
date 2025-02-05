import { vec3 } from "gl-matrix";

import Game from "@/Game.js";
import State from "@/State/State.js";
import Camera from "./Camera.js";

export default class Player {
  constructor() {
    this.game = Game.getInstance();
    this.state = State.getInstance();
    this.time = this.state.time;
    this.controls = this.state.controls;

    this.rotation = 0;
    this.inputSpeed = 4; // Even slower for more waddle-like movement
    this.inputBoostSpeed = 25; // Sliding speed unchanged
    this.speed = 0;
    this.waddleTime = 0;
    this.waddleFrequency = 5; // Slower waddle frequency
    this.waddleAmplitude = 0.15; // Reduced side-to-side movement
    this.footRotation = 0;
    this.bodyTilt = 0;
    this.isSliding = false;
    this.slideDeceleration = 0.95;

    this.position = {};
    this.position.current = vec3.fromValues(10, 0, 1);
    this.position.previous = vec3.clone(this.position.current);
    this.position.delta = vec3.create();

    this.camera = new Camera(this);
  }

  update() {
    if (
      this.camera.mode !== Camera.MODE_FLY &&
      (this.controls.keys.down.forward ||
        this.controls.keys.down.backward ||
        this.controls.keys.down.strafeLeft ||
        this.controls.keys.down.strafeRight)
    ) {
      this.rotation = this.camera.thirdPerson.theta;

      if (this.controls.keys.down.forward) {
        if (this.controls.keys.down.strafeLeft) this.rotation += Math.PI * 0.25;
        else if (this.controls.keys.down.strafeRight)
          this.rotation -= Math.PI * 0.25;
      } else if (this.controls.keys.down.backward) {
        if (this.controls.keys.down.strafeLeft) this.rotation += Math.PI * 0.75;
        else if (this.controls.keys.down.strafeRight)
          this.rotation -= Math.PI * 0.75;
        else this.rotation -= Math.PI;
      } else if (this.controls.keys.down.strafeLeft) {
        this.rotation += Math.PI * 0.5;
      } else if (this.controls.keys.down.strafeRight) {
        this.rotation -= Math.PI * 0.5;
      }

      // Update waddle effect with foot rotation and body tilt
      this.waddleTime += this.time.delta * this.waddleFrequency;
      const waddleOffset = Math.sin(this.waddleTime) * this.waddleAmplitude;

      // Calculate foot rotation and body tilt
      this.footRotation = Math.sin(this.waddleTime * 2) * 0.3; // Foot rotation
      this.bodyTilt = Math.sin(this.waddleTime) * 0.1; // Body tilt

      let speed = this.controls.keys.down.boost
        ? this.inputBoostSpeed
        : this.inputSpeed;

      // If boosting, enter slide mode
      if (this.controls.keys.down.boost) {
        this.isSliding = true;
        this.footRotation = 0; // Reset foot rotation during sliding
        this.bodyTilt = 0; // Reset body tilt during sliding
      }

      // Apply movement with vertical bounce for waddle
      const x = Math.sin(this.rotation) * this.time.delta * speed;
      const z = Math.cos(this.rotation) * this.time.delta * speed;
      const verticalBounce = Math.abs(Math.sin(this.waddleTime)) * 0.1; // Add slight vertical bounce

      this.position.current[0] -= x;
      this.position.current[2] -= z;

      // Apply waddle effects when not sliding
      if (!this.isSliding) {
        this.position.current[0] +=
          waddleOffset * Math.cos(this.rotation) * 0.5;
        this.position.current[2] -=
          waddleOffset * Math.sin(this.rotation) * 0.5;
        this.position.current[1] += verticalBounce; // Add vertical bounce to waddle
      }
    } else {
      // Gradually reset foot rotation and body tilt when not moving
      this.footRotation *= 0.9;
      this.bodyTilt *= 0.9;

      // Decelerate sliding
      if (this.isSliding) {
        const currentSpeed = vec3.len(this.position.delta);
        if (currentSpeed < 0.001) {
          this.isSliding = false;
        } else {
          const x =
            Math.sin(this.rotation) *
            this.time.delta *
            currentSpeed *
            this.slideDeceleration;
          const z =
            Math.cos(this.rotation) *
            this.time.delta *
            currentSpeed *
            this.slideDeceleration;
          this.position.current[0] -= x;
          this.position.current[2] -= z;
        }
      }
    }

    vec3.sub(
      this.position.delta,
      this.position.current,
      this.position.previous
    );
    vec3.copy(this.position.previous, this.position.current);

    this.speed = vec3.len(this.position.delta);

    // Update view
    this.camera.update();

    // Update elevation with smooth transition
    const chunks = this.state.chunks;
    const elevation = chunks.getElevationForPosition(
      this.position.current[0],
      this.position.current[2]
    );

    if (elevation)
      this.position.current[1] =
        elevation +
        (this.isSliding ? 0 : Math.abs(Math.sin(this.waddleTime)) * 0.1);
    else this.position.current[1] = 0;
  }
}
