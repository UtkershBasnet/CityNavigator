export interface GraphNode {
  id: string
  name: string
  lat: number
  lng: number
  type: "landmark" | "transport" | "education" | "commercial" | "medical" | "recreation"
}

export interface GraphEdge {
  from: string
  to: string
  weight: number
  distance: number
  time: number
}

export interface PathResult {
  path: string[]
  distance: number
  steps: number
  visitedOrder: string[]
  algorithm: "dijkstra" | "astar"
}
