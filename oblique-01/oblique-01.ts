/// <reference path="../base.ts" />

var gMath = Math;
module THREE {
	export function handleColorChange( color: THREE.Color ) {
		return ( value: any ) => {
			if ( typeof value === 'string' ) {
				value = value.replace( '#', '0x' );
			}

			color.setHex( value );
		}
	}

	export class ObliqueCamera extends OrthographicCamera {
		public alpha: number;
		public phi: number;

		constructor( left: number, right: number, top: number, bottom: number,
		             near: number = 0.1, far: number = 2000,
		             alpha: number = -45.0, phi: number = 63.4349488 ) {
			this.alpha = alpha;
			this.phi = phi;

			super( left, right, top, bottom, near, far );

			this.type = 'ObliqueCamera';
		}

		public updateProjectionMatrix(): void {
			super.updateProjectionMatrix();

			var L = 1.0 / gMath.tan( THREE.Math.degToRad( this.phi ) )
			var cosA = gMath.cos( THREE.Math.degToRad( this.alpha ) );
			var sinA = gMath.sin( THREE.Math.degToRad( this.alpha ) );

			var obliqueShear = new THREE.Matrix4();
			var m = obliqueShear.elements;
			m[0] = 1.0;    m[4] = 0.0;    m[ 8] = L*cosA;    m[12] = 0.0;
			m[1] = 0.0;    m[5] = 1.0;    m[ 9] = L*sinA;    m[13] = 0.0;
			m[2] = 0.0;    m[6] = 0.0;    m[10] =    1.0;    m[14] = 0.0;
			m[3] = 0.0;    m[7] = 0.0;    m[11] =    0.0;    m[15] = 1.0;

			this.projectionMatrix.multiplyMatrices( this.projectionMatrix, obliqueShear );
		}
	}
}

class ObliqueSim extends BaseSim {
	protected gui: dat.GUI;

	protected material: THREE.Material;
	protected mesh: THREE.Mesh;

	protected meshColor;


	constructor( containingElement: HTMLElement = document.body ) {
		super( containingElement );

		this.camera = new THREE.ObliqueCamera( 0, this.containerWidth, 0, this.containerHeight, 0.1, 2000.0, -45, 45.0 );
		this.camera.position.z = 200.1;

		this.material = new THREE.MeshBasicMaterial( {
			blending: THREE.AdditiveBlending,
			color: 0x00ccff,
			depthTest: false,
			opacity: 0.5,
			side: THREE.DoubleSide,
			transparent: true
		} );

		this.meshColor = this.material.color.getHex();

		var loader = new THREE.OBJLoader();
		loader.load( '../assets/cf-logo.obj', ( obj: THREE.Object3D ) => {
			this.mesh = <THREE.Mesh>( obj.children[0] );

			this.mesh.material = this.material;
			this.mesh.position.x = this.containerWidth / 2;
			this.mesh.position.y = this.containerHeight / 2;
			this.mesh.position.z = 100;
			this.mesh.scale.set( 200, 200, 200 );

			this.scene.add( this.mesh );
		} );

		var testCube = new THREE.BoxGeometry( 1, 1, 1 );
		var testMesh = new THREE.Mesh( testCube, new THREE.MeshBasicMaterial( { color: 0x00ff00, wireframe: true } ) );
		testMesh.position.x = this.containerWidth / 2;
		testMesh.position.y = this.containerHeight / 2;
		testMesh.position.z = 100;
		testMesh.scale.set( 200, 200, 200 );
		this.scene.add( testMesh );

		this.gui = new dat.GUI();
		this.gui.addColor( this, 'meshColor' ).onChange( THREE.handleColorChange( this.material.color ) );
		var guiProj = this.gui.addFolder( 'projection' );
		guiProj.open();
		guiProj.add( this.camera, 'alpha', -180, 180 );
		guiProj.add( this.camera, 'phi', 1, 90 );
	}


	protected update( dtMs: number ) {
		super.update( dtMs );

		var dtSec = dtMs / 1000;
		(<THREE.ObliqueCamera>(this.camera)).updateProjectionMatrix();
	}
}


var g_sim: BaseSim;
function main(): void {
	g_sim = new ObliqueSim();
}

main();