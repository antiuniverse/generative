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
	protected animationFrameCallback = ( timestampMs : number ) => {
		var dtMs = timestampMs - this.lastRenderTimeMs;
		this.update( dtMs );
		this.render();
		this.lastRenderTimeMs = timestampMs;
		requestAnimationFrame( this.animationFrameCallback );
	}

	protected update( dtMs : number ) {
		++this.updateCount;
	}

	protected render() {
		this.renderer.render( this.scene, this.camera );
	}
}


////////////////////////////////////////


class TriangleSim extends GenerativeSim {
	protected velocityMin = 25;
	protected velocityMax = 50;

	protected numParticles : number;
	protected maxNumTris : number;
	protected maxNumVerts : number;

	protected positions : Float32Array;
	protected velocities : Float32Array;

	protected indexBuffer : Uint16Array;
	protected vertexBuffer : Float32Array; //ArrayBuffer; // <-- For interleaved vertex format?
	protected primCentroidBuffer : Float32Array;

	protected geometry : THREE.BufferGeometry;
	protected positionAttribute : THREE.BufferAttribute;
	protected primCentroidAttribute : THREE.BufferAttribute;
	protected indexAttribute : THREE.BufferAttribute;
	protected material : THREE.Material;
	protected mesh : THREE.Mesh;
	protected pointCloudMaterial : THREE.PointCloudMaterial;
	protected pointCloud : THREE.PointCloud;

	protected triangulation : Array<number>;

	constructor( numParticles : number, containingElement : HTMLElement = document.body ) {
		super( containingElement );

		this.numParticles = numParticles;
		this.camera = new THREE.OrthographicCamera( 0, this.containerWidth, 0, this.containerHeight, this.nearClip, this.farClip );

		// Upper bound on faces in triangulation, per http://math.stackexchange.com/a/745166/127337
		this.maxNumTris = this.numParticles * 2 - 4;
		this.maxNumVerts = this.maxNumTris * 3; // Need to duplicate vertices to emulate per-primitive attributes

		// Create canonical arrays
		this.positions = new Float32Array( this.numParticles * 3 ); // 3 floats per position (X, Y, Z)
		this.velocities = new Float32Array( this.numParticles * 2 ); // 2 floats per velocity (X, Y)

		// Create index buffer
		this.indexBuffer = new Uint16Array( this.maxNumTris * 3 );

		for ( var i = 0; i < this.indexBuffer.length; ++i ) {
			this.indexBuffer[i] = i;
		}

		// Create vertex buffers
		this.vertexBuffer = new Float32Array( this.maxNumVerts * 3 );
		this.primCentroidBuffer = new Float32Array( this.maxNumVerts * 2 );

		// Initialize particles' position and velocity
		for ( var i = 0; i < this.numParticles; ++i ) {
			this.positions[i*3 + 0] = Math.random() * this.containerWidth;
			this.positions[i*3 + 1] = Math.random() * this.containerHeight;
			this.positions[i*3 + 2] = 0;

			this.velocities[i*2 + 0] = (this.velocityMin + (Math.random() * (this.velocityMax - this.velocityMin))) * (Math.random() > 0.5 ? -1 : 1);
			this.velocities[i*2 + 1] = (this.velocityMin + (Math.random() * (this.velocityMax - this.velocityMin))) * (Math.random() > 0.5 ? -1 : 1);
		}

		this.geometry = new THREE.BufferGeometry();
		this.geometry.addAttribute( 'position', this.positionAttribute = new THREE.DynamicBufferAttribute( this.vertexBuffer, 3 ) );
		this.geometry.addAttribute( 'primCentroid', this.primCentroidAttribute = new THREE.DynamicBufferAttribute( this.primCentroidBuffer, 2 ) );
		this.geometry.addAttribute( 'index', this.indexAttribute = new THREE.BufferAttribute( this.indexBuffer, 1 ) );

		this.material = new THREE.ShaderMaterial( {
			attributes: {
				primCentroid: { type: 'v2', value: null }
			},
			uniforms: {
				viewportSize: { type: 'v2', value: new THREE.Vector2( this.containerWidth, this.containerHeight ) }
			},
			vertexShader: document.getElementById( 'tri_vs' ).textContent,
			fragmentShader: document.getElementById( 'tri_fs' ).textContent,
			side: THREE.DoubleSide,
			blending: THREE.AdditiveBlending,
			depthTest: false,
			transparent: true
			//,wireframe: true
		} );

		this.mesh = new THREE.Mesh( this.geometry, this.material );
		this.mesh.frustumCulled = false;
		this.scene.add( this.mesh );

		////////////////////////////////////////

		this.pointCloudMaterial = new THREE.PointCloudMaterial( {
			color: 0x000000,
			size: 50.0
		} );
		this.pointCloud = new THREE.PointCloud( this.geometry, this.pointCloudMaterial );
		this.pointCloud.frustumCulled = false;
		this.scene.add( this.pointCloud );

		this.camera.position.z = this.farClip * 0.5;
	}

	protected update( dtMs : number ) {
		super.update( dtMs );

		var dtSec = dtMs / 1000;

		// Simulate particle kinematics
		for (var i = 0; i < this.numParticles; ++i) {
			// Apply velocity
			this.positions[i*3 + 0] += this.velocities[i*2 + 0] * dtSec;
			this.positions[i*3 + 1] += this.velocities[i*2 + 1] * dtSec;

			// Reflect X velocity at the container left/right edges
			if ( this.positions[i*3 + 0] < 0 || this.positions[i*3 + 0] > this.containerWidth ) {
				this.velocities[i*2 + 0] *= -1;
			}

			// Reflect Y velocity at the container top/bottom edges
			if ( this.positions[i*3 + 1] < 0 || this.positions[i*3 + 1] > this.containerHeight ) {
				this.velocities[i*2 + 1] *= -1;
			}
		}

		if ( this.updateCount % 1800 == 1 ) {
			this.UpdateTriangulation();
		}

		this.UpdateVertexBuffer();
		this.UpdateCentroidBuffer();
	}

	protected UpdateTriangulation() {
		// Retriangulate
		// FIXME: Adapt Delaunay triangulation methods to work with TypedArray
		var tri_input = new Array( this.numParticles );
		for ( var i = 0; i < this.numParticles; ++i ) {
			tri_input[i] = [this.positions[i * 3 + 0], this.positions[i * 3 + 1]];
		}
		this.triangulation = Delaunay.triangulate( tri_input );
	}

	protected UpdateVertexBuffer() {
		for ( var i = 0; i < this.maxNumVerts; ++i ) {
			if ( i < this.triangulation.length ) {
				var particleIdx = this.triangulation[i];
				this.vertexBuffer[i * 3 + 0] = this.positions[particleIdx * 3 + 0];
				this.vertexBuffer[i * 3 + 1] = this.positions[particleIdx * 3 + 1];
				this.vertexBuffer[i * 3 + 2] = this.positions[particleIdx * 3 + 2];
			} else {
				this.vertexBuffer[i * 3 + 0] = 0;
				this.vertexBuffer[i * 3 + 1] = 0;
				this.vertexBuffer[i * 3 + 2] = 0;
			}
		}
		this.positionAttribute.needsUpdate = true;
	}

	protected UpdateCentroidBuffer() {
		// Update per-triangle centroids (WTB SIMD)
		for ( var i = 0; i < this.triangulation.length; i += 3 ) {
			var vertexA_X = this.vertexBuffer[i * 3 + 0];
			var vertexA_Y = this.vertexBuffer[i * 3 + 1];
			//	var vertexA_Z = this.vertexBuffer[i*3 + 2];
			var vertexB_X = this.vertexBuffer[i * 3 + 3];
			var vertexB_Y = this.vertexBuffer[i * 3 + 4];
			//	var vertexB_Z = this.vertexBuffer[i*3 + 5];
			var vertexC_X = this.vertexBuffer[i * 3 + 6];
			var vertexC_Y = this.vertexBuffer[i * 3 + 7];
			//	var vertexC_Z = this.vertexBuffer[i*3 + 8];

			var centroidX = (vertexA_X + vertexB_X + vertexC_X) / 3;
			var centroidY = (vertexA_Y + vertexB_Y + vertexC_Y) / 3;
			//	var centroidZ = (vertexA_Z + vertexB_Z + vertexC_Z) / 3;

			this.primCentroidBuffer[i * 2 + 0] = centroidX;
			this.primCentroidBuffer[i * 2 + 1] = centroidY;
			this.primCentroidBuffer[i * 2 + 2] = centroidX;
			this.primCentroidBuffer[i * 2 + 3] = centroidY;
			this.primCentroidBuffer[i * 2 + 4] = centroidX;
			this.primCentroidBuffer[i * 2 + 5] = centroidY;
		}
		this.primCentroidAttribute.needsUpdate = true;
	}
}


////////////////////////////////////////


var g_sim : GenerativeSim;
function main(): void {
	g_sim = new TriangleSim( 400 );
}

main();