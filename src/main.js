import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/Addons.js";

class App {
  #renderer_;
  #camera_;
  #scene_;
  #controls_;
  #clock_ = new THREE.Clock();
  #dpr_ = Math.min(window.devicePixelRatio, 2);
  #player_;
  #car_;
  #moveState_ = { forward: false, backward: false, left: false, right: false };
  #isDriving_ = false;

  initialize() {
    this.#initRenderer();
    this.#initScene();
    this.#initCamera();
    this.#initControls();
    this.#initObjects();
    this.#initEventListeners();
    this.#raf();
  }

  #initRenderer() {
    this.#renderer_ = new THREE.WebGLRenderer({ antialias: true });
    this.#renderer_.setSize(window.innerWidth, window.innerHeight);
    this.#renderer_.setPixelRatio(this.#dpr_);
    document.body.appendChild(this.#renderer_.domElement);
  }

  #initScene() {
    this.#scene_ = new THREE.Scene();
    this.#scene_.background = new THREE.Color(0x121316);

    const hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 1.2);
    hemi.position.set(0, 10, 0);
    this.#scene_.add(hemi);

    const dir = new THREE.DirectionalLight(0xffffff, 0.8);
    dir.position.set(5, 10, 7.5);
    this.#scene_.add(dir);
  }

  #initCamera() {
    const aspect = window.innerWidth / window.innerHeight;
    this.#camera_ = new THREE.PerspectiveCamera(75, aspect, 0.1, 2000);
    this.#camera_.position.set(0, 5, 10);
  }

  #initControls() {
    this.#controls_ = new OrbitControls(
      this.#camera_,
      this.#renderer_.domElement
    );
    this.#controls_.enableDamping = true;
    this.#controls_.target.set(0, 0, 0);
  }

  #initObjects() {
    // Player (capsule)
    this.#player_ = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.4, 0.7, 8, 16),
      new THREE.MeshNormalMaterial()
    );
    this.#player_.position.set(-2, 0.71, 0);
    this.#scene_.add(this.#player_);

    // Car (box)
    this.#car_ = new THREE.Mesh(
      new THREE.BoxGeometry(2, 0.5, 4),
      new THREE.MeshStandardMaterial({ color: 0xff23a2 })
    );
    this.#car_.position.set(2, 0.25, 0);
    this.#scene_.add(this.#car_);

    // Ground (keeping it tied to `initObject` method only as it is no required globally for this project)
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(20, 20),
      new THREE.MeshStandardMaterial({ color: 0x101d39 })
    );
    ground.rotation.x = -Math.PI / 2;
    this.#scene_.add(ground);
  }

  #initEventListeners() {
    window.addEventListener("resize", this.#onResize.bind(this));
    window.addEventListener("keydown", this.#onKeyDown.bind(this));
    window.addEventListener("keyup", this.#onKeyUp.bind(this));

    const btn = document.getElementById("drive-btn");
    btn.addEventListener("click", () => {
      if (!this.#isDriving_) {
        /**
         * ? This is the key concept for understanding the scene graph behavior:
         * ? When the drive button is clicked, the `player` object is reparented from the scene to the `car`.
         * ? As a result, any transformations applied to the car (e.g., position or rotation)
         * ? will also affect the player while in the driving state.
         */
        this.#car_.add(this.#player_);
        this.#player_.position.set(0, 1, 0);
        btn.textContent = "Stop Driving";
      } else {
        /**
         * ? Exiting driving mode:
         * ? The `player` is parented back to the `scene`, detaching it from the car.
         * ? This stops the player from inheriting the car's transformations (position, rotation).
         * ? The player's position is reset to a fixed point near the car
         * ? So following player will move independently
         */
        this.#scene_.add(this.#player_);
        this.#player_.position.set(-2, 0.7, 0);
        btn.textContent = "Drive";
      }
      this.#isDriving_ = !this.#isDriving_;
    });
  }

  #onResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.#camera_.aspect = width / height;
    this.#camera_.updateProjectionMatrix();
    this.#renderer_.setSize(width, height);
    this.#renderer_.setPixelRatio(this.#dpr_);
  }

  #onKeyDown(e) {
    const key = e.key.toLowerCase();
    if (key === "w") this.#moveState_.forward = true;
    if (key === "s") this.#moveState_.backward = true;
    if (key === "a") this.#moveState_.left = true;
    if (key === "d") this.#moveState_.right = true;
  }

  #onKeyUp(e) {
    const key = e.key.toLowerCase();
    if (key === "w") this.#moveState_.forward = false;
    if (key === "s") this.#moveState_.backward = false;
    if (key === "a") this.#moveState_.left = false;
    if (key === "d") this.#moveState_.right = false;
  }

  #stepUpdate(delta) {
    // Determine controlled object
    const obj = this.#isDriving_ ? this.#car_ : this.#player_;
    const speed = 5 * delta;
    if (this.#moveState_.forward) obj.position.z -= speed;
    if (this.#moveState_.backward) obj.position.z += speed;
    if (this.#moveState_.left) obj.position.x -= speed;
    if (this.#moveState_.right) obj.position.x += speed;

    this.#controls_.update();
  }

  #render() {
    this.#renderer_.render(this.#scene_, this.#camera_);
  }

  #raf() {
    requestAnimationFrame(() => {
      const delta = this.#clock_.getDelta();
      this.#stepUpdate(delta);
      this.#render();
      this.#raf();
    });
  }
}

const app = new App();
app.initialize();
