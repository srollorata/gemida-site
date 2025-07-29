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
  const [selectedMember, setSelectedMember] = useState<FamilyMember | null>(null);
  const [showPanel, setShowPanel] = useState(false);

  useEffect(() => {
    if (!diagramRef.current) return;
    const $ = go.GraphObject.make;
    const { nodes, links } = getGoJSData(mockFamilyMembers);

    const diagram = $(go.Diagram, diagramRef.current, {
      initialContentAlignment: go.Spot.Center,
      layout: $(go.LayeredDigraphLayout, { direction: 90, layerSpacing: 40 }),
      'undoManager.isEnabled': true,
      autoScale: go.Diagram.Uniform,
    });

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

    return () => { diagram.div = null; };
  }, []);

  return (
    <div className="relative w-full h-[600px] border rounded-lg shadow bg-white">
      <div className="w-full h-full" ref={diagramRef} />
      
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