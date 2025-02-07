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

    // Body - main hippo body (larger and rounder)
    const body = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.6, 1.2, 8, 16),
      new PlayerMaterial()
    );
    body.position.y = 0.9;
    this.helper.add(body);

    // Head - larger and more hippo-like
    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.5, 12, 12),
      new PlayerMaterial()
    );
    head.position.y = 1.7;
    head.position.z = 0.3;
    head.scale.z = 1.3; // Elongated snout
    this.helper.add(head);

    // Snout
    const snout = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.4, 0.3, 8, 16),
      new PlayerMaterial()
    );
    snout.rotation.x = Math.PI * 0.5;
    snout.position.set(0, 1.5, 0.7);
    this.helper.add(snout);

    // Nostrils
    const nostrilGeometry = new THREE.SphereGeometry(0.08, 8, 8);
    const leftNostril = new THREE.Mesh(nostrilGeometry, new PlayerMaterial());
    leftNostril.position.set(-0.15, 1.6, 0.9);
    this.helper.add(leftNostril);

    const rightNostril = new THREE.Mesh(nostrilGeometry, new PlayerMaterial());
    rightNostril.position.set(0.15, 1.6, 0.9);
    this.helper.add(rightNostril);

    // Legs
    const legGeometry = new THREE.CylinderGeometry(0.15, 0.15, 0.8, 8);
    const frontLeftLeg = new THREE.Mesh(legGeometry, new PlayerMaterial());
    frontLeftLeg.position.set(-0.4, 0.4, 0.3);
    this.helper.add(frontLeftLeg);

    const frontRightLeg = new THREE.Mesh(legGeometry, new PlayerMaterial());
    frontRightLeg.position.set(0.4, 0.4, 0.3);
    this.helper.add(frontRightLeg);

    const backLeftLeg = new THREE.Mesh(legGeometry, new PlayerMaterial());
    backLeftLeg.position.set(-0.4, 0.4, -0.3);
    this.helper.add(backLeftLeg);

    const backRightLeg = new THREE.Mesh(legGeometry, new PlayerMaterial());
    backRightLeg.position.set(0.4, 0.4, -0.3);
    this.helper.add(backRightLeg);

    // Ears
    const earGeometry = new THREE.CylinderGeometry(0.1, 0.1, 0.1, 8);
    const leftEar = new THREE.Mesh(earGeometry, new PlayerMaterial());
    leftEar.position.set(-0.3, 2.1, 0.2);
    this.helper.add(leftEar);

    const rightEar = new THREE.Mesh(earGeometry, new PlayerMaterial());
    rightEar.position.set(0.3, 2.1, 0.2);
    this.helper.add(rightEar);

    // Set materials
    const parts = [
      body,
      head,
      snout,
      leftNostril,
      rightNostril,
      frontLeftLeg,
      frontRightLeg,
      backLeftLeg,
      backRightLeg,
      leftEar,
      rightEar,
    ];

    // Assign fun colors to different parts
    parts.forEach((part, index) => {
      let color;
      switch (part) {
        case body:
          color = new THREE.Color("#FF69B4"); // Hot pink body
          break;
        case head:
          color = new THREE.Color("#FF69B4"); // Match body
          break;
        case snout:
          color = new THREE.Color("#FFB6C1"); // Lighter pink snout
          break;
        case leftNostril:
        case rightNostril:
          color = new THREE.Color("#FF1493"); // Deep pink nostrils
          break;
        case leftEar:
        case rightEar:
          color = new THREE.Color("#FF69B4"); // Match body
          break;
        default: // legs
          color = new THREE.Color("#FFB6C1"); // Lighter pink legs
      }
      part.material.uniforms.uColor.value = color;
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

    // Add bouncy movement
    const bounceAmount = Math.sin(this.state.time.elapsed * 3) * 0.1;
    this.helper.position.y = bounceAmount;

    // Add playful head bobbing
    const headBob = Math.sin(this.state.time.elapsed * 2) * 0.05;
    if (this.helper.children[1]) {
      // Head
      this.helper.children[1].position.y = 1.7 + headBob;
    }

    // Add ear wiggling
    const earWiggle = Math.sin(this.state.time.elapsed * 4) * 0.1;
    if (this.helper.children[9]) {
      // Left ear
      this.helper.children[9].rotation.z = earWiggle;
    }
    if (this.helper.children[10]) {
      // Right ear
      this.helper.children[10].rotation.z = -earWiggle;
    }

    // Leg animations for walking
    const legAnimation = Math.sin(this.state.time.elapsed * 5);
    const legRotationAmount = 0.3;

    if (!playerState.isSliding) {
      // Front legs
      if (this.helper.children[5]) {
        // Front left leg
        this.helper.children[5].rotation.x = legAnimation * legRotationAmount;
      }
      if (this.helper.children[6]) {
        // Front right leg
        this.helper.children[6].rotation.x = -legAnimation * legRotationAmount;
      }

      // Back legs
      if (this.helper.children[7]) {
        // Back left leg
        this.helper.children[7].rotation.x = -legAnimation * legRotationAmount;
      }
      if (this.helper.children[8]) {
        // Back right leg
        this.helper.children[8].rotation.x = legAnimation * legRotationAmount;
      }
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
