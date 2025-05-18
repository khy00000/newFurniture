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
// 톤매핑 노출값 설정(밝기 조절)
renderer.toneMappingExposure = 2.5;
// 컨테이너에 추가
document.querySelector("model").appendChild(renderer.domElement);

// 조명 1 / 주변광(전체 조명을 제공)
const ambiemtlight = new THREE.Ambiemtlight(0xffffff, 0.75);
scene.add(ambiemtlight);

// 조명 2
const mainLight = new THREE.DirectionalLight(0xffffff, 7.5);
mainLight.position(0.5, 7.5, 2.5);
scene.add(mainLight);

// 조명 2-2
const fillLight = new THREE.DirectionalLight(0xffffff, 2.5);
fillLight.position.set(-15, 0, -5);
scene.add(fillLight);

// 조명 3 / 반구형 조명(상단과 하단에 자연스러운 그라데이션)
const hemilight = new THREE.HemisphereLight(0xffffff, 0xffffff, 1.5);
hemilight.position.set(0, 0, 0);
scene.add(hemilight);

function basicAnimate() {
    renderer.render(scene, camera);
    requestAnimationFrame(basicAnimate);
}
basicAnimate();

let model;
const loader = new THREE.GLTFLoader();
loader.load("./assets/black_chiar.glb", function (gltf) {
    model = gltf.scene;
    model.traverse((node) => {
        if (node.isMesh){
            if (node.material){
                // 반짝이는 표면 속성 지정
                // 금속성
                node.material.metalness = 2;
                // 거칠기
                node.material.roughness = 3;
                // 강도(환경 조명이 표면에 얼마나 반사되는지 조정)
                node.material.envMapintensity = 5;
            }
            // 그림자(더욱 사실적인 효과 넣기)
            node.cashShadow = true;
            node.receiveShadow = true;
        }
    });

    //모델 치수
    const box = new THREE.Box3().setFromObject(model);
    //모델 가운데 위치
    const center = box.getCenter(new THREE.Vector3());
    model.position.sub(center);
    scene.add(model);

    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math,
})