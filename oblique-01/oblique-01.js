/// <reference path="../base.ts" />
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var gMath = Math;
var THREE;
(function (THREE) {
    var ObliqueCamera = (function (_super) {
        __extends(ObliqueCamera, _super);
        function ObliqueCamera(left, right, top, bottom, near, far, alpha, phi) {
            if (near === void 0) { near = 0.1; }
            if (far === void 0) { far = 2000; }
            if (alpha === void 0) { alpha = -45.0; }
            if (phi === void 0) { phi = 63.4349488; }
            this.alpha = alpha;
            this.phi = phi;
            _super.call(this, left, right, top, bottom, near, far);
            this.type = 'ObliqueCamera';
        }
        ObliqueCamera.prototype.updateProjectionMatrix = function () {
            _super.prototype.updateProjectionMatrix.call(this);
            var L = 1.0 / gMath.tan(THREE.Math.degToRad(this.phi));
            var cosA = gMath.cos(THREE.Math.degToRad(this.alpha));
            var sinA = gMath.sin(THREE.Math.degToRad(this.alpha));
            var obliqueShear = new THREE.Matrix4();
            var m = obliqueShear.elements;
            m[0] = 1.0;
            m[4] = 0.0;
            m[8] = L * cosA;
            m[12] = 0.0;
            m[1] = 0.0;
            m[5] = 1.0;
            m[9] = L * sinA;
            m[13] = 0.0;
            m[2] = 0.0;
            m[6] = 0.0;
            m[10] = 1.0;
            m[14] = 0.0;
            m[3] = 0.0;
            m[7] = 0.0;
            m[11] = 0.0;
            m[15] = 1.0;
            this.projectionMatrix.multiplyMatrices(this.projectionMatrix, obliqueShear);
        };
        return ObliqueCamera;
    })(THREE.OrthographicCamera);
    THREE.ObliqueCamera = ObliqueCamera;
})(THREE || (THREE = {}));
var ObliqueSim = (function (_super) {
    __extends(ObliqueSim, _super);
    function ObliqueSim(containingElement) {
        var _this = this;
        if (containingElement === void 0) { containingElement = document.body; }
        _super.call(this, containingElement);
        this.camera = new THREE.ObliqueCamera(0, this.containerWidth, 0, this.containerHeight, 0.1, 2000.0, -45, 45.0);
        this.camera.position.z = 200.1;
        this.material = new THREE.MeshBasicMaterial({
            blending: THREE.AdditiveBlending,
            color: 0x00ccff,
            depthTest: false,
            opacity: 0.5,
            side: THREE.DoubleSide,
            transparent: true
        });
        var loader = new THREE.OBJLoader();
        loader.load('../assets/cf-logo.obj', function (obj) {
            _this.mesh = (obj.children[0]);
            _this.mesh.material = _this.material;
            _this.mesh.position.x = _this.containerWidth / 2;
            _this.mesh.position.y = _this.containerHeight / 2;
            _this.mesh.position.z = 100;
            _this.mesh.scale.set(200, 200, 200);
            _this.scene.add(_this.mesh);
        });
        var testCube = new THREE.BoxGeometry(1, 1, 1);
        var testMesh = new THREE.Mesh(testCube, new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: true }));
        testMesh.position.x = this.containerWidth / 2;
        testMesh.position.y = this.containerHeight / 2;
        testMesh.position.z = 100;
        testMesh.scale.set(200, 200, 200);
        this.scene.add(testMesh);
        this.gui = new dat.GUI();
        var guiProj = this.gui.addFolder('projection');
        guiProj.open();
        guiProj.add(this.camera, 'alpha', -180, 180);
        guiProj.add(this.camera, 'phi', 1, 90);
    }
    ObliqueSim.prototype.update = function (dtMs) {
        _super.prototype.update.call(this, dtMs);
        var dtSec = dtMs / 1000;
        (this.camera).updateProjectionMatrix();
    };
    return ObliqueSim;
})(BaseSim);
var g_sim;
function main() {
    g_sim = new ObliqueSim();
}
main();
//# sourceMappingURL=oblique-01.js.map