import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

// Hardcoded coordinates for the test track layout
const TRACK_LAYOUT = {
  sections: [
    { id: 'main1', name: 'Main 1', x: 150, y: 100, radius: 25 },
    { id: 'main2', name: 'Main 2', x: 450, y: 100, radius: 25 },
    { id: 'bypass', name: 'Bypass', x: 300, y: 200, radius: 25 },
    { id: 'siding', name: 'Siding', x: 300, y: 300, radius: 25 }
  ],
  switches: [
    { id: 'A', name: 'Switch A', x: 250, y: 100, radius: 15, color: '#4CAF50' },
    { id: 'B', name: 'Switch B', x: 350, y: 100, radius: 15, color: '#FF9800' },
    { id: 'C', name: 'Switch C', x: 300, y: 150, radius: 15, color: '#2196F3' }
  ],
  accessories: [
    { id: 'signal1', type: 'signal', name: 'Signal 1', x: 100, y: 80, sectionId: 'main1' },
    { id: 'light1', type: 'light', name: 'Yard Light', x: 400, y: 180, sectionId: 'bypass' },
    { id: 'house1', type: 'house', name: 'Station House', x: 250, y: 350, sectionId: 'siding' }
  ],
  connections: [
    // Main line connections
    { from: { x: 175, y: 100 }, to: { x: 225, y: 100 }, type: 'direct' },
    { from: { x: 275, y: 100 }, to: { x: 325, y: 100 }, type: 'direct' },
    { from: { x: 375, y: 100 }, to: { x: 425, y: 100 }, type: 'direct' },
    
    // Switch connections with bends
    { from: { x: 250, y: 115 }, to: { x: 280, y: 185 }, type: 'bend' }, // A to Bypass
    { from: { x: 350, y: 115 }, to: { x: 320, y: 185 }, type: 'bend' }, // B to Bypass
    { from: { x: 300, y: 165 }, to: { x: 300, y: 275 }, type: 'direct' }, // C to Siding
    { from: { x: 285, y: 185 }, to: { x: 315, y: 165 }, type: 'bend' } // Bypass to C
  ]
};

const SVG_DIMENSIONS = {
  width: 600,
  height: 400,
  margin: 50
};

interface AccessorySVGProps {
  type: string;
  x: number;
  y: number;
  size?: number;
}

const AccessorySVG: React.FC<AccessorySVGProps> = ({ type, x, y, size = 16 }) => {
  const color = getAccessoryColor(type);
  
  switch (type) {
    case 'signal':
      return (
        <g>
          <rect x={x - size/2} y={y - size/2} width={size} height={size} fill={color} stroke="#333" strokeWidth="1"/>
          <circle cx={x} cy={y - size/4} r={size/6} fill="#FFF"/>
          <circle cx={x} cy={y + size/4} r={size/6} fill="#FFF"/>
        </g>
      );
    case 'light':
      return (
        <g>
          <circle cx={x} cy={y} r={size/2} fill={color} stroke="#333" strokeWidth="1"/>
          <path d={`M ${x-size/3} ${y-size/3} L ${x+size/3} ${y+size/3} M ${x+size/3} ${y-size/3} L ${x-size/3} ${y+size/3}`} stroke="#333" strokeWidth="1"/>
        </g>
      );
    case 'house':
      return (
        <g>
          <rect x={x - size/2} y={y - size/4} width={size} height={size/2} fill={color} stroke="#333" strokeWidth="1"/>
          <polygon points={`${x - size/2},${y - size/4} ${x},${y - size/2} ${x + size/2},${y - size/4}`} fill="#8B4513" stroke="#333" strokeWidth="1"/>
        </g>
      );
    default:
      return null;
  }
};

function getAccessoryColor(type: string): string {
  switch (type) {
    case 'signal': return '#F44336';
    case 'light': return '#FFEB3B';
    case 'house': return '#8BC34A';
    default: return '#666';
  }
}

const Legend: React.FC = () => (
  <Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
    <Typography variant="h6" gutterBottom>Legend</Typography>
    <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Box sx={{ 
          width: 20, 
          height: 20, 
          borderRadius: '50%', 
          bgcolor: '#1976d2',
          border: '2px solid #333'
        }} />
        <Typography variant="body2">Track Sections</Typography>
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Box sx={{ 
          width: 15, 
          height: 15, 
          borderRadius: '50%', 
          bgcolor: '#4CAF50',
          border: '1px solid #333'
        }} />
        <Typography variant="body2">Switches</Typography>
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Box sx={{ 
          width: 16, 
          height: 16, 
          bgcolor: '#F44336',
          border: '1px solid #333'
        }} />
        <Typography variant="body2">Signal</Typography>
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Box sx={{ 
          width: 16, 
          height: 16, 
          borderRadius: '50%',
          bgcolor: '#FFEB3B',
          border: '1px solid #333'
        }} />
        <Typography variant="body2">Yard Light</Typography>
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Box sx={{ 
          width: 16, 
          height: 12, 
          bgcolor: '#8BC34A',
          border: '1px solid #333'
        }} />
        <Typography variant="body2">Station House</Typography>
      </Box>
    </Box>
  </Box>
);

const VirtualTrackLayout: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Virtual Track Layout
      </Typography>
      
      <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
        Interactive track layout showing sections, switches, and accessories.
      </Typography>

      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          {/* SVG Track Layout */}
          <svg
            width={SVG_DIMENSIONS.width}
            height={SVG_DIMENSIONS.height}
            style={{ border: '1px solid #ddd', borderRadius: '4px' }}
          >
            {/* Grid background (optional) */}
            <defs>
              <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#f0f0f0" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />

            {/* Track connections */}
            {TRACK_LAYOUT.connections.map((conn, index) => (
              <line
                key={`connection-${index}`}
                x1={conn.from.x}
                y1={conn.from.y}
                x2={conn.to.x}
                y2={conn.to.y}
                stroke="#333"
                strokeWidth="3"
                strokeLinecap="round"
              />
            ))}

            {/* Track sections */}
            {TRACK_LAYOUT.sections.map((section) => (
              <g key={section.id}>
                <circle
                  cx={section.x}
                  cy={section.y}
                  r={section.radius}
                  fill="#1976d2"
                  stroke="#333"
                  strokeWidth="2"
                />
                <text
                  x={section.x}
                  y={section.y + 5}
                  textAnchor="middle"
                  fill="white"
                  fontSize="12"
                  fontWeight="bold"
                >
                  {section.name}
                </text>
              </g>
            ))}

            {/* Switches */}
            {TRACK_LAYOUT.switches.map((switchItem) => (
              <g key={switchItem.id}>
                <circle
                  cx={switchItem.x}
                  cy={switchItem.y}
                  r={switchItem.radius}
                  fill={switchItem.color}
                  stroke="#333"
                  strokeWidth="1"
                />
                <text
                  x={switchItem.x}
                  y={switchItem.y + 4}
                  textAnchor="middle"
                  fill="white"
                  fontSize="10"
                  fontWeight="bold"
                >
                  {switchItem.id}
                </text>
              </g>
            ))}

            {/* Accessories rendered as SVG */}
            {TRACK_LAYOUT.accessories.map((accessory) => (
              <AccessorySVG
                key={accessory.id}
                type={accessory.type}
                x={accessory.x}
                y={accessory.y}
              />
            ))}
          </svg>
        </Box>

        <Legend />
      </Paper>
    </Box>
  );
};

export default VirtualTrackLayout;