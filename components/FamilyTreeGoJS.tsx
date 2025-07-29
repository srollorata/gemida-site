import React, { useEffect, useRef } from 'react';
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

    return () => { diagram.div = null; };
  }, []);

  return (
    <div className="w-full h-[600px] border rounded-lg shadow bg-white" ref={diagramRef} />
  );
};

export default FamilyTreeGoJS; 