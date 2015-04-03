/// <reference path="typings/tsd.d.ts" />

class GenerativeSim {
	protected fov = 75.0;
	protected aspectRatio = 1.0;
	protected nearClip = 0.1;
	protected farClip = 10000.0;

	protected $containerEl : JQuery;
	protected containerWidth : number;
	protected containerHeight : number;
	protected scene : THREE.Scene;
	protected camera : THREE.Camera;
	protected renderer : THREE.WebGLRenderer;

	protected lastRenderTimeMs = 0;


	constructor( containingElement: HTMLElement = document.body ) {
		this.$containerEl = $( containingElement );

		// TODO: Handle resize
		var width = this.$containerEl.innerWidth();
		var height = this.$containerEl.innerHeight();
		this.containerWidth = width;
		this.containerHeight = height;
		this.aspectRatio = width / height;

		// Create scene
		this.scene = new THREE.Scene();

		// Create camera
		this.camera = new THREE.PerspectiveCamera( this.fov, this.aspectRatio, this.nearClip, this.farClip );

		// Create and attach renderer
		this.renderer = new THREE.WebGLRenderer();
		this.renderer.setSize( width, height );
		this.renderer.setClearColor( 0x222222 );
		containingElement.appendChild( this.renderer.domElement );

		// Bootstrap animation loop
		this.lastRenderTimeMs = window.performance.now();
		requestAnimationFrame( this.animationFrameCallback );
	}

	// Fat arrow closure to preserve 'this' context when reinvoked on subsequent frames
	protected animationFrameCallback = ( timestampMs : number ) => {
		var dtMs = timestampMs - this.lastRenderTimeMs;
		this.update( dtMs );
		this.render();
		this.lastRenderTimeMs = timestampMs;
		requestAnimationFrame( this.animationFrameCallback );
	}

	protected update( dtMs : number ) {

	}

	protected render() {
		this.renderer.render( this.scene, this.camera );
	}
}


////////////////////////////////////////


class TriangleSim extends GenerativeSim {
	protected velocityMin = 5;
	protected velocityMax = 30;

	protected positions = new Float32Array( this.numParticles * 3 ); // 3 floats per position (X, Y, Z)
	protected velocities = new Float32Array( this.numParticles * 2 ); // 2 floats per velocity (X, Y)

	protected geometry : THREE.BufferGeometry;
	protected positionAttribute : THREE.BufferAttribute;
	protected indexAttribute : THREE.BufferAttribute;
	protected indexBuffer : Uint16Array;
	protected material : THREE.Material;
	protected mesh : THREE.Mesh;

	constructor( protected numParticles : number = 1000, containingElement: HTMLElement = document.body ) {
		super( containingElement );

		this.camera = new THREE.OrthographicCamera( 0, this.containerWidth, 0, this.containerHeight );

		this.indexBuffer = new Uint16Array( 3 * (this.numParticles * 2 - 4) );

		for ( var i = 0; i < this.numParticles; ++i ) {
			this.positions[i*3 + 0] = Math.random() * this.containerWidth;
			this.positions[i*3 + 1] = Math.random() * this.containerHeight;
			this.positions[i*3 + 2] = 0;

			this.velocities[i*2 + 0] = (this.velocityMin + (Math.random() * (this.velocityMax - this.velocityMin))) * (Math.random() > 0.5 ? -1 : 1);
			this.velocities[i*2 + 1] = (this.velocityMin + (Math.random() * (this.velocityMax - this.velocityMin))) * (Math.random() > 0.5 ? -1 : 1);
		}

		this.geometry = new THREE.BufferGeometry();
		this.geometry.dynamic = true;
		this.geometry.addAttribute( 'position', this.positionAttribute = new THREE.BufferAttribute( this.positions, 3 ) );
		this.geometry.addAttribute( 'index', this.indexAttribute = new THREE.BufferAttribute( this.indexBuffer, 1 ) );
		this.geometry.computeBoundingSphere();

		this.material = new THREE.MeshBasicMaterial( { color: 0xff0000, side: THREE.DoubleSide, wireframe: true } );
		this.mesh = new THREE.Mesh( this.geometry, this.material );
		this.scene.add( this.mesh );

		this.camera.position.z = 1000;
	}

	protected update( dtMs : number ) {
		var dtSec = dtMs / 1000;

		// Apply velocity
		for (var i = 0; i < this.numParticles; ++i) {
			this.positions[i*3 + 0] += this.velocities[i*2 + 0] * dtSec;
			this.positions[i*3 + 1] += this.velocities[i*2 + 1] * dtSec;
		}
		this.positionAttribute.needsUpdate = true;

		// Retriangulate
		// FIXME: Adapt Delaunay triangulation methods to work with TypedArray
		var tri_input = new Array( this.numParticles );
		for ( var i = 0; i < this.numParticles; ++i ) {
			tri_input[i] = [this.positions[i*3 + 0], this.positions[i*3 + 1]];
		}
		var triangulation : Array<number> = Delaunay.triangulate( tri_input );

		// Update index buffer
		this.indexBuffer.set( triangulation );
		var zeroFillLen = this.indexBuffer.length - triangulation.length;
		if ( zeroFillLen > 0 ) {
			var zeroFillBuf = new Uint16Array( zeroFillLen );
			this.indexBuffer.set( zeroFillBuf, triangulation.length );
		}
		this.indexAttribute.needsUpdate = true;
	}
}


////////////////////////////////////////


var g_sim : GenerativeSim;
function main(): void {
	g_sim = new TriangleSim();
}

main();