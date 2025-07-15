import React, { useState, useEffect } from "react";
import ActivityHeatmap from "./ActivityHeatmap";
import ActivityHeatmapFallback from "./ActivityHeatmapFallback";

interface ActivityHeatmapWrapperProps {
  userId: number;
}

const ActivityHeatmapWrapper: React.FC<ActivityHeatmapWrapperProps> = ({
  userId,
}) => {
  const [shouldUseFallback, setShouldUseFallback] = useState(false);

  // Error boundary for main component
  const handleError = () => {
    console.warn("ActivityHeatmap failed, switching to fallback");
    setShouldUseFallback(true);
  };

  if (shouldUseFallback) {
    return <ActivityHeatmapFallback userId={userId} />;
  }

  return (
    <ErrorBoundary onError={handleError}>
      <ActivityHeatmap userId={userId} />
    </ErrorBoundary>
  );
};

// Простой Error Boundary
class ErrorBoundary extends React.Component<
  { children: React.ReactNode; onError: () => void },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; onError: () => void }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("ActivityHeatmap Error:", error, errorInfo);
    this.props.onError();
  }

  render() {
    if (this.state.hasError) {
      return null; // Родительский компонент покажет fallback
    }

    return this.props.children;
  }
}

export default ActivityHeatmapWrapper;
