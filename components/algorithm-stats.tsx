import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { PathResult } from "@/types/graph"
import { BarChart3, Navigation, Target } from "lucide-react"

interface AlgorithmStatsProps {
  result: PathResult
}

export default function AlgorithmStats({ result }: AlgorithmStatsProps) {
  const getAlgorithmInfo = () => {
    if (result.algorithm === "dijkstra") {
      return {
        name: "Dijkstra's Algorithm",
        description: "Guarantees shortest path, explores all directions equally",
        complexity: "O((V + E) log V)",
        pros: ["Always finds optimal solution", "Works with negative weights"],
        cons: ["Can be slower than A*", "Explores unnecessary nodes"],
      }
    } else {
      return {
        name: "A* Algorithm",
        description: "Uses heuristic to guide search toward goal",
        complexity: "O(b^d) where b is branching factor",
        pros: ["Faster than Dijkstra", "Heuristic guides search"],
        cons: ["Requires good heuristic", "May not work with negative weights"],
      }
    }
  }

  const info = getAlgorithmInfo()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          Algorithm Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Badge variant="outline" className="mb-2">
            {info.name}
          </Badge>
          <p className="text-sm text-gray-600">{info.description}</p>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Navigation className="w-4 h-4 text-blue-500" />
            <span>Steps: {result.steps}</span>
          </div>
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-green-500" />
            <span>Distance: {result.distance.toFixed(2)}km</span>
          </div>
        </div>

        <div>
          <h4 className="font-medium text-sm mb-2">Time Complexity</h4>
          <code className="text-xs bg-gray-100 px-2 py-1 rounded">{info.complexity}</code>
        </div>

        <div className="grid grid-cols-1 gap-3">
          <div>
            <h4 className="font-medium text-sm text-green-700 mb-1">Advantages</h4>
            <ul className="text-xs space-y-1">
              {info.pros.map((pro, index) => (
                <li key={index} className="flex items-start gap-1">
                  <span className="text-green-500 mt-0.5">•</span>
                  {pro}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-sm text-red-700 mb-1">Limitations</h4>
            <ul className="text-xs space-y-1">
              {info.cons.map((con, index) => (
                <li key={index} className="flex items-start gap-1">
                  <span className="text-red-500 mt-0.5">•</span>
                  {con}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {result.visitedOrder.length > 0 && (
          <div>
            <h4 className="font-medium text-sm mb-2">Nodes Visited (Order)</h4>
            <div className="flex flex-wrap gap-1">
              {result.visitedOrder.map((nodeId, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {index + 1}. {nodeId}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
