import React, { useState, useCallback, useMemo } from "react";
import ReactFlow, {
  Background,
  Controls,
  Handle,
  Position,
  ReactFlowProvider,
  useReactFlow
} from "reactflow";
import "reactflow/dist/style.css";

const NODE_GAP_X = 280;
const NODE_GAP_Y = 120;

// ✅ STABLE GRAPH CREATION
const createGraph = (data, expandedMap, onToggle) => {
  let nodes = [];
  let edges = [];
  let yCounter = 0;

  const traverse = (node, parentId = null, depth = 0, path = "0") => {
    const currentId = path;
    const isExpanded = !!expandedMap[currentId];
    const y = yCounter;
    yCounter += NODE_GAP_Y;

    nodes.push({
      id: currentId,
      type: "custom",
      data: {
        label: node.title || node.topic || "",
        nodeId: currentId,
        hasChildren: !!(node.children && node.children.length > 0),
        isExpanded,
        onToggle
      },
      position: { x: depth * NODE_GAP_X, y },
      draggable: false,
      style: {
        background: "#161b22",
        color: "#c9d1d9",
        border: "1px solid #30363d",
        padding: "10px 14px",
        borderRadius: 12,
        boxShadow: "0px 8px 25px rgba(0,0,0,0.6)",
        width: 180
      }
    });

    if (parentId) {
      edges.push({
        id: `e${parentId}-${currentId}`,
        source: parentId,
        target: currentId,
        type: "smoothstep",
        style: { stroke: "#58a6ff", strokeWidth: 2 }
      });
    }

    if (node.children && isExpanded) {
      node.children.forEach((child, index) => {
        traverse(child, currentId, depth + 1, `${path}-${index}`);
      });
    }
  };

  traverse(data);
  return { nodes, edges };
};

const CustomNode = React.memo(({ data }) => {
  return (
    <div style={{ position: "relative" }}>
      <Handle type="target" position={Position.Left} style={{ visibility: "hidden" }} />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
        <span style={{ flex: 1, fontSize: 13, wordBreak: "break-word" }}>{data.label}</span>
        {data.hasChildren && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              data.onToggle(data.nodeId);
            }}
            style={{
              flexShrink: 0,
              background: data.isExpanded ? "#f85149" : "#2f81f7",
              border: "none",
              color: "white",
              borderRadius: "50%",
              width: 22,
              height: 22,
              cursor: "pointer",
              fontSize: 10,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transform: data.isExpanded ? "rotate(90deg)" : "rotate(0deg)",
              transition: "0.2s"
            }}
          >
            ▶
          </button>
        )}
      </div>
      <Handle type="source" position={Position.Right} style={{ visibility: "hidden" }} />
    </div>
  );
});

function FlowContent({ data }) {
  const [expandedMap, setExpandedMap] = useState({ "0": true });
  const { setCenter, getNodes } = useReactFlow();

  const onToggle = useCallback((id) => {
    setExpandedMap((prev) => {
      const isExpanding = !prev[id];
      const newState = { ...prev, [id]: isExpanding };
      
      // Delay to allow the new nodes to actually exist in the DOM
      setTimeout(() => {
        const allNodes = getNodes();
        
        if (!isExpanding) {
          // CLOSE: Snap camera to the parent
          const parent = allNodes.find(n => n.id === id);
          if (parent) {
            setCenter(parent.position.x + 90, parent.position.y + 25, { zoom: 1, duration: 600 });
          }
        } else {
          // EXPAND: Target ONLY the direct child set
          const children = allNodes.filter(n => n.id.startsWith(`${id}-`));
          
          if (children.length > 0) {
            // Calculate the middle point of the new child vertical stack
            const minX = children[0].position.x;
            const minY = Math.min(...children.map(n => n.position.y));
            const maxY = Math.max(...children.map(n => n.position.y));
            
            const centerX = minX + 90; // Center of the node width
            const centerY = (minY + maxY) / 2 + 25; // Middle of the vertical spread

            // FORCE camera to this coordinate. No global fitView allowed.
            setCenter(centerX, centerY, { zoom: 0.9, duration: 700 });
          }
        }
      }, 100);

      return newState;
    });
  }, [setCenter, getNodes]);

  const nodeTypes = useMemo(() => ({ custom: CustomNode }), []);

  const { nodes, edges } = useMemo(() => {
    if (!data) return { nodes: [], edges: [] };
    return createGraph(data, expandedMap, onToggle);
  }, [data, expandedMap, onToggle]);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      fitView={false} // 🚩 CRITICAL: This stops the random "zoom out" on every change
      nodesDraggable={false}
      minZoom={0.2}
      maxZoom={2}
    >
      <Background color="#21262d" gap={20} />
      <Controls />
    </ReactFlow>
  );
}

export default function MindMap({ data }) {
  if (!data) return <p style={{ color: "white", padding: 20 }}>No mind map yet</p>;

  return (
    <div
      style={{
        height: "calc(100vh - 150px)",
        width: "100%",
        background: "#0d1117",
        borderRadius: 12,
        overflow: "hidden"
      }}
    >
      <ReactFlowProvider>
        <FlowContent data={data} />
      </ReactFlowProvider>
    </div>
  );
}