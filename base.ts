/// <reference path="typings/tsd.d.ts" />

class BaseSim {
	protected fov = 75.0;
	protected aspectRatio = 1.0;
	protected nearClip = 0.1;
	protected farClip = 10000.0;

	protected $containerEl: JQuery;
	protected containerWidth: number;
	protected containerHeight: number;
	protected scene: THREE.Scene;
	protected camera: THREE.Camera;
	protected renderer: THREE.WebGLRenderer;

	protected lastRenderTimeMs = 0;
	protected updateCount = 0;


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
		this.renderer.setClearColor( 0x000000 );
		containingElement.appendChild( this.renderer.domElement );

		// Bootstrap animation loop
		this.lastRenderTimeMs = window.performance.now();
		requestAnimationFrame( this.animationFrameCallback );
	}


	// Fat arrow closure to preserve 'this' context when reinvoked on subsequent frames
	protected animationFrameCallback = ( timestampMs: number ) => {
		var dtMs = timestampMs - this.lastRenderTimeMs;
		this.update( dtMs );
		this.render();
		this.lastRenderTimeMs = timestampMs;
		requestAnimationFrame( this.animationFrameCallback );
	}

	protected update( dtMs: number ) {
		++this.updateCount;
	}

	protected render() {
		this.renderer.render( this.scene, this.camera );
	}
}