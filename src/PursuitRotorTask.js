class PursuitRotorTask extends HTMLElement {

  static circleTime = "circle-time";
  static numOfCircle = "num-of-circle";
  static componentR = "component-radius";
  static dotR = "dot-radius";
  static redAlert = 'red-alert';
  static greenAlert = 'green-alert';
  static timer = 'timer';
  static attributes = {
    [PursuitRotorTask.componentR]: {
      css: "--radius",
      default: "100px"
    },
    [PursuitRotorTask.dotR]: {
      css: "--dot-radius",
      default: "40px"
    },
    [PursuitRotorTask.circleTime]: {
      css: "--circle-time",
      default: "10",
      prefix: "s",
      convert: parseInt,
      proprty: true
    },
    [PursuitRotorTask.numOfCircle]: {
      css: "--num-of-circle",
      default: "1",
      prefix: "s",
      convert: parseInt,
      proprty: true
    },
    [PursuitRotorTask.redAlert]: {
      default: true,
      convert: (v) => 'true' === v,
      proprty: true
    },
    [PursuitRotorTask.greenAlert]: {
      default: true,
      convert: (v) => 'true' === v,
      proprty: true
    },
    [PursuitRotorTask.timer]: {
      default: "0",
      convert: parseInt,
      proprty: true
    }
  };

  constructor() {
    super();
    const template = document.createElement("template");
    template.innerHTML = `<style>
    :host {
      --dot-position: calc(var(--radius) - var(--dot-radius));
      --alert-size: calc(var(--radius) / 2);
      --alert-position: calc(var(--radius) - calc(var(--alert-size) / 2));
    }

    #PursuitRotorTask {
      width: calc(var(--radius) * 2);
      height: calc(var(--radius) * 2);
      border: 2px solid #ccc;
      position: absolute;
      top: 0;
      bottom: 0;
      left: 0;
      right: 0;
      margin: auto;
      border-radius: 50%;
    }

    #dot {
      position: absolute;
      width: calc(var(--dot-radius) * 2);
      height: calc(var(--dot-radius) * 2);
      background: cyan;
      border-radius: 50%;
      top: var(--dot-position);
      bottom: 0;
      left: var(--dot-position);
      right: 0;
      overflow: hidden;
      animation: circle var(--circle-time) linear infinite;
    }

    #alert {
      width: var(--alert-size);
      height: var(--alert-size);
      background-color: red;
      position: absolute;
      top: var(--alert-position);
      bottom: var(--alert-position);
      left: var(--alert-position);
      right: var(--alert-position);
      display: none;
      align-items: center;
      justify-content: center;
      font-weight: bold;
    }

    @keyframes circle {
      from {
        transform: rotate(0deg) translateX(var(--radius));
      }

      to {
        transform: rotate(360deg) translateX(var(--radius));
      }
    }
  </style>
  <div id="PursuitRotorTask">
    <div id="dot"></div>
    <div id="alert">
      <span>OFF</span>
    </div>
  </div>`;
    this._shadowRoot = this.attachShadow({ mode: "open" });
    this._shadowRoot.appendChild(template.content.cloneNode(true));

    this.$component = this._shadowRoot.getElementById("PursuitRotorTask");
    this.$dot = this._shadowRoot.getElementById("dot");
    this.$alert = this._shadowRoot.getElementById("alert");
    this.$message = this.$alert.querySelector("span");

    this.onMouseMoveInterval = 600;
    this.onMouseMoveTimeout = null;

    this.$dot.style.webkitAnimationPlayState = "paused"

    this.experienceTimeout = null;

    this.data = {
      outCount: 0,
      inTimeMs: 0
    };

    this.temp = null;
  }

  static get observedAttributes() {
    return Object.keys(PursuitRotorTask.attributes);
  }

  attributeChangedCallback(name, oldValue, newValue) {
    const attr = PursuitRotorTask.attributes[name];
    if (attr.css) {
      this.style.setProperty(attr.css, newValue + (attr.prefix || ""));
    }
    if (attr.proprty) {
      this[name] = attr.convert ? attr.convert(newValue) : newValue;
    }

    window.requestAnimationFrame(() => {
      this.onMouseMoveInterval = PursuitRotorTask.ShlomoFormulaForRadiusTime(
        this.getAttribute(PursuitRotorTask.circleTime*PursuitRotorTask.numOfCircle),
        this.$component.clientWidth,
        this.$dot.clientWidth
      );
    });
  }

  connectedCallback() {
    // We set a default attribute here; if our end user hasn't provided one,
    // our element will display a "placeholder" text instead.
    Object.keys(PursuitRotorTask.attributes)
      .filter((attr) => !this.hasAttribute(attr))
      .forEach((attr) =>
        this.setAttribute(attr, PursuitRotorTask.attributes[attr].default)
      );

    this.startAnimation()
  }

  startAnimation = () => {
    const initPrm = this[PursuitRotorTask.timer] > 0 ? this.countDown() : Promise.resolve(this.showRedAlert())
    initPrm
      .then(this.registerMouseEvents)
      .then(() => this.$dot.style.webkitAnimationPlayState = "running")
  }

  startExperienceTimeout = () => {
    if (!this.experienceTimeout) {
      this.experienceTimeout = setTimeout(
        this.onFinish,
        this[PursuitRotorTask.circleTime] * 1000
      );
    }
  }

  registerMouseEvents = () => {
    this.$dot.addEventListener("mousemove", this.dotEnter, { once: true });
    this.$dot.addEventListener("mouseleave", this.dotLeave);

    document.onmousemove = () => {
      clearTimeout(this.onMouseMoveTimeout);
      this.onMouseMoveTimeout = setTimeout(this.dotLeave, this.onMouseMoveInterval);
    };
  }

  dotLeave = () => {
    if (this.temp) {
      this.data.inTimeMs += performance.now() - this.temp;
      this.temp = null;
      this.data.outCount++;
    }
    this.showRedAlert();
  }

  dotEnter = () => {
    this.temp = performance.now();
    this.showGreenAlert();

    this.startExperienceTimeout()

    this.$dot.addEventListener("mouseenter", this.dotEnter);
  }

  showRedAlert = () => {
    if (this[PursuitRotorTask.redAlert]) {
      this.$alert.style.display = 'flex'
      this.$alert.style.backgroundColor = "red";
      this.$message.innerText = "OFF";
    } else {
      this.$alert.style.display = 'none'
    }
  }

  showGreenAlert = () => {
    if (this[PursuitRotorTask.greenAlert]) {
      this.$alert.style.display = 'flex'
      this.$alert.style.backgroundColor = "green";
      this.$message.innerText = "ON";
    } else {
      this.$alert.style.display = 'none'
    }
  }

  takeTime = () => {
    if (this.enterTime) {
      this.data.inTimeMs += new Date() - this.enterTime;
    }
  }

  countDown = () => {
    return new Promise((resolve) => {

      let count = this[PursuitRotorTask.timer]
      this.$alert.style.display = 'flex'
      this.$alert.style.backgroundColor = "gray";
      this.$message.innerText = count;

      const intervalId = setInterval(() => {
        this.$message.innerText = --count;
        if (count <= 0) {
          clearInterval(intervalId)
          this.showRedAlert()
          resolve()
        }
      }, 1000)

    }).then(this.startExperienceTimeout)
  }

  onFinish = () => {
    if (this.temp) this.data.inTimeMs += performance.now() - this.temp;
    this.$dot.style.webkitAnimationPlayState = "paused";
    this.dispatchEvent(new CustomEvent("finish", { detail: this.data }));
  }

  static ShlomoFormulaForRadiusTime(circleTs, componentWidth, dotWidth) {
    const circleTms = circleTs * 1000
    const componentR = componentWidth / 2
    const dotR = dotWidth / 2
    return (dotR * circleTms) / (Math.PI * componentR);
  }
}

customElements.define("pursuit-rotor-task", PursuitRotorTask);
