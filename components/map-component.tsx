"use client"

import { useEffect, useRef, useState } from "react"
import type { GraphNode, GraphEdge, PathResult } from "@/types/graph"

interface MapComponentProps {
  nodes: GraphNode[]
  edges: GraphEdge[]
  selectedStart: string | null
  selectedEnd: string | null
  pathResult: PathResult | null
  onNodeSelect: (nodeId: string, type: "start" | "end") => void
}

export default function MapComponent({
  nodes,
  edges,
  selectedStart,
  selectedEnd,
  pathResult,
  onNodeSelect,
}: MapComponentProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markersRef = useRef<any[]>([])
  const linesRef = useRef<any[]>([])
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (!isClient || !mapRef.current) return

    const initMap = async () => {
      try {
        const L = (await import("leaflet")).default

        // Fix for default markers in Next.js
        delete (L.Icon.Default.prototype as any)._getIconUrl
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
          iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
          shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
        })

        // Clean up existing map
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove()
          mapInstanceRef.current = null
        }

        // Create new map
        const map = L.map(mapRef.current, {
          center: [40.7505, -73.9851],
          zoom: 13,
          zoomControl: true,
        })

        // Add tile layer
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "© OpenStreetMap contributors",
          maxZoom: 19,
        }).addTo(map)

        mapInstanceRef.current = map

        // Clear existing layers
        markersRef.current.forEach((marker) => {
          if (map.hasLayer(marker)) {
            map.removeLayer(marker)
          }
        })
        linesRef.current.forEach((line) => {
          if (map.hasLayer(line)) {
            map.removeLayer(line)
          }
        })
        markersRef.current = []
        linesRef.current = []

        // Add edges (roads) as bidirectional lines
        edges.forEach((edge) => {
          const fromNode = nodes.find((n) => n.id === edge.from)
          const toNode = nodes.find((n) => n.id === edge.to)

          if (fromNode && toNode) {
            const line = L.polyline(
              [
                [fromNode.lat, fromNode.lng],
                [toNode.lat, toNode.lng],
              ],
              {
                color: "#94a3b8",
                weight: 3,
                opacity: 0.6,
              },
            ).addTo(map)

            // Add bidirectional arrows
            const midLat = (fromNode.lat + toNode.lat) / 2
            const midLng = (fromNode.lng + toNode.lng) / 2

            const bidirectionalArrow = L.marker([midLat, midLng], {
              icon: L.divIcon({
                html: `<div style="
          color: #64748b;
          font-size: 12px;
          font-weight: bold;
          text-shadow: 1px 1px 2px white;
        ">↔</div>`,
                className: "bidirectional-arrow",
                iconSize: [20, 20],
                iconAnchor: [10, 10],
              }),
            }).addTo(map)

            // Add weight labels
            const weightLabel = L.marker([midLat + 0.001, midLng + 0.001], {
              icon: L.divIcon({
                html: `<div style="
          background: white;
          border: 1px solid #ccc;
          border-radius: 4px;
          padding: 2px 4px;
          font-size: 10px;
          font-weight: bold;
          color: #666;
        ">${edge.weight.toFixed(1)}km</div>`,
                className: "weight-label",
                iconSize: [40, 20],
                iconAnchor: [20, 10],
              }),
            }).addTo(map)

            linesRef.current.push(line, bidirectionalArrow, weightLabel)
          }
        })

        // Add path if exists
        if (pathResult && pathResult.path.length > 1) {
          const pathCoords = pathResult.path.map((nodeId) => {
            const node = nodes.find((n) => n.id === nodeId)!
            return [node.lat, node.lng] as [number, number]
          })

          const pathLine = L.polyline(pathCoords, {
            color: pathResult.algorithm === "dijkstra" ? "#3b82f6" : "#10b981",
            weight: 4,
            opacity: 0.9,
          }).addTo(map)
          linesRef.current.push(pathLine)

          // Add direction arrows along the path
          for (let i = 0; i < pathCoords.length - 1; i++) {
            const start = pathCoords[i]
            const end = pathCoords[i + 1]
            const midLat = (start[0] + end[0]) / 2
            const midLng = (start[1] + end[1]) / 2

            // Calculate arrow direction
            const angle = Math.atan2(end[0] - start[0], end[1] - start[1]) * (180 / Math.PI)

            const arrow = L.marker([midLat, midLng], {
              icon: L.divIcon({
                html: `<div style="
                  color: ${pathResult.algorithm === "dijkstra" ? "#3b82f6" : "#10b981"};
                  font-size: 16px;
                  font-weight: bold;
                  transform: rotate(${angle}deg);
                  text-shadow: 1px 1px 2px white;
                ">▲</div>`,
                className: "arrow-icon",
                iconSize: [20, 20],
                iconAnchor: [10, 10],
              }),
            }).addTo(map)
            markersRef.current.push(arrow)
          }
        }

        // Add node markers
        nodes.forEach((node) => {
          const getMarkerColor = () => {
            if (node.id === selectedStart) return "#22c55e"
            if (node.id === selectedEnd) return "#ef4444"
            if (pathResult?.visitedOrder.includes(node.id)) return "#f59e0b"
            return "#6b7280"
          }

          const getNodeTypeIcon = () => {
            switch (node.type) {
              case "transport":
                return "🚉"
              case "education":
                return "🎓"
              case "commercial":
                return "🏪"
              case "medical":
                return "🏥"
              case "recreation":
                return "🌳"
              case "landmark":
                return "🏛️"
              default:
                return "📍"
            }
          }

          const color = getMarkerColor()
          const icon = getNodeTypeIcon()

          const marker = L.marker([node.lat, node.lng], {
            icon: L.divIcon({
              html: `
                <div style="
                  background-color: ${color};
                  width: 30px;
                  height: 30px;
                  border-radius: 50%;
                  border: 3px solid white;
                  box-shadow: 0 2px 6px rgba(0,0,0,0.3);
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  color: white;
                  font-weight: bold;
                  font-size: 14px;
                  position: relative;
                ">
                  ${node.id}
                  <div style="
                    position: absolute;
                    top: -8px;
                    right: -8px;
                    font-size: 12px;
                  ">${icon}</div>
                </div>
              `,
              className: "custom-marker",
              iconSize: [30, 30],
              iconAnchor: [15, 15],
            }),
          }).addTo(map)

          const popupContent = `
            <div style="padding: 8px; min-width: 200px;">
              <h3 style="margin: 0 0 8px 0; font-weight: bold; font-size: 14px;">${node.name}</h3>
              <p style="margin: 0 0 8px 0; font-size: 12px; color: #666;">
                ${icon} ${node.type.charAt(0).toUpperCase() + node.type.slice(1)}
              </p>
              <div style="display: flex; gap: 4px;">
                <button 
                  onclick="window.selectStart('${node.id}')" 
                  style="
                    padding: 4px 8px;
                    background: #22c55e;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    font-size: 11px;
                    cursor: pointer;
                  "
                >
                  Set Start
                </button>
                <button 
                  onclick="window.selectEnd('${node.id}')" 
                  style="
                    padding: 4px 8px;
                    background: #ef4444;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    font-size: 11px;
                    cursor: pointer;
                  "
                >
                  Set End
                </button>
              </div>
            </div>
          `

          marker.bindPopup(popupContent)
          markersRef.current.push(marker)
        })

        // Global functions for popup buttons
        ;(window as any).selectStart = (nodeId: string) => {
          onNodeSelect(nodeId, "start")
          map.closePopup()
        }
        ;(window as any).selectEnd = (nodeId: string) => {
          onNodeSelect(nodeId, "end")
          map.closePopup()
        }

        // Fit map to show all nodes
        if (nodes.length > 0) {
          const group = new L.featureGroup(markersRef.current)
          map.fitBounds(group.getBounds().pad(0.1))
        }
      } catch (error) {
        console.error("Error initializing map:", error)
      }
    }

    initMap()

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [isClient, nodes, edges, selectedStart, selectedEnd, pathResult, onNodeSelect])

  if (!isClient) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-lg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">Loading map...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div ref={mapRef} className="w-full h-full rounded-lg" />
      <style jsx global>{`
        .leaflet-container {
          height: 100% !important;
          width: 100% !important;
          border-radius: 0.5rem;
        }
        .custom-marker {
          background: transparent !important;
          border: none !important;
        }
        .weight-label {
          background: transparent !important;
          border: none !important;
        }
        .arrow-icon {
          background: transparent !important;
          border: none !important;
        }
        .leaflet-popup-content {
          margin: 0 !important;
        }
        .leaflet-popup-content-wrapper {
          border-radius: 8px !important;
        }
        .leaflet-popup-tip {
          background: white !important;
        }
      `}</style>
    </>
  )
}
