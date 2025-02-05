import * as THREE from "three";

import Game from "@/Game.js";
import View from "@/View/View.js";
import Debug from "@/Debug/Debug.js";
import State from "@/State/State.js";
import PlayerMaterial from "./Materials/PlayerMaterial.js";

export default class Player {
  constructor() {
    this.game = Game.getInstance();
    this.state = State.getInstance();
    this.view = View.getInstance();
    this.debug = Debug.getInstance();

    this.scene = this.view.scene;

    this.setGroup();
    this.setHelper();
    this.setDebug();
  }

  setGroup() {
    this.group = new THREE.Group();
    this.scene.add(this.group);
  }

  setHelper() {
    this.helper = new THREE.Group();

    // Body - main penguin body (larger and rounder)
    const body = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.45, 0.9, 8, 16),
      new PlayerMaterial()
    );
    body.position.y = 0.75;
    this.helper.add(body);

    // White belly (flattened capsule)
    const belly = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.35, 0.7, 8, 16),
      new PlayerMaterial()
    );
    belly.position.set(0, 0.75, 0.15);
    belly.scale.z = 0.4;
    this.helper.add(belly);

    // Head - rounder and larger
    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.3, 12, 12),
      new PlayerMaterial()
    );
    head.position.y = 1.5;
    head.position.z = 0.15;
    this.helper.add(head);

    // White face mask
    const faceMask = new THREE.Mesh(
      new THREE.SphereGeometry(0.25, 12, 12),
      new PlayerMaterial()
    );
    faceMask.position.set(0, 1.5, 0.22);
    faceMask.scale.z = 0.4;
    this.helper.add(faceMask);

    // Wings - larger flattened boxes
    const wingGeometry = new THREE.BoxGeometry(0.12, 0.6, 0.3);
    const leftWing = new THREE.Mesh(wingGeometry, new PlayerMaterial());
    leftWing.position.set(-0.45, 0.9, 0);
    leftWing.rotation.z = 0.3;
    this.helper.add(leftWing);

    const rightWing = new THREE.Mesh(wingGeometry, new PlayerMaterial());
    rightWing.position.set(0.45, 0.9, 0);
    rightWing.rotation.z = -0.3;
    this.helper.add(rightWing);

    // Feet
    const footGeometry = new THREE.BoxGeometry(0.2, 0.08, 0.3);
    const leftFoot = new THREE.Mesh(footGeometry, new PlayerMaterial());
    leftFoot.position.set(-0.2, 0.04, 0);
    leftFoot.rotation.y = 0.3;
    this.helper.add(leftFoot);

    const rightFoot = new THREE.Mesh(footGeometry, new PlayerMaterial());
    rightFoot.position.set(0.2, 0.04, 0);
    rightFoot.rotation.y = -0.3;
    this.helper.add(rightFoot);

    // Beak - slightly larger
    const beak = new THREE.Mesh(
      new THREE.ConeGeometry(0.06, 0.2, 8),
      new PlayerMaterial()
    );
    beak.rotation.x = -Math.PI * 0.5;
    beak.position.set(0, 1.5, 0.45);
    this.helper.add(beak);

    // Set materials
    const parts = [body, head, leftWing, rightWing, beak, leftFoot, rightFoot];
    const whiteParts = [belly, faceMask];

    parts.forEach((part) => {
      part.material.uniforms.uColor.value =
        part === beak || part === leftFoot || part === rightFoot
          ? new THREE.Color("#ffa500")
          : new THREE.Color("#000000");
      part.material.uniforms.uSunPosition.value = new THREE.Vector3(
        -0.5,
        -0.5,
        -0.5
      );
    });

    whiteParts.forEach((part) => {
      part.material.uniforms.uColor.value = new THREE.Color("#ffffff");
      part.material.uniforms.uSunPosition.value = new THREE.Vector3(
        -0.5,
        -0.5,
        -0.5
      );
    });

    this.group.add(this.helper);
  }

  setDebug() {
    if (!this.debug.active) return;

    // Sphere
    const playerFolder = this.debug.ui.getFolder("view/player");

    playerFolder.addColor(
      this.helper.children[0].material.uniforms.uColor,
      "value"
    );
  }

  update() {
    const playerState = this.state.player;
    const sunState = this.state.sun;

    this.group.position.set(
      playerState.position.current[0],
      playerState.position.current[1],
      playerState.position.current[2]
    );

    // Helper rotation with body tilt
    this.helper.rotation.y = playerState.rotation;
    this.helper.rotation.x = playerState.bodyTilt || 0;
    this.helper.rotation.z = (playerState.bodyTilt || 0) * 0.5;

    // Update foot rotations
    const leftFoot = this.helper.children[7]; // Index of left foot
    const rightFoot = this.helper.children[8]; // Index of right foot
    if (leftFoot && rightFoot) {
      leftFoot.rotation.x = playerState.footRotation || 0;
      rightFoot.rotation.x = -(playerState.footRotation || 0);
    }

    // Update wing positions during waddle
    const leftWing = this.helper.children[4]; // Index of left wing
    const rightWing = this.helper.children[5]; // Index of right wing
    if (leftWing && rightWing && !playerState.isSliding) {
      const wingWaddle = Math.sin(playerState.waddleTime || 0) * 0.2;
      leftWing.rotation.z = 0.3 + wingWaddle;
      rightWing.rotation.z = -0.3 - wingWaddle;
    }

    // Update sun position for all parts
    const sunPosition = new THREE.Vector3(
      sunState.position.x,
      sunState.position.y,
      sunState.position.z
    );

    this.helper.children.forEach((child) => {
      if (child.material && child.material.uniforms) {
        child.material.uniforms.uSunPosition.value.copy(sunPosition);
      }
    });
  }
}
