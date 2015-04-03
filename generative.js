/// <reference path="typings/tsd.d.ts" />
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var GenerativeSim = (function () {
    function GenerativeSim(containingElement) {
        var _this = this;
        if (containingElement === void 0) { containingElement = document.body; }
        this.fov = 75.0;
        this.aspectRatio = 1.0;
        this.nearClip = 0.1;
        this.farClip = 10000.0;
        this.lastRenderTimeMs = 0;
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
        this.renderer.setClearColor(0x222222);
        containingElement.appendChild(this.renderer.domElement);
        // Bootstrap animation loop
        this.lastRenderTimeMs = window.performance.now();
        requestAnimationFrame(this.animationFrameCallback);
    }
    GenerativeSim.prototype.update = function (dtMs) {
    };
    GenerativeSim.prototype.render = function () {
        this.renderer.render(this.scene, this.camera);
    };
    return GenerativeSim;
})();
////////////////////////////////////////
var TriangleSim = (function (_super) {
    __extends(TriangleSim, _super);
    function TriangleSim(numParticles, containingElement) {
        if (numParticles === void 0) { numParticles = 1000; }
        if (containingElement === void 0) { containingElement = document.body; }
        _super.call(this, containingElement);
        this.numParticles = numParticles;
        this.velocityMin = 5;
        this.velocityMax = 30;
        this.positions = new Float32Array(this.numParticles * 3); // 3 floats per position (X, Y, Z)
        this.velocities = new Float32Array(this.numParticles * 2); // 2 floats per velocity (X, Y)
        this.camera = new THREE.OrthographicCamera(0, this.containerWidth, 0, this.containerHeight);
        this.indexBuffer = new Uint16Array(3 * (this.numParticles * 2 - 4));
        for (var i = 0; i < this.numParticles; ++i) {
            this.positions[i * 3 + 0] = Math.random() * this.containerWidth;
            this.positions[i * 3 + 1] = Math.random() * this.containerHeight;
            this.positions[i * 3 + 2] = 0;
            this.velocities[i * 2 + 0] = (this.velocityMin + (Math.random() * (this.velocityMax - this.velocityMin))) * (Math.random() > 0.5 ? -1 : 1);
            this.velocities[i * 2 + 1] = (this.velocityMin + (Math.random() * (this.velocityMax - this.velocityMin))) * (Math.random() > 0.5 ? -1 : 1);
        }
        this.geometry = new THREE.BufferGeometry();
        this.geometry.dynamic = true;
        this.geometry.addAttribute('position', this.positionAttribute = new THREE.BufferAttribute(this.positions, 3));
        this.geometry.addAttribute('index', this.indexAttribute = new THREE.BufferAttribute(this.indexBuffer, 1));
        this.geometry.computeBoundingSphere();
        this.material = new THREE.MeshBasicMaterial({ color: 0xff0000, side: THREE.DoubleSide, wireframe: true });
        this.mesh = new THREE.Mesh(this.geometry, this.material);
        this.scene.add(this.mesh);
        this.camera.position.z = 1000;
    }
    TriangleSim.prototype.update = function (dtMs) {
        var dtSec = dtMs / 1000;
        for (var i = 0; i < this.numParticles; ++i) {
            this.positions[i * 3 + 0] += this.velocities[i * 2 + 0] * dtSec;
            this.positions[i * 3 + 1] += this.velocities[i * 2 + 1] * dtSec;
        }
        this.positionAttribute.needsUpdate = true;
        // Retriangulate
        // FIXME: Adapt Delaunay triangulation methods to work with TypedArray
        var tri_input = new Array(this.numParticles);
        for (var i = 0; i < this.numParticles; ++i) {
            tri_input[i] = [this.positions[i * 3 + 0], this.positions[i * 3 + 1]];
        }
        var triangulation = Delaunay.triangulate(tri_input);
        // Update index buffer
        this.indexBuffer.set(triangulation);
        var zeroFillLen = this.indexBuffer.length - triangulation.length;
        if (zeroFillLen > 0) {
            var zeroFillBuf = new Uint16Array(zeroFillLen);
            this.indexBuffer.set(zeroFillBuf, triangulation.length);
        }
        this.indexAttribute.needsUpdate = true;
    };
    return TriangleSim;
})(GenerativeSim);
////////////////////////////////////////
var g_sim;
function main() {
    g_sim = new TriangleSim();
}
main();
//# sourceMappingURL=generative.js.map