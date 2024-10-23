// Name: BlockifyVR
// ID: blockifyvr
// Description: An extension that adds full Virtual Reality support.
// By: -MasterMath- <https://scratch.mit.edu/users/-MasterMath-/>
// License: MPL-2.0 and MIT //TODO: put the right license here before publishing.

//* Research, planning, and preliminary project development started Friday, January 27, 2023.

//* This extension supports Oculus Rift, Rift S, Quest 1, Quest 2, Quest 3, Quest Pro, HTC Vive, and Windows Mixed Reality headsets on WebXR compatible browsers.

/*=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=A-FRAME LIBRARY-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

A-frame library for VR support. Their website can be found at https://aframe.io

Minified source code found at https://aframe.io/releases/1.5.0/aframe.min.js.
Unminified source code can be found at https://aframe.io/releases/1.5.0/aframe.js

The A-frame libary is licensed under the MIT license, which can be found at https://github.com/aframevr/aframe/blob/master/LICENSE.

=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
*/

//Start the extension
(function(Scratch) {
  'use strict';

  if (!Scratch.extensions.unsandboxed) {
    throw new Error('This extension must run unsandboxed for it to work properly.');
  }

  const vm = Scratch.vm;
  const runtime = vm.runtime;
  const gl = vm.renderer.gl;

  /* eslint-disable */
  // prettier-ignore
  //# sourceMappingURL=aframe.min.js.map
  /* eslint-enable */

  // prettier-ignore
  const htmlcode = `
  <a-scene renderer="highRefreshRate: true; multiviewStereo: true; foveationLevel: 0.25;" background="color: white" pose-matrices embedded style="display: none; !important">
    <a-entity camera look-controls id="AframeCamera" camera-logger>
      <a-plane id="scratchStageVRDisplay" material="shader: flat; src: #scratchcanvas;" update-display></a-plane>
    </a-entity>
    <a-entity oculus-touch-controls="hand: left" left-controller-manager visible="false"></a-entity>
    <a-entity oculus-touch-controls="hand: right" right-controller-manager visible="false"></a-entity>
  </a-scene>
  `;
  gl.canvas.setAttribute("id", "scratchcanvas");
  document.head.innerHTML += htmlcode;

  const AScene = document.querySelector("a-scene");

  let initialStageWidth = runtime.stageWidth;
  let initialStageHeight = runtime.stageHeight;

  AScene.addEventListener('enter-vr', function () {
    inVR = true;
    // Resize stage to its initial size to prevent WebGL texture errors.
    vm.setStageSize(Scratch.Cast.toNumber(initialStageWidth), Scratch.Cast.toNumber(initialStageHeight));
    //Scale the display to match the camera size while maintaining the ratio of the Scratch Stage.
    requestAnimationFrame(() => {
      const plane = document.getElementById("scratchStageVRDisplay");
      const canvas = AScene.renderer.domElement;
      const fov = THREE.MathUtils.degToRad(document.getElementById("AframeCamera").components.camera.data.fov);
      const canvasAspect = canvas.width / canvas.height;
      const stageAspect = runtime.stageWidth / runtime.stageHeight;
      let height = 2 * Math.tan(fov / 2);
      let width = height * canvasAspect;
      const cameraWidth = width;
      const cameraHeight = height;

      if (stageAspect > canvasAspect) {
        width = height * stageAspect;
      } else {
        height = width / stageAspect;
      }

      if (width > height) {
        width -= height - cameraHeight;
        height -= height - cameraHeight;
      } else if (height > width) {
        height -= width - cameraWidth;
        width -= width - cameraWidth;
      }

      plane.object3D.scale.set(width, height, 1);
      plane.object3D.position.set(0, 0, -1);
    });
  });
  
  AScene.addEventListener('exit-vr', function () {
    inVR = false;
    vm.setStageSize(Scratch.Cast.toNumber(initialStageWidth), Scratch.Cast.toNumber(initialStageHeight));
  });

  //=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
  let inVR = false

  let cameraOrientationX, cameraOrientationY, cameraOrientationZ;

  let cameraPosX, cameraPosY, cameraPosZ;

  let leftControllerOrientationX, leftControllerOrientationY, leftControllerOrientationZ;

  let leftControllerPositionX, leftControllerPositionY, leftControllerPositionZ;

  let rightControllerOrientationX, rightControllerOrientationY, rightControllerOrientationZ;

  let rightControllerPositionX, rightControllerPositionY, rightControllerPositionZ;

  let rightTriggerPressed, leftTriggerPressed, rightThumbstickPressed, leftThumbstickPressed, rightGripPressed, leftGripPressed = false;

  let aButtonPressed, bButtonPressed, xButtonPressed, yButtonPressed = false;
  // TODO: Add more buttons for controllers of other platforms.
  let leftThumbstickX, leftThumbstickY, rightThumbstickX, rightThumbstickY, rightThumbstickDirection, leftThumbstickDirection;

  let lastButtonPressed;

  let rightControllerConnected,leftControllerConnected = false;
  //=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
  let display = document.getElementById("scratchStageVRDisplay");
  let material;
  AFRAME.registerComponent('update-display', {
    dependencies: ['geometry', 'material'],
    init: function () {
      material = display.getObject3D('mesh').material;
    },
    tick: function () {
      runtime.frameLoop.stepCallback();
      material.map.needsUpdate = true;
    }
  });

  let xrProjectionMatrix;
  let xrTransform;
  let xrCombinedMatrix;
  //Matrix processing code from the AR extension.
  AFRAME.registerComponent('pose-matrices', {
    tick: function () {
      if (inVR == true) { 
        var frame = this.el.frame;
        var xrRefSpace = this.el.renderer.xr.getReferenceSpace();
        if (xrRefSpace) {
          const pose = frame.getViewerPose(xrRefSpace);
          if (pose) {
            xrProjectionMatrix = pose.views[0].projectionMatrix;
            xrTransform = pose.views[0].transform;
            const inverseTransformMatrix = xrTransform.inverse.matrix;
            const a00 = xrProjectionMatrix[0];
            const a01 = xrProjectionMatrix[1];
            const a02 = xrProjectionMatrix[2];
            const a03 = xrProjectionMatrix[3];
            const a10 = xrProjectionMatrix[4];
            const a11 = xrProjectionMatrix[5];
            const a12 = xrProjectionMatrix[6];
            const a13 = xrProjectionMatrix[7];
            const a20 = xrProjectionMatrix[8];
            const a21 = xrProjectionMatrix[9];
            const a22 = xrProjectionMatrix[10];
            const a23 = xrProjectionMatrix[11];
            const a30 = xrProjectionMatrix[12];
            const a31 = xrProjectionMatrix[13];
            const a32 = xrProjectionMatrix[14];
            const a33 = xrProjectionMatrix[15];
            const b00 = inverseTransformMatrix[0];
            const b01 = inverseTransformMatrix[1];
            const b02 = inverseTransformMatrix[2];
            const b03 = inverseTransformMatrix[3];
            const b10 = inverseTransformMatrix[4];
            const b11 = inverseTransformMatrix[5];
            const b12 = inverseTransformMatrix[6];
            const b13 = inverseTransformMatrix[7];
            const b20 = inverseTransformMatrix[8];
            const b21 = inverseTransformMatrix[9];
            const b22 = inverseTransformMatrix[10];
            const b23 = inverseTransformMatrix[11];
            const b30 = inverseTransformMatrix[12];
            const b31 = inverseTransformMatrix[13];
            const b32 = inverseTransformMatrix[14];
            const b33 = inverseTransformMatrix[15];
            xrCombinedMatrix = [
              b00 * a00 + b01 * a10 + b02 * a20 + b03 * a30,
              b00 * a01 + b01 * a11 + b02 * a21 + b03 * a31,
              b00 * a02 + b01 * a12 + b02 * a22 + b03 * a32,
              b00 * a03 + b01 * a13 + b02 * a23 + b03 * a33,
              b10 * a00 + b11 * a10 + b12 * a20 + b13 * a30,
              b10 * a01 + b11 * a11 + b12 * a21 + b13 * a31,
              b10 * a02 + b11 * a12 + b12 * a22 + b13 * a32,
              b10 * a03 + b11 * a13 + b12 * a23 + b13 * a33,
              b20 * a00 + b21 * a10 + b22 * a20 + b23 * a30,
              b20 * a01 + b21 * a11 + b22 * a21 + b23 * a31,
              b20 * a02 + b21 * a12 + b22 * a22 + b23 * a32,
              b20 * a03 + b21 * a13 + b22 * a23 + b23 * a33,
              b30 * a00 + b31 * a10 + b32 * a20 + b33 * a30,
              b30 * a01 + b31 * a11 + b32 * a21 + b33 * a31,
              b30 * a02 + b31 * a12 + b32 * a22 + b33 * a32,
              b30 * a03 + b31 * a13 + b32 * a23 + b33 * a33,
            ];
          }
        }
      }
    }
  });

  let rotation;
  AFRAME.registerComponent('camera-logger', {
    tick: function () {
      rotation = this.el.getAttribute('rotation');
      //Switch rotation Yaw = Y and Pitch = X to Yaw = X and Pitch = Y to match most Scratch 3D engines
      this.el.object3D.rotation.set(
        THREE.MathUtils.degToRad(rotation.y),
        THREE.MathUtils.degToRad(rotation.x),
        THREE.MathUtils.degToRad(rotation.z),
      );
      rotation = this.el.getAttribute('rotation');
      cameraOrientationX = rotation.x;
      cameraOrientationY = rotation.y;
      cameraOrientationZ = rotation.z;
      cameraPosX = this.el.object3D.position.x;
      cameraPosY = this.el.object3D.position.y;
      cameraPosZ = this.el.object3D.position.z;
    },
  });

  AFRAME.registerComponent('custom-controls', {
    schema: {
      hand: {default: ''},
    },
    
    update: function () {
      var hand = this.data.hand;
      var el = this.el;
      var controlConfiguration = {
        hand: hand,
        model: false,
        orientationOffset: {x: 0, y: 0, z: hand === 'left' ? 90 : -90}
      };

      el.setAttribute('vive-controls', controlConfiguration);
      el.setAttribute('oculus-touch-controls', controlConfiguration);
      el.setAttribute('windows-motion-controls', controlConfiguration);
    }
  });

  AFRAME.registerComponent('right-controller-manager', {
    init: function () {
      this.el.addEventListener('thumbstickmoved', this.logThumbstick);
      this.el.addEventListener('triggerchanged', this.logTrigger);
      this.el.addEventListener('gripchanged', this.logGrip);
      this.el.addEventListener('controllerconnected', function() {
        rightControllerConnected = true;
      });
      this.el.addEventListener('controllerdisconnected', function() {
        rightControllerConnected = false;
      });

      var el = this.el;

      el.addEventListener('triggerdown', function() {
        rightTriggerPressed = true;
        lastButtonPressed = "right trigger";
        runtime.startHats('blockifyvr_whenAnyButtonPressed');
      });

      el.addEventListener('triggerup', function() {
        rightTriggerPressed = false;
      });

      el.addEventListener('thumbstickdown', function() {
        rightThumbstickPressed = true;
        lastButtonPressed = "right thumbstick";
        runtime.startHats('blockifyvr_whenAnyButtonPressed');
      });

      el.addEventListener('thumbstickup', function() {
        rightThumbstickPressed = false;
      });
      
      el.addEventListener('gripdown', function() {
        rightGripPressed = true;
        lastButtonPressed = "right grip";
        runtime.startHats('blockifyvr_whenAnyButtonPressed');
      });

      el.addEventListener('gripup', function() {
        rightGripPressed = false;
      });

      el.addEventListener('abuttondown', function() {
        aButtonPressed = true;
        lastButtonPressed = "A";
        runtime.startHats('blockifyvr_whenAnyButtonPressed');
      });

      el.addEventListener('abuttonup', function() {
        aButtonPressed = false;
      });

      el.addEventListener('bbuttondown', function() {
        bButtonPressed = true;
        lastButtonPressed = "B";
        runtime.startHats('blockifyvr_whenAnyButtonPressed');
      });

      el.addEventListener('bbuttonup', function() {
        bButtonPressed = false;
      });
    },

    tick: function () {
      rightControllerOrientationX = this.el.object3D.rotation.x;
      rightControllerOrientationY = this.el.object3D.rotation.y;
      rightControllerOrientationZ = this.el.object3D.rotation.z;

      rightControllerPositionX = this.el.object3D.position.x;
      rightControllerPositionY = this.el.object3D.position.y;
      rightControllerPositionZ = this.el.object3D.position.z;
    },

    logThumbstick: function (evt) {
      rightThumbstickX = evt.detail.x;
      rightThumbstickY = evt.detail.y;
      rightThumbstickDirection = Math.atan2(rightThumbstickY, rightThumbstickX) * 180 / Math.PI + 90;
    },

    logTrigger: function (evt) {
      rightTriggerAmount = evt.detail.value;
    },

    logGrip: function (evt) {
      rightGripAmount = evt.detail.value;
    }
  });

  AFRAME.registerComponent('left-controller-manager', {
    init: function () {
      this.el.addEventListener('thumbstickmoved', this.logThumbstick);
      this.el.addEventListener('triggerchanged', this.logTrigger);
      this.el.addEventListener('gripchanged', this.logGrip);
      this.el.addEventListener('controllerconnected', function() {
        leftControllerConnected = true;
      });
      this.el.addEventListener('controllerdisconnected', function() {
        leftControllerConnected = false;
      });

      let el = this.el

      el.addEventListener('triggerdown', function() {
        leftTriggerPressed = true;
        lastButtonPressed = "left trigger";
        runtime.startHats('blockifyvr_whenAnyButtonPressed');
      });

      el.addEventListener('triggerup', function() {
        leftTriggerPressed = false;
      });

      el.addEventListener('thumbstickdown', function() {
        leftThumbstickPressed = true;
        lastButtonPressed = "left thumbstick";
        runtime.startHats('blockifyvr_whenAnyButtonPressed');
      });

      el.addEventListener('thumbstickup', function() {
        leftThumbstickPressed = false;
      });
      
      el.addEventListener('gripdown', function() {
        leftGripPressed = true;
        lastButtonPressed = "left grip";
        runtime.startHats('blockifyvr_whenAnyButtonPressed');
      });

      el.addEventListener('gripup', function() {
        leftGripPressed = false;
      });

      el.addEventListener('xbuttondown', function() {
        xButtonPressed = true;
        lastButtonPressed = "X";
        runtime.startHats('blockifyvr_whenAnyButtonPressed');
      });

      el.addEventListener('xbuttonup', function() {
        xButtonPressed = false;
      });

      el.addEventListener('ybuttondown', function() {
        yButtonPressed = true;
        lastButtonPressed = "Y";
        runtime.startHats('blockifyvr_whenAnyButtonPressed');
      });

      el.addEventListener('ybuttonup', function() {
        yButtonPressed = false;
      });
    },

    tick: function () {
      leftControllerOrientationX = this.el.object3D.rotation.x;
      leftControllerOrientationY = this.el.object3D.rotation.y;
      leftControllerOrientationZ = this.el.object3D.rotation.z;
    
      leftControllerPositionX = this.el.object3D.position.x;
      leftControllerPositionY = this.el.object3D.position.y;
      leftControllerPositionZ = this.el.object3D.position.z;
    },

    logThumbstick: function (evt) {
      leftThumbstickX = evt.detail.x;
      leftThumbstickY = evt.detail.y;
      leftThumbstickDirection = Math.atan2(leftThumbstickY, leftThumbstickX) * 180 / Math.PI + 90;
    },

    logTrigger: function (evt) {
      leftTriggerAmount = evt.detail.value;
    },

    logGrip: function (evt) {
      leftGripAmount = evt.detail.value;
    }
  });

  const icon = "data:image/png;base64,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";

  class BlockifyVR {
    getInfo() {
      return {
        id: 'blockifyvr', 
        color1: '#00a616',
        color2: '#02ad19', 
        color3: '#128211', 
        name: 'BlockifyVR',
        menuIconURI: icon,
        blockIconURI: icon,
        //docsURI: 'https://extensions.turbowarp.org/-MasterMath-/BlockifyVR', //TODO: update this URL when the extension is finished. Create a Turbowarp documentation page and include an optional link to the documentation on the website.
        blocks: [
          {
            blockType: 'label',
            text: 'Utilities',
          },
          {
            opcode: 'toggleVrMode',
            blockType: Scratch.BlockType.COMMAND,
            text: '[enterExit] vr mode',
            arguments: {
              enterExit: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "enter",
                menu: 'toggleVrMode',
              }
            }
          },
          {
            opcode: 'inVR',
            blockType: Scratch.BlockType.BOOLEAN,
            text: 'in vr?',
            disableMonitor: 'true',
          },
          {
            opcode: 'headsetConnected',
            blockType: Scratch.BlockType.BOOLEAN,
            text: 'is headset connected?',
            disableMonitor: 'true',
          },
          {
            opcode: 'controllerConnected',
            blockType: Scratch.BlockType.BOOLEAN,
            text: 'is controller [controller] connected?',
            arguments: {
              controller: {
                type: Scratch.ArgumentType.STRING,
                menu: 'controllerMenu',
                defaultValue: 'left controller',
              }
            }
          },
          //* Matrix block code from the Augmented Reality extension.
          {
            opcode: 'getMatrix',
            blockType: Scratch.BlockType.REPORTER,
            text: 'item [ITEM] of [MATRIX] matrix',
            arguments: {
              ITEM: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: 1,
              },
              MATRIX: {
                type: Scratch.ArgumentType.STRING,
                menu: 'matrix',
                defaultValue: 'combined',
              },
            },
          },
          {
            opcode: 'getStageWidth',
            blockType: Scratch.BlockType.REPORTER,
            text: 'stage width',
            disableMonitor: 'true',
          },
          {
            opcode: 'getStageHeight',
            blockType: Scratch.BlockType.REPORTER,
            text: 'stage height',
            disableMonitor: 'true',
          },
          "---",
          {
            blockType: 'label',
            text: 'Transformations',
          },
          {
            opcode: 'positionOf',
            blockType: Scratch.BlockType.REPORTER,
            text: '[position] of [Device]',
            arguments: {
              position:{
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'x-position',
                menu: 'positionMenu',
              },
              Device: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'headset',
                menu: 'deviceMenu',
              }
            }
          },
          {
            opcode: 'rotationOf',
            blockType: Scratch.BlockType.REPORTER,
            text: '[direction] of [device]',
            arguments: {
              direction: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'x-rotation',
                menu: 'rotationMenu',
              },
              device: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'headset',
                menu: 'deviceMenu',
              }
            }
          },
          "---",
          {
            blockType: 'label',
            text: 'Controller Input',
          },
          {
            opcode: 'whenAnyButtonPressed',
            blockType: Scratch.BlockType.EVENT,
            text: 'when any button pressed',
            isEdgeActivated: false,
          },
          {
            opcode: 'isButtonPressed',
            blockType: Scratch.BlockType.BOOLEAN,
            text: 'button [button] pressed?',
            arguments: {
              button: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'left trigger',
                menu: 'buttonMenu',
              }
            }
          },
          {
            opcode: 'triggerGripValue',
            blockType: Scratch.BlockType.REPORTER,
            text: '[button] value',
            arguments: {
              button: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'left trigger',
                menu: 'floatButtonMenu',
              }
            }
          },
          {
            opcode: 'lastButtonPressed',
            blockType: Scratch.BlockType.REPORTER,
            text: 'last button pressed',
            disableMonitor: true,
          },
          {
            opcode: 'thumbstickDirection',
            blockType: Scratch.BlockType.REPORTER,
            text: 'thumbstick [value] of [controller]',
            arguments: {
              value: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'direction',
                menu: 'value',
              },
              controller: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'left controller',
                menu: 'controllerMenu',
              }
            }
          },
          {
            opcode: 'isThumbstickDirection',
            blockType: Scratch.BlockType.BOOLEAN,
            text: 'is [controller] thumbstick direction [direction]?',
            arguments: {
              controller: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'left controller',
                menu: 'controllerMenu',
              },
              direction: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'up',
                menu: 'cardinalDirection',
              }
            }
          }
        ],
        menus: {
          toggleVrMode: {
            acceptReporters: false,
            items: ["enter", "exit"],
          },
          rotationMenu: {
            acceptReporters: false, 
            items: ["x-rotation", "y-rotation", "z-rotation"],
          },
          deviceMenu: {
            acceptReporters: false,
            items: ["headset", "left controller", "right controller"],
          },
          positionMenu: {
            acceptReporters: false,
            items: ["x-position", "y-position", "z-position"],
          },
          //This is from the Augmented Reality extension. Credit goes to it for the matrix processing.
          matrix: {
            acceptReporters: false,
            items: ["combined", "projection", "view", "inverse view"],
          },
          buttonMenu: {
            acceptReporters: false,
            items: ["left trigger", "right trigger", "left grip", "right grip", "A", "B", "X", "Y", "left thumbstick", "right thumbstick"],
          },
          floatButtonMenu: {
            acceptReporters: false,
            items: ["left trigger", "right trigger", "left grip", "right grip"],
          },
          controllerMenu: {
            acceptReporters: false,
            items: ["left controller", "right controller"],
          },
          value: {
            acceptReporters: false,
            items: ["direction", "x value", "y value"],
          },
          cardinalDirection: {
            acceptReporters: false,
            items: ["up", "down", "left", "right"],
          },
        }
      };
    }

    toggleVrMode({enterExit}) {
      if (enterExit == 'enter') {
        if (confirm('Would you like to enter VR mode?') == true) {
          AScene.enterVR(); //enter VR mode
        }
      } else if (enterExit == 'exit') {
        AScene.exitVR();
      }
    }

    inVR() {
      return inVR;
    }

    headsetConnected() {
      return AFRAME.utils.device.checkHeadsetConnected();
    }

    controllerConnected({controller}) {
      if (controller == 'left controller') {
        return leftControllerConnected;
      }
      if (controller == 'right controller') {
        return rightControllerConnected;
      }
    }

    //* This is from the augmented reality extension.
    getMatrix(args) {
      let item = args.ITEM | 0;
      if (item < 1 && item > 16) return "";
      let matrix = null;
      switch (args.MATRIX) {
        case "combined":
          matrix = xrCombinedMatrix;
          break;
        case "projection":
          matrix = xrProjectionMatrix;
          break;
        case "view":
          matrix = xrTransform?.matrix;
          break;
        case "inverse view":
          matrix = xrTransform?.inverse?.matrix;
          break;
      }
      if (!matrix) return 0;
      return matrix[item - 1] || 0;
    }

    getStageWidth() {
      return runtime.stageWidth;
    }
    
    getStageHeight() {
      return runtime.stageHeight;
    }

    positionOf({position,Device}) { 
      if (position == 'x-position' && Device == 'headset') {
        return cameraPosX;
      } 
      
      if (position == 'y-position' && Device == 'headset') {
        return cameraPosY;
      } 
      
      if (position == 'z-position' && Device == 'headset') {
        return cameraPosZ;
      } 
      
      if (position == 'x-position' && Device == 'left controller') {
        return leftControllerPositionX;
      } 
      
      if (position == 'y-position' && Device == 'left controller') {
        return leftControllerPositionY;
      }
      
      if (position == 'z-position' && Device == 'left controller') {
        return leftControllerPositionZ;
      } 
      
      if (position == 'x-position' && Device == 'right controller') {
        return rightControllerPositionX;
      } 
      
      if (position == 'y-position' && Device == 'right controller') {
        return rightControllerPositionY;
      }

      if (position == 'z-position' && Device == 'right controller') {
        return rightControllerPositionZ;
      }
    }

    rotationOf({direction,device}) {
      if (direction == 'x-rotation' && device == 'headset') {
        return cameraOrientationX;
      } 
      
      if (direction == 'y-rotation' && device == 'headset') {
        return cameraOrientationY;
      } 

      if (direction == 'z-rotation' && device == 'headset') {
        return cameraOrientationZ;
      } 

      if (direction == 'x-rotation' && device == 'left controller') {
        return leftControllerOrientationX;
      }

      if (direction == 'y-rotation' && device == 'left controller') {
        return leftControllerOrientationY;
      }

      if (direction == 'z-rotation' && device == 'left controller') {
        return leftControllerOrientationZ;
      } 

      if (direction == 'x-rotation' && device == 'right controller') {
        return rightControllerOrientationX;
      } 

      if (direction == 'y-rotation' && device == 'right controller') {
        return rightControllerOrientationY;
      }

      if (direction == 'z-rotation' && device == 'right controller') {
        return rightControllerOrientationZ;
      }
      
    }

    isButtonPressed({button}) {
      if (button == 'left trigger') {
        return leftTriggerPressed;
      }

      if (button == 'right trigger') {
        return rightTriggerPressed;
      } 
      
      if (button == 'left grip') {
        return leftGripPressed;
      }

      if (button == 'right grip') {
        return rightGripPressed;
      }

      if (button == 'left trigger') {
        return leftTriggerPressed;
      } 

      if (button == 'left thumbstick') {
        return leftThumbstickPressed;
      } 

      if (button == 'right thumbstick') {
        return rightThumbstickPressed;
      } 

      if (button == 'A') {
        return aButtonPressed;
      } 

      if (button == 'B') {
        return bButtonPressed;
      } 

      if (button == 'X') {
        return xButtonPressed;
      } 

      if (button == 'Y') {
        return yButtonPressed;
      }
    }
    
    triggerGripValue({button}) {
      if (button == 'left trigger') {
        return leftTriggerAmount;
      }

      if (button == 'right trigger') {
        return rightTriggerAmount;
      }

      if (button == 'left grip') {
        return leftGripAmount;
      }

      if (button == 'right grip') {
        return rightGripAmount;
      }
    }

    thumbstickDirection({value,controller}) {
      //left controller
      if (value == 'x value' && controller == 'left controller') {
        return leftThumbstickX;
      }

      if (value == 'y value' && controller == 'left controller') {
        return leftThumbstickY;
      }

      if (value == 'direction' && controller == 'left controller' ) {
        return leftThumbstickDirection;
      }

      //right controller
      if (value == 'x value' && controller == 'right controller') {
        return rightThumbstickX;
      }

      if (value == 'y value' && controller == 'right controller') {
        return rightThumbstickY;
      }

      if (value == 'direction' && controller == 'right controller' ) {
        return rightThumbstickDirection;
      }
    }

    isThumbstickDirection({controller,direction}) {
      if (controller == 'left controller') {
          if (leftThumbstickY > 0.95 && direction == "up") {
            return true;
          } else if (leftThumbstickY < -0.95 && direction == "down") {
            return true;
          } else if (leftThumbstickX < -0.95 && direction == "left") {
            return true;
          } else if (leftThumbstickX > 0.95 && direction == "right") {
            return true;
          } else {
            return false;
          }
      } else if (controller == 'right controller') {
        if (rightThumbstickY > 0.95 && direction == "up") {
          return true;
        } else if (rightThumbstickY < -0.95 && direction == "down") {
          return true;
        } else if (rightThumbstickX < -0.95 && direction == "left") {
          return true;
        } else if (rightThumbstickX > 0.95 && direction == "right") {
          return true;
        } else {
          return false;
        }
      } 
    }
    
    lastButtonPressed() { 
      return lastButtonPressed;
    }
  }

  Scratch.extensions.register(new BlockifyVR());
})(Scratch);