"use client";

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { gsap } from 'gsap';

interface StorePoint {
  storeCode: string;
  storeName: string;
  position: THREE.Vector3;
  mesh: THREE.Mesh;
  material: THREE.MeshBasicMaterial;
  scale: THREE.Vector3;
  visible: boolean;
  region: string;
  color: string;
}

interface ThreeDScatterWaveProps {
  stores: Array<{
    storeCode: string;
    storeName: string;
    x: number;
    y: number;
    z: number;
    region: string;
    departmentGrade: string;
    salesGrade: string;
    areaGrade: string;
    totalSales: number;
    totalQuantity: number;
  }>;
  regionColors: { [key: string]: string };
  gradeToNumber: (grade: string) => number;
}

export default function ThreeDScatterWave({ stores, regionColors, gradeToNumber }: ThreeDScatterWaveProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const pointsRef = useRef<StorePoint[]>([]);
  const animationFrameRef = useRef<number | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  // 파동 효과로 점들 제거
  const waveRemoveEffect = (centerPoint: THREE.Vector3, maxRadius: number, duration: number = 2000) => {
    if (isAnimating) return;
    setIsAnimating(true);

    const startTime = Date.now();
    const waveSpeed = maxRadius / duration;
    const processedPoints = new Set<string>(); // 이미 처리된 점 추적

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const currentRadius = waveSpeed * elapsed;

      if (currentRadius > maxRadius) {
        setIsAnimating(false);
        return;
      }

      pointsRef.current.forEach((point) => {
        if (!point.visible || processedPoints.has(point.storeCode)) return;

        const distance = point.position.distanceTo(centerPoint);

        // 파동이 점에 도달했을 때 (파동 두께 50)
        if (distance <= currentRadius && distance >= currentRadius - 50) {
          processedPoints.add(point.storeCode);

          // 점 사라지는 애니메이션
          gsap.to(point.scale, {
            x: 0,
            y: 0,
            z: 0,
            duration: 0.5,
            ease: "power2.in"
          });

          gsap.to(point.material, {
            opacity: 0,
            duration: 0.5
          });

          // 위로 튀어오르는 효과 추가
          const originalY = point.position.y;
          gsap.to(point.position, {
            y: originalY + 20,
            duration: 0.3,
            ease: "power2.out"
          });

          point.visible = false;
        }
      });

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    if (!containerRef.current) return;

    // Scene 생성
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);
    sceneRef.current = scene;

    // Camera 생성
    const camera = new THREE.PerspectiveCamera(
      75,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(8, 8, 8);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Renderer 생성
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 조명 추가
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 10, 5);
    scene.add(directionalLight);

    // 점들 생성
    const points: StorePoint[] = [];
    
    // 테스트용 임의 점 3개 추가 (stores가 비어있거나 적을 때)
    const testStores = stores.length === 0 ? [
      { storeCode: 'TEST1', storeName: '테스트 매장 1', x: 2, y: 3, z: 2, region: '서울', departmentGrade: 'A', salesGrade: 'A', areaGrade: 'A', totalSales: 100000000, totalQuantity: 1000 },
      { storeCode: 'TEST2', storeName: '테스트 매장 2', x: 4, y: 2, z: 3, region: '경기', departmentGrade: 'B', salesGrade: 'B', areaGrade: 'B', totalSales: 80000000, totalQuantity: 800 },
      { storeCode: 'TEST3', storeName: '테스트 매장 3', x: 3, y: 4, z: 1, region: '부산', departmentGrade: 'C', salesGrade: 'C', areaGrade: 'C', totalSales: 60000000, totalQuantity: 600 }
    ] : stores;
    
    testStores.forEach((store) => {
      const geometry = new THREE.SphereGeometry(0.3, 16, 16);
      const color = regionColors[store.region] || '#6b7280';
      const material = new THREE.MeshBasicMaterial({
        color: color,
        opacity: 0.8,
        transparent: true
      });

      const mesh = new THREE.Mesh(geometry, material);
      const position = new THREE.Vector3(store.x, store.y, store.z);
      mesh.position.copy(position);

      const scale = new THREE.Vector3(1, 1, 1);
      mesh.scale.copy(scale);

      scene.add(mesh);

      points.push({
        storeCode: store.storeCode,
        storeName: store.storeName,
        position: position,
        mesh: mesh,
        material: material,
        scale: scale,
        visible: true,
        region: store.region,
        color: color
      });
    });

    pointsRef.current = points;

    // 축 추가
    const axesHelper = new THREE.AxesHelper(5);
    scene.add(axesHelper);

    // 그리드 추가
    const gridHelper = new THREE.GridHelper(10, 10);
    scene.add(gridHelper);

    // 마우스 컨트롤 (간단한 OrbitControls 대체)
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };

    const onMouseDown = (event: MouseEvent) => {
      isDragging = true;
      previousMousePosition = { x: event.clientX, y: event.clientY };
      if (renderer.domElement) {
        renderer.domElement.style.cursor = 'grabbing';
      }
    };

    const onMouseMove = (event: MouseEvent) => {
      if (!isDragging) return;

      const deltaX = event.clientX - previousMousePosition.x;
      const deltaY = event.clientY - previousMousePosition.y;

      const spherical = new THREE.Spherical();
      spherical.setFromVector3(camera.position);
      spherical.theta -= deltaX * 0.01;
      spherical.phi += deltaY * 0.01;
      spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, spherical.phi));

      camera.position.setFromSpherical(spherical);
      camera.lookAt(0, 0, 0);

      previousMousePosition = { x: event.clientX, y: event.clientY };
    };

    const onMouseUp = () => {
      isDragging = false;
      if (renderer.domElement) {
        renderer.domElement.style.cursor = 'grab';
      }
    };

    const onWheel = (event: WheelEvent) => {
      const scale = event.deltaY > 0 ? 1.1 : 0.9;
      camera.position.multiplyScalar(scale);
    };

    // 클릭 이벤트 - 파동 효과
    const onDoubleClick = (event: MouseEvent) => {
      event.preventDefault();
      const rect = renderer.domElement.getBoundingClientRect();
      const mouse = new THREE.Vector2();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, camera);

      const visibleMeshes = pointsRef.current.filter(p => p.visible).map(p => p.mesh);
      const intersects = raycaster.intersectObjects(visibleMeshes, false);

      if (intersects.length > 0) {
        const clickedPoint = intersects[0].point;
        const centerPoint = new THREE.Vector3(clickedPoint.x, clickedPoint.y, clickedPoint.z);
        const maxRadius = 15; // 파동 반경 증가
        waveRemoveEffect(centerPoint, maxRadius, 3000);
      } else {
        // 아무 점도 클릭하지 않았으면 중심에서 시작
        const centerPoint = new THREE.Vector3(0, 0, 0);
        const maxRadius = 15;
        waveRemoveEffect(centerPoint, maxRadius, 3000);
      }
    };

    renderer.domElement.addEventListener('mousedown', onMouseDown);
    renderer.domElement.addEventListener('mousemove', onMouseMove);
    renderer.domElement.addEventListener('mouseup', onMouseUp);
    renderer.domElement.addEventListener('wheel', onWheel);
    renderer.domElement.addEventListener('dblclick', onDoubleClick);

    // 애니메이션 루프
    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate);

      // 점들 업데이트
      pointsRef.current.forEach((point) => {
        if (point.mesh) {
          point.mesh.scale.copy(point.scale);
          point.mesh.position.copy(point.position);
          if (point.material) {
            point.mesh.material = point.material;
          }
          point.mesh.visible = point.visible;
        }
      });

      renderer.render(scene, camera);
    };

    animate();

    // 리사이즈 핸들러
    const handleResize = () => {
      if (!containerRef.current || !camera || !renderer) return;

      camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    };

    window.addEventListener('resize', handleResize);

    // 클린업
    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('mousedown', onMouseDown);
      renderer.domElement.removeEventListener('mousemove', onMouseMove);
      renderer.domElement.removeEventListener('mouseup', onMouseUp);
      renderer.domElement.removeEventListener('wheel', onWheel);
      renderer.domElement.removeEventListener('dblclick', onDoubleClick);

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      pointsRef.current.forEach((point) => {
        if (point.mesh) {
          scene.remove(point.mesh);
          if (point.mesh.geometry) {
            point.mesh.geometry.dispose();
          }
          if (point.material) {
            point.material.dispose();
          }
        }
      });

      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }

      renderer.dispose();
    };
  }, [stores, regionColors, gradeToNumber]);

  return (
    <div className="relative">
      <div
        ref={containerRef}
        className="w-full"
        style={{ height: '700px', cursor: 'grab' }}
      />
      <div className="absolute top-4 left-4 bg-white/90 rounded-lg p-3 shadow-lg">
        <p className="text-sm text-gray-700">
          💡 더블클릭으로 파동 효과 시작
        </p>
        <p className="text-xs text-gray-500 mt-1">
          마우스 드래그: 회전 | 휠: 확대/축소
        </p>
        {stores.length === 0 && (
          <p className="text-xs text-blue-600 mt-2 font-semibold">
            🧪 테스트 모드: 임의 점 3개 표시 중
          </p>
        )}
      </div>
    </div>
  );
}

