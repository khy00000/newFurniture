// 부드러운 스코롤
const lenis = new Lenis();
console.log("Lenis initialized");

// 스코롤 이벤트 트리거
lenis.on("scroll", () => {
  console.log("Lenis scroll event");
  ScrollTrigger.update();
});

// 프레임 관리 및 스코롤 지연 0으로(즉각적 반응)
gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
});
gsap.ticker.lagSmoothing(0);

// 3d 씬 생성
const scene = new THREE.Scene();

// 3d 공간 시각화
const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);

// 렌더러 설정
const renderer = new THREE.WebGLRenderer({
    antialias: true,
    //투명 배경
    alpha: true,
});
// 배경 검정 투명도 0
renderer.setClearColor(0x000000, 0);
// 캔버스 크기 브라우저 크기에 맞게 설정
renderer.setSize(window.innerWidth, window.innerHeight);
// 화면 픽셀밀도에 맞는 품질조정
renderer.setPixelRatio(window.devicePixelRatio);
// 그림자 맵 활성
renderer.shadowMap.enabled = true;
// 부드러운 그림자
renderer.shadowMap.type = THREE.PCFSoftShadow;
// 현실감 있는 조명
renderer.physicallyCorrectLights = true;
// ACES필름 톤매핑 색상 표현 개선
renderer.toneMapping = THREE.ACESFilmicToneMapping;
// 톤매핑 노출값 설정 밝기 조절
renderer.toneMappingExposure = 2.5;
document.querySelector("model").appendChild(renderer.domElement);