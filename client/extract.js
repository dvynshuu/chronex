import fs from 'fs';
const content = fs.readFileSync('C:/Users/divya/.gemini/antigravity/brain/63566322-4449-4278-9696-a4816665628d/.system_generated/steps/74/content.md', 'utf8');
const svgStart = content.indexOf('<svg');
const svgEnd = content.indexOf('</svg>') + 6;
let svg = content.substring(svgStart, svgEnd);

// convert to React
svg = svg.replace(/class="mainland"/g, 'className="mainland"');
svg = svg.replace(/xmlns:xlink/g, 'xmlnsXlink');
svg = svg.replace(/xml:space/g, 'xmlSpace');
svg = svg.replace(/<svg version="1.1"/, '<svg version="1.1" style={{ width: "100%", height: "100%" }} preserveAspectRatio="none"');
// replace any other React unsupported things like style="" strings? The SVG doesn't seem to have them.

const reactCode = `import React from 'react';

export default function WorldMapBg() {
    return (
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0.15, pointerEvents: 'none' }}>
            ${svg}
        </div>
    );
}
`;

fs.writeFileSync('src/views/WorldMapBg.jsx', reactCode);
console.log('Success');
