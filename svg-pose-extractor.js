/**
 * SVG POSE EXTRACTOR
 * Converts Adobe Illustrator SVG pose data to normalized coordinates (0-1)
 * for use in the animation system
 */

// SVG座標をキャンバス座標に変換（ビューボックスに基づいて正規化）
function extractPoseFromSVG(svgString, poseName = 'extracted') {
  const parser = new DOMParser();
  const svgDoc = parser.parseFromString(svgString, 'image/svg+xml');
  const svg = svgDoc.documentElement;
  
  // viewBox から寸法を取得
  const viewBox = svg.getAttribute('viewBox').split(/[\s,]+/).map(Number);
  const svgWidth = viewBox[2] || 1920;
  const svgHeight = viewBox[3] || 1080;
  
  console.log(`📐 SVG Dimensions: ${svgWidth}×${svgHeight}`);
  
  // SVG内のすべてのcircle要素を取得
  const circles = svg.querySelectorAll('circle');
  const joints = [];
  
  circles.forEach((circle, idx) => {
    const cx = parseFloat(circle.getAttribute('cx'));
    const cy = parseFloat(circle.getAttribute('cy'));
    const r = parseFloat(circle.getAttribute('r'));
    const className = circle.getAttribute('class');
    
    joints.push({
      id: idx,
      cx, cy, r,
      className,
      normalized: [cx / svgWidth, cy / svgHeight]
    });
  });
  
  console.log(`🎯 Found ${joints.length} joint circles in SVG`);
  console.log(joints);
  
  return { poseName, joints, svgWidth, svgHeight };
}

// 手動マッピング：SVG circle indexをJOINT_NAMESに割り当て
// run.svg の場合の推定マッピング：
const SVG_JOINT_MAPPING = {
  // SVG index → JOINT_NAME
  0: 'head',           // cx="700.67" cy="214.67" r="90" (大きい頭)
  1: 'head_eye',       // cx="649.67" cy="213" r="20" (目)- スキップ
  5: 'lSho',           // cx="555.67" cy="406.33" r="38.33" (左肩)
  6: 'rSho',           // cx="1065.67" cy="311.33" r="38.33" (右肩)
  7: 'lElb',           // cx="799" cy="304.67" r="20" (左肘)
  8: 'rElb',           // cx="960" cy="214.67" r="20" (右肘？)
  9: 'rWrist',         // cx="839.5" cy="264.17" r="20"
  10: 'hip',           // cx="960" cy="551.67" r="20"
  11: 'lKne',          // cx="758.5" cy="710" r="20"
  12: 'lFoo',          // cx="594" cy="921.67" r="20"
  13: 'lFoot_detail',  // cx="525.67" cy="889.17" r="20" - スキップ
  14: 'lFoot_detail2', // cx="485.17" cy="840.83" r="20" - スキップ
  15: 'lHan',          // cx="729" cy="465.17" r="20"
  16: 'rHan',          // cx="1007.33" cy="531.67" r="20"
  17: 'rFoo',          // cx="1209" cy="748" r="20"
  18: 'rKne_detail',   // cx="1422.33" cy="580" r="20" - スキップ
  19: 'rKne_detail2',  // cx="1492.33" cy="608.33" r="20" - スキップ
  20: 'rFoot_detail',  // cx="1522.33" cy="648.83" r="20" - スキップ
};

// SVG抽出データから POSES 形式に変換
function convertSVGToPose(extractedData, mappingConfig = null) {
  const JOINT_NAMES = ['head','neck','lSho','rSho','lElb','rElb','lHan','rHan','hip','lKne','rKne','lFoo','rFoo'];
  const pose = {};
  
  const mapping = mappingConfig || SVG_JOINT_MAPPING;
  
  extractedData.joints.forEach((joint, svgIdx) => {
    const jointName = mapping[svgIdx];
    if (jointName && JOINT_NAMES.includes(jointName)) {
      pose[jointName] = joint.normalized;
      console.log(`✓ ${jointName}: [${joint.normalized[0].toFixed(3)}, ${joint.normalized[1].toFixed(3)}]`);
    }
  });
  
  return pose;
}

// パイプライン：SVG文字列 → POSES形式
function createPoseFromSVGString(svgString, poseName = 'custom') {
  const extracted = extractPoseFromSVG(svgString, poseName);
  const pose = convertSVGToPose(extracted);
  
  console.log(`\n📦 Generated pose "${poseName}":`, pose);
  return pose;
}

// 使用例：
/*
const mySVGString = `<?xml version="1.0" encoding="utf-8"?>
<!-- Adobe Illustrator SVG -->
<svg version="1.0" viewBox="0 0 1920 1080">
  <!-- circles here -->
</svg>`;

const newPose = createPoseFromSVGString(mySVGString, 'myRun');
console.log(newPose);

// 12-pose-to-pose.html の POSES に追加:
// POSES['myRun'] = newPose;
*/

// ═════════════════════════════════════════════
// インタラクティブ抽出UI
// ═════════════════════════════════════════════

function createSVGExtractorUI() {
  const html = `
  <div id="svg-extractor-modal" style="
    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center;
    z-index: 10000; font-family: 'IBM Plex Mono', monospace;
  ">
    <div style="
      background: #0C0C0C; border: 1px solid #36FF00;
      padding: 20px; width: 90%; max-width: 600px;
      color: #36FF00; max-height: 80vh; overflow-y: auto;
    ">
      <h2 style="margin-bottom: 15px; color: #F9FF47;">🎨 SVG POSE EXTRACTOR</h2>
      
      <label style="display: block; margin-bottom: 10px;">
        Pose Name:
        <input type="text" id="pose-name-input" value="run" style="
          background: #111; color: #36FF00; border: 1px solid #36FF00;
          padding: 5px; width: 100%; box-sizing: border-box;
        ">
      </label>
      
      <label style="display: block; margin-bottom: 10px;">
        Paste SVG XML:
        <textarea id="svg-input" style="
          background: #111; color: #36FF00; border: 1px solid #36FF00;
          padding: 10px; width: 100%; height: 200px; box-sizing: border-box;
          font-family: 'IBM Plex Mono', monospace; font-size: 11px;
        "></textarea>
      </label>
      
      <button onclick="extractAndShowPose()" style="
        background: #36FF00; color: #000; border: none;
        padding: 8px 16px; cursor: pointer; font-weight: bold;
        margin-right: 10px;
      ">EXTRACT</button>
      
      <button onclick="closeSVGExtractor()" style="
        background: transparent; color: #36FF00; border: 1px solid #36FF00;
        padding: 8px 16px; cursor: pointer;
      ">CANCEL</button>
      
      <pre id="extraction-output" style="
        background: #050505; color: #36FF00; padding: 10px;
        margin-top: 15px; overflow-x: auto; font-size: 10px;
      "></pre>
    </div>
  </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', html);
}

function extractAndShowPose() {
  const svgInput = document.getElementById('svg-input').value;
  const poseName = document.getElementById('pose-name-input').value;
  const output = document.getElementById('extraction-output');
  
  try {
    const pose = createPoseFromSVGString(svgInput, poseName);
    
    const poseCode = `POSES['${poseName}'] = ${JSON.stringify(pose, null, 2)};`;
    output.textContent = poseCode;
    
    // クリップボードにコピー
    navigator.clipboard.writeText(poseCode);
    alert('✅ Pose code copied to clipboard!');
  } catch (e) {
    output.textContent = '❌ Error: ' + e.message;
  }
}

function closeSVGExtractor() {
  document.getElementById('svg-extractor-modal').remove();
}

// グローバルに公開
window.createSVGExtractorUI = createSVGExtractorUI;
window.closeSVGExtractor = closeSVGExtractor;
window.extractAndShowPose = extractAndShowPose;
window.createPoseFromSVGString = createPoseFromSVGString;
