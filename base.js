/// <reference path="typings/tsd.d.ts" />
var BaseSim = (function () {
    function BaseSim(containingElement) {
        var _this = this;
        if (containingElement === void 0) { containingElement = document.body; }
        this.fov = 75.0;
        this.aspectRatio = 1.0;
        this.nearClip = 0.1;
        this.farClip = 10000.0;
        this.lastRenderTimeMs = 0;
        this.updateCount = 0;
        // Fat arrow closure to preserve 'this' context when reinvoked on subsequent frames
        this.animationFrameCallback = function (timestampMs) {
            var dtMs = timestampMs - _this.lastRenderTimeMs;
            _this.update(dtMs);
            _this.render();
            _this.lastRenderTimeMs = timestampMs;
            requestAnimationFrame(_this.animationFrameCallback);
        };
        this.$containerEl = $(containingElement);
        // TODO: Handle resize
        var width = this.$containerEl.innerWidth();
        var height = this.$containerEl.innerHeight();
        this.containerWidth = width;
        this.containerHeight = height;
        this.aspectRatio = width / height;
        // Create scene
        this.scene = new THREE.Scene();
        // Create camera
        this.camera = new THREE.PerspectiveCamera(this.fov, this.aspectRatio, this.nearClip, this.farClip);
        // Create and attach renderer
        this.renderer = new THREE.WebGLRenderer();
        this.renderer.setSize(width, height);
        this.renderer.setClearColor(0x000000);
        containingElement.appendChild(this.renderer.domElement);
        // Bootstrap animation loop
        this.lastRenderTimeMs = window.performance.now();
        requestAnimationFrame(this.animationFrameCallback);
    }
    BaseSim.prototype.update = function (dtMs) {
        ++this.updateCount;
    };
    BaseSim.prototype.render = function () {
        this.renderer.render(this.scene, this.camera);
    };
    return BaseSim;
})();
//# sourceMappingURL=base.js.map