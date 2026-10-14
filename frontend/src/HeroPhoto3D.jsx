import React, { useEffect, useRef } from "react";
import { RotateCcw } from "lucide-react";

function roundedRect(context, x, y, width, height, radius) {
  context.beginPath();
  context.roundRect(x, y, width, height, radius);
}

function makeCardTexture(THREE, caption, timeLabel) {
  const canvas = document.createElement("canvas");
  canvas.width = 520;
  canvas.height = 650;
  const context = canvas.getContext("2d");
  context.clearRect(0, 0, canvas.width, canvas.height);

  // Rebuild the existing hero illustration as a clean backing plate. The
  // printed bottle is a separate transparent layer so it can dissolve away.
  context.shadowColor = "rgba(23, 60, 50, .12)";
  context.shadowBlur = 26;
  context.shadowOffsetY = 18;
  roundedRect(context, 14, 12, 492, 626, 20);
  context.fillStyle = "#fff";
  context.fill();
  context.shadowColor = "transparent";
  context.shadowBlur = 0;
  context.shadowOffsetY = 0;

  context.save();
  roundedRect(context, 34, 32, 452, 536, 9);
  context.clip();
  const backdrop = context.createLinearGradient(50, 40, 475, 535);
  backdrop.addColorStop(0, "#c8d4bf");
  backdrop.addColorStop(.29, "#c8d4bf");
  backdrop.addColorStop(.3, "#e0c38c");
  backdrop.addColorStop(.62, "#e0c38c");
  backdrop.addColorStop(.63, "#b5c5b3");
  backdrop.addColorStop(1, "#b5c5b3");
  context.fillStyle = backdrop;
  context.fillRect(34, 32, 452, 536);

  context.beginPath();
  context.arc(397, 118, 64, 0, Math.PI * 2);
  context.fillStyle = "#f6dfa2";
  context.fill();

  context.restore();

  context.fillStyle = "#355446";
  context.font = "600 18px 'DM Sans', 'Noto Sans SC', sans-serif";
  context.fillText(caption, 22, 603);
  context.fillStyle = "#87968a";
  context.font = "400 15px 'DM Sans', sans-serif";
  context.textAlign = "right";
  context.fillText(timeLabel, 498, 603);
  context.textAlign = "left";

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  texture.needsUpdate = true;
  return texture;
}

function makeBottlePrintTexture(THREE) {
  const canvas = document.createElement("canvas");
  canvas.width = 520;
  canvas.height = 650;
  drawPrintedBottle(canvas.getContext("2d"));
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

function drawPrintedBottle(context) {
  context.save();
  context.shadowColor = "rgba(35, 58, 47, .30)";
  context.shadowBlur = 26;
  context.shadowOffsetX = 20;
  context.shadowOffsetY = 23;
  const bottle = context.createLinearGradient(213, 0, 374, 0);
  bottle.addColorStop(0, "#3f6855");
  bottle.addColorStop(.48, "#7c9980");
  bottle.addColorStop(1, "#4b715f");
  roundedRect(context, 222, 204, 142, 323, 42);
  context.fillStyle = bottle;
  context.fill();
  context.shadowColor = "transparent";
  context.shadowBlur = 0;
  context.shadowOffsetX = 0;
  context.shadowOffsetY = 0;
  roundedRect(context, 257, 175, 74, 47, 11);
  context.fillStyle = "#344e40";
  context.fill();
  roundedRect(context, 244, 229, 14, 235, 8);
  context.fillStyle = "rgba(195, 211, 187, .54)";
  context.fill();
  context.strokeStyle = "rgba(231, 233, 206, .5)";
  context.lineWidth = 2;
  context.strokeRect(261, 335, 67, 75);
  context.fillStyle = "#edf0d9";
  context.textAlign = "center";
  context.font = "600 17px 'DM Sans', sans-serif";
  context.fillText("DAY", 294, 364);
  context.fillText("TRIP", 294, 389);
  context.restore();
}

function createLiquidSurfaceGeometry(THREE, radius, segments, rings) {
  const positions = [0, 0, 0];
  const indices = [];
  for (let ring = 1; ring <= rings; ring += 1) {
    const ringRadius = radius * ring / rings;
    for (let segment = 0; segment < segments; segment += 1) {
      const angle = segment / segments * Math.PI * 2;
      positions.push(Math.cos(angle) * ringRadius, 0, Math.sin(angle) * ringRadius);
    }
  }
  for (let segment = 0; segment < segments; segment += 1) {
    const next = (segment + 1) % segments;
    // Winding must face up: this mesh is an XZ water plane with +Y normals.
    indices.push(0, 1 + next, 1 + segment);
  }
  for (let ring = 1; ring < rings; ring += 1) {
    const innerStart = 1 + (ring - 1) * segments;
    const outerStart = innerStart + segments;
    for (let segment = 0; segment < segments; segment += 1) {
      const next = (segment + 1) % segments;
      const a = innerStart + segment;
      const b = innerStart + next;
      const c = outerStart + segment;
      const d = outerStart + next;
      indices.push(a, b, c, b, d, c);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function createBottle(THREE) {
  const bottle = new THREE.Group();
  const profile = [
    new THREE.Vector2(0, 0), new THREE.Vector2(.24, 0), new THREE.Vector2(.30, .035),
    new THREE.Vector2(.32, .09), new THREE.Vector2(.32, 1.06), new THREE.Vector2(.31, 1.19),
    new THREE.Vector2(.27, 1.29), new THREE.Vector2(.22, 1.34), new THREE.Vector2(.21, 1.40),
    new THREE.Vector2(.21, 1.43), new THREE.Vector2(0, 1.43),
  ];
  const body = new THREE.Mesh(
    new THREE.LatheGeometry(profile, 64),
    new THREE.MeshStandardMaterial({ color: "#567b68", roughness: .3, metalness: .01, transparent: true, opacity: .28, depthWrite: false })
  );
  body.castShadow = true;
  body.receiveShadow = true;
  bottle.add(body);

  // Keep a real 3D liquid volume inside the bottle. Its local pivot is placed
  // at the fill's centre so it can lag and settle as the photo is tilted.
  const liquid = new THREE.Group();
  liquid.position.y = .40;
  const water = new THREE.Mesh(
    new THREE.LatheGeometry([
      new THREE.Vector2(.19, -.31), new THREE.Vector2(.25, -.29), new THREE.Vector2(.27, -.25),
      new THREE.Vector2(.27, .20), new THREE.Vector2(.265, .26), new THREE.Vector2(.255, .30),
    ], 64),
    new THREE.MeshPhysicalMaterial({ color: "#59cbb8", roughness: .14, metalness: 0, transparent: true, opacity: .48, side: THREE.DoubleSide, depthWrite: false, clearcoat: .8, clearcoatRoughness: .1 })
  );
  water.renderOrder = 2;
  liquid.add(water);
  const waterBottomGeometry = new THREE.CircleGeometry(.19, 48);
  waterBottomGeometry.rotateX(-Math.PI / 2);
  const waterBottom = new THREE.Mesh(
    waterBottomGeometry,
    new THREE.MeshPhysicalMaterial({ color: "#59cbb8", roughness: .14, transparent: true, opacity: .5, side: THREE.DoubleSide, depthWrite: false, clearcoat: .8 })
  );
  waterBottom.position.y = -.31;
  waterBottom.renderOrder = 2;
  liquid.add(waterBottom);
  const surfaceGeometry = createLiquidSurfaceGeometry(THREE, .255, 48, 8);
  const waterSurface = new THREE.Mesh(
    surfaceGeometry,
    new THREE.MeshPhysicalMaterial({ color: "#a4f0df", roughness: .12, metalness: 0, transparent: true, opacity: .92, side: THREE.DoubleSide, depthWrite: false, clearcoat: 1, clearcoatRoughness: .08 })
  );
  waterSurface.position.y = .30;
  waterSurface.renderOrder = 3;
  liquid.add(waterSurface);
  liquid.userData.surfaceGeometry = surfaceGeometry;
  liquid.userData.surface = waterSurface;
  bottle.add(liquid);
  bottle.userData.liquid = liquid;

  const cap = new THREE.Mesh(
    new THREE.CylinderGeometry(.205, .22, .23, 48, 1, false),
    new THREE.MeshStandardMaterial({ color: "#344e40", roughness: .34 })
  );
  cap.position.y = 1.55;
  cap.castShadow = true;
  bottle.add(cap);

  const labelCanvas = document.createElement("canvas");
  labelCanvas.width = 256;
  labelCanvas.height = 192;
  const labelCtx = labelCanvas.getContext("2d");
  labelCtx.strokeStyle = "rgba(237, 240, 217, .72)";
  labelCtx.lineWidth = 3;
  labelCtx.strokeRect(8, 8, 240, 176);
  labelCtx.fillStyle = "#edf0d9";
  labelCtx.textAlign = "center";
  labelCtx.font = "600 42px 'DM Sans', sans-serif";
  labelCtx.fillText("DAY", 128, 82);
  labelCtx.fillText("TRIP", 128, 137);
  const labelTexture = new THREE.CanvasTexture(labelCanvas);
  labelTexture.colorSpace = THREE.SRGBColorSpace;
  const label = new THREE.Mesh(
    new THREE.PlaneGeometry(.28, .22),
    new THREE.MeshBasicMaterial({ map: labelTexture, transparent: true, side: THREE.DoubleSide, depthWrite: false })
  );
  label.position.set(0, .78, .326);
  bottle.add(label);

  const highlight = new THREE.Mesh(
    new THREE.CapsuleGeometry(.018, .90, 5, 10),
    new THREE.MeshBasicMaterial({ color: "#c3d3bb", transparent: true, opacity: .52 })
  );
  highlight.position.set(-.205, .79, .25);
  bottle.add(highlight);
  return bottle;
}

export default function HeroPhoto3D({ hint, resetLabel, caption, timeLabel }) {
  const mountRef = useRef(null);
  const runtimeRef = useRef(null);
  const labelsRef = useRef({ caption, timeLabel });
  labelsRef.current = { caption, timeLabel };

  useEffect(() => {
    let disposed = false;
    let cleanup = () => {};
    import("three").then((THREE) => {
      if (disposed || !mountRef.current) return;
      const mount = mountRef.current;
      const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "low-power" });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1;
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.domElement.setAttribute("aria-hidden", "true");
      mount.appendChild(renderer.domElement);
      mount.classList.add("is-ready");

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(31, 1, .1, 30);
      camera.position.set(0, 0, 5.55);
      const group = new THREE.Group();
      scene.add(group);

      const cardTexture = makeCardTexture(THREE, caption, timeLabel);
      const printedTexture = makeBottlePrintTexture(THREE);
      const card = new THREE.Mesh(
        new THREE.PlaneGeometry(2.55, 3.19),
        new THREE.MeshBasicMaterial({ map: cardTexture, transparent: true, side: THREE.DoubleSide })
      );
      group.add(card);
      const printedBottle = new THREE.Mesh(
        new THREE.PlaneGeometry(2.55, 3.19),
        new THREE.MeshBasicMaterial({ map: printedTexture, transparent: true, side: THREE.DoubleSide, depthWrite: false })
      );
      printedBottle.position.z = .006;
      group.add(printedBottle);

      const shadowCanvas = document.createElement("canvas");
      shadowCanvas.width = 128;
      shadowCanvas.height = 128;
      const shadowCtx = shadowCanvas.getContext("2d");
      const shadowGradient = shadowCtx.createRadialGradient(64, 64, 4, 64, 64, 62);
      shadowGradient.addColorStop(0, "rgba(31, 51, 39, .34)");
      shadowGradient.addColorStop(1, "rgba(31, 51, 39, 0)");
      shadowCtx.fillStyle = shadowGradient;
      shadowCtx.fillRect(0, 0, 128, 128);
      const shadowTexture = new THREE.CanvasTexture(shadowCanvas);
      const shadow = new THREE.Mesh(
        new THREE.PlaneGeometry(.94, .30),
        new THREE.MeshBasicMaterial({ map: shadowTexture, transparent: true, depthWrite: false })
      );
      shadow.position.set(.1, -.93, .018);
      group.add(shadow);

      const bottle = createBottle(THREE);
      bottle.position.set(.16, -.98, .015);
      bottle.scale.set(.98, .98, .98);
      group.add(bottle);
      bottle.traverse((child) => {
        if (!child.isMesh) return;
        const materials = Array.isArray(child.material) ? child.material : [child.material];
        materials.forEach((material) => {
          material.userData.emergeOpacity = material.opacity;
          material.transparent = true;
          material.opacity = 0;
          material.depthWrite = false;
        });
      });

      scene.add(new THREE.HemisphereLight("#f5f4df", "#43584b", .56));
      const keyLight = new THREE.DirectionalLight("#fff2d5", .82);
      keyLight.position.set(-3.8, 4.5, 5);
      keyLight.castShadow = true;
      keyLight.shadow.mapSize.set(512, 512);
      scene.add(keyLight);
      const fillLight = new THREE.DirectionalLight("#d7eedb", .24);
      fillLight.position.set(3.5, 1.2, 3);
      scene.add(fillLight);

      const target = { x: 0, y: 0 };
      const current = { x: 0, y: 0 };
      let dragging = false;
      let lastPointer = { x: 0, y: 0 };
      let frame = 0;
      let resizeObserver;
      const dragImpulse = { x: 0, y: 0 };
      const liquidMotion = { x: 0, y: 0, velocityX: 0, velocityY: 0, elapsed: 0 };
      const waterSurface = bottle.userData.liquid.userData.surface;
      const waterSurfacePositions = bottle.userData.liquid.userData.surfaceGeometry.attributes.position;

      function resize() {
        const bounds = mount.getBoundingClientRect();
        if (!bounds.width || !bounds.height) return;
        renderer.setSize(bounds.width, bounds.height, false);
        camera.aspect = bounds.width / bounds.height;
        camera.fov = 31;
        camera.position.z = bounds.height > bounds.width * 1.25 ? 5.55 : 5.8;
        camera.updateProjectionMatrix();
      }
      function pointerDown(event) {
        if (event.button !== undefined && event.button !== 0) return;
        dragging = true;
        lastPointer = { x: event.clientX, y: event.clientY };
        mount.setPointerCapture?.(event.pointerId);
        mount.classList.add("is-dragging");
      }
      function pointerMove(event) {
        if (!dragging) return;
        const dx = event.clientX - lastPointer.x;
        const dy = event.clientY - lastPointer.y;
        lastPointer = { x: event.clientX, y: event.clientY };
        if (Math.abs(dx) + Math.abs(dy) > 1) mount.classList.add("has-rotated");
        dragImpulse.x = THREE.MathUtils.clamp(dragImpulse.x + dy * .0012, -.12, .12);
        dragImpulse.y = THREE.MathUtils.clamp(dragImpulse.y + dx * .0012, -.12, .12);
        target.y = THREE.MathUtils.clamp(target.y + dx * .006, -1.48, 1.48);
        target.x = THREE.MathUtils.clamp(target.x + dy * .006, -1.48, 1.48);
      }
      function pointerUp(event) {
        dragging = false;
        mount.classList.remove("is-dragging");
        if (event?.pointerId !== undefined && mount.hasPointerCapture?.(event.pointerId)) mount.releasePointerCapture?.(event.pointerId);
      }
      function handleKey(event) {
        if (event.repeat) return;
        const step = Math.PI / 18;
        if (event.key === "ArrowLeft") target.y = THREE.MathUtils.clamp(target.y - step, -1.48, 1.48);
        else if (event.key === "ArrowRight") target.y = THREE.MathUtils.clamp(target.y + step, -1.48, 1.48);
        else if (event.key === "ArrowUp") target.x = THREE.MathUtils.clamp(target.x - step, -1.48, 1.48);
        else if (event.key === "ArrowDown") target.x = THREE.MathUtils.clamp(target.x + step, -1.48, 1.48);
        else return;
        event.preventDefault();
      }
      function animate() {
        frame = requestAnimationFrame(animate);
        current.x += (target.x - current.x) * .105;
        current.y += (target.y - current.y) * .105;
        group.rotation.x = current.x;
        group.rotation.y = current.y;
        const angle = Math.max(Math.abs(current.x), Math.abs(current.y)) * 180 / Math.PI;
        const progress = THREE.MathUtils.clamp((angle - 2) / 26, 0, 1);
        const emerge = progress * progress * (3 - 2 * progress);
        liquidMotion.elapsed += .016;
        // Keep the liquid volume in the bottle's coordinate system. Only the
        // free surface gets a small, damped tilt so it cannot separate from
        // the bottle when the photo turns edge-on.
        const liquidErrorX = THREE.MathUtils.clamp(-current.x * .12, -.12, .12) - liquidMotion.x;
        const liquidErrorY = THREE.MathUtils.clamp(-current.y * .12, -.12, .12) - liquidMotion.y;
        liquidMotion.velocityX = (liquidMotion.velocityX + liquidErrorX * .11 + dragImpulse.x * .08) * .97;
        liquidMotion.velocityY = (liquidMotion.velocityY + liquidErrorY * .11 + dragImpulse.y * .08) * .97;
        dragImpulse.x *= .88;
        dragImpulse.y *= .88;
        liquidMotion.x += liquidMotion.velocityX;
        liquidMotion.y += liquidMotion.velocityY;
        liquidMotion.x = THREE.MathUtils.clamp(liquidMotion.x, -.12, .12);
        liquidMotion.y = THREE.MathUtils.clamp(liquidMotion.y, -.12, .12);
        const surfaceActivity = Math.abs(liquidMotion.velocityX) + Math.abs(liquidMotion.velocityY)
          + Math.abs(dragImpulse.x) + Math.abs(dragImpulse.y);
        const ripple = Math.min(.11, .03 + surfaceActivity * 2);
        for (let index = 0; index < waterSurfacePositions.count; index += 1) {
          const x = waterSurfacePositions.getX(index);
          const z = waterSurfacePositions.getZ(index);
          const radius = Math.hypot(x, z);
          const edgeFade = 1 - Math.pow(radius / .255, 2) * .76;
          const waveDirection = x * Math.cos(liquidMotion.elapsed * .9) + z * Math.sin(liquidMotion.elapsed * .9);
          const wave = Math.sin(liquidMotion.elapsed * 6.2 - waveDirection * 20)
            + .42 * Math.sin(liquidMotion.elapsed * 8.1 + x * 16 - z * 13);
          const sloshTilt = -liquidMotion.x * z + liquidMotion.y * x;
          waterSurfacePositions.setY(index, sloshTilt + wave * ripple * edgeFade);
        }
        waterSurfacePositions.needsUpdate = true;
        waterSurface.geometry.computeVertexNormals();
        waterSurface.position.y = .30 + Math.sin(liquidMotion.elapsed * 1.7) * .004;
        printedBottle.material.opacity = 1 - emerge;
        bottle.traverse((child) => {
          if (child.isMesh && child.material.transparent) child.material.opacity = emerge * (child.material.userData.emergeOpacity ?? 1);
        });
        bottle.position.z = .015 + emerge * .63;
        bottle.scale.setScalar(.98 + emerge * .035);
        shadow.material.opacity = emerge * .82;
        shadow.scale.set(1 + emerge * .22, 1, 1);
        renderer.render(scene, camera);
      }
      resize();
      resizeObserver = new ResizeObserver(resize);
      resizeObserver.observe(mount);
      mount.addEventListener("pointerdown", pointerDown);
      mount.addEventListener("pointermove", pointerMove);
      mount.addEventListener("pointerup", pointerUp);
      mount.addEventListener("pointercancel", pointerUp);
      window.addEventListener("pointerup", pointerUp);
      window.addEventListener("pointercancel", pointerUp);
      mount.addEventListener("keydown", handleKey);
      animate();

      runtimeRef.current = { target, stopDragging: pointerUp };
      cleanup = () => {
        cancelAnimationFrame(frame);
        resizeObserver?.disconnect();
        mount.removeEventListener("pointerdown", pointerDown);
        mount.removeEventListener("pointermove", pointerMove);
        mount.removeEventListener("pointerup", pointerUp);
        mount.removeEventListener("pointercancel", pointerUp);
        window.removeEventListener("pointerup", pointerUp);
        window.removeEventListener("pointercancel", pointerUp);
        mount.removeEventListener("keydown", handleKey);
        card.geometry.dispose();
        printedBottle.geometry.dispose();
        shadow.geometry.dispose();
        bottle.traverse((child) => {
          child.geometry?.dispose();
          if (Array.isArray(child.material)) child.material.forEach((material) => material.dispose());
          else child.material?.dispose();
        });
        cardTexture.dispose();
        printedTexture.dispose();
        shadowTexture.dispose();
        renderer.dispose();
        renderer.domElement.remove();
        mount.classList.remove("is-ready");
        runtimeRef.current = null;
      };
    }).catch((error) => {
      console.error("Could not initialize the interactive hero photo:", error);
      mountRef.current?.classList.add("is-fallback");
    });

    return () => {
      disposed = true;
      cleanup();
    };
  }, [caption, timeLabel]);

  function reset() {
    if (runtimeRef.current) {
      runtimeRef.current.stopDragging();
      runtimeRef.current.target.x = runtimeRef.current.target.y = 0;
    }
  }

  return <>
    <div ref={mountRef} className="hero-photo-canvas" role="group" tabIndex={0} aria-label={hint}>
      <span className="photo-fallback" aria-hidden="true">
        <span className="photo-fallback-scene"><i className="photo-fallback-sun" /><i className="photo-fallback-bottle"><i /><b>DAY<br />TRIP</b></i></span>
        <span className="photo-fallback-caption"><b>{caption}</b><small>{timeLabel}</small></span>
      </span>
    </div>
    <span className="photo-rotate-cue" aria-hidden="true"><span className="photo-rotate-icon"><RotateCcw size={13} /></span><span className="photo-rotate-tooltip">{hint}</span></span>
    <button className="photo-reset" type="button" onClick={reset} aria-label={resetLabel} title={resetLabel}><RotateCcw size={14} /></button>
  </>;
}
