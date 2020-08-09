class PursuitRotorTask extends HTMLElement {
  constructor() {
    super();
    const template = document.createElement("template");
    template.innerHTML = `<style>
    :host {
      /* calculations */
      --dot-position: calc(var(--radius) - calc(var(--dot-size) / 2));
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
      width: var(--dot-size);
      height: var(--dot-size);
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
      left: var(--alert-position);
      display: flex;
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
    document.onmousemove = () => {
      clearTimeout(this.onMouseMoveTimeout);
      this.onMouseMoveTimeout = setTimeout(
        this.dotLeave.bind(this),
        this.onMouseMoveInterval
      );
    };

    this.$dot.addEventListener("mouseenter", this.dotEnter.bind(this));
    this.$dot.addEventListener("mouseleave", this.dotLeave.bind(this));

    this.experienceTimeout = null;

    this.data = {
      outCount: 0,
      inTimeMs: null
    };

    this.temp = null;
  }

  static get observedAttributes() {
    return Object.keys(PursuitRotorTask.attributes);
  }

  attributeChangedCallback(name, oldValue, newValue) {
    const attr = PursuitRotorTask.attributes[name];
    this.style.setProperty(attr.css, newValue + (attr.prefix || ""));
    if (attr.proprty) {
      this[name] = attr.convert ? attr.convert(newValue) : newValue;
    }

    window.requestAnimationFrame(() => {
      this.onMouseMoveInterval = PursuitRotorTask.ShlomoFormulaForRadiusTime(
        this.getAttribute(PursuitRotorTask.circleTime),
        this.$component.clientWidth,
        this.$dot.offsetWidth
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
  }

  dotLeave() {
    if (this.temp) {
      this.data.inTimeMs += performance.now() - this.temp;
      this.temp = null;
      this.data.outCount++;
    }
    this.$alert.style.backgroundColor = "red";
    this.$message.innerText = "OFF";
  }

  dotEnter() {
    this.temp = performance.now();
    this.$alert.style.backgroundColor = "green";
    this.$message.innerText = "ON";

    if (!this.experienceTimeout) {
      this.experienceTimeout = setTimeout(
        this.onFinish.bind(this),
        this[PursuitRotorTask.circleTime] * 1000
      );
    }
  }

  takeTime() {
    if (this.enterTime) {
      this.data.inTimeMs += new Date() - this.enterTime;
    }
  }

  onFinish() {
    if (this.temp) this.data.inTimeMs += performance.now() - this.temp;
    this.$dot.style.webkitAnimationPlayState = "paused";
    this.dispatchEvent(new CustomEvent("finish", { detail: this.data }));
  }

  static ShlomoFormulaForRadiusTime(circleTs, componentR, dotR) {
    return (dotR * circleTs) / (2 * Math.PI * componentR);
  }

  static circleTime = "circle-time";
  static componentR = "component-radius";
  static dotR = "dot-radius";
  static attributes = {
    [PursuitRotorTask.componentR]: {
      css: "--radius",
      default: "100px"
    },
    [PursuitRotorTask.dotR]: {
      css: "--dot-size",
      default: "40px"
    },
    [this.circleTime]: {
      css: "--circle-time",
      default: "10",
      prefix: "s",
      convert: parseInt,
      proprty: true
    }
  };
}

customElements.define("pursuit-rotor-task", PursuitRotorTask);
