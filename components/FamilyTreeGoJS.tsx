import React, { useEffect, useRef, useState } from 'react';
import * as go from 'gojs';
import { mockFamilyMembers } from '@/data/mockData';
import { FamilyMember } from '@/types';

// Transform FamilyMember[] to GoJS node/link data
function getGoJSData(members: FamilyMember[]) {
  const nodes = members.map(member => ({
    key: member.id,
    name: member.name,
    relationship: member.relationship,
    birthDate: member.birthDate,
    deathDate: member.deathDate,
    profileImage: member.profileImage,
    occupation: member.occupation,
    location: member.location,
    isUser: member.isUser,
  }));

  // Links: parent -> child
  const links: { from: string; to: string }[] = [];
  members.forEach(member => {
    if (member.children) {
      member.children.forEach(childId => {
        links.push({ from: member.id, to: childId });
      });
    }
  });

  return { nodes, links };
}

const FamilyTreeGoJS: React.FC = () => {
  const diagramRef = useRef<HTMLDivElement>(null);
  const diagramInstanceRef = useRef<go.Diagram | null>(null);
  const [selectedMember, setSelectedMember] = useState<FamilyMember | null>(null);
  const [showPanel, setShowPanel] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);

  useEffect(() => {
    if (!diagramRef.current) return;
    const $ = go.GraphObject.make;
    const { nodes, links } = getGoJSData(mockFamilyMembers);

    const diagram = $(go.Diagram, diagramRef.current, {
      initialContentAlignment: go.Spot.Center,
      layout: $(go.LayeredDigraphLayout, { direction: 90, layerSpacing: 40 }),
      'undoManager.isEnabled': true,
      autoScale: go.Diagram.Uniform,
      // Enable mouse wheel zooming
      'toolManager.mouseWheelBehavior': go.ToolManager.WheelZoom,
      // Set zoom factor
      'commandHandler.zoomFactor': 1.25,
    });

    // Configure panning tool after diagram creation
    diagram.toolManager.panningTool.isEnabled = true;
    diagram.toolManager.panningTool.isActive = false;

    // Store diagram instance for external control
    diagramInstanceRef.current = diagram;

    diagram.nodeTemplate = $(
      go.Node,
      'Auto',
      $(go.Shape, 'RoundedRectangle', { fill: '#f0fdf4', stroke: '#10b981', strokeWidth: 2 }),
      $(
        go.Panel,
        'Horizontal',
        { margin: 6 },
        $(go.Picture, {
          margin: 4,
          width: 40,
          height: 40,
          background: '#fff',
        },
        new go.Binding('source', 'profileImage')
        ),
        $(
          go.Panel,
          'Table',
          $(go.TextBlock, {
            row: 0,
            font: 'bold 14px sans-serif',
            stroke: '#064e3b',
            margin: new go.Margin(0, 0, 2, 0),
            wrap: go.TextBlock.WrapFit,
            width: 120,
          }, new go.Binding('text', 'name')),
          $(go.TextBlock, {
            row: 1,
            font: '12px sans-serif',
            stroke: '#047857',
            margin: new go.Margin(0, 0, 2, 0),
            wrap: go.TextBlock.WrapFit,
            width: 120,
          }, new go.Binding('text', 'relationship')),
          $(go.TextBlock, {
            row: 2,
            font: '11px sans-serif',
            stroke: '#6b7280',
            wrap: go.TextBlock.WrapFit,
            width: 120,
          }, new go.Binding('text', 'birthDate', d => d ? `b. ${d}` : '')),
          $(go.TextBlock, {
            row: 3,
            font: '11px sans-serif',
            stroke: '#6b7280',
            wrap: go.TextBlock.WrapFit,
            width: 120,
          }, new go.Binding('text', 'deathDate', d => d ? `d. ${d}` : '')),
        )
      )
    );

    diagram.linkTemplate = $(
      go.Link,
      { routing: go.Link.Orthogonal, corner: 8 },
      $(go.Shape, { strokeWidth: 2, stroke: '#10b981' })
    );

    diagram.model = new go.GraphLinksModel(nodes, links);

    // Add click event handler for nodes
    diagram.addDiagramListener('ObjectSingleClicked', e => {
      const part = e.subject.part;
      if (part instanceof go.Node) {
        const key = part.data.key;
        const member = mockFamilyMembers.find(m => m.id === key);
        setSelectedMember(member || null);
        setShowPanel(true); // Automatically show panel when member is selected
      }
    });

    // Add click handler to hide panel when clicking on background
    diagram.addDiagramListener('BackgroundSingleClicked', e => {
      setSelectedMember(null);
      setShowPanel(false);
    });

    // Listen for zoom changes
    diagram.addDiagramListener('ViewportBoundsChanged', e => {
      setZoomLevel(diagram.commandHandler.zoomFactor);
    });

    return () => { 
      diagram.div = null; 
      diagramInstanceRef.current = null;
    };
  }, []);

  // Zoom control functions
  const zoomIn = () => {
    if (diagramInstanceRef.current) {
      const currentZoom = diagramInstanceRef.current.commandHandler.zoomFactor;
      if (currentZoom < 4) { // max zoom 400%
        diagramInstanceRef.current.commandHandler.increaseZoom();
      }
    }
  };

  const zoomOut = () => {
    if (diagramInstanceRef.current) {
      const currentZoom = diagramInstanceRef.current.commandHandler.zoomFactor;
      if (currentZoom > 0.25) { // min zoom 25%
        diagramInstanceRef.current.commandHandler.decreaseZoom();
      }
    }
  };

  const resetZoom = () => {
    if (diagramInstanceRef.current) {
      diagramInstanceRef.current.commandHandler.resetZoom();
    }
  };

  const fitToWindow = () => {
    if (diagramInstanceRef.current) {
      diagramInstanceRef.current.commandHandler.zoomToFit();
    }
  };

  const togglePanning = () => {
    if (diagramInstanceRef.current) {
      const tool = diagramInstanceRef.current.toolManager.panningTool;
      tool.isActive = !tool.isActive;
    }
  };

  return (
    <div className="relative w-full h-[600px] border rounded-lg shadow bg-white">
      <div className="w-full h-full" ref={diagramRef} />
      
      {/* Zoom and Pan Controls */}
      <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
        {/* Zoom Controls */}
        <div className="flex flex-col bg-white rounded-lg shadow border">
          <button
            className="px-3 py-2 bg-green-600 text-white hover:bg-green-700 focus:outline-none transition-colors rounded-t-lg"
            onClick={zoomIn}
            title="Zoom In"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </button>
          
          <div className="px-3 py-1 text-center text-xs text-gray-600 bg-gray-50 border-t border-b">
            {Math.round(zoomLevel * 100)}%
          </div>
          
          <button
            className="px-3 py-2 bg-green-600 text-white hover:bg-green-700 focus:outline-none transition-colors"
            onClick={zoomOut}
            title="Zoom Out"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
          </button>
          
          <button
            className="px-3 py-2 bg-blue-600 text-white hover:bg-blue-700 focus:outline-none transition-colors border-t"
            onClick={resetZoom}
            title="Reset Zoom"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
          </button>
          
          <button
            className="px-3 py-2 bg-purple-600 text-white hover:bg-purple-700 focus:outline-none transition-colors rounded-b-lg border-t"
            onClick={fitToWindow}
            title="Fit to Window"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8l8-8 8 8M4 16l8 8 8-8" />
            </svg>
          </button>
        </div>

        {/* Pan Control */}
        <button
          className="px-3 py-2 bg-orange-600 text-white hover:bg-orange-700 focus:outline-none transition-colors rounded-lg shadow border"
          onClick={togglePanning}
          title="Toggle Panning Mode"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
          </svg>
        </button>
      </div>
      
      {/* Show Details button only when a member is selected */}
      {selectedMember && (
        <button
          className="absolute top-4 right-4 z-20 px-3 py-1 bg-green-600 text-white rounded shadow hover:bg-green-700 focus:outline-none transition-colors"
          onClick={() => setShowPanel((prev) => !prev)}
        >
          {showPanel ? 'Hide Details' : 'Show Details'}
        </button>
      )}
      
      {/* No member selected indicator */}
      {!selectedMember && (
        <div className="absolute top-4 right-4 z-20 px-3 py-2 bg-gray-100 text-gray-600 rounded shadow text-sm">
          Click on a family member to view details
        </div>
      )}
      
      {/* Instructions */}
      <div className="absolute bottom-4 left-4 z-20 px-3 py-2 bg-white bg-opacity-90 text-gray-600 rounded shadow text-xs">
        <div>• Use mouse wheel to zoom</div>
        <div>• Click and drag to pan</div>
        <div>• Use controls to adjust view</div>
      </div>
      
      {showPanel && selectedMember && (
        <div className="absolute top-16 right-4 z-20 w-80 p-4 border rounded-lg shadow bg-white">
          <button
            className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 transition-colors"
            onClick={() => setShowPanel(false)}
            aria-label="Close details"
          >
            ×
          </button>
          <div className="flex items-center mb-4">
            <img
              src={selectedMember.profileImage}
              alt={selectedMember.name}
              className="w-16 h-16 rounded-full object-cover border mr-4"
            />
            <div>
              <h2 className="text-lg font-bold text-green-900">{selectedMember.name}</h2>
              <p className="text-green-700">{selectedMember.relationship}</p>
              <p className="text-gray-500 text-sm">
                {selectedMember.birthDate && `b. ${selectedMember.birthDate}`} {selectedMember.deathDate && `- d. ${selectedMember.deathDate}`}
              </p>
            </div>
          </div>
          {selectedMember.biography && <p className="mb-2 text-gray-700">{selectedMember.biography}</p>}
          {selectedMember.occupation && <p className="text-sm text-gray-600">Occupation: {selectedMember.occupation}</p>}
          {selectedMember.location && <p className="text-sm text-gray-600">Location: {selectedMember.location}</p>}
        </div>
      )}
    </div>
  );
};

export default FamilyTreeGoJS; 