import React, { useEffect, useRef, useState } from 'react';
import * as go from 'gojs';
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

interface FamilyTreeGoJSProps {
  familyMembers: FamilyMember[];
}

const FamilyTreeGoJS: React.FC<FamilyTreeGoJSProps> = ({ familyMembers }) => {
  const diagramRef = useRef<HTMLDivElement>(null);
  const diagramInstanceRef = useRef<go.Diagram | null>(null);
  const [selectedMember, setSelectedMember] = useState<FamilyMember | null>(null);
  const [showPanel, setShowPanel] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isPanning, setIsPanning] = useState(false);

  // Helper to format ISO-like date strings to YYYY-MM-DD
  const formatDate = (s?: string | null) => {
    if (!s) return '';
    try {
      const d = new Date(s);
      if (isNaN(d.getTime())) return s; // fallback to original string if invalid
      return d.toISOString().slice(0, 10);
    } catch {
      return s;
    }
  };

  // Keyboard shortcuts for diagram (when it has focus)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const key = e.key;
    if (!diagramInstanceRef.current) return;
    if (key === '+' || key === '=') { zoomIn(); e.preventDefault(); }
    else if (key === '-' || key === '_') { zoomOut(); e.preventDefault(); }
    else if (key === '0') { resetZoom(); e.preventDefault(); }
    else if (key.toLowerCase() === 'f') { fitToWindow(); e.preventDefault(); }
    else if (key.toLowerCase() === 'p') { togglePanning(); setIsPanning(prev => !prev); e.preventDefault(); }
    else if (key === 'Escape') { setShowPanel(false); setSelectedMember(null); }
  };
  useEffect(() => {
    if (!diagramRef.current || familyMembers.length === 0) return;
    const $ = go.GraphObject.make;
    const { nodes, links } = getGoJSData(familyMembers);

    const diagram = $(go.Diagram, diagramRef.current, {
      initialContentAlignment: go.Spot.Center,
      layout: $(go.TreeLayout, {
        angle: 90,
        nodeSpacing: 20,
        layerSpacing: 50,
        layerStyle: go.TreeLayout.LayerUniform
      }),
      'undoManager.isEnabled': true,
      'toolManager.hoverDelay': 100,
      autoScale: go.Diagram.Uniform,
      // Enable mouse wheel zooming
      'toolManager.mouseWheelBehavior': go.ToolManager.WheelZoom,
      // Default zoom factor must be > 1.0 (GoJS requirement)
      'commandHandler.zoomFactor': 1.25,
    });

    // Configure panning tool after diagram creation
    diagram.toolManager.panningTool.isEnabled = true;
    diagram.toolManager.panningTool.isActive = false;

    // Store diagram instance for external control
    diagramInstanceRef.current = diagram;

    // Small highlight helpers (similar behavior to GoJS sample)
    const onMouseEnterPart = (e: any, part: any) => { if (part) part.isHighlighted = true; };
    const onMouseLeavePart = (e: any, part: any) => { if (part && !part.isSelected) part.isHighlighted = false; };
    const onSelectionChange = (part: any) => { if (part) part.isHighlighted = part.isSelected; };

    diagram.nodeTemplate = $(
      go.Node,
      'Spot',
      { selectionAdorned: false, cursor: 'pointer', mouseEnter: onMouseEnterPart, mouseLeave: onMouseLeavePart, selectionChanged: onSelectionChange,
        toolTip: $('ToolTip', $(go.TextBlock, { margin: 6, maxSize: new go.Size(220, NaN), wrap: go.TextBlock.WrapFit }, new go.Binding('text', '', (data: any) => data.biography || '')))
      },

      // Main rounded card
      $(
        go.Panel,
        'Auto',
        $(go.Shape, 'RoundedRectangle', { name: 'mainShape', fill: '#ffffff', stroke: '#e6fef1', strokeWidth: 2, parameter1: 12, desiredSize: new go.Size(220, 110) }),
        $(
          go.Panel,
          'Table',
          // increase left margin to make space for avatar pop-out
          { margin: new go.Margin(8, 44, 8, 76) },
          $(go.TextBlock, { row: 0, font: 'bold 14px Poppins, sans-serif', stroke: '#064e3b', wrap: go.TextBlock.WrapFit, textAlign: 'center' }, new go.Binding('text', 'name')),
          $(go.TextBlock, { row: 2, font: '11px sans-serif', stroke: '#6b7280', textAlign: 'center' }, new go.Binding('text', '', (data: any) => {
            const b = data?.birthDate ? new Date(data.birthDate).toISOString().slice(0,10) : '';
            const d = data?.deathDate ? new Date(data.deathDate).toISOString().slice(0,10) : '';
            if (!b && !d) return '';
            if (b && d) return `${b} - ${d}`;
            return b || d;
          })),
        )
      ),

      // Circular picture on the left side of the card
      $(
        go.Panel,
        'Spot',
        { alignment: go.Spot.MiddleLeft, alignmentFocus: go.Spot.MiddleLeft, margin: new go.Margin(0,0,0, -26) },
        $(go.Shape, 'Circle', { desiredSize: new go.Size(52,52), fill: '#ffffff', stroke: '#e6fef1', strokeWidth: 2 }),
        $(go.Picture, { desiredSize: new go.Size(48,48), margin: 2, background: '#fff', imageStretch: go.GraphObject.UniformToFill, alignment: go.Spot.Center }, new go.Binding('source', 'profileImage'))
      ),

      // Badge (relationship/status)
      $(
        go.Panel,
        'Auto',
        { alignment: go.Spot.TopRight, alignmentFocus: go.Spot.TopRight, margin: new go.Margin(6,6,0,0) },
        $(go.Shape, { figure: 'RoundedRectangle', parameter1: 4, fill: '#fff3f0', stroke: null }),
        $(go.TextBlock, { margin: 6, font: 'bold 11px sans-serif', stroke: '#7a1728' }, new go.Binding('text', 'relationship'))
      ),

      // Child counter - visible only when there are children (bindObject to access node)
      $(
        go.Panel,
        'Auto',
        { alignment: go.Spot.Bottom, alignmentFocus: go.Spot.BottomCenter }
      )
        .bindObject('visible', '', (obj: any) => obj.findLinksOutOf().count > 0)
        .add(
          $(go.Shape, 'Circle', { desiredSize: new go.Size(28,28), stroke: '#ffffff', strokeWidth: 2, fill: '#10b981' }),
          $(go.TextBlock, { stroke: '#ffffff', font: 'bold 12px sans-serif', textAlign: 'center', alignment: go.Spot.Center }).bindObject('text', '', (obj: any) => obj.findNodesOutOf().count)
        ),

    );

    diagram.linkTemplate = $(
      go.Link,
      { selectionAdorned: false, routing: go.Link.Orthogonal, corner: 6, layerName: 'Background' },
      $(go.Shape, { strokeWidth: 1, stroke: '#94d3b5' })
        .bindObject('stroke', 'isHighlighted', (h: boolean) => h ? '#485670' : '#94d3b5')
        .bindObject('strokeWidth', 'isSelected', (s: boolean) => s ? 2 : 1)
    );

    diagram.model = new go.GraphLinksModel(nodes, links);

    // Center on the user node if available, else the first node
    const rootKey = familyMembers.find(m => m.isUser)?.id || (nodes[0] && nodes[0].key);
    const rootNode = rootKey ? diagram.findNodeForKey(rootKey) : null;
    if (rootNode) {
      diagram.scale = 0.9;
      diagram.commandHandler.scrollToPart(rootNode);
    } else {
      diagram.commandHandler.zoomToFit();
    }

    // Add click event handler for nodes
    diagram.addDiagramListener('ObjectSingleClicked', e => {
      const part = e.subject.part;
      if (part instanceof go.Node) {
        const key = part.data.key;
        const member = familyMembers.find(m => m.id === key);
        setSelectedMember(member || null);
        setShowPanel(true); // Automatically show panel when member is selected
      }
    });

    // Add click handler to hide panel when clicking on background
    diagram.addDiagramListener('BackgroundSingleClicked', e => {
      setSelectedMember(null);
      setShowPanel(false);
    });

    // Listen for zoom changes using diagram.scale
    diagram.addDiagramListener('ViewportBoundsChanged', e => {
      setZoomLevel(diagram.scale || 1);
    });

    return () => { 
      diagram.div = null; 
      diagramInstanceRef.current = null;
    };


  }, [familyMembers]);

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
      <div className="w-full h-full" ref={diagramRef} tabIndex={0} onKeyDown={handleKeyDown} role="application" aria-label="Family tree diagram. Focus and use + to zoom in, - to zoom out, f to fit, p to toggle panning, Escape to close details." />
      <div aria-live="polite" className="sr-only">{selectedMember ? `Selected ${selectedMember.name}` : 'No member selected'}</div>
      
      {/* Zoom and Pan Controls */}
      <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
        {/* Zoom Controls */}
        <div className="flex flex-col bg-white rounded-lg shadow border">
          <button
            className="px-3 py-2 bg-green-600 text-white hover:bg-green-700 transition-colors rounded-t-lg focus:ring-2 focus:ring-offset-1 focus:ring-green-500"
            onClick={zoomIn}
            title="Zoom In"
            aria-label="Zoom in"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </button>
          
          <div className="px-3 py-1 text-center text-xs text-gray-600 bg-gray-50 border-t border-b">
            {Math.round(zoomLevel * 100)}%
          </div>
          
          <button
            className="px-3 py-2 bg-green-600 text-white hover:bg-green-700 transition-colors focus:ring-2 focus:ring-offset-1 focus:ring-green-500"
            onClick={zoomOut}
            title="Zoom Out"
            aria-label="Zoom out"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
          </button>
          
          <button
            className="px-3 py-2 bg-blue-600 text-white hover:bg-blue-700 transition-colors border-t focus:ring-2 focus:ring-offset-1 focus:ring-blue-500"
            onClick={resetZoom}
            title="Reset Zoom"
            aria-label="Reset zoom"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
          </button>
          
          <button
            className="px-3 py-2 bg-purple-600 text-white hover:bg-purple-700 transition-colors rounded-b-lg border-t focus:ring-2 focus:ring-offset-1 focus:ring-purple-500"
            onClick={fitToWindow}
            title="Fit to Window"
            aria-label="Fit to window"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8l8-8 8 8M4 16l8 8 8-8" />
            </svg>
          </button>
        </div>

        {/* Pan Control */}
        <button
          className={`px-3 py-2 bg-orange-600 text-white hover:bg-orange-700 transition-colors rounded-lg shadow border focus:ring-2 focus:ring-offset-1 focus:ring-orange-500 ${isPanning ? 'ring-2 ring-offset-1 ring-orange-700' : ''}`}
          onClick={() => { togglePanning(); setIsPanning(prev => !prev); }}
          title="Toggle Panning Mode"
          aria-pressed={isPanning}
          aria-label="Toggle panning mode"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
          </svg>
        </button>
      </div>
      
      {/* Show Details button only when a member is selected */}
      {selectedMember && (
        <button
          className="absolute top-4 right-4 z-20 px-3 py-1 bg-green-600 text-white rounded shadow hover:bg-green-700 transition-colors focus:ring-2 focus:ring-offset-1 focus:ring-green-500"
          onClick={() => setShowPanel((prev) => !prev)}
          aria-controls={`details-panel-${selectedMember?.id}`}
          aria-expanded={showPanel}
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
        <div id={`details-panel-${selectedMember.id}`} role="region" aria-labelledby={`details-heading-${selectedMember.id}`} className="absolute top-16 right-4 z-20 w-80 p-4 border rounded-lg shadow bg-white">
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
              <h2 id={`details-heading-${selectedMember.id}`} className="text-lg font-bold text-green-900">{selectedMember.name}</h2>
              <p className="text-green-700">{selectedMember.relationship}</p>
              <p className="text-gray-500 text-sm">
                { (selectedMember.birthDate || selectedMember.deathDate) && `${formatDate(selectedMember.birthDate)}${selectedMember.birthDate && selectedMember.deathDate ? ' - ' : ''}${formatDate(selectedMember.deathDate)}` }
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