"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MapPin, Navigation, Clock, Zap } from "lucide-react"
import MapComponent from "@/components/map-component"
import AlgorithmStats from "@/components/algorithm-stats"
import type { GraphNode, GraphEdge, PathResult } from "@/types/graph"

// Sample city graph data (simplified for demonstration)
const cityNodes: GraphNode[] = [
  { id: "A", name: "Downtown Plaza", lat: 40.7589, lng: -73.9851, type: "landmark" },
  { id: "B", name: "Central Station", lat: 40.7505, lng: -73.9934, type: "transport" },
  { id: "C", name: "University Campus", lat: 40.7282, lng: -73.9942, type: "education" },
  { id: "D", name: "Shopping District", lat: 40.7614, lng: -73.9776, type: "commercial" },
  { id: "E", name: "Hospital", lat: 40.7505, lng: -73.9712, type: "medical" },
  { id: "F", name: "Park Entrance", lat: 40.7829, lng: -73.9654, type: "recreation" },
  { id: "G", name: "Airport Terminal", lat: 40.7282, lng: -73.9776, type: "transport" },
  { id: "H", name: "Business Center", lat: 40.7505, lng: -73.9851, type: "commercial" },
]

const cityEdges: GraphEdge[] = [
  { from: "A", to: "B", weight: 1.2, distance: 1.2, time: 3 },
  { from: "A", to: "D", weight: 0.8, distance: 0.8, time: 2 },
  { from: "A", to: "H", weight: 0.5, distance: 0.5, time: 1 },
  { from: "B", to: "C", weight: 2.1, distance: 2.1, time: 5 },
  { from: "B", to: "E", weight: 1.5, distance: 1.5, time: 4 },
  { from: "C", to: "G", weight: 1.8, distance: 1.8, time: 4 },
  { from: "D", to: "F", weight: 2.3, distance: 2.3, time: 6 },
  { from: "D", to: "H", weight: 1.1, distance: 1.1, time: 3 },
  { from: "E", to: "H", weight: 1.3, distance: 1.3, time: 3 },
  { from: "F", to: "H", weight: 2.0, distance: 2.0, time: 5 },
  { from: "H", to: "G", weight: 1.7, distance: 1.7, time: 4 },
]

export default function CityNavigator() {
  const [selectedStart, setSelectedStart] = useState<string | null>(null)
  const [selectedEnd, setSelectedEnd] = useState<string | null>(null)
  const [pathResult, setPathResult] = useState<PathResult | null>(null)
  const [algorithm, setAlgorithm] = useState<"dijkstra" | "astar">("dijkstra")
  const [isCalculating, setIsCalculating] = useState(false)

  const handleNodeSelect = (nodeId: string, type: "start" | "end") => {
    if (type === "start") {
      setSelectedStart(nodeId)
    } else {
      setSelectedEnd(nodeId)
    }
    setPathResult(null)
  }

  const calculatePath = async () => {
    if (!selectedStart || !selectedEnd) return

    setIsCalculating(true)

    // Simulate calculation time for better UX
    await new Promise((resolve) => setTimeout(resolve, 500))

    const result =
      algorithm === "dijkstra"
        ? dijkstraAlgorithm(selectedStart, selectedEnd)
        : astarAlgorithm(selectedStart, selectedEnd)

    setPathResult(result)
    setIsCalculating(false)
  }

  const dijkstraAlgorithm = (start: string, end: string): PathResult => {
    const distances: { [key: string]: number } = {}
    const previous: { [key: string]: string | null } = {}
    const visited = new Set<string>()
    const queue = new Set(cityNodes.map((n) => n.id))

    // Initialize distances
    cityNodes.forEach((node) => {
      distances[node.id] = node.id === start ? 0 : Number.POSITIVE_INFINITY
      previous[node.id] = null
    })

    let steps = 0
    const visitedOrder: string[] = []

    while (queue.size > 0) {
      // Find unvisited node with minimum distance
      const current = Array.from(queue).reduce((min, node) => (distances[node] < distances[min] ? node : min))

      if (distances[current] === Number.POSITIVE_INFINITY) break

      queue.delete(current)
      visited.add(current)
      visitedOrder.push(current)
      steps++

      if (current === end) break

      // Update distances to neighbors (bidirectional edges)
      cityEdges
        .filter((edge) => edge.from === current || edge.to === current)
        .forEach((edge) => {
          const neighbor = edge.from === current ? edge.to : edge.from
          if (!visited.has(neighbor)) {
            const newDistance = distances[current] + edge.weight
            if (newDistance < distances[neighbor]) {
              distances[neighbor] = newDistance
              previous[neighbor] = current
            }
          }
        })
    }

    // Reconstruct path
    const path: string[] = []
    let current = end
    while (current !== null) {
      path.unshift(current)
      current = previous[current]
    }

    return {
      path: path.length > 1 ? path : [],
      distance: distances[end],
      steps,
      visitedOrder,
      algorithm: "dijkstra",
    }
  }

  const astarAlgorithm = (start: string, end: string): PathResult => {
    const getHeuristic = (nodeId: string): number => {
      const node = cityNodes.find((n) => n.id === nodeId)!
      const endNode = cityNodes.find((n) => n.id === end)!

      // Manhattan distance heuristic
      return Math.abs(node.lat - endNode.lat) + Math.abs(node.lng - endNode.lng)
    }

    const gScore: { [key: string]: number } = {}
    const fScore: { [key: string]: number } = {}
    const previous: { [key: string]: string | null } = {}
    const openSet = new Set([start])
    const closedSet = new Set<string>()

    cityNodes.forEach((node) => {
      gScore[node.id] = node.id === start ? 0 : Number.POSITIVE_INFINITY
      fScore[node.id] = node.id === start ? getHeuristic(start) : Number.POSITIVE_INFINITY
      previous[node.id] = null
    })

    let steps = 0
    const visitedOrder: string[] = []

    while (openSet.size > 0) {
      // Find node in openSet with lowest fScore
      const current = Array.from(openSet).reduce((min, node) => (fScore[node] < fScore[min] ? node : min))

      if (current === end) break

      openSet.delete(current)
      closedSet.add(current)
      visitedOrder.push(current)
      steps++

      cityEdges
        .filter((edge) => edge.from === current || edge.to === current)
        .forEach((edge) => {
          const neighbor = edge.from === current ? edge.to : edge.from
          if (closedSet.has(neighbor)) return

          const tentativeGScore = gScore[current] + edge.weight

          if (!openSet.has(neighbor)) {
            openSet.add(neighbor)
          } else if (tentativeGScore >= gScore[neighbor]) {
            return
          }

          previous[neighbor] = current
          gScore[neighbor] = tentativeGScore
          fScore[neighbor] = gScore[neighbor] + getHeuristic(neighbor)
        })
    }

    // Reconstruct path
    const path: string[] = []
    let current = end
    while (current !== null) {
      path.unshift(current)
      current = previous[current]
    }

    return {
      path: path.length > 1 ? path : [],
      distance: gScore[end],
      steps,
      visitedOrder,
      algorithm: "astar",
    }
  }

  const getNodeName = (id: string) => cityNodes.find((n) => n.id === id)?.name || id

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-gray-900 flex items-center justify-center gap-2">
            <Navigation className="w-8 h-8 text-blue-600" />
            City Navigator
          </h1>
          <p className="text-lg text-gray-600">Find the shortest path using Dijkstra's and A* algorithms</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Controls Panel */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Route Planning
                </CardTitle>
                <CardDescription>Select start and end points, then choose an algorithm</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Start Location</label>
                  <select
                    value={selectedStart || ""}
                    onChange={(e) => handleNodeSelect(e.target.value, "start")}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select start point...</option>
                    {cityNodes.map((node) => (
                      <option key={node.id} value={node.id}>
                        {node.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">End Location</label>
                  <select
                    value={selectedEnd || ""}
                    onChange={(e) => handleNodeSelect(e.target.value, "end")}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select end point...</option>
                    {cityNodes.map((node) => (
                      <option key={node.id} value={node.id}>
                        {node.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Algorithm</label>
                  <div className="flex gap-2">
                    <Button
                      variant={algorithm === "dijkstra" ? "default" : "outline"}
                      onClick={() => setAlgorithm("dijkstra")}
                      className="flex-1"
                    >
                      <Clock className="w-4 h-4 mr-1" />
                      Dijkstra
                    </Button>
                    <Button
                      variant={algorithm === "astar" ? "default" : "outline"}
                      onClick={() => setAlgorithm("astar")}
                      className="flex-1"
                    >
                      <Zap className="w-4 h-4 mr-1" />
                      A*
                    </Button>
                  </div>
                </div>

                <Button
                  onClick={calculatePath}
                  disabled={!selectedStart || !selectedEnd || isCalculating}
                  className="w-full"
                  size="lg"
                >
                  {isCalculating ? "Calculating..." : "Find Shortest Path"}
                </Button>

                {pathResult && (
                  <div className="space-y-3 p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        {pathResult.algorithm.toUpperCase()}
                      </Badge>
                      <span className="text-sm font-medium text-green-800">Path Found!</span>
                    </div>
                    <div className="text-sm space-y-1">
                      <div>
                        <strong>Route:</strong> {pathResult.path.map(getNodeName).join(" → ")}
                      </div>
                      <div>
                        <strong>Distance:</strong> {pathResult.distance.toFixed(2)} km
                      </div>
                      <div>
                        <strong>Steps:</strong> {pathResult.steps}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {pathResult && <AlgorithmStats result={pathResult} />}
          </div>

          {/* Map */}
          <div className="lg:col-span-2">
            <Card className="h-[600px]">
              <CardContent className="p-0 h-full">
                <MapComponent
                  nodes={cityNodes}
                  edges={cityEdges}
                  selectedStart={selectedStart}
                  selectedEnd={selectedEnd}
                  pathResult={pathResult}
                  onNodeSelect={handleNodeSelect}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
