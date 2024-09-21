var gZenCompactModeManager = {
  _flashTimeouts: {},
  _evenListeners: [],

  init() {
    Services.prefs.addObserver('zen.view.compact', this._updateEvent.bind(this));
    Services.prefs.addObserver('zen.view.compact.toolbar-flash-popup.duration', this._updatedSidebarFlashDuration.bind(this));

    gZenUIManager.addPopupTrackingAttribute(this.sidebar);
    gZenUIManager.addPopupTrackingAttribute(document.getElementById('zen-appcontent-navbar-container'));

    Services.prefs.addObserver('zen.tabs.vertical.right-side', this._updateSidebarIsOnRight.bind(this));
    this.addMouseActions();
  },

  get prefefence() {
    return Services.prefs.getBoolPref('zen.view.compact');
  },

  set preference(value) {
    Services.prefs.setBoolPref('zen.view.compact', value);
  },

  get sidebarIsOnRight() {
    if (this._sidebarIsOnRight) {
      return this._sidebarIsOnRight;
    }
    return Services.prefs.getBoolPref('zen.tabs.vertical.right-side');
  },

  get sidebar() {
    if (!this._sidebar) {
      this._sidebar= document.getElementById('navigator-toolbox');
    }
    return this._sidebar;
  },

  addEventListener(callback) {
    this._evenListeners.push(callback);
  },

  _updateEvent() {
    this._evenListeners.forEach((callback) => callback());
    Services.prefs.setBoolPref('zen.view.sidebar-expanded.on-hover', false);
  },

  toggle() {
    this.preference = !this.prefefence;
  },

  _updatedSidebarFlashDuration() {
    this._flashSidebarDuration = Services.prefs.getIntPref('zen.view.compact.toolbar-flash-popup.duration');
  },

  _updateSidebarIsOnRight() {
    this._sidebarIsOnRight = Services.prefs.getBoolPref('zen.tabs.vertical.right-side');
  },

  toggleSidebar() {
    this.sidebar.toggleAttribute('zen-user-show');
  },

  get flashSidebarDuration() {
    if (this._flashSidebarDuration) {
      return this._flashSidebarDuration;
    }
    return Services.prefs.getIntPref('zen.view.compact.toolbar-flash-popup.duration');
  },

  get hideAfterHoverDuration() {
    if (this._hideAfterHoverDuration) {
      return this._hideAfterHoverDuration;
    }
    return Services.prefs.getIntPref('zen.view.compact.toolbar-hide-after-hover.duration');
  },

  get hoverableElements() {
    return [
      {
        element: this.sidebar,
        getScreenEdge: () => this.sidebarIsOnRight ? "right" : "left",
      },
      {
        element: document.getElementById('zen-appcontent-navbar-container'),
        getScreenEdge: () =>  "top",
      }
    ];
  },

  flashSidebar(duration = this.flashSidebarDuration) {
    let tabPanels = document.getElementById('tabbrowser-tabpanels');
    if (!tabPanels.matches("[zen-split-view='true']")) {
      this.flashElement(this.sidebar, duration, this.sidebar.id);
    }
  },

  flashElement(element, duration, id, attrName = 'flash-popup') {
    if (element.matches(':hover')) {
      return;
    }
    if (this._flashTimeouts[id]) {
      clearTimeout(this._flashTimeouts[id]);
    } else {
      requestAnimationFrame(() => element.setAttribute(attrName, ''));
    }
    this._flashTimeouts[id] = setTimeout(() => {
      window.requestAnimationFrame(() => {
        element.removeAttribute(attrName);
        this._flashTimeouts[id] = null;
      });
    }, duration);
  },

  clearFlashTimeout(id) {
    clearTimeout(this._flashTimeouts[id]);
    this._flashTimeouts[id] = null;
  },

  addMouseActions() {
    for (let i = 0; i < this.hoverableElements.length; i++) {
      this.hoverableElements[i].addEventListener('mouseenter', (event) => {
        let target = this.hoverableElements[i];
        target.setAttribute('zen-has-hover', 'true');
      });

      if (this.hoverableElements[i].keepHoverDuration) {
        target.addEventListener('mouseleave', (event) => {
          this.flashSidebar(target, keepHoverDuration, target.id, 'hover-timeout');
        });
      }
    }

    document.body.addEventListener('mouseleave', (event) => {
      for (let i = 0; i < this.hoverableElements.length; i++) {
        const target = this.hoverableElements[i].element;
        const edge = this.hoverableElements[i].getScreenEdge();
        if (!edge) return;
        const orient = (edge === "left" || edge === "right" ? "vertical" : "horizontal");
        if (
          this._getNearestEdge(document.body, event.pageX, event.pageY) === edge
          && this._positionIsAligned(orient, target, event.pageX, event.pageY, 7)
        ) {
          this.flashElement(target, this.hideAfterHoverDuration, target.id);

          document.addEventListener('mousemove', () => {
            target.removeAttribute('flash-popup');
            this.clearFlashTimeout(target.id);
          }, {once: true});
        }
      }
    });
  },

  _getNearestEdge(element, posX, posY) {
    const targetBox = element.getBoundingClientRect();
    let smallestDistance = Infinity;
    let closestEdge = "";
    for (let edge of ["top", "bottom", "left", "right"]) {
      const onXAxis = edge === "left" || edge === "right";
      const distance = Math.abs( (onXAxis ? posX : posY) - targetBox[edge]);
      if (smallestDistance > distance) {
        smallestDistance = distance;
        closestEdge = edge;
      }
    }
    return closestEdge;
  },

  _positionIsAligned(axis = "x", element, x, y, error = 0) {
    const bBox = element.getBoundingClientRect();
    if (axis === "x") return bBox.top - error < y && y < bBox.bottom + error;
    else return bBox.left - error < x && x < bBox.right + error;
  },

  toggleToolbar() {
    let toolbar = document.getElementById('zen-appcontent-navbar-container');
    toolbar.toggleAttribute('zen-user-show');
  },
};