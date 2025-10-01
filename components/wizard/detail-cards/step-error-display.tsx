import type { StepError } from "./types"

interface StepErrorDisplayProps {
  error: StepError
  stepId: string
  onToggleExpansion: () => void
}

export function StepErrorDisplay({
  error,
  stepId,
  onToggleExpansion,
}: StepErrorDisplayProps) {
  return (
    <div className="mb-3">
      <h4 className="mb-1 text-sm font-medium text-gray-700">Error Details</h4>
      <p className="mb-2 text-sm text-red-600">{error.message}</p>

      {error.technicalDetails && (
        <>
          <button
            onClick={onToggleExpansion}
            className="mb-2 inline-flex items-center text-sm font-medium text-red-600 hover:text-red-800"
          >
            {error.isExpanded ? "Hide" : "Show"} Technical Details
            <span className="ml-1">{error.isExpanded ? "▼" : "▶"}</span>
          </button>
          {error.isExpanded && (
            <div className="overflow-x-auto rounded border border-red-200 bg-red-50 p-3 font-mono text-xs whitespace-pre-wrap text-red-800">
              {error.technicalDetails}
            </div>
          )}
        </>
      )}
    </div>
  )
}
