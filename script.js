// 부드러운 스코롤
const lenis = new Lenis();

// gsap 스코롤 트리거 연동
lenis.on("scroll", () => {
  //   console.log("Lenis scroll event");
  ScrollTrigger.update();
});

// lenis 프레임 갱신 - gsap ticker 연결
gsap.ticker.add((time) => {
  lenis.raf(time * 1000);
});
// 렉 방지
gsap.ticker.lagSmoothing(0);

// 3d 씬 생성 (오브젝트가 담기는 공간)
const scene = new THREE.Scene();

// 3d 공간 카메라 설정 (원근감 시점, 시야각 75도 / 클립 범위 0.1~1000)
const camera = new THREE.PerspectiveCamera(
  75, // 시야각
  window.innerWidth / window.innerHeight, // 종횡비
  0.1, // near 너무 가까운 물체는 안보임
  1000 // far 너무 멀면 안보임
);

// 렌더러 설정 (사실감 있는 표현 구성)
const renderer = new THREE.WebGLRenderer({
  antialias: true,
  //투명 배경
  alpha: true,
});
// 배경 검정, 투명도 0
renderer.setClearColor(0x000000, 0);
// 브라우저 전체 크기에 맞춤
renderer.setSize(window.innerWidth, window.innerHeight);
// 고해상도 디스플레이 대응
renderer.setPixelRatio(window.devicePixelRatio);
// 그림자 활성
renderer.shadowMap.enabled = true;
// 부드러운 그림자
renderer.shadowMap.type = THREE.PCFSoftShadow;
// 물리 기반(현실감 있는) 조명
renderer.physicallyCorrectLights = true;
// 필름 효과 (톤매핑 색상 표현 개선)
renderer.toneMapping = THREE.ACESFilmicToneMapping;
// 밝기 보정
renderer.toneMappingExposure = 2.5;
// html 컨테이너에 추가
document.querySelector(".model").appendChild(renderer.domElement);

// 조명 1 / 전체 조도(방향성 없음)
const ambientlight = new THREE.AmbientLight(0xffffff, 0.75);
scene.add(ambientlight);

// 조명 2 / 한 방향 빛 (태양광 느낌)
const mainLight = new THREE.DirectionalLight(0xffffff, 7.5);
mainLight.position.set(0.5, 7.5, 2.5);
scene.add(mainLight);

// 조명 2-2 / 보조 방향 조명(그림자 어두움 조절)
const fillLight = new THREE.DirectionalLight(0xffffff, 2.5);
fillLight.position.set(-15, 0, -5);
scene.add(fillLight);

// 조명 3 / 반구형 조명(상단과 하단에 자연스러운 그라데이션)
const hemilight = new THREE.HemisphereLight(0xffffff, 0xffffff, 1.5);
hemilight.position.set(0, 0, 0);
scene.add(hemilight);

// 애니메이션 시작 전 로딩 상태에서 씬 계속 그리기 위한 루프
function basicAnimate() {
  renderer.render(scene, camera);
  requestAnimationFrame(basicAnimate);
}
basicAnimate();

// 3d 모델 로딩
let model;
const loader = new THREE.GLTFLoader();
loader.load("./assets/chair.glb", function (gltf) {
  model = gltf.scene;
  model.traverse((node) => {
    if (node.isMesh) {
      if (node.material) {
        // 반짝이는 표면 속성 지정
        // 금속 느낌
        node.material.metalness = 2;
        // 표면 거칠기(반사 감소)
        node.material.roughness = 3;
        // 강도(환경 조명 표면 반사 조정)
        node.material.envMapintensity = 5;

        // Grayscale 셰이더 적용
        node.material = node.material.clone(); // 기존 material 보호
        node.material.onBeforeCompile = (shader) => {
          shader.fragmentShader = shader.fragmentShader.replace(
            "#include <dithering_fragment>",
            `
            vec3 grayscaleColor = vec3(dot(outgoingLight, vec3(0.299, 0.587, 0.114)));
            // 밝기
            grayscaleColor *= 1.9;
            // 과도한 밝기 방지 (0~1 사이로 클램핑)
            grayscaleColor = clamp(grayscaleColor, 0.0, 1.0);
            gl_FragColor = vec4(grayscaleColor, diffuseColor.a);
            `
          );
        };

        node.material.needsUpdate = true;
      }
      // 그림자(더욱 사실적인 효과 넣기)
      node.castShadow = true;
      node.receiveShadow = true;
    }
  });

  const box = new THREE.Box3().setFromObject(model);
  // 모델 가운데 위치
  const center = box.getCenter(new THREE.Vector3());
  model.position.sub(center);
  scene.add(model);

  // 모델 크기에 따라 카메라 거리 조정
  const size = box.getSize(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z);
  camera.position.z = maxDim * 1.75;

  // 모델 크기 처음에 안보이게(축소)
  model.scale.set(0, 0, 0);
  // 약간 회전시켜 배치
  model.rotation.set(0, 0.5, 0);
  // 처음 등장 애니메이션
  playInitialAnimation();

  cancelAnimationFrame(basicAnimate);
  // 애니메이션 루프 시작
  animate();
});

const floatAmplitude = 0.2;
const floatSpeed = 1.5;
const rotationSpeed = 0.3;
let isFloating = true;
let currentScroll = 0;

// 최대 스코롤 거리
const totalscrollHeight =
  document.documentElement.scrollHeight - window.innerHeight;

// 등장 애니메이션 0 -> 1
function playInitialAnimation() {
  if (model) {
    gsap.to(model.scale, {
      x: 1,
      y: 1,
      z: 1,
      duration: 1,
      ease: "power2.out",
    });
  }
}

// 현재 스코롤 실시간 업데이트
lenis.on("scroll", (e) => {
  currentScroll = e.scroll;
});

// 루프 y축 둥둥 애니메이션
function animate() {
  if (model) {
    if (isFloating) {
      const floatOffset =
        Math.sin(Date.now() * 0.001 * floatSpeed) * floatAmplitude;
      model.position.y = floatOffset;
    }

    // 스코롤에 따라 회전 0~1사이의 스코롤 진행률로 정규화
    const scrollProgress = Math.min(currentScroll / totalscrollHeight, 1);

    // 모델 기본 각도
    const baseTilt = 0.5;
    // Math.PI * 4 : 약 720도 2회전
    model.rotation.x = scrollProgress * Math.PI * 4 + baseTilt;
  }

  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

// h2 스피릿 타입
const introSection = document.querySelector(".intro");
const archiveSection = document.querySelector(".archive");
const outroSection = document.querySelector(".outro");

// 줄로 쪼개서 .line add
const splitText = new SplitType(".outro h2", {
  types: "lines",
  lineClass: "line",
});

splitText.lines.forEach((line) => {
  const text = line.innerHTML;
  line.innerHTML = `<span style="display: block; transform: translateY(70px);">${text}</span>`;
});

ScrollTrigger.create({
  trigger: ".outro",
  start: "top center",
  onEnter: () => {
    gsap.to(".outro-copy h2 .line span", {
      translateY: 0,
      dutation: 1,
      stagger: 0.1,
      ease: "power3.out",
      force3D: true,
    });
  },
  onLeaveBack: () => {
    gsap.to(".outro-copy h2 .line span", {
      translateY: 70,
      dutation: 1,
      stagger: 0.1,
      ease: "power3.out",
      force3D: true,
    });
  },
  toggleActions: "play reverse play reverse",
});